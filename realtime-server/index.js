const pathUtility = require('path')

const subscribers = {
    // 'root/path[0]': [
    //     subscriber_1, 
    //     subscriber_2...
    // ]
}

function isValid(params){
    // if(!params.root){
    //     return false
    // }
    if(!params.path){
        return false
    }
    // if(typeof params.root !== 'string'){ 
    //     return false
    // }
    if(typeof params.path !== 'string'){ 
        return false
    }
    return true
}
function invalidReason(params){
    // if(!params.root){
    //     return 'Please include a root'
    // }
    if(!params.path){
        return 'Please include a path'
    }
    // if(typeof params.root !== 'string'){ 
    //     return 'Invalid type of root'
    // }
    if(typeof params.path !== 'string'){ 
        return 'Invalid type of path'
    }
    return 'Something went wrong, please try again.'
}

module.exports = function(io, redis){
    redis.subscribe('change', (message) => {
        if(!message){ return; }
        message = JSON.parse(message)
        let { root, path, value } = message,
            key = '';
        if(path){
            key = pathUtility.join(root + path.shift()||'')
        } else{
            key = root
        }

        if(subscribers[key]){
            Object
                .values(subscribers[key])
                .forEach(callback => {
                    callback(value)
                })
        }
    })

    io.on('connection', (socket) => {

        const socket_id = socket.id

        let mySubscriptions = []

        socket.emit("Connected");

        socket.on('get', async (params={}) => {
            if(!isValid(params)){ return socket.emit('error', { ...params, message: invalidReason(params) }) }

            let { root, path, id } = params

            path = path.split('/')
            // TODO: Search the branches of the tree using path
            try {
                let key = pathUtility.join(root, path.shift()||'')
                let value = await redis.get(key)
                socket.emit('value', { id, value })
            } catch(e) {
                socket.emit('value', { id, value: null })
            }
        })

        socket.on('set', async (params={}) => {
            if(!isValid(params)){ return socket.emit('error', { ...params, message: invalidReason(params) }) }

            let { root, path, value } = params

            path = path.split('/')
            try {
                // Check if it exists!
                let key = pathUtility.join(root, path.shift()||'')
                let existing_doc = await redis.get(key)
                if(existing_doc) {
                    // For atomic/path sets
                    try {
                        existing_doc = JSON.parse(existing_doc)

                        let doc = existing_doc;

                        let path_list = path.split('/');
                        let len = path_list.length - 1;

                        for(let i = 0; i < len; i++) {
                            let elem = path_list[i];
                            if( !doc[elem] ){
                                doc[elem] = {}
                            }
                            doc = doc[elem];
                        }
                    
                        doc[path_list[len]] = value;
                        await redis.set(key, JSON.stringify(existing_doc))
                        socket.emit('value', { ...params, value: existing_doc })
                        redis.publish('change', JSON.stringify(params))

                    } catch(e){
                        await redis.set(key, JSON.stringify(value))
                        socket.emit('value', { ...params, value: existing_doc })
                        redis.publish('change', JSON.stringify(params))
                    }
                }
                else {
                    await redis.set(key, JSON.stringify(value))
                    socket.emit('value', { ...params, value })
                    redis.publish('change', JSON.stringify(params))
                }
            } catch(e) {
                console.log(e)
                socket.emit('error', { ...params, message: 'Set failed: ' + e.message })
            }
        })

        socket.on('subscribe', async (params={}) => {
            if(!isValid(params)){ return socket.emit('error', { ...params, message: invalidReason(params) }) }

            let { root, path, id } = params
            path = path.split('/')
            
            let key = pathUtility.join(root, path[0]||'')
            if(!subscribers[key]){ subscribers[key] = {} }
            subscribers[key][socket_id] = function(value){
                // TODO: Search the branches of the tree using path
                socket.emit('value', { ...params, value })
            }
            mySubscriptions.push({ key, id })
        })
        
        // socket.on('push')

        socket.on('unsubscribe', (id) => {
            if(!id){ return socket.emit('error', { ...params, message: 'Please include the id of what you want to unsubscribe from!' }) }

            let subscription = mySubscriptions.find(a => a.id === id)
            if(!subscription){ return }

            let { key } = subscription

            if(subscribers[key] && subscribers[key][socket.id]){
                delete subscribers[key][socket.id]
            }
            mySubscriptions = mySubscriptions.filter(a => a.id !== id)
        });

        socket.on('disconnect', () => {
            // console.log(socket.id + " disconnected.")
            mySubscriptions.forEach(key => {
                delete subscribers[key][socket.id]
            })
            mySubscriptions = []
            socket.leave()
        });
    });
}
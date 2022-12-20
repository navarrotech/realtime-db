import { get, set } from '../client.js'

const uid = 'navarro'

get('accounts', uid, function(value){
    console.log('Callback: ', { value })
})
get('accounts', uid)
    .catch(console.log)
    .then((value) => {
        console.log('Promise then: ', { value })
    })
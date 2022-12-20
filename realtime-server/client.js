import { io } from "socket.io-client";
import { nanoid } from 'nanoid'

const socket = io("ws://localhost:3333/", {
    reconnectionDelayMax: 10000
});

const callbacks = {}

socket.on('connect', () => {
    console.log("Connection made")
})
socket.on('error', (error) => {
    console.log("Error: ", error)
})
socket.on('value', ({ id, value=null }) => {
    if(callbacks[id]){ callbacks[id](value); delete callbacks[id] }
})

export function get(root, path, callback){
    return new Promise(accept => {
        let id = nanoid(11)
        callbacks[id] = function(value){
            if(callback){ callback(value); }
            accept(value)
        }
        socket.emit('get', { root, path, id })
    })
}

export function set(root, path, value, callback){
    return new Promise(accept => {
        let id = nanoid(11)
        callbacks[id] = function(value){
            if(callback){ callback(value); }
            accept(value)
        }
        socket.emit('set', { root, path, value, id })
    })
}

export function onValue(root, path, callback){
    let id = nanoid(11)
    callbacks[id] = function(value){
        if(callback){ callback(value); }
    }
    socket.emit('subscribe', { id, root, path })
    return function (){
        socket.emit('unsubscribe', id)
    }
}

export function push(root, path, value, callback){
    return new Promise(accept => {
        let id = nanoid(11)
        callbacks[id] = function(value){
            if(callback){ callback(value); }
            accept(value)
        }
        socket.emit('push', { root, path, value, id })
    })
}
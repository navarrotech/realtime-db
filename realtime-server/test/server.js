const Redis = require('ioredis')
const express = require('express')
const SocketIo = require('socket.io')
const http = require('http')

const useRealtimeServer = require('../index.js')
const redis = new Redis();

const { PORT=3333 } = process.env

const app = express()

app.get('/', (req, res) => res.sendFile('index.html', { root:__dirname }))
app.get('/client.js', (req, res) => res.sendFile('./dist/main.bundle.js', { root:__dirname }))

const server = http.createServer(app);
const io = SocketIo(server, {
    // cors: {
    //     origin: "http://localhost:3000"
    // }
});

useRealtimeServer(
    io,    // Must be an active socket.io server
    redis  // Must be an active Redis.io object.
)

server.listen(PORT, () => { console.log("Test server running on port " + PORT) })
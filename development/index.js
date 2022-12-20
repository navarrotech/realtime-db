import Redis from "ioredis"
import express from "express"

const subscriber = new Redis(6380);
const publisher  = new Redis(6380);

const app = express()

app.get('/', (req, res) => {
    publisher.publish("updates", JSON.stringify({ 
        name:"alex navarro", 
        uid: "123749812478921",
        email: 'alex@navarrocity.com'
    }));
    res.send('Published!')
})

subscriber.subscribe('updates', (err, count) => {
    console.log({ err, count })
})

subscriber.on('message', (channel, message) => {
    console.log({ channel, message })
})

app.listen(3000, () => { console.log("Listening on 3000") })

// redis.on('error', (err) => console.log('Redis redis Error', err));

// redis
//     .hset('navarro_2', {
//         first_name: "alex",
//         last_name: "navarro",
//         email: "alex@navarrocity.com",
//         documents:{
//             "one":"Hello world",
//             "two":"Hello johnny"
//         }
//     })
//     .then(() => {
//         return redis.hget('navarro_2')
//     })
//     .then((item) => {
//         console.log({ item })
//         return redis.disconnect()
//     })
//     .then(() => {
//         console.log("Finished!")
//         process.exit(0)
//     })
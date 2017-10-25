const express = require('express');
const app     = express();
const server  = require('http').createServer(app);
const io      = require('socket.io')(server)

app.use(express.static(__dirname + '/public'))

app.post('/sonos-webhook', (req, res) => {
  io.emit('message', 'Sonos state changed.')
  res.sendStatus(200)
})

server.listen(3000)
console.log('server started at localhost:3000')

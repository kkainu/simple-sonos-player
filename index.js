const express = require('express');
const app     = express();
const server  = require('http').createServer(app);
const io      = require('socket.io')(server)

app.use(express.static('public'))

app.get('/hello', (req, res) => {
  io.emit('message', 'hello')
  res.sendStatus(200)
})

app.post('/sonos-webhook', (req, res) => {
  io.emit('message', 'sonos here!!!!')
  res.sendStatus(200)
})

server.listen(3000)


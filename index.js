const express = require("express");
const app = express();
const server = require('http').createServer(app)
require('dotenv').config()

const io = require("socket.io")(server, {
  cors: { origin: "*" },
});

const sockets = {};
const getChatSocket = (socket) => {
  return sockets['chat-user-' + socket];
}

const setChatSocket = (socket, data) => {
  sockets['chat-user-' + socket] = data;
}

const deleteChatSocket = (socket) => {
  delete sockets["chat-user-" + socket];
}

io.on('connection', (socket) => {
  socket.on('connect-user', (userId) => {
    socket.socketid = userId;
    setChatSocket(socket.socketid, socket);
    console.log(sockets);
  });

  socket.on('disconnect', () => {
    deleteChatSocket(socket.socketid);
  });

  socket.on('message', (message) => {
    const receiver = getChatSocket(message.receiver)
    if (receiver)
      receiver.emit('message', { body: message.body, sender: message.sender });
  });
})

app.use(express.static('public'))

server.listen(process.env.PORT, () => {
  console.log("listeing on " + process.env.URL);
});

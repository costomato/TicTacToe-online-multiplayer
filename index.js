const express = require("express");
const app = express();
const server = require('http').createServer(app)
require('dotenv').config()
const port = process.env.PORT || 8080

const io = require("socket.io")(server, {
  cors: { origin: "*" },
});

const sockets = {};
const getRoom = (roomCode) => {
  return sockets['room-' + roomCode];
}

const createNewRoom = (roomCode, data) => {
  sockets['room-' + roomCode] = {
    creatorName: data.name,
    playerQuantity: 1,
    board: ['1', '2', '3', '4', '5', '6', '7', '8', '9'],
    player1Socket: data.socket
  };
}

const updateBoardOnSocket = (roomCode, req) => {
  sockets['room-' + roomCode].board[req.index] = req.move
}
const resetBoardOnSocket = (roomCode) => {
  sockets['room-' + roomCode].board = ['1', '2', '3', '4', '5', '6', '7', '8', '9']
}

const checkWinner = require('./util/checkWinner')
const getRoomWinner = (roomCode) => {
  const board = sockets[`room-${roomCode}`]['board']
  return checkWinner(board)
}
const getRemainingMovesInRoom = (roomCode) => {
  const board = sockets[`room-${roomCode}`]['board']
  let count = 0
  board.forEach((item) => {
    if (item >= '1' && item <= '9')
      count++
  })
  return count
}
const addPlayerInRoom = (roomCode, data) => {
  const soc = sockets[`room-${roomCode}`]
  soc.playerQuantity++
  soc.player2Socket = data.socket
  soc.joinerName = data.name
}

const deleteRoom = (roomCode) => {
  delete sockets["room-" + roomCode];
}

const generateRoomCode = require('./util/generateRoomCode')
io.on('connection', (socket) => {

  socket.on('create-room', (req) => {
    /* req contains { name } */
    let roomCode = generateRoomCode()
    while (`room-${roomCode}` in sockets)
      roomCode = generateRoomCode()

    createNewRoom(roomCode, { name: req.name, socket: socket })
    socket.emit('create-room', { roomCode: roomCode, yourSymbol: 'X' })
    /* create-room response contains { roomCode, yourSymbol } */
  })

  socket.on('join-room', (req) => {
    /* req contains { roomCode, name } */
    const room = getRoom(req.roomCode)
    if (room) {
      if (room.playerQuantity < 2) {
        addPlayerInRoom(req.roomCode, { name: req.name, socket: socket })
        socket.emit('join-status', { statusOk: true, statusCode: 100, statusString: 'Joined', firstMove: 'X', roomCode: req.roomCode, creatorName: room.creatorName, yourSymbol: 'O' })
        room.player1Socket.emit('join-status', { statusOk: true, statusCode: 101, statusString: req.name, firstMove: 'X', yourSymbol: 'X' })
      }
      else
        socket.emit('join-status', { statusOk: false, statusCode: 102, statusString: 'Room is full' })
    } else
      socket.emit('join-status', { statusOk: false, statusCode: 103, statusString: 'Room does not exist' })
  });

  socket.on('move', (req) => {
    /* req contains { roomCode, index, move, player } */
    const roomCode = req.roomCode
    const room = getRoom(roomCode)
    req.currentMove = req.move == 'X' ? 'O' : 'X'
    room.player2Socket.emit('move', req)
    room.player1Socket.emit('move', req)
    /* move response contains { roomCode, index, move, player, currentMove } */

    updateBoardOnSocket(roomCode, req)

    const winner = getRoomWinner(roomCode)
    if (winner) {
      const res = { winner: winner == 'X' ? room.creatorName : room.joinerName, draw: false, symbol: winner }
      room.player1Socket.emit('winner', res)
      room.player2Socket.emit('winner', res)
    } else if (getRemainingMovesInRoom(roomCode) == 0) {
      room.player1Socket.emit('winner', { winner: 'No one', draw: true })
      room.player2Socket.emit('winner', { winner: 'No one', draw: true })
    }
  })

  socket.on('retry-game', (req) => {
    const room = getRoom(req.roomCode)
    resetBoardOnSocket(req.roomCode)
    const res = { move: req.symbol == 'X' ? 'O' : 'X' }
    room.player1Socket.emit('retry-game', res)
    room.player2Socket.emit('retry-game', res)
  })

  socket.on('delete-room', (roomCode) => {
    deleteRoom(roomCode);
  });

})

app.use(express.static('public'))

server.listen(port, () => {
  console.log("listeing on " + process.env.URL);
});

const socket = io(window.location.href);

const displayPlayer = (player) => {
  const li = document.createElement("li");
  li.innerHTML = player;
  li.style.fontSize = "18px";
  document.getElementById("players").append(li);
}

const displayStatus = (status) => {
  const li = document.createElement("li");
  li.innerHTML = status;
  li.style.fontSize = "18px";
  document.getElementById('gameStatus').prepend(li);
}

// hide roomCreation show ticTac
const displayGameLayout = () => {
  document.getElementById('roomCreation').style.display = 'none'
  document.getElementById('ticTac').style.display = 'block'
}


// room creation
let joinerName, move, yourSymbol, creatorName, yourName

document.getElementById('btnCreateRoom').onclick = () => {
  creatorName = document.getElementById('creatorName').value.trim()
  yourName = creatorName
  if (creatorName)
    socket.emit('create-room', { name: creatorName })
  else
    alert("Hey you! Don't you have a name? :)")
}

let roomCode
socket.on('create-room', (res) => {
  /* create-room response contains { roomCode, yourSymbol } */
  displayGameLayout()
  roomCode = res.roomCode
  document.getElementById('roomCode').innerHTML = `Room code: ${roomCode}`
  displayPlayer(creatorName)
})


// room joining
document.getElementById('btnJoinRoom').onclick = () => {
  joinerName = document.getElementById('joinerName').value.trim()
  yourName = joinerName
  roomCode = document.getElementById('inJoinRoom').value.trim()
  if (joinerName && roomCode)
    socket.emit('join-room', { roomCode: roomCode, name: joinerName })
  else if (joinerName)
    alert('You forgot to enter the room code!!')
  else
    alert("Hey you! Don't you have a name? :)")
}

let roomReady = false
socket.on('join-status', (res) => {
  /* join-status response contains 
  { statusOk: true, statusCode: 100, statusString: 'Joined', firstMove: 'X', roomCode: req.roomCode, creatorName: room.creatorName, yourSymbol: 'O' 
 } */
  if (res.statusOk) {
    if (res.statusCode == 100) { // joiner
      displayGameLayout()
      roomCode = res.roomCode
      document.getElementById('roomCode').innerHTML = `Room code: ${roomCode}`
      displayPlayer(res.creatorName)
      displayPlayer(joinerName)
      roomReady = true
    } else { // creator
      displayPlayer(res.statusString)
      roomReady = true
    }
    yourSymbol = res.yourSymbol
    move = res.firstMove
    displayStatus(`'${yourSymbol}' is your symbol`)
    displayStatus(`'${res.firstMove}' moves first`)
  } else {
    alert(res.statusString)
  }
})



// playing the game
const markOnBoard = (board) => {
  const btn = document.getElementById(`b${board.index}`)
  btn.value = board.move
}

const boxListener = (index, value) => {
  if (!value && move == yourSymbol && roomReady) {
    socket.emit('move', { roomCode: roomCode, index: index, move: move, player: yourName })
    markOnBoard({ index: index, move: yourSymbol })
  } else if (!roomReady) {
    alert("Could you just wait for your friend to join?");
  }
}

socket.on('move', (res) => {
  /* move response contains { roomCode, index, move, player, currentMove } */
  move = res.currentMove
  markOnBoard({ index: res.index, move: res.move })
})


// declaring winner
socket.on('winner', (res) => {
  if (res.draw)
    displayStatus(`Oops :/ Match drawn. That was an amazing clash! Both of you should try again :D`)
  else
    displayStatus(`${res.winner} with symbol ${res.symbol} is the winner!! Congrats to the champion.`)
  move = null
  document.getElementById('retryContainer').style.display = 'block'
})


// enabling retry
const resetGame = (currentMove) => {
  document.getElementById('retryContainer').style.display = 'none'
  move = currentMove
  for (let i = 0; i <= 8; i++) {
    document.getElementById(`b${i}`).value = ''
  }
  document.getElementById('gameStatus').innerHTML = "";

  displayStatus(`'${yourSymbol}' is your symbol`)
  displayStatus(`'${move}' moves first`)
}

document.getElementById('btnRetry').onclick = () => {
  socket.emit('retry-game', { roomCode: roomCode, symbol: yourSymbol })
}

socket.on('retry-game', (res) => {
  /* res contains { move } */
  resetGame(res.move)
})

socket.on("delete-room", () => {
  location.reload()
})
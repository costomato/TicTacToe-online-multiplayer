const socket = io('http://localhost:8080');

let fromId = toId = ''
document.getElementById('btnFromId').onclick = () => {
  fromId = document.getElementById('fromId').value
  if (fromId === '')
    alert("ID cannot be blank")
  else
    socket.emit('connect-user', fromId)
}
document.getElementById('btnToId').onclick = () => {
  toId = document.getElementById('toId').value
  if (toId === '')
    alert("ID cannot be blank")
  console.log(toId);
}

const displayMessage = (sender, body) => {
  const el = document.createElement("li");
  el.innerHTML = `${sender} said: ${body}`;
  el.style.fontSize = "24pt";
  document.querySelector("ul").appendChild(el);
}
document.getElementById('btnSend').onclick = () => {
  const message = {
    body: document.getElementById('msg').value,
    receiver: toId,
    sender: fromId
  }
  if (message.body !== '' && toId !== '' && fromId !== '') {
    document.getElementById('msg').value = ''
    socket.emit('message', message);
    displayMessage('You', message.body)
  } else if (message.body !== '')
    alert("ID cannot be blank")
}
document.getElementById('msg').addEventListener("keyup", (event, callback) => {
  if (event.key == 'Enter') {
    document.getElementById('btnSend').click()
  }
  callback('Enter')
})

socket.on('message', (message) => {
  displayMessage(message.sender, message.body)
})
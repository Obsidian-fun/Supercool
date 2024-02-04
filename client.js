// This is the client side code

const URL = "http://localhost:3890";
const socket = io();   //URL, { autoConnect: false });


const input = document.querySelector('.Chatbox #message-container #message-input');
const form = document.querySelector('.Chatbox #message-container #form');
const message = document.querySelector('.Chatbox #message-container #message');
const messageBody = document.querySelector('.Chatbox #message-container');

// Socket on connection,
socket.on('connection', (msg) =>{
  display(msg);
});

// For sending messages,
form.addEventListener('submit', (e) => {
  e.preventDefault();
    if (input.value) {
        socket.emit('chat message', input.value);
        input.value = '';
    }
});

// For receiveing messages,
socket.on('chat message', (msg) => {
  display(msg);
  messageBody.scrollTo(0, messageBody.scrollHeight);
});

socket.on('disconnect' , (msg)=>{
  const el=document.createElement('li');
  el.innerText = `See ya later amigo 👋`;
  document.querySelector('.Chatbox #message-container #message').append(el);
});


function display(message) {
  const el = document.createElement('li');
  el.innerText = `${message}`;
  document.querySelector('.Chatbox #message-container #message').append(el);
}

        

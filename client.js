// This is the client side code

const URL = "http://localhost:3890";
const socket = io({
  //URL, { autoConnect: false });
  //  auth:{
  //    token:
  //  }
});
  
  
  
console.log(socket);

const input = document.querySelector('.Chatbox #message-container #message-input');
const form = document.querySelector('.Chatbox #message-container #form');
const message = document.querySelector('.Chatbox #message-container #message');
const messageBody = document.querySelector('.Chatbox #message-container');

// Socket on connection,
socket.on('connect', ()=>{
  console.log(`Welcome to the Chat! `);
});



// For sending messages,
form.addEventListener('submit', (e) => {
  e.preventDefault();
    if (input.value) {
        socket.emit('chat message',input.value);
        input.value = '';
    }
});

// For receiving messages,
socket.on('chat message', (user, text)=> {
  display(user, text);
  messageBody.scrollTo(0, messageBody.scrollHeight);
});

socket.on('disconnect' , (msg)=>{
  const el=document.createElement('li');
  el.innerText = `See ya later amigo 👋`;
  document.querySelector('.Chatbox #message-container #message').append(el);
});


function display(name, message) {
  const el = document.createElement('li');
  el.innerText = `${name}: ${message}`;
  document.querySelector('.Chatbox #message-container #message').append(el);
}

function onlineUser(name) {
  const onlinePerson = document.createElement('ul');
  onlinePerson.innerText = `${name}`;
  document.querySelector('.Container .Users').appendChild(onlinePerson);
}



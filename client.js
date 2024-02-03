// This is the client side code

// const username = window.prompt('Enter your username?');
//localStorage.setItem('username',username);
//const user = localStorage.getItem('username');

const input = document.querySelector('.Chatbox #message-container #message-input');
const form = document.querySelector('.Chatbox #message-container #form');
const message = document.querySelector('.Chatbox #message-container #message');


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
  window.scrollTo(0, document.querySelector('#message-container').scrollHeight);
});

socket.on('disconnect' , (msg)=>{
  const el=document.createElement('li');
  el.innerText = `See ya later amigo 👋`;
  document.querySelector('ul').append(el);
});


function display(message) {
  const el = document.createElement('li');
  el.innerText = `${message}`;
  document.querySelector('ul').append(el);
}

// check out differences between textContent, innerHTML and innerText at https://builtin.com/software-engineering-perspectives/innerhtml-vs-innertext
        
// https://sparrowshare.com/app/listings/02eb6d47-0d42-4924-b552-5b0c3adb3d09

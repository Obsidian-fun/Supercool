// This is the client side code

const URL = "http://localhost:3890";
const socket = io(
  {
//     autoConnect: false,
 //   socket.handshake.auth = sessionStorage.name
  });




function username(){
  const displayName= window.prompt("Enter your Display Name","");

  if(displayName.toString().length < 3){
    alert("Username should be atleast 3 letters");
    username();
  } else {
      sessionStorage.setItem("name",displayName);
  }
}

const input = document.querySelector('.Chatbox #message-container #message-input');
const form = document.querySelector('.Chatbox #message-container #form');
const message = document.querySelector('.Chatbox #message-container #message');
const messageBody = document.querySelector('.Chatbox #message-container');

// Socket on connection,

socket.on('connect', ()=>{
    console.log(`Welcome welcome`);
  });


// Display list of users,
socket.on('users',(users)=>{
  users.forEach((user)=>{
    online(user);
  });
});

// Display connected user to other users,
socket.on('user connected',(users)=>{
      online(users[users.length-1]);
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

function online(name) {
  const onliner = document.createElement('ul');
  onliner.innerText = `${name}`;
  document.querySelector('.Container .Users').appendChild(onliner);
}










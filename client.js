// This is the client side code

const input = document.querySelector('.Chatbox #message-container #message-input');
const form = document.querySelector('.Chatbox #message-container #form');
const message = document.querySelector('.Chatbox #message-container #message');
const messageBody = document.querySelector('.Chatbox #message-container');


// const URL = "http://localhost:3890";

const socket = io(
  {
     autoConnect: false,
     transports: ["websockets","polling"],
  });

// Executing the main function that deals with the logic of sockets,
stayConnected();

// Whenever, page is refreshed (load), session will be maintained,
function stayConnected(){
  localStorage.setItem("initialConnection",true);

  if(localStorage.initialConnection === "true"){
    localStorage.initialConnection = false;
    socket.connect();
    console.log(socket);
  } else {
      const session = localStorage.getItem("sessionID");
      if (session) {
        socket.auth = session;
        console.log("Refreshed socket.auth value: ", socket.auth);
        console.log('Preserved in local cache: ',session);
        socket.connect();
        console.log(socket);
      }
   }

//     Session Management,
      socket.on('session', ({sessionID, userID})=>{
        // using auth, to store session ID,
        console.log(sessionID);
        socket.auth = sessionID;
        console.log("Initial Socket.Auth value: ",socket.auth);
        localStorage.setItem("sessionID",sessionID);
        socket.userID = userID;
      });
      
      // Display list of users,
      socket.on('users',(users)=>{
        for( let i=0; i<users.length; i++){
          let name = users[i].username;
          online(name);
        }
      });
      
      // Display connected user to other users,
      socket.on('user connected',(user)=>{
            online(user);
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
}

// Supporting functions to help with the display of text and to show online users,
// These functions are called within the sockets of function stayConnected();
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

  

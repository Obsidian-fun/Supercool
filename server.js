import express from 'express';
import path from 'path';
import { fileURLToPath } from 'url';
import { dirname, join } from 'path';
import bcrypt from 'bcryptjs'; 
import 'dotenv/config';
import cors from 'cors';
import bodyParser from 'body-parser';
import mysql from 'mysql';
import HashMap from 'hashmap';
import {uuid,cryptToken} from './systemToken/token.js';

// socket.io imports,
import { Server } from 'socket.io';
import { createServer } from 'http';  // Routing

const app = express();
const server=createServer(app);
const io= new Server(server);


// Creating a class to store usernames with ids in a hashmap,

class User{
  constructor(){
    this.hashmap = new HashMap();
    this.array = [];
  }
  push(name){
    this.array.push(name);
  }
  pop(){
    this.array.pop();
  }
  splice(name){
    this.array.splice(this.array.indexOf(name),1);
  }
  showArray(){
    return this.array;
  }
  get(key) {
    return this.hashmap.get(key);
  }
  set(key,value) {
    this.hashmap.set(key, value);
  }   
  search(key) {
    return this.hashmap.search(key);  
  }
  delete(key) {
    this.hashmap.delete(key);
  }
  has(key) {
    return this.hashmap.has(key);
  }
  size() {
    return this.hashmap.size();
  }
  clear(key) {
    this.hashmap.clear();
  }
}
const value = new User();

// Connecting server to listen on a port,
let port = process.env.PORT || 3000;

app.set('view engine','EJS');

app.use(cors('http://localhost:${process.env.PORT}')) // Enable ALL cross origin sharing ( DANGEROUS - PLEASE CHANGE IN PRODUCTION)
app.use(bodyParser.json())

// setting the default path
const __dirname = dirname(fileURLToPath(import.meta.url));
console.log(__dirname);

// serve static pages,
app.use(express.static(__dirname));

// connecting database to server,
const connection = mysql.createConnection({
  host : process.env.DB_HOST,
  user : process.env.DB_USER,
  database : process.env.DB_NAME,
  password : process.env.DB_PASSWORD,
  charset : "utf8mb4"           // Fun emojis
});
connection.connect();


// Initial GET requests to fetch pages,
app.get('/', (req,res)=> {
  res.sendFile(join(__dirname,'login.html'));
});

app.get('/signup', (req,res)=> {
  res.sendFile(join(__dirname,'register.html'));
});


// All the POST routes,
app.post('/register', (req, res)=>{
  let { username, email, password } = req.body;
  
  bcrypt.hash(password, 10, (err, hash)=> {
    if(err){
      res.status(500).send({
        message:err,
      })
    } else {
      connection.query(`INSERT INTO users (id, username, password, registered) VALUES (?, ?, ?, NOW());`,[uuid(), username, hash], 
      (err, result) => {
        if (err) {
          return res.status(400).send({
            message:err,
          });
        }
        return res.status(200).send({
          message:"Registered",
        });
      }
     ); 
    }
  });
});



// All the POST requests, to work with user credentials,
app.post('/login', (req, res)=> {
  const {username, password} = req.body;
   
  // check for validity,
  connection.query(`SELECT * FROM users WHERE username=?; `, [req.body.username],
    (err, result) =>{
      if(err) {
        return res.status(401).send({
          message:"Incorrect username or password!",
        });
      } else if (result.length === 0) {
        return res.status(401).send({
          message: "Incorrect username or password!",
        }); 
      } else {
          bcrypt.compare(
            password, result[0].password,
            (bErr, bResult)=>{
              if (bErr) {
                return res.status(404).send({
                message:"Incorrect username or password!",
              });
              }
              if(bResult) {
                // UPDATE login time of user,
               connection.query(`UPDATE users SET last_login=NOW() WHERE id=?;`, [result[0].id,]);
               value.push(username);
               
              return res.status(200).send({
                message:"Logged In!",
                user: result[0],
              });          
          }          
       return res.status(400).send({
         message: "Incorrect username or password!",
       });
        }
      )};
    }
  );
});

// Secret route, only logged in users can fetch these pages,
app.get('/chatroom', (req, res)=> {
  res.render(join(__dirname,'chatroom.ejs'));  
});

import {InMemorySessionStore} from './sessionStore.js';
const sessionStore = new InMemorySessionStore();    

io.use((socket, next)=>{
   /*   const sessionID = socket.handshake.auth.sessionID;
      if (sessionID != undefined){
        const session =  sessionStore.findSession(sessionID);
        console.log(session);
        typeof(session);
        if (session){
        //  socket.handshake.auth.sessionID = sessionID;
        //  socket.handshake.auth.userID = sessionID.userID;
        //  socket.handshake.auth.username = session.username;
          return next();
        }
      } else {
          const username = value.get(socket.id);
          if (!username) {
            return next(new Error("invalid username"));
          }
        // Creating new session    */
        socket.handshake.auth.username = value.array[value.array.length-1];
        socket.handshake.auth.sessionID = uuid();
        socket.handshake.auth.userID = uuid();   
        next();
    //  }
});

io.on('connection', (socket) =>{
    // Get the socket id, and the last user that connected, from value.array ,
    value.set(socket.id,value.array[value.array.length-1]); 
 
    let user= value.get(socket.id);
    console.log(`${user} connected on ${socket.handshake.time}`);
    console.log(value.array);

    // Creating session persistance in hashmap,
    sessionStore.saveSession(socket.handshake.auth.sessionID, {
      userID: socket.handshake.auth.userID,
      username: socket.handshake.auth.username,
      connected: true,
    });
      
    socket.emit('session',{
      sessionID: socket.handshake.auth.sessionID,
      userID: socket.handshake.auth.userID,
    });
   
    socket.emit('users',value.array);
    socket.broadcast.emit('user connected',value.array);

    socket.onAny((event, ...args)=>{    // Catch all socket events
      console.log(event, args);
    });

    socket.on('chat message', (msg)=> {
      io.emit('chat message', user, msg);
    });
   
    socket.on('disconnect', (msg) => {
      console.log(value.get(socket.id), ' disconnected');
      value.splice(user);
      value.delete(socket.id);
    });

  });


server.listen(port, ()=> {
  console.log(`Server listening on ${port}`);
});


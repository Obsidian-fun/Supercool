import express from 'express';
import session from 'express-session';
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
import {validateRegister} from './middleware/users.js';
import { Server } from 'socket.io';
import { createServer } from 'http';  // Routing

// Initializers and middleware,
const app = express();
const server=createServer(app);


// TODO change secret, secure and maxAge params
const sessionMiddleware = app.use(session({
  secret:'change_this_key',
  resave: false,
  saveUninitialized: false,
  cookie: {
    sameSite: 'strict',
    httpOnly: true,
    secure: false,
    maxAge: null
  }
}));

const io= new Server(server, {
  transports: ["websockets","polling"],
  cors: {
    origin: "http://127.0.0.1:3890",
    credentials: true,
  }
});


// Creating a class to store usernames with ids in a hashmap,

class User{
  constructor(){
    this.hashmap = new HashMap();
    this.array = [];
    this.initialLoggedIn = true;
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

/***
FIXME
Enable ALL cross origin sharing ( DANGEROUS - 
PLEASE CHANGE IN PRODUCTION)
***/  
app.use(cors('http://localhost:${process.env.PORT}')) 

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
  if(req.session.loggedIn){
    res.redirect('/chatroom');
  }
  res.sendFile(join(__dirname,'login.html'));
});

app.get('/signup', (req,res)=> {
  res.sendFile(join(__dirname,'register.html'));
});

// All the POST routes,
app.post('/register',validateRegister, (req, res)=>{
  const { username, email, password } = req.body;
  
  connection.query(`SELECT id FROM users WHERE LOWER(username)=LOWER(?);`,[username],
    (err, result)=>{
      if( result && result.length > 0 ){
        return res.status(409).send({
          message:"Username already taken!",
        });
      } else {
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
      }
    }
 );
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
              
              req.session.loggedIn = true;  
              req.session.user = username;
                
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

app.get('/logout',(req,res)=>{
  req.session.destroy(function (err){
    if (err) {
      console.log(err);
    } else {
      res.sendFile(join(__dirname,'login.html'));
    }
  });
});


import {InMemorySessionStore} from './sessionStore.js';
const sessionStore = new InMemorySessionStore();    

io.engine.use(sessionMiddleware);
io.use((socket, next)=>{
// Using a hashmap to manage username and session key. The key is last username saved in array.
  let sessionID = socket.handshake.auth.sessionID;
  const cookieInfo = socket.request.session;
  console.log("Express cookie", cookieInfo);
  console.log("Request headers from client",);
//  console.log("Middleware session ID", sessionID);
      if(sessionID){
        console.log("This finally got called");
        const session =  sessionStore.findSession(sessionID);
        if (session){
          socket.sessionID = sessionID;
          socket.userID = session.userID;
          socket.username = session.username;
          console.log('bp2');
          return next();
        }
      } else { 
          const username = value.array[value.array.length -1]; 
          if (!username) {
            return next(new Error("invalid username"));
          }
        // Creating a new session if no socket.handshake was established,
        socket.username = username;
        socket.sessionID = uuid();
        socket.userID = uuid();   
        console.log('bp1');
        next();
      }
});

io.on('connection', (socket) =>{
    // Get the socket id, and the last user that connected, from value.array ,
    let user= value.array[value.array.length -1]; 

    //TODO [DELETE]?? Saving a hashmaps of sessionID to user,
    value.set(user, socket.sessionID);

    //TODO [DELETE] session ID value
    console.log("Session ID for connection: ",socket.sessionID);

    // Creating session persistance in hashmap,
    sessionStore.saveSession(socket.sessionID, {
        userID: socket.userID,
        username: socket.username,
      });

    console.log(`${user} connected on ${socket.handshake.time}`);

    const users=[];
    sessionStore.findAllSessions().forEach((session)=>{
      users.push({
        userID: session.userID,
        username: session.username,
      });
    });

    socket.emit('session',{
      sessionID: socket.sessionID,
      userID: socket.userID,
    });
   
    socket.emit('users',users);
    socket.broadcast.emit('user connected',user);

    socket.onAny((event, ...args)=>{    // Catch all socket events
      console.log(event, args);
    });

    socket.on('chat message', (msg)=> {
      io.emit('chat message', user, msg);
    });
   
    socket.on('disconnect', (msg) => {
      console.log(user, ' disconnected');
 //     sessionStore.deleteSession(socket.sessionID)
 //     value.splice(user);

    }); 
});

server.listen(port, ()=> {
  console.log(`Server listening on ${port}`);
});

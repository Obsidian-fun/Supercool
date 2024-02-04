import express from 'express';
const app = express();
import path from 'path';
import { fileURLToPath } from 'url';
import { dirname, join } from 'path';
import bcrypt from 'bcryptjs'; 
import 'dotenv/config';
import cors from 'cors';
import bodyParser from 'body-parser';
import mysql from 'mysql';

import {uuid,cryptToken} from './systemToken/token.js';


// socket.io imports,
import { Server } from 'socket.io';
import { createServer } from 'http';  // Routing

const server=createServer(app);
const io= new Server(server);


// Connecting server to listen on a port,
let port = process.env.PORT || 3000;

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
  charset : "utf8mb4"
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
  
  const user = { name:username };
//  const accessToken = jwt.sign(user, process.env.ACCESS_TOKEN_SECRET);

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

const usersLoggedIn=[];

// All the POST requests, to work with user credentials,
app.post('/login', async (req, res)=> {
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
        //     const accessToken = jwt.sign({username}, process.env.ACCESS_TOKEN_SECRET, {expiresIn: '7d'});
              usersLoggedIn.push(username);
            // UPDATE login time of user,
               connection.query(`UPDATE users SET last_login=NOW() WHERE id=?;`, [result[0].id,]);
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
  res.sendFile(join(__dirname,'chatroom.html'));  
});

io.on('connection', (socket) =>{

    const user=usersLoggedIn[usersLoggedIn.length-1];
    console.log(user+` has connected at ${socket.id}`);

    socket.onAny((event, ...args)=>{    // Catch all socket events
      console.log(event, args);
    });

    socket.on('chat message', (msg)=> {
      io.emit('chat message',`${user}:${msg}`);
    });
   
    socket.on('disconnect', (msg) => {
    console.log(socket.id, 'User disconnected');
    });
  });



server.listen(port, ()=> {
  console.log(`Server listening on ${port}`);
});



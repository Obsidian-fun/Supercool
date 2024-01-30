import express from 'express';
const app = express();
import path from 'path';
import { fileURLToPath } from 'url';
import { dirname, join } from 'path';
import bcrypt from 'bcryptjs'; // Find out right ES6 import import { v4 as uuid } from 'uuid';
import jwt from 'jsonwebtoken';  // Find out right ES6 import
import 'dotenv/config';
import cors from 'cors';
import bodyParser from 'body-parser';
import mysql from 'mysql';
import { v4 as uuidv4 } from 'uuid';

// Connecting server to listen on a port,
let port = process.env.PORT || 3000;

app.use(cors()) // Enable ALL cross origin sharing ( DANGEROUS - PLEASE CHANGE IN PRODUCTION)
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

/*
// Middleware functions,
function isLoggedIn(req, res, next) {
  if(!req.headers.authorization) {
    return res.status(401).send({
      message:"Not logged in!"
    });
  }
  try {
    const authHeader = req.headers.authorization;
    console.log('authHeader = '+ authHeader + '\n');
    const token = authHeader.split(' ')[1];
    console.log('token = ' + token + '\n');
    jwt.verify(token, process.env.ACCESS_TOKEN_SECRET,(err, decoded)=>{
        if(err) {
          res.status(401).send({
            message:'Something wrong'
          });
        }
    console.log('decoded = ' + decoded); 
    req.userData = decoded;
    next(); });
  } catch (err) {
     return res.status(401).send({
       message:err,
     });
  }
}

*/

// All the POST routes,
app.post('/register', (req, res)=>{
  let { username, email, password } = req.body;
  
  const user = { name:username };
  const accessToken = jwt.sign(user, process.env.ACCESS_TOKEN_SECRET);

  bcrypt.hash(password, 10, (err, hash)=> {
    if(err){
      res.status(500).send({
        message:err,
      })
    } else {
      connection.query(`INSERT INTO users (id, username, password, registered) VALUES (?, ?, ?, NOW());`,[uuidv4(), username, hash], 
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
app.get('/secret-route', (req, res)=> {
  res.sendFile(join(__dirname,'/secret.html'));
});

app.listen(port, ()=> {
  console.log(`Server listening on ${port}`);
});



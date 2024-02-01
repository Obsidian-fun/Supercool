import express from 'express';
import { Server } from 'socket.io';
import { createServer } from 'http';  // Routing
import { fileURLToPath } from 'url';  // Routing
import { dirname, join } from 'path'; // Routing
import path from 'path';
import cors from 'cors';

const app=express();
const server=createServer(app);
const io= new Server(server);

server.listen(3800, () =>{
  console.log('Connected, listening on port 3800');
});

app.use(cors('http://localhost:3800')); // To remove blocking nature of cross-origin scripting

const __dirname = dirname(fileURLToPath(import.meta.url));
console.log(__dirname);
app.use(express.static(path.join(__dirname,'/')));

app.get('/', (req,res) => {
  res.sendFile(join(__dirname, 'chatroom.html'));
});

// For socket on make sure the name of the socket and the function variables match on both the server and client side
io.on('connection', (socket) =>{
  io.emit('connection', `User has connected at ${socket.id}`);
  console.log(`User has connected at ${socket.id}`);

  socket.on('chat message', (msg) => {
    io.emit('chat message', msg);
  });

  socket.on('disconnect', (msg) => {
    console.log(socket.id, 'User disconnected');
  });

});

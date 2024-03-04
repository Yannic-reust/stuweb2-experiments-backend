import express from "express";
import * as path from "node:path";
import { fileURLToPath } from "node:url";
import { Server } from "socket.io";
import { createServer } from "node:http";

// create a new express web server
let app = express();

// create a new socket.io server
const server = createServer(app);

const gameState = createGameState();
const rooms = [];
const connectedUsers = {};

let playersTurn = 1;

function createGameState() {
  return [
    { index: 0, player: null },
    { index: 1, player: null },
    { index: 2, player: null },
    { index: 3, player: null },
    { index: 4, player: null },
    { index: 5, player: null },
    { index: 6, player: null },
    { index: 7, player: null },
    { index: 8, player: null },
   
  ];
}

function updateGameState(data) {

  gameState[data.move].player =data.player;
  playersTurn = data.player === 1 ? 2 : 1;
  io.to(data.roomID).emit("game_state", gameState);
  io.to(data.roomID).emit("turn", playersTurn);
  console.log("gameState", gameState);
 
}

// Enable CORS
const io = new Server(server, {
  cors: {
    origin: "http://localhost:5173",
    methods: ["GET", "POST"],
  },
  connectionStateRecovery: {
    maxDisconnectionDuration: 2 * 60 * 1000,
  },
});



let firstTime = true;
let roomID;

// a client has connected
io.on("connection", (socket) => {

  var currentRooms = io.sockets.adapter.rooms;
  console.log("rooms", currentRooms);

  socket.on("join_room", (data) => {
    console.log("user wants to join here", data);
    socket.join(data);
    
    io.to(data).emit("connected", {
      connected: true,
      roomID: data,
      userID: socket.id,
      player:2
    });

    io.to(data).emit("game_state", gameState);
    io.to(data).emit("turn", 1);
  });

  socket.on("input", (input) => {
    console.log("input", input);
    console.log(currentRooms)
    console.log("playersTurn", playersTurn);
    //if valid
    updateGameState(input);

    //console.log("user wants to join here", data);
  });

  socket.on("create_room", (name) => {
    socket.emit("connected", {
      connected: true,
      roomID: name + "-" + socket.id,
      userID: socket.id,
      player:1
    });

    //console.log("room created with data:", name + "-" + socket.id);
    socket.join(name + "-" + socket.id);
  
    console.log("rooms-join", currentRooms);

    io.to(name + "-" + socket.id).emit("game_state", gameState);
    playersTurn = 1;
    console.log("playersTurn", playersTurn);
    io.to(name + "-" + socket.id).emit("turn", playersTurn);
  });

  // Handle user disconnection
  socket.on("disconnect", () => {
    socket.leaveAll();
    console.log("a user disconnected", socket.id);

    // Additional logic for handling user disconnection
  });
});

// Additional function to generate a unique user ID
function generateRoomId() {
  return Math.random().toString(36).substr(2, 9);
}

// start the web server
let port = process.env.PORT || 8080; // set our port
server.listen(port);
console.log("Magic happens on port " + port);

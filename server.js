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

function updateGameState(index) {
  gameState[index].player = 1;
  io.emit("game_state", gameState);
  console.log(gameState);
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

io.engine.generateId = function (req) {
    // generate a new custom id here
    return 1
}

let firstTime = true;
let roomID;
// a client has connected
io.on("connection", (socket) => {
  socket.on("join_room", (data) => {
    console.log("user wants to join here", data);
  });
  


  socket.on("create_room", () => {
    socket.join(socket.id);

    socket.emit("connected", { connected: true, roomID: socket.id });
    
    console.log("room created", socket.id)

    /* console.log("user", socket.id)
      if (firstTime) {
        roomID = socket.id;
        socket.join(roomID);
        firstTime = false;
      }
  
      var currentRooms = io.sockets.adapter.rooms;  // Change variable name to currentRooms
      console.log("rooms", currentRooms);
  
      console.log("room size:", currentRooms.get(roomID).size);
      if (currentRooms.get(roomID).size >= 2) {
        roomID = generateRoomId();
        console.log("room created after check", roomID);
      }
      console.log("joining room", roomID)
      socket.join(roomID);
  
      //console.log("roomID", roomID);
      // console.log(`User ${socket.id} joined room ${roomID}`);
  
      socket.emit("connected", { connected: true, roomID: roomID });
      // Additional logic for handling room joining
      console.log("still this room", roomID)
    });*/
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

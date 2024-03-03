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
  return 1;
};

let firstTime = true;
let roomID;
// a client has connected
io.on("connection", (socket) => {
  socket.on("join_room", (data) => {
    //console.log("user wants to join here", data);
  });

  socket.on("input", (input) => {
    console.log("input", input);
    // ToDo: check if it is the users turn

    //if valid
    updateGameState(input.move);

    //console.log("user wants to join here", data);
  });

  socket.on("create_room", (name) => {
    socket.emit("connected", {
      connected: true,
      roomID: name + "-" + socket.id,
      userID: socket.id,
    });

    //console.log("room created with data:", name + "-" + socket.id);
    socket.join(name + "-" + socket.id);
    // var currentRooms = io.sockets.adapter.rooms; // Change variable name to currentRooms
    //console.log("rooms-join", currentRooms);

    io.to(name + "-" + socket.id).emit("game_state", gameState);
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

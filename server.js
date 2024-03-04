import express from "express";
import { Server } from "socket.io";
import { createServer } from "node:http";

let app = express();
const server = createServer(app);

// create a map to store game states for each room
const gameStates = new Map();

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
  const roomGameState = gameStates.get(data.roomID);

  if (roomGameState) {
    roomGameState[data.move].player = data.player;
    const playersTurn = data.player === 1 ? 2 : 1;

    io.to(data.roomID).emit("game_state", roomGameState);
    io.to(data.roomID).emit("turn", playersTurn);

   
  }
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

io.on("connection", (socket) => {
  socket.on("join_room", (data) => {
    socket.join(data);

    if (!gameStates.has(data)) {
      gameStates.set(data, createGameState());
    }

    io.to(data).emit("connected", {
      connected: true,
      roomID: data,
      userID: socket.id,
      player: 2,
    });

    io.to(data).emit("game_state", gameStates.get(data));
    io.to(data).emit("turn", 1);
  });

  socket.on("input", (input) => {
    updateGameState(input);
  });

  socket.on("create_room", (name) => {
    const roomID = name + "-" + socket.id;

    socket.emit("connected", {
      connected: true,
      roomID: roomID,
      userID: socket.id,
      player: 1,
    });

    socket.join(roomID);

    // create a game state for the room
    gameStates.set(roomID, createGameState());

    io.to(roomID).emit("game_state", gameStates.get(roomID));
    io.to(roomID).emit("turn", 1);
  });

  // Handle user disconnection
  socket.on("disconnect", () => {
    socket.leaveAll();
    console.log("a user disconnected", socket.id);

    // Additional logic for handling user disconnection
  });
});

// start the web server
let port = process.env.PORT || 8080; // set our port
server.listen(port);
console.log("Magic happens on port " + port);

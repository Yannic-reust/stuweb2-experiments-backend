import express from "express";
import { Server } from "socket.io";
import { createServer } from "node:http";
import cors from "cors";

let app = express();
const server = createServer(app);

const gameStates = new Map();


const io = new Server(server, {
  cors: {
    origin: "*",
    methods: ["GET", "POST"],
  },
  connectionStateRecovery: {
    maxDisconnectionDuration: 2 * 60 * 1000,
  },
});

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

function checkWinner(roomGameState) {
  const winningCombinations = [
    [0, 1, 2],
    [3, 4, 5],
    [6, 7, 8],
    [0, 3, 6],
    [1, 4, 7],
    [2, 5, 8],
    [0, 4, 8],
    [2, 4, 6],
  ];

  for (const combination of winningCombinations) {
    const [a, b, c] = combination;
    if (
      roomGameState[a].player &&
      roomGameState[a].player === roomGameState[b].player &&
      roomGameState[a].player === roomGameState[c].player
    ) {
      return roomGameState[a].player;
    }
  }

  return null;
}

function updateGameState(data) {
  const roomGameState = gameStates.get(data.roomID);

  if (roomGameState) {
    roomGameState[data.move].player = data.player;
    const playersTurn = data.player === 1 ? 2 : 1;

    io.to(data.roomID).emit("game_state", roomGameState);
    io.to(data.roomID).emit("turn", playersTurn);

   
      const winner = checkWinner(roomGameState);
      if (winner) {
        io.to(data.roomID).emit("game_over", { winner });
        // You can add more logic here for handling the end of the game
      }
      }
    
  
}

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

    gameStates.set(roomID, createGameState());

    io.to(roomID).emit("game_state", gameStates.get(roomID));
    io.to(roomID).emit("turn", 1);
  });

  socket.on("disconnect", () => {
    socket.leaveAll();
    console.log("a user disconnected", socket.id);
  });
});

let port = process.env.PORT || 8080;
server.listen(port);
console.log("Magic happens on port " + port);

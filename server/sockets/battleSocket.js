const roomState = new Map();

const getRoom = (roomCode) => {
  if (!roomState.has(roomCode)) {
    roomState.set(roomCode, { players: new Map() });
  }
  return roomState.get(roomCode);
};

const registerBattleSocket = (io) => {
  io.on("connection", (socket) => {
    socket.on("battle:join", ({ roomCode, userId, name }) => {
      socket.join(roomCode);
      socket.data.roomCode = roomCode;
      socket.data.userId = userId;

      const room = getRoom(roomCode);
      room.players.set(userId, { name, status: "coding" });

      io.to(roomCode).emit("battle:playerJoined", {
        userId,
        name,
        players: Array.from(room.players.entries()).map(([id, p]) => ({ id, ...p })),
      });
    });

    socket.on("battle:ready", ({ roomCode, userId }) => {
      io.to(roomCode).emit("battle:playerReady", { userId });
    });

    socket.on("battle:start", ({ roomCode, startTime }) => {
      io.to(roomCode).emit("battle:started", { startTime });
    });

    socket.on("battle:statusUpdate", ({ roomCode, userId, status }) => {
      const room = getRoom(roomCode);
      const player = room.players.get(userId);
      if (player) player.status = status;
      io.to(roomCode).emit("battle:opponentStatus", { userId, status });
    });

    socket.on("battle:submit", ({ roomCode, userId, result }) => {
      const room = getRoom(roomCode);
      const player = room.players.get(userId);
      if (player) player.status = "submitted";
      io.to(roomCode).emit("battle:opponentSubmitted", { userId, result });
    });

    socket.on("battle:finish", ({ roomCode, winnerId }) => {
      io.to(roomCode).emit("battle:finished", { winnerId });
      roomState.delete(roomCode);
    });

    socket.on("disconnect", () => {
      const { roomCode, userId } = socket.data;
      if (!roomCode || !userId) return;
      const room = roomState.get(roomCode);
      if (room) {
        room.players.delete(userId);
        io.to(roomCode).emit("battle:playerLeft", { userId });
      }
    });
  });
};

module.exports = registerBattleSocket;

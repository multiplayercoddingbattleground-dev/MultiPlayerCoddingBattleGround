import { useState } from "react";

function BattleLobby() {
  const [roomCode, setRoomCode] = useState("");
  const [createdRoom, setCreatedRoom] = useState(null);

  const createBattle = () => {
    // Temporary frontend room code.
    // Backend will generate the real code later.
    const code = Math.random()
      .toString(36)
      .substring(2, 8)
      .toUpperCase();

    setCreatedRoom(code);
  };

  const copyLink = async () => {
    const link = `${window.location.origin}/battle/${createdRoom}`;

    await navigator.clipboard.writeText(link);

    alert("Battle link copied!");
  };

  const copyCode = async () => {
    await navigator.clipboard.writeText(createdRoom);

    alert("Battle code copied!");
  };

  const joinBattle = () => {
    if (!roomCode.trim()) {
      alert("Enter a battle code");
      return;
    }

    window.location.href = `/battle/${roomCode.toUpperCase()}`;
  };

  return (
    <div className="battle-lobby">

      <h2>⚔ Multiplayer Coding Battle</h2>

      {!createdRoom ? (
        <>
          <button
            className="primary-btn"
            onClick={createBattle}
          >
            Create Battle
          </button>

          <div className="divider">
            OR
          </div>

          <input
            type="text"
            placeholder="Enter Battle Code"
            value={roomCode}
            onChange={(e) =>
              setRoomCode(e.target.value)
            }
          />

          <button
            className="secondary-btn"
            onClick={joinBattle}
          >
            Join Battle
          </button>
        </>
      ) : (
        <div className="created-room">

          <p>🎮 Battle Created!</p>

          <h1>{createdRoom}</h1>

          <p>Share this code with your friend</p>

          <button
            className="primary-btn"
            onClick={copyCode}
          >
            📋 Copy Code
          </button>

          <button
            className="secondary-btn"
            onClick={copyLink}
          >
            🔗 Copy Battle Link
          </button>

          <p className="waiting">
            ⏳ Waiting for opponent...
          </p>

        </div>
      )}

    </div>
  );
}

export default BattleLobby;
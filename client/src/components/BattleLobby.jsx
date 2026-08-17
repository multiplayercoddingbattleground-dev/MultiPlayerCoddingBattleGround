import React, { useState } from "react";
import { useNavigate } from "react-router-dom";
import {
  Users,
  Copy,
  Play,
  LogIn,
  Swords,
  CheckCircle
} from "lucide-react";

function BattleLobby() {
  const navigate = useNavigate();

  const [roomCode, setRoomCode] = useState("");
  const [joinCode, setJoinCode] = useState("");
  const [copied, setCopied] = useState(false);
  const [players, setPlayers] = useState([]);

  // Generate a random 6-character room code
  const generateRoomCode = () => {
    const characters = "ABCDEFGHJKLMNPQRSTUVWXYZ23456789";

    let code = "";

    for (let i = 0; i < 6; i++) {
      code += characters.charAt(
        Math.floor(Math.random() * characters.length)
      );
    }

    return code;
  };

  // Create a new battle
  const handleCreateBattle = () => {
    const newRoomCode = generateRoomCode();

    setRoomCode(newRoomCode);

    setPlayers([
      {
        id: 1,
        name: "Lakshman",
        host: true
      }
    ]);

    setCopied(false);
  };

  // Copy room code
  const handleCopyCode = async () => {
    if (!roomCode) return;

    try {
      await navigator.clipboard.writeText(roomCode);

      setCopied(true);

      setTimeout(() => {
        setCopied(false);
      }, 2000);

    } catch (error) {
      console.error("Failed to copy room code:", error);
    }
  };

  // Join an existing battle
  const handleJoinBattle = () => {
    const code = joinCode.trim().toUpperCase();

    if (!code) {
      alert("Please enter a room code.");
      return;
    }

    if (code.length !== 6) {
      alert("Room code must contain 6 characters.");
      return;
    }

    navigate(`/battle/${code}`);
  };

  // Start created battle
  const handleStartBattle = () => {
    if (!roomCode) {
      alert("Please create a battle first.");
      return;
    }

    navigate(`/battle/${roomCode}`);
  };

  return (
    <div className="lobby-container">

      {/* Header */}
      <div className="lobby-header">

        <div className="lobby-logo">
          <Swords size={28} />

          <div>
            <h1>CODING BATTLEGROUND</h1>

            <p>
              Multiplayer Coding Arena
            </p>
          </div>
        </div>

      </div>

      {/* Main Lobby */}
      <div className="lobby-content">

        {/* Create Battle */}
        <div className="lobby-card">

          <div className="card-icon create-icon">
            <Swords size={30} />
          </div>

          <h2>Create Battle</h2>

          <p>
            Create a new coding battle and invite your friends.
          </p>

          {!roomCode ? (

            <button
              className="lobby-primary-btn"
              onClick={handleCreateBattle}
            >
              <Swords size={18} />

              Create New Battle
            </button>

          ) : (

            <div className="room-section">

              <p className="room-label">
                Your Room Code
              </p>

              <div className="room-code-box">

                <span>
                  {roomCode}
                </span>

                <button
                  onClick={handleCopyCode}
                  title="Copy room code"
                >
                  {copied ? (
                    <CheckCircle size={20} />
                  ) : (
                    <Copy size={20} />
                  )}
                </button>

              </div>

              {copied && (
                <p className="copied-message">
                  Room code copied!
                </p>
              )}

              <p className="invite-message">
                Share this code with your friend.
              </p>

              {/* Players */}
              <div className="players-section">

                <div className="players-title">
                  <Users size={18} />

                  <span>
                    Players ({players.length}/2)
                  </span>
                </div>

                {players.map((player) => (

                  <div
                    className="player-item"
                    key={player.id}
                  >

                    <div className="player-avatar">
                      {player.name.charAt(0).toUpperCase()}
                    </div>

                    <div className="player-info">

                      <strong>
                        {player.name}
                      </strong>

                      {player.host && (
                        <span>
                          Host
                        </span>
                      )}

                    </div>

                    <CheckCircle
                      size={18}
                      className="player-ready"
                    />

                  </div>

                ))}

              </div>

              <button
                className="lobby-start-btn"
                onClick={handleStartBattle}
              >
                <Play
                  size={18}
                  fill="currentColor"
                />

                Start Battle
              </button>

            </div>
          )}

        </div>

        {/* Join Battle */}
        <div className="lobby-card">

          <div className="card-icon join-icon">
            <LogIn size={30} />
          </div>

          <h2>Join Battle</h2>

          <p>
            Enter your friend's room code to join their battle.
          </p>

          <input
            type="text"
            value={joinCode}
            onChange={(event) =>
              setJoinCode(
                event.target.value.toUpperCase()
              )
            }
            placeholder="ENTER ROOM CODE"
            maxLength={6}
            className="room-input"
          />

          <button
            className="lobby-secondary-btn"
            onClick={handleJoinBattle}
          >
            <LogIn size={18} />

            Join Battle
          </button>

        </div>

      </div>

      {/* Footer */}
      <div className="lobby-footer">

        <span>
          ⚡ Compete
        </span>

        <span>
          🧠 Solve
        </span>

        <span>
          🏆 Win
        </span>

      </div>

    </div>
  );
}

export default BattleLobby;
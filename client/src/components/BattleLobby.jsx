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
import { createBattle, joinBattle } from "../services/api";
import { useAuth } from "../context/AuthContext";

function BattleLobby() {
  const navigate = useNavigate();
  const { user } = useAuth();

  const [roomCode, setRoomCode] = useState("");
  const [joinCode, setJoinCode] = useState("");
  const [copied, setCopied] = useState(false);
  const [players, setPlayers] = useState([]);
  const [creating, setCreating] = useState(false);
  const [joining, setJoining] = useState(false);
  const [error, setError] = useState("");

  // Create a new battle via the backend
  const handleCreateBattle = async () => {
    setError("");
    setCreating(true);

    try {
      const battle = await createBattle();

      setRoomCode(battle.roomCode);
      setPlayers([{ id: user.id, name: user.name, host: true }]);
      setCopied(false);
    } catch (err) {
      setError(err.message || "Failed to create battle");
    } finally {
      setCreating(false);
    }
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

  // Join an existing battle via the backend
  const handleJoinBattle = async () => {
    const code = joinCode.trim().toUpperCase();

    if (!code) {
      setError("Please enter a room code.");
      return;
    }

    setError("");
    setJoining(true);

    try {
      const battle = await joinBattle(code);
      navigate(`/battle/${battle.roomCode}`);
    } catch (err) {
      setError(err.message || "Failed to join battle");
    } finally {
      setJoining(false);
    }
  };

  // Enter the room you just created
  const handleStartBattle = () => {
    if (!roomCode) {
      setError("Please create a battle first.");
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

      {error && <p className="auth-error" style={{ width: "min(950px, 92%)", margin: "16px auto 0" }}>{error}</p>}

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
              disabled={creating}
            >
              <Swords size={18} />

              {creating ? "Creating..." : "Create New Battle"}
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

                Enter Battle Room
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
            disabled={joining}
          >
            <LogIn size={18} />

            {joining ? "Joining..." : "Join Battle"}
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

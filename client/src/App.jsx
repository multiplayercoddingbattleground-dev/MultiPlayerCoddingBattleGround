import React from "react";
import { Routes, Route, Navigate } from "react-router-dom";

import Home from "./pages/Home";
import Login from "./pages/login";
import Register from "./pages/Register";
import Dashboard from "./pages/Dashboard";

import Battle from "./pages/Battle";
import BattleLobby from "./pages/BattleLobby";
import BattleMatch from "./pages/BattleMatch";

import QuestionSelection from "./pages/QuestionSelection";
import Results from "./pages/Results";

function App() {
  return (
    <Routes>
      {/* Home */}
      <Route
        path="/"
        element={
          <Navigate
            to="/home"
            replace
          />
        }
      />

      <Route
        path="/home"
        element={<Home />}
      />

      {/* Authentication */}
      <Route
        path="/login"
        element={<Login />}
      />

      <Route
        path="/register"
        element={<Register />}
      />

      {/* Dashboard */}
      <Route
        path="/dashboard"
        element={<Dashboard />}
      />

      {/* Battle Lobby */}
      <Route
        path="/battle-lobby"
        element={<BattleLobby />}
      />

      {/* 
        Multiplayer Battle
        IMPORTANT:
        Battle.jsx expects both roomCode and battleId.
      */}
      <Route
        path="/battle/:roomCode/:battleId"
        element={<Battle />}
      />

      {/* Fallback battle route for older/local links */}
      <Route
        path="/battle/:roomCode"
        element={<Battle />}
      />

      <Route
        path="/battle"
        element={<Battle />}
      />

      {/* Question Selection */}
      <Route
        path="/question-selection"
        element={<QuestionSelection />}
      />

      {/* Battle Match */}
      <Route
        path="/battle-match/:roomCode"
        element={<BattleMatch />}
      />

      <Route
        path="/battle-match"
        element={<BattleMatch />}
      />

      {/* Results */}
      <Route
        path="/results"
        element={<Results />}
      />

      {/* Unknown route */}
      <Route
        path="*"
        element={
          <Navigate
            to="/home"
            replace
          />
        }
      />
    </Routes>
  );
}

export default App;
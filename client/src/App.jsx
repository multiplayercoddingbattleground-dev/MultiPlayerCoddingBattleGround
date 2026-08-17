import { BrowserRouter, Routes, Route } from "react-router-dom";

import Home from "./pages/Home";
import Login from "./pages/Login";
import Register from "./pages/Register";
import Dashboard from "./pages/Dashboard";
import Battle from "./pages/Battle";
import Results from "./pages/Results";

import BattleLobby from "./components/BattleLobby";

function App() {
  return (
    <BrowserRouter>

      <Routes>

        <Route
          path="/"
          element={<Home />}
        />

        <Route
          path="/login"
          element={<Login />}
        />

        <Route
          path="/register"
          element={<Register />}
        />

        <Route
          path="/dashboard"
          element={<Dashboard />}
        />

        {/* Battle Lobby */}
        <Route
          path="/battle-lobby"
          element={<BattleLobby />}
        />

        {/* Actual Battle */}
        <Route
          path="/battle/:roomCode"
          element={<Battle />}
        />

        <Route
          path="/results"
          element={<Results />}
        />

      </Routes>

    </BrowserRouter>
  );
}

export default App;
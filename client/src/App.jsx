import { BrowserRouter, Routes, Route } from "react-router-dom";

import Home from "./pages/Home";
import Login from "./pages/Login";
import Register from "./pages/Register";
import Dashboard from "./pages/Dashboard";
import Battle from "./pages/Battle";
import Results from "./pages/Results";

import BattleLobby from "./components/BattleLobby";
import ProtectedRoute from "./components/ProtectedRoute";
import MainLayout from "./layouts/MainLayout";

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
          element={
            <ProtectedRoute>
              <MainLayout>
                <Dashboard />
              </MainLayout>
            </ProtectedRoute>
          }
        />

        {/* Battle Lobby */}
        <Route
          path="/battle-lobby"
          element={
            <ProtectedRoute>
              <MainLayout>
                <BattleLobby />
              </MainLayout>
            </ProtectedRoute>
          }
        />

        {/* Actual Battle */}
        <Route
          path="/battle/:roomCode"
          element={
            <ProtectedRoute>
              <Battle />
            </ProtectedRoute>
          }
        />

        <Route
          path="/results"
          element={
            <ProtectedRoute>
              <Results />
            </ProtectedRoute>
          }
        />

      </Routes>

    </BrowserRouter>
  );
}

export default App;
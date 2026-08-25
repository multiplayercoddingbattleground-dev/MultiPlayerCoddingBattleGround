const API_URL = import.meta.env.VITE_API_URL || "http://localhost:5000/api";
const TOKEN_KEY = "cb_auth_token";

export function getToken() {
  return localStorage.getItem(TOKEN_KEY);
}

export function setToken(token) {
  if (token) localStorage.setItem(TOKEN_KEY, token);
  else localStorage.removeItem(TOKEN_KEY);
}

async function request(path, { method = "GET", body, auth = true } = {}) {
  const headers = { "Content-Type": "application/json" };

  if (auth) {
    const token = getToken();
    if (token) headers.Authorization = `Bearer ${token}`;
  }

  const response = await fetch(`${API_URL}${path}`, {
    method,
    headers,
    body: body !== undefined ? JSON.stringify(body) : undefined,
  });

  const isJson = response.headers.get("content-type")?.includes("application/json");
  const data = isJson ? await response.json() : null;

  if (!response.ok) {
    const message = data?.message || `Request failed with status ${response.status}`;
    const error = new Error(message);
    error.status = response.status;
    throw error;
  }

  return data;
}

// Auth
export const registerUser = (data) =>
  request("/auth/register", { method: "POST", body: data, auth: false });

export const loginUser = (data) =>
  request("/auth/login", { method: "POST", body: data, auth: false });

export const getMe = () => request("/auth/me");

// Users
export const getLeaderboard = () => request("/users/leaderboard", { auth: false });

export const getUserProfile = (id) => request(`/users/${id}`);

// Problems
export const getProblems = (difficulty) =>
  request(`/problems${difficulty ? `?difficulty=${difficulty}` : ""}`, { auth: false });

export const getProblemById = (id) => request(`/problems/${id}`, { auth: false });

// Battles
export const createBattle = () => request("/battles", { method: "POST" });

export const joinBattle = (roomCode) =>
  request(`/battles/${roomCode}/join`, { method: "POST" });

export const getBattle = (roomCode) => request(`/battles/${roomCode}`);

// Submissions
export const runCode = (data) => request("/submissions/run", { method: "POST", body: data });

export const submitCode = (data) => request("/submissions", { method: "POST", body: data });

export const getBattleSubmissions = (battleId) =>
  request(`/submissions/battle/${battleId}`);

const API_URL = "http://localhost:5000/api";

export async function createBattle(data) {

  const response = await fetch(
    `${API_URL}/battles`,
    {
      method: "POST",

      headers: {
        "Content-Type": "application/json"
      },

      body: JSON.stringify(data)
    }
  );

  return response.json();
}

export async function joinBattle(roomCode) {

  const response = await fetch(
    `${API_URL}/battles/${roomCode}/join`,
    {
      method: "POST",

      headers: {
        "Content-Type": "application/json"
      }
    }
  );

  return response.json();
}

export async function getBattle(roomCode) {

  const response = await fetch(
    `${API_URL}/battles/${roomCode}`
  );

  return response.json();
}
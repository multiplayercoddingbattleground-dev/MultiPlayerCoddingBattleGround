const API_BASE_URL = "http://localhost:5000/api";

const getToken = () => {
  return localStorage.getItem("token");
};

const apiRequest = async (endpoint, options = {}) => {
  const token = getToken();

  const headers = {
    "Content-Type": "application/json",
    ...(options.headers || {}),
  };

  if (token) {
    headers.Authorization = `Bearer ${token}`;
  }

  const response = await fetch(`${API_BASE_URL}${endpoint}`, {
    ...options,
    headers,
  });

  let data = null;

  try {
    data = await response.json();
  } catch {
    data = null;
  }

  if (!response.ok) {
    throw new Error(
      data?.message || `Request failed with status ${response.status}`
    );
  }

  return data;
};

export const api = {
  get: (endpoint) =>
    apiRequest(endpoint, {
      method: "GET",
    }),

  post: (endpoint, body = {}) =>
    apiRequest(endpoint, {
      method: "POST",
      body: JSON.stringify(body),
    }),

  put: (endpoint, body = {}) =>
    apiRequest(endpoint, {
      method: "PUT",
      body: JSON.stringify(body),
    }),

  delete: (endpoint) =>
    apiRequest(endpoint, {
      method: "DELETE",
    }),
};

export default api;
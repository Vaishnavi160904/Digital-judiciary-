import axios from "axios";

const api = axios.create({
  baseURL: "http://127.0.0.1:8000",
});

api.interceptors.request.use((config) => {
  const token = localStorage.getItem("token");

  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  }

  return config;
});

api.interceptors.response.use(
  (response) => response,
  (error) => {
    if (error.response?.status === 401) {
      localStorage.clear();
      window.location.href = "/login";
    }
    return Promise.reject(error);
  }
);

export default api;

// ---------------- AUTH ----------------

export const registerUser = (data) =>
  api.post("/auth/register", data);


export const loginUser = (data) =>
  api.post("/auth/login", data);

// ---------------- LAW GPT ----------------

export const sendMessage = (question) =>
  api.post("/lawgpt/chat", { question });

export const saveChat = (data) =>
  api.post("/lawgpt/save", data);

export const getChatHistory = () =>
  api.get("/lawgpt/history");

export const getChatById = (id) =>
  api.get(`/lawgpt/chat/${id}`);
// ---------------- CASE ----------------

export const submitCase = (data) =>
  api.post("/cases/submit", data, {
    headers: { "Content-Type": "multipart/form-data" }
  });

export const trackCase = (cnr) =>
  api.get(`/cases/track/${cnr}`);

export const getLawyerCases = () =>
  api.get("/dashboard/lawyer/my-cases");

export const getJudgeCases = () =>
  api.get("/dashboard/judge/court-cases");

export const updateCaseStatus = (id, status) =>
  api.put(`/dashboard/judge/update-status/${id}?status=${status}`);
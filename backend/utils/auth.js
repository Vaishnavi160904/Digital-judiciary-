import jwt_decode from "jwt-decode";

export const checkTokenExpiry = () => {
  const token = localStorage.getItem("token");
  if (!token) return;

  const decoded = jwt_decode(token);
  const currentTime = Date.now() / 1000;

  if (decoded.exp < currentTime) {
    localStorage.clear();
    window.location.href = "/login";
  }
};
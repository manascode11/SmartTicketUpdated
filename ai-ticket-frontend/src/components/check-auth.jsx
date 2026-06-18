import { Navigate } from "react-router-dom";

export default function CheckAuth({ children, protected: isProtected }) {
  const token = localStorage.getItem("token");

  if (isProtected && !token) {
    return <Navigate to="/login" replace />;
  }

  if (!isProtected && token) {
    return <Navigate to="/" replace />;
  }

  return children;
}
import { Navigate } from "react-router-dom";
import { authStore } from "../store/authStore";

export default function ProtectedRoute({ children }) {
  const user = authStore((s) => s.user);
  const authReady = authStore((s) => s.authReady);

  if (!authReady) return null; // wait silently — App.jsx shows spinner

  if (!user) return <Navigate to="/login" replace />;

  return children;
}

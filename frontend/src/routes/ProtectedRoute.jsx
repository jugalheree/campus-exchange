import { Navigate } from "react-router-dom";
import { authStore } from "../store/authStore";

// authReady is set to true in App.jsx once the /auth/refresh call completes.
// Until then we show nothing — prevents the flash-redirect-to-login on reload.
export default function ProtectedRoute({ children }) {
  const user = authStore((state) => state.user);
  const authReady = authStore((state) => state.authReady);

  // Still waiting for the refresh check — render nothing (App shows spinner)
  if (!authReady) return null;

  // Refresh done, no user found
  if (!user) return <Navigate to="/login" replace />;

  return children;
}

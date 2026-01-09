// client/components/Login.jsx
import { SignIn } from "@clerk/clerk-react";
import { useEffect } from "react";
import { useNavigate } from "react-router-dom";

const Login = () => {
  const navigate = useNavigate();

  useEffect(() => {
    // if Clerk returns back here after auth, push to dashboard
    const params = new URLSearchParams(window.location.search);
    const redirected = params.get("__clerk_status");
    if (redirected) navigate("/dashboard", { replace: true });
  }, [navigate]);

  return (
    <div className="auth-page">
      <div className="auth-card">
        <div className="auth-header">
          <h1 className="auth-title">Login</h1>
          <p className="auth-subtitle">Welcome back. Please sign in.</p>
        </div>

        <div className="auth-clerk">
          <SignIn
            routing="path"
            path="/login"
            signUpUrl="/register"
            afterSignInUrl="/dashboard"
            redirectUrl="/dashboard"
          />
        </div>
      </div>
    </div>
  );
};

export default Login;

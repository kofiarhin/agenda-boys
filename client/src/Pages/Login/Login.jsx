// client/components/Login.jsx
import { SignIn } from "@clerk/clerk-react";

const Login = () => {
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
            afterSignInUrl="/post-signin"
            redirectUrl="/post-signin"
          />
        </div>
      </div>
    </div>
  );
};

export default Login;

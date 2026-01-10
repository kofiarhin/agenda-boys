// Pages/Register/Register.jsx
import { SignUp } from "@clerk/clerk-react";

const Register = () => {
  return (
    <div className="auth-page">
      <div className="auth-card">
        <div className="auth-header">
          <h1 className="auth-title">Create account</h1>
          <p className="auth-subtitle">Sign up to continue.</p>
        </div>

        <div className="auth-clerk">
          <SignUp
            routing="path"
            path="/register"
            signInUrl="/login"
            afterSignUpUrl="/login"
            redirectUrl="/login"
          />
        </div>
      </div>
    </div>
  );
};

export default Register;

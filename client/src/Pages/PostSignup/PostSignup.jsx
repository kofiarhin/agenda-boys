// Pages/PostSignup/PostSignup.jsx
import { useUser } from "@clerk/clerk-react";
import { useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { baseUrl } from "../../constants/constants";

const PostSignup = () => {
  const { isLoaded, user } = useUser();
  const navigate = useNavigate();

  useEffect(() => {
    if (!isLoaded || !user) return;

    const syncUser = async () => {
      const payload = {
        clerkId: user.id,
        firstName: user.firstName || "",
        lastName: user.lastName || "",
        email: user.primaryEmailAddress?.emailAddress || "",
        imageUrl: user.imageUrl || "",
      };

      await fetch(`${baseUrl}/api/auth/register`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });

      navigate("/login", { replace: true });
    };

    syncUser();
  }, [isLoaded, user, navigate]);

  return <div>Creating your account...</div>;
};

export default PostSignup;

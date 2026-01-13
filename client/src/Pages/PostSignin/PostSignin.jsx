// Pages/PostSignin/PostSignin.jsx
import { useAuth, useUser } from "@clerk/clerk-react";
import { useEffect } from "react";
import { useNavigate } from "react-router-dom";

const API_URL = import.meta.env.VITE_API_URL || "http://localhost:5000";

const PostSignin = () => {
  const { isLoaded, user } = useUser();
  const { getToken } = useAuth();
  const navigate = useNavigate();

  useEffect(() => {
    if (!isLoaded || !user) return;

    const syncUser = async () => {
      try {
        const token = await getToken();
        if (!token) return navigate("/login", { replace: true });

        const payload = {
          clerkId: user.id,
          firstName: user.firstName || "",
          lastName: user.lastName || "",
          email: user.primaryEmailAddress?.emailAddress || "",
          imageUrl: user.imageUrl || "",
        };

        await fetch(`${API_URL}/api/auth/sync-user`, {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${token}`,
          },
          body: JSON.stringify(payload),
        });

        navigate("/dashboard", { replace: true });
      } catch {
        navigate("/login", { replace: true });
      }
    };

    syncUser();
  }, [isLoaded, user, getToken, navigate]);

  return <div>Signing you in...</div>;
};

export default PostSignin;

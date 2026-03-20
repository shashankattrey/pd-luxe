"use client";

import React, {
  createContext,
  useContext,
  useState,
  useEffect,
  useMemo,
} from "react";
import { GoogleOAuthProvider } from "@react-oauth/google";

interface User {
  name: string;
  email: string;
}

interface UserContextType {
  user: User | null;
  setUser: React.Dispatch<React.SetStateAction<User | null>>;
  isLoading: boolean;
}

const UserContext = createContext<UserContextType | undefined>(undefined);

export const useUser = () => {
  const context = useContext(UserContext);
  if (!context) throw new Error("useUser must be used within UserProvider");
  return context;
};

export default function Providers({ children }: { children: React.ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    // By wrapping the fetch in an effect and only calling setIsLoading(false)
    // at the very end, we handle the mounting and data-fetching in one flow.
    const fetchUser = async () => {
      try {
        const res = await fetch(
          "https://paisadekho-ai.paisadekhogroup.workers.dev/auth/me",
          { credentials: "include" },
        );
        if (res.ok) {
          const data = await res.json();
          setUser(data);
        }
      } catch (err) {
        console.error("Auth initialization failed:", err);
      } finally {
        setIsLoading(false);
      }
    };

    fetchUser();
  }, []);

  // useMemo prevents unnecessary re-renders of the Context Provider itself
  const value = useMemo(
    () => ({ user, setUser, isLoading }),
    [user, isLoading],
  );

  return (
    <GoogleOAuthProvider clientId={process.env.NEXT_PUBLIC_GOOGLE_CLIENT_ID!}>
      <UserContext.Provider value={value}>
        {/* We use a simple CSS fade or empty div to prevent the "useUser" crash 
            in children before the context is ready */}
        {!isLoading ? children : null}
      </UserContext.Provider>
    </GoogleOAuthProvider>
  );
}

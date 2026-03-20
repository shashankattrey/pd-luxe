"use client";

import React, {
  createContext,
  useContext,
  useState,
  useEffect,
  ReactNode,
} from "react";
import { GoogleOAuthProvider } from "@react-oauth/google";

interface User {
  name: string;
  email: string;
}

interface UserContextType {
  user: User | null;

  setUser: React.Dispatch<React.SetStateAction<User | null>>;
  loading: boolean; // ✅ Add this to the interface
}

const UserContext = createContext<UserContextType | undefined>(undefined);

export const useUser = () => {
  const context = useContext(UserContext);
  if (!context) throw new Error("useUser must be used within UserProvider");
  return context;
};

export function UserProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true); // Add this

  useEffect(() => {
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
        console.error("Failed to fetch user", err);
      } finally {
        setLoading(false); // Done trying
      }
    };
    fetchUser();
  }, []);

  return (
    <GoogleOAuthProvider clientId={process.env.NEXT_PUBLIC_GOOGLE_CLIENT_ID!}>
      <UserContext.Provider value={{ user, setUser, loading }}>
        {!loading ? (
          children
        ) : (
          <div className="h-screen w-full flex items-center justify-center bg-black text-amber-400 font-serif italic">
            Initializing PaisaDekho Luxe...
          </div>
        )}
      </UserContext.Provider>
    </GoogleOAuthProvider>
  );
}

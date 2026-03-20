"use client";

import {
  createContext,
  useContext,
  useState,
  useEffect,
  ReactNode,
} from "react";

type User = { name: string; email?: string } | null;

interface UserContextProps {
  user: User;
  refreshUser: () => Promise<void>;
}

const UserContext = createContext<UserContextProps | undefined>(undefined);

export function UserProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<User>(null);

  // Safe effect wrapper
  useEffect(() => {
    const fetchUser = async () => {
      try {
        const res = await fetch(
          "https://paisadekho-ai.paisadekhogroup.workers.dev/auth/me",
          { credentials: "include" },
        );
        if (!res.ok) return;
        const data = await res.json();
        setUser(data); // <-- now safely inside async function
      } catch (err) {
        console.error("Failed to fetch user", err);
      }
    };

    fetchUser(); // call it here
  }, []);

  // Optional: refresh function
  const refreshUser = async () => {
    try {
      const res = await fetch(
        "https://paisadekho-ai.paisadekhogroup.workers.dev/auth/me",
        { credentials: "include" },
      );
      if (!res.ok) return;
      const data = await res.json();
      setUser(data);
    } catch (err) {
      console.error("Failed to refresh user", err);
    }
  };

  return (
    <UserContext.Provider value={{ user, refreshUser }}>
      {children}
    </UserContext.Provider>
  );
}

export function useUser() {
  const context = useContext(UserContext);
  if (!context) throw new Error("useUser must be used inside UserProvider");
  return context;
}

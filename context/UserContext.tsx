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
  isLoading: boolean; // 👈 Add this
  refreshUser: () => Promise<void>;
}

const UserContext = createContext<UserContextProps | undefined>(undefined);

export function UserProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<User>(null);
  const [isLoading, setIsLoading] = useState(true); // 👈 Initialize true

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
      setIsLoading(false); // 👈 Always stop loading
    }
  };

  useEffect(() => {
    fetchUser();
  }, []);

  return (
    <UserContext.Provider value={{ user, isLoading, refreshUser: fetchUser }}>
      {children}
    </UserContext.Provider>
  );
}

export function useUser() {
  const context = useContext(UserContext);
  if (context === undefined) {
    throw new Error("useUser must be used inside UserProvider");
  }
  return context;
}

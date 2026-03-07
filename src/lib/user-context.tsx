"use client";

import { createContext, useContext } from "react";

export interface UserContextType {
  user: {
    id: string;
    name: string | null;
    email: string;
    role: string;
  };
  plan: string;
}

const UserContext = createContext<UserContextType | null>(null);

export function UserProvider({
  children,
  value,
}: {
  children: React.ReactNode;
  value: UserContextType;
}) {
  return <UserContext.Provider value={value}>{children}</UserContext.Provider>;
}

export function useUser() {
  const context = useContext(UserContext);
  if (!context) {
    throw new Error("useUser must be used within UserProvider");
  }
  return context;
}

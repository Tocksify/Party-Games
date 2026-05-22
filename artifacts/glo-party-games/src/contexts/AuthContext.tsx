import { createContext, useContext, ReactNode } from "react";
import { useGetMe, getGetMeQueryKey } from "@workspace/api-client-react";

interface User {
  id: number;
  username: string;
  email?: string | null;
  isGuest: boolean;
  createdAt: string;
}

interface AuthContextType {
  user: User | null;
  isLoading: boolean;
  isAuthenticated: boolean;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export function AuthProvider({ children }: { children: ReactNode }) {
  const { data: user, isLoading, error } = useGetMe({
    query: {
      queryKey: getGetMeQueryKey(),
      retry: false,
    }
  });

  return (
    <AuthContext.Provider
      value={{
        user: error ? null : (user ?? null),
        isLoading,
        isAuthenticated: !!user && !error,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error("useAuth must be used within an AuthProvider");
  }
  return context;
}

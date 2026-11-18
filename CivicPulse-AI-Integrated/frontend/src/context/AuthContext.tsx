
import {
  createContext,
  useContext,
  useState,
  useEffect,
  useCallback,
  type ReactNode
} from "react";

import { onIdTokenChanged } from "firebase/auth";
import { auth } from "../firebase";

import { api } from "../services/api";
import { authService } from "../services/authService";

type Auth = {
  user: any;
  setUser: (u: any) => void;
  loading: boolean;
};

const C = createContext<Auth>({
  user: null,
  setUser: () => {},
  loading: true
});

export function AuthProvider({
  children
}: {
  children: ReactNode;
}) {
  const [user, setUserState] = useState<any>(
    () => authService.get()
  );

  const [loading, setLoading] = useState(true);

  const setUser = useCallback((nextUser: any) => {
    setUserState(nextUser);

    if (nextUser) {
      authService.set(nextUser);
    } else {
      authService.clear();
    }
  }, []);

  useEffect(() => {
    let active = true;

    const unsubscribe = onIdTokenChanged(
      auth,
      async (firebaseUser) => {
        if (!active) return;

    
        if (!firebaseUser) {
          const savedUser = authService.get();

          if (savedUser?.authProvider === "firebase") {
            authService.clear();
            setUserState(null);
          } else {
            setUserState(savedUser);
          }

          setLoading(false);
          return;
        }

        try {
          const token = await firebaseUser.getIdToken();

          const result = await api<{
            success: boolean;
            user: {
              id: string;
              name: string;
              email: string;
              phone?: string;
              role: string;
            };
          }>("/auth/me", {
            headers: {
              Authorization: `Bearer ${token}`
            }
          });

          if (!result.success || !result.user) {
            throw new Error("Unable to load user profile");
          }

          const savedUser = {
            ...result.user,
            token,
            authProvider: "firebase"
          };

          if (active) {
            authService.set(savedUser);
            setUserState(savedUser);
          }

        } catch (error) {
          console.error(
            "[AUTH] Firebase profile loading failed:",
            error
          );

       
          if (active) {
            authService.clear();
            setUserState(null);
          }

        } finally {
          if (active) {
            setLoading(false);
          }
        }
      }
    );

    return () => {
      active = false;
      unsubscribe();
    };
  }, []);

  return (
    <C.Provider value={{ user, setUser, loading }}>
      {children}
    </C.Provider>
  );
}

export const useAuthContext = () => useContext(C);

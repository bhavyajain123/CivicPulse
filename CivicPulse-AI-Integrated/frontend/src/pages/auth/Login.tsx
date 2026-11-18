
import { useState, type FormEvent } from "react";
import { Link, useNavigate } from "react-router-dom";

import {
  signInWithEmailAndPassword,
  signOut
} from "firebase/auth";

import { auth } from "../../firebase";
import { api } from "../../services/api";
import { useAuthContext } from "../../context/AuthContext";

type ProfileResponse = {
  success: boolean;
  user: {
    id: string;
    name: string;
    email: string;
    phone?: string;
    role: string;
  };
};

const ALLOWED_ROLES = [
  "admin",
  "operator",
  "response_team",
  "officer",
  "citizen"
];

const getErrorCode = (error: unknown): string | undefined => {
  if (
    typeof error === "object" &&
    error !== null &&
    "code" in error
  ) {
    const code = (error as { code?: unknown }).code;
    return typeof code === "string" ? code : undefined;
  }

  return undefined;
};

export default function Login() {
  const navigate = useNavigate();
  const { setUser } = useAuthContext();

  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  const handleLogin = async (e: FormEvent<HTMLFormElement>) => {
    e.preventDefault();

    setError("");
    setLoading(true);

    let firebaseSignedIn = false;

    try {
      const normalizedEmail = email.trim().toLowerCase();

      let credential;

      try {
        credential = await signInWithEmailAndPassword(
          auth,
          normalizedEmail,
          password
        );

        firebaseSignedIn = true;

      } catch (firebaseError) {
        const code = getErrorCode(firebaseError);

        const canTryLegacyMigration = [
          "auth/invalid-credential",
          "auth/user-not-found",
          "auth/wrong-password"
        ].includes(code || "");

        if (!canTryLegacyMigration) {
          throw firebaseError;
        }

        await api("/auth/migrate-legacy", {
          method: "POST",
          body: JSON.stringify({
            email: normalizedEmail,
            password
          })
        });
        credential = await signInWithEmailAndPassword(
          auth,
          normalizedEmail,
          password
        );

        firebaseSignedIn = true;
      }

    
      const token = await credential.user.getIdToken();

   
      const result = await api<ProfileResponse>(
        "/auth/me",
        {
          headers: {
            Authorization: `Bearer ${token}`
          }
        }
      );

      if (!result.success || !result.user) {
        throw new Error("Unable to load CivicPulse profile.");
      }

      if (!ALLOWED_ROLES.includes(result.user.role)) {
        throw new Error("Your account does not have access.");
      }

      const savedUser = {
        ...result.user,
        token,
        authProvider: "firebase"
      };

      setUser(savedUser);

  
      navigate(
        result.user.role === "response_team" ||
        result.user.role === "officer"
          ? "/officer"
          : result.user.role === "citizen"
            ? "/citizen/complaints"
            : "/dashboard",
        { replace: true }
      );

    } catch (err) {
      if (firebaseSignedIn) {
        setUser(null);
        await signOut(auth).catch(() => {});
      }

      const code = getErrorCode(err);

      if (code === "auth/too-many-requests") {
        setError("Too many attempts. Please try again later.");
      } else if (code === "auth/network-request-failed") {
        setError("Network error. Please check your internet connection.");
      } else {
        setError(
          err instanceof Error
            ? err.message
            : "Login failed. Please try again."
        );
      }

    } finally {
      setLoading(false);
    }
  };

  return (
    <main className="landing">
      <nav className="landing-nav">
        <Link to="/" className="landing-brand">
          <span className="landing-mark">CC</span>
          <span>
            <b>CivicConnect</b>
            <small>EMERGENCY OPERATIONS</small>
          </span>
        </Link>

        <Link to="/" className="btn btn-secondary">
          Back to Home
        </Link>
      </nav>

      <section
        className="panel"
        style={{
          maxWidth: "460px",
          margin: "65px auto",
          padding: "28px"
        }}
      >
        <div className="eyebrow">
          CIVICCONNECT COMMAND CENTER
        </div>

        <h2 style={{ margin: "12px 0 7px" }}>
          Welcome back
        </h2>

        <p style={{ color: "#91a3bc", fontSize: "11px" }}>
          Sign in with your CivicConnect account.
        </p>

        <form onSubmit={handleLogin}>
          <div className="form-grid" style={{ marginTop: "22px" }}>
            <label className="full">
              Email address
              <input
                type="email"
                value={email}
                onChange={e => setEmail(e.target.value)}
                placeholder="Enter your email"
                autoComplete="username"
                required
              />
            </label>

            <label className="full">
              Password
              <input
                type="password"
                value={password}
                onChange={e => setPassword(e.target.value)}
                placeholder="Enter your password"
                autoComplete="current-password"
                required
              />
            </label>
          </div>

          {error && (
            <p
              role="alert"
              style={{
                color: "#f28c8c",
                fontSize: "11px",
                marginTop: "14px"
              }}
            >
              {error}
            </p>
          )}

          <button
            type="submit"
            className="btn btn-primary"
            disabled={loading}
            style={{
              width: "100%",
              marginTop: "20px"
            }}
          >
            {loading ? "Signing in..." : "Sign in to command center"}
          </button>
        </form>

        <p style={{
          color: "#91a3bc",
          fontSize: "12px",
          marginTop: "18px",
          textAlign: "center"
        }}>
          New citizen? <Link to="/register">Create an account</Link>
        </p>
      </section>
    </main>
  );
}

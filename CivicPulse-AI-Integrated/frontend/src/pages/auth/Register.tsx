
import { useState, type FormEvent } from "react";
import { Link, useNavigate } from "react-router-dom";

import {
  createUserWithEmailAndPassword,
  updateProfile,
  sendEmailVerification,
  deleteUser,
  signOut
} from "firebase/auth";

import { auth } from "../../firebase";
import { api } from "../../services/api";
import { useAuthContext } from "../../context/AuthContext";

type RegisterResponse = {
  success: boolean;
  message: string;
  user: {
    id: string;
    name: string;
    email: string;
    phone: string;
    role: string;
  };
};

export default function Register() {
  const navigate = useNavigate();
  const { setUser } = useAuthContext();

  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [phone, setPhone] = useState("");
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");

  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  const handleRegister = async (
    e: FormEvent<HTMLFormElement>
  ) => {
    e.preventDefault();

    setError("");

    if (name.trim().length < 3) {
      setError("Name must contain at least 3 characters.");
      return;
    }

    if (password.length < 8) {
      setError("Password must contain at least 8 characters.");
      return;
    }

    if (password !== confirmPassword) {
      setError("Passwords do not match.");
      return;
    }

    setLoading(true);

    let firebaseUser: Awaited<
      ReturnType<typeof createUserWithEmailAndPassword>
    >["user"] | null = null;

    try {
      
      const credential = await createUserWithEmailAndPassword(
        auth,
        email.trim().toLowerCase(),
        password
      );

      firebaseUser = credential.user;

      
      await updateProfile(firebaseUser, {
        displayName: name.trim()
      });

  
      const token = await firebaseUser.getIdToken();


      let result: RegisterResponse;

      try {
        result = await api<RegisterResponse>(
          "/auth/register",
          {
            method: "POST",
            headers: {
              Authorization: `Bearer ${token}`
            },
            body: JSON.stringify({
              name: name.trim(),
              email: email.trim().toLowerCase(),
              phone: phone.trim()
            })
          }
        );
      } catch (registrationError) {
        const message =
          registrationError instanceof Error
            ? registrationError.message
            : "";

        
        if (message.toLowerCase().includes("email is already registered")) {
          await deleteUser(firebaseUser).catch(() => {});
          firebaseUser = null;
          await signOut(auth).catch(() => {});

          throw new Error(
            "This email already has a CivicPulse account. Please sign in and migrate your existing account."
          );
        }

        throw registrationError;
      }

      if (!result.success || !result.user) {
        throw new Error("Unable to create CivicPulse profile.");
      }

      if (result.user.role !== "citizen") {
        throw new Error("Unexpected account role returned by server.");
      }

      try {
        await sendEmailVerification(firebaseUser);
      } catch (verificationError) {
        console.warn(
          "Verification email could not be sent:",
          verificationError
        );
      }

     
      const savedUser = {
        ...result.user,
        token: await firebaseUser.getIdToken(),
        authProvider: "firebase"
      };

      setUser(savedUser);

      navigate("/citizen/complaints", {
        replace: true
      });

    } catch (err) {
      setError(
        err instanceof Error
          ? err.message
          : "Registration failed. Please try again."
      );

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
          margin: "45px auto",
          padding: "28px"
        }}
      >
        <div className="eyebrow">
          CIVICCONNECT COMMUNITY
        </div>

        <h2 style={{ margin: "12px 0 7px" }}>
          Create your account
        </h2>

        <p style={{ color: "#91a3bc", fontSize: "11px" }}>
          Register as a citizen to report and track civic incidents.
        </p>

        <form onSubmit={handleRegister}>
          <div className="form-grid" style={{ marginTop: "22px" }}>
            <label className="full">
              Full name
              <input
                type="text"
                value={name}
                onChange={e => setName(e.target.value)}
                placeholder="Enter your full name"
                autoComplete="name"
                required
                minLength={3}
              />
            </label>

            <label className="full">
              Email address
              <input
                type="email"
                value={email}
                onChange={e => setEmail(e.target.value)}
                placeholder="Enter your email"
                autoComplete="email"
                required
              />
            </label>

            <label className="full">
              Phone number
              <input
                type="tel"
                value={phone}
                onChange={e => setPhone(e.target.value)}
                placeholder="Enter your phone number"
                autoComplete="tel"
                minLength={10}
                required
              />
            </label>

            <label className="full">
              Password
              <input
                type="password"
                value={password}
                onChange={e => setPassword(e.target.value)}
                placeholder="Create a password"
                autoComplete="new-password"
                minLength={8}
                required
              />
            </label>

            <label className="full">
              Confirm password
              <input
                type="password"
                value={confirmPassword}
                onChange={e => setConfirmPassword(e.target.value)}
                placeholder="Confirm your password"
                autoComplete="new-password"
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
            {loading ? "Creating account..." : "Create Citizen Account"}
          </button>
        </form>

        <p
          style={{
            color: "#91a3bc",
            fontSize: "12px",
            marginTop: "18px",
            textAlign: "center"
          }}
        >
          Already registered?{" "}
          <Link to="/login">Sign in</Link>
        </p>
      </section>
    </main>
  );
}

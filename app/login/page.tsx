"use client";

import { FormEvent, useState } from "react";
import { useRouter } from "next/navigation";

type LoginResponse = {
  message?: string;
  error?: string;
  user?: {
    id: string;
    name: string;
    email: string;
    role: "PARTICIPANT" | "RESEARCHER" | "ADMIN";
  };
};

export default function LoginPage() {
  const router = useRouter();

  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");

  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  async function handleSubmit(
    event: FormEvent<HTMLFormElement>
  ) {
    event.preventDefault();

    setError("");
    setLoading(true);

    try {
      const response = await fetch("/api/auth/login", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          email,
          password,
        }),
      });

      const data =
        (await response.json()) as LoginResponse;

      if (!response.ok) {
        setError(data.error || "Login failed.");
        return;
      }

      // Make sure the API actually returned the user
      if (!data.user) {
        setError("Login succeeded, but user information is missing.");
        return;
      }

      // Redirect based on the user's role
      switch (data.user.role) {
        case "ADMIN":
          router.push("/admin");
          break;

        case "RESEARCHER":
          router.push("/researcher");
          break;

        case "PARTICIPANT":
          router.push("/participant");
          break;

        default:
          setError("Unknown user role.");
          return;
      }

      router.refresh();
    } catch (error) {
      console.error("Login error:", error);
      setError("Unable to connect to the server.");
    } finally {
      setLoading(false);
    }
  }

  return (
    <main>
      <h1>Welcome back to Tinat</h1>

      <form onSubmit={handleSubmit}>
        <input
          type="email"
          placeholder="Email"
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          required
        />

        <input
          type="password"
          placeholder="Password"
          value={password}
          onChange={(e) => setPassword(e.target.value)}
          required
        />

        {error && <p>{error}</p>}

        <button
          type="submit"
          disabled={loading}
        >
          {loading
            ? "Logging in..."
            : "Login"}
        </button>
      </form>

      <p>
        Don&apos;t have an account?{" "}
        <a href="/register">Create one</a>
      </p>
    </main>
  );
}
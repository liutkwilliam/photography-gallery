"use client";

import { useState, FormEvent } from "react";
import { signInWithEmailAndPassword } from "firebase/auth";
import { auth } from "@/lib/firebase";
import { useRouter } from "next/navigation";
import Inputs from "@/components/Inputs";
import Buttons from "@/components/Buttons";

export default function LoginPage() {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const router = useRouter();

  const handleLogin = async (e: FormEvent) => {
    e.preventDefault();
    setError(null);
    setLoading(true);

    try {
      const userCredential = await signInWithEmailAndPassword(
        auth,
        email,
        password,
      );
      const token = await userCredential.user.getIdToken();

      // Handshake with Next.js Backend API
      const response = await fetch("/api/auth/login", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ idToken: token }),
      });

      if (!response.ok) {
        throw new Error("Failed to authenticate with backend server");
      }

      router.push("/dashboard");
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
    } catch (err: any) {
      setError(err.message || "Invalid email or password");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="flex min-h-screen items-center justify-center">
      {error && <p className="text-sm text-red-500">{error}</p>}
      <form
        onSubmit={handleLogin}
        className="w-full max-w-md space-y-4 rounded p-6"
      >
        <h1 className="text-3xl font-semibold">Admin Dashboard Sign In</h1>
        <Inputs
          label="Email Address"
          type="email"
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          required
        />
        <Inputs
          label="Password"
          type="password"
          value={password}
          onChange={(e) => setPassword(e.target.value)}
          required
        />
        <Buttons type="submit" disabled={loading}>
          {loading ? "Signing in..." : "Sign In"}
        </Buttons>
      </form>
    </div>
  );
}

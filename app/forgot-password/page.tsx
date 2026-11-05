"use client";

import { useState } from "react";
import Link from "next/link";
import Image from "next/image";
import { createSupabaseClient } from "@/lib/supabase-client";

export default function ForgotPasswordPage() {
  const [email, setEmail] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState(false);

  async function handleForgotPassword(event: React.FormEvent) {
    event.preventDefault();
    setError(null);
    setIsLoading(true);

    try {
      const supabase = createSupabaseClient();

      const { error } = await supabase.auth.resetPasswordForEmail(email.trim(), {
        redirectTo: `${window.location.origin}/reset-password`,
      });

      if (error) {
        throw new Error(error.message);
      }

      setSuccess(true);
    } catch (forgotPasswordError) {
      setError(
        forgotPasswordError instanceof Error
          ? forgotPasswordError.message
          : "Unable to send reset link. Please try again."
      );
    } finally {
      setIsLoading(false);
    }
  }

  return (
    <main style={styles.page}>
      <div style={styles.card}>
        <div style={styles.logoSection}>
          <Image
            src="/logo-new.png"
            alt="PadiMarket logo"
            width={160}
            height={160}
            priority
            style={styles.logo}
          />
        </div>

        <h1 style={styles.title}>Forgot password?</h1>
        <p style={styles.subtitle}>
          Enter the email address linked to your PadiMarket account. We will
          send you a link to reset your password.
        </p>

        {success ? (
          <div style={styles.successCard}>
            <h2 style={styles.successTitle}>Check your email</h2>
            <p style={styles.successText}>
              If <strong>{email}</strong> is registered, we sent a password
              reset link to it.
            </p>

            <Link href="/login" style={styles.successButton}>
              Back to sign in
            </Link>
          </div>
        ) : (
          <form onSubmit={handleForgotPassword}>
            <label style={styles.label}>Email address</label>
            <input
              type="email"
              value={email}
              onChange={(event) => setEmail(event.target.value)}
              placeholder="you@example.com"
              required
              style={styles.input}
            />

            {error && <p style={styles.error}>{error}</p>}

            <button
              type="submit"
              disabled={isLoading}
              style={{
                ...styles.submitButton,
                background: isLoading
                  ? "#9ca3af"
                  : "linear-gradient(145deg, #17d39a, #0b9e77)",
                cursor: isLoading ? "not-allowed" : "pointer",
              }}
            >
              {isLoading ? "Sending reset link..." : "Send reset link"}
            </button>

            <p style={styles.footerText}>
              Remembered your password?{" "}
              <Link href="/login" style={styles.footerLink}>
                Sign in
              </Link>
            </p>
          </form>
        )}
      </div>
    </main>
  );
}

const styles: { [key: string]: React.CSSProperties } = {
  page: {
    minHeight: "100vh",
    display: "grid",
    placeItems: "center",
    padding: "40px 20px",
    background: "var(--pm-bg)",
    color: "var(--pm-text)",
    fontFamily: "'Plus Jakarta Sans', Arial, sans-serif",
  },
  card: {
    width: "100%",
    maxWidth: "460px",
    padding: "36px",
    borderRadius: "28px",
    background: "var(--pm-surface)",
    boxShadow: "var(--pm-shadow)",
    border: "1px solid var(--pm-border)",
  },
  logoSection: {
    display: "grid",
    justifyItems: "center",
    marginBottom: "24px",
  },
  logo: {
    width: "140px",
    height: "auto",
    objectFit: "contain",
  },
  title: {
    margin: "0 0 8px",
    fontSize: "30px",
    textAlign: "center",
  },
  subtitle: {
    margin: "0 0 26px",
    color: "var(--pm-muted)",
    textAlign: "center",
    lineHeight: 1.6,
  },
  successCard: {
    padding: "20px",
    borderRadius: "18px",
    background: "rgba(23, 211, 154, 0.12)",
    color: "#0b9e77",
    textAlign: "center",
  },
  successTitle: {
    margin: "0 0 8px",
    fontSize: "22px",
  },
  successText: {
    margin: 0,
    color: "var(--pm-text)",
  },
  successButton: {
    display: "inline-block",
    marginTop: "18px",
    padding: "12px 24px",
    borderRadius: "999px",
    background: "#0b7a5d",
    color: "white",
    fontWeight: 800,
    textDecoration: "none",
  },
  label: {
    display: "block",
    marginBottom: "8px",
    fontSize: "14px",
    fontWeight: 700,
    color: "var(--pm-muted)",
  },
  input: {
    width: "100%",
    marginBottom: "18px",
    padding: "14px 16px",
    borderRadius: "14px",
    border: "1px solid var(--pm-border)",
    background: "var(--pm-bg)",
    color: "var(--pm-text)",
    fontSize: "15px",
    outline: "none",
  },
  error: {
    margin: "14px 0 0",
    color: "#ef4444",
    fontSize: "14px",
    fontWeight: 600,
  },
  submitButton: {
    width: "100%",
    marginTop: "22px",
    padding: "16px",
    border: 0,
    borderRadius: "999px",
    color: "white",
    fontSize: "16px",
    fontWeight: 800,
  },
  footerText: {
    marginTop: "18px",
    textAlign: "center",
    color: "var(--pm-muted)",
    fontSize: "14px",
  },
  footerLink: {
    color: "#0b9e77",
    fontWeight: 700,
    textDecoration: "none",
  },
};
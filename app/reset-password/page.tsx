"use client";

import { useState } from "react";
import Link from "next/link";
import Image from "next/image";
import { createSupabaseClient } from "@/lib/supabase-client";

export default function ResetPasswordPage() {
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState(false);

  async function handleResetPassword(event: React.FormEvent) {
    event.preventDefault();
    setError(null);

    if (password.length < 8) {
      setError("Password must be at least 8 characters.");
      return;
    }

    if (password !== confirmPassword) {
      setError("Passwords do not match.");
      return;
    }

    setIsLoading(true);

    try {
      const supabase = createSupabaseClient();

      const { error } = await supabase.auth.updateUser({
        password,
      });

      if (error) {
        throw new Error(error.message);
      }

      setSuccess(true);
    } catch (resetError) {
      setError(
        resetError instanceof Error
          ? resetError.message
          : "Unable to reset your password. Please try again."
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

        <h1 style={styles.title}>Set a new password</h1>
        <p style={styles.subtitle}>
          Create a new password for your PadiMarket account.
        </p>

        {success ? (
          <div style={styles.successCard}>
            <h2 style={styles.successTitle}>Password updated</h2>
            <p style={styles.successText}>
              Your password has been changed successfully. Use your new
              password to sign in.
            </p>

            <Link href="/login" style={styles.successButton}>
              Go to sign in
            </Link>
          </div>
        ) : (
          <form onSubmit={handleResetPassword}>
            <label style={styles.label}>New password</label>
            <div style={styles.passwordWrapper}>
              <input
                type={showPassword ? "text" : "password"}
                value={password}
                onChange={(event) => setPassword(event.target.value)}
                placeholder="At least 8 characters"
                required
                minLength={8}
                style={styles.passwordInput}
              />

              <button
                type="button"
                onClick={() => setShowPassword(!showPassword)}
                aria-label={showPassword ? "Hide password" : "Show password"}
                style={styles.eyeButton}
              >
                {showPassword ? "🙈" : "👁️"}
              </button>
            </div>

            <label style={styles.label}>Confirm new password</label>
            <div style={styles.passwordWrapper}>
              <input
                type={showConfirmPassword ? "text" : "password"}
                value={confirmPassword}
                onChange={(event) => setConfirmPassword(event.target.value)}
                placeholder="Re-enter your new password"
                required
                minLength={8}
                style={styles.passwordInput}
              />

              <button
                type="button"
                onClick={() =>
                  setShowConfirmPassword(!showConfirmPassword)
                }
                aria-label={
                  showConfirmPassword ? "Hide password" : "Show password"
                }
                style={styles.eyeButton}
              >
                {showConfirmPassword ? "🙈" : "👁️"}
              </button>
            </div>

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
              {isLoading ? "Updating password..." : "Update password"}
            </button>
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
  passwordWrapper: {
    position: "relative",
    marginBottom: "18px",
  },
  passwordInput: {
    width: "100%",
    padding: "14px 52px 14px 16px",
    borderRadius: "14px",
    border: "1px solid var(--pm-border)",
    background: "var(--pm-bg)",
    color: "var(--pm-text)",
    fontSize: "15px",
    outline: "none",
  },
  eyeButton: {
    position: "absolute",
    top: "50%",
    right: "10px",
    transform: "translateY(-50%)",
    width: "36px",
    height: "36px",
    display: "grid",
    placeItems: "center",
    border: 0,
    background: "transparent",
    fontSize: "18px",
    cursor: "pointer",
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
};
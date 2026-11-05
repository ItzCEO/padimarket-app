"use client";

import { useState } from "react";
import Link from "next/link";
import Image from "next/image";
import { createSupabaseClient } from "@/lib/supabase-client";
import Recaptcha from "@/components/Recaptcha";

export default function SignUpPage() {
  const [fullName, setFullName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [accountType, setAccountType] = useState<"buyer" | "seller">("buyer");
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [recaptchaToken, setRecaptchaToken] = useState<string | null>(null);

  async function handleSignUp(event: React.FormEvent) {
    event.preventDefault();
    setError(null);

    if (!fullName.trim()) {
      setError("Please enter your full name.");
      return;
    }

    if (!email.trim()) {
      setError("Please enter your email address.");
      return;
    }

    if (password.length < 8) {
      setError("Password must be at least 8 characters.");
      return;
    }

    if (password !== confirmPassword) {
      setError("Passwords do not match.");
      return;
    }

    if (!recaptchaToken) {
      setError("Please complete the reCAPTCHA.");
      return;
    }

    const recaptchaResponse = await fetch("/api/verify-recaptcha", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({ token: recaptchaToken }),
    });

    const recaptchaResult = await recaptchaResponse.json();

    if (!recaptchaResult.success) {
      setError(recaptchaResult.error ?? "Please complete the reCAPTCHA.");
      return;
    }

    setIsLoading(true);

    try {
      const supabase = createSupabaseClient();

      const { data, error } = await supabase.auth.signUp({
        email: email.trim(),
        password,
        options: {
          data: {
            full_name: fullName.trim(),
            account_type: accountType,
          },
          emailRedirectTo: `${window.location.origin}/login`,
        },
      });

      if (error) {
        throw new Error(error.message);
      }

      if (data.user) {
        setSuccess(true);
      }
    } catch (signUpError) {
      setError(
        signUpError instanceof Error
          ? signUpError.message
          : "Unable to create your account. Please try again."
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

        <h1 style={styles.title}>Create your account</h1>
        <p style={styles.subtitle}>
          Join PadiMarket to buy and sell items safely.
        </p>

        {success ? (
          <div style={styles.successCard}>
            <h2 style={styles.successTitle}>Check your email</h2>
            <p style={styles.successText}>
              We sent a confirmation link to <strong>{email}</strong>. Click
              the link to activate your account.
            </p>
          </div>
        ) : (
          <form onSubmit={handleSignUp}>
            <label style={styles.label}>Full name</label>
            <input
              type="text"
              value={fullName}
              onChange={(event) => setFullName(event.target.value)}
              placeholder="Enter your full name"
              style={styles.input}
            />

            <label style={styles.label}>I want to</label>

            <div style={styles.accountTypeWrapper}>
              <button
                type="button"
                onClick={() => setAccountType("buyer")}
                style={{
                  ...styles.accountTypeButton,
                  background:
                    accountType === "buyer" ? "#0b9e77" : "var(--pm-bg)",
                  color:
                    accountType === "buyer" ? "#04231b" : "var(--pm-text)",
                  borderColor:
                    accountType === "buyer" ? "#0b9e77" : "var(--pm-border)",
                }}
              >
                Buy items
              </button>

              <button
                type="button"
                onClick={() => setAccountType("seller")}
                style={{
                  ...styles.accountTypeButton,
                  background:
                    accountType === "seller" ? "#0b9e77" : "var(--pm-bg)",
                  color:
                    accountType === "seller" ? "#04231b" : "var(--pm-text)",
                  borderColor:
                    accountType === "seller" ? "#0b9e77" : "var(--pm-border)",
                }}
              >
                Sell items
              </button>
            </div>

            <label style={styles.label}>Email address</label>
            <input
              type="email"
              value={email}
              onChange={(event) => setEmail(event.target.value)}
              placeholder="you@example.com"
              style={styles.input}
            />

            <label style={styles.label}>Password</label>
            <div style={styles.passwordWrapper}>
              <input
                type={showPassword ? "text" : "password"}
                value={password}
                onChange={(event) => setPassword(event.target.value)}
                placeholder="At least 8 characters"
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

            <label style={styles.label}>Confirm password</label>
            <div style={styles.passwordWrapper}>
              <input
                type={showConfirmPassword ? "text" : "password"}
                value={confirmPassword}
                onChange={(event) => setConfirmPassword(event.target.value)}
                placeholder="Re-enter your password"
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

            <div style={{ marginBottom: "18px" }}>
              <Recaptcha
                siteKey={process.env.NEXT_PUBLIC_RECAPTCHA_SITE_KEY ?? ""}
                onChange={setRecaptchaToken}
              />
            </div>

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
              {isLoading ? "Creating account..." : "Create account"}
            </button>

            <p style={styles.footerText}>
              Already have an account?{" "}
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
  label: {
    display: "block",
    marginBottom: "8px",
    fontSize: "14px",
    fontWeight: 700,
    color: "var(--pm-muted)",
  },
  accountTypeWrapper: {
    display: "grid",
    gridTemplateColumns: "1fr 1fr",
    gap: "12px",
    marginBottom: "18px",
  },
  accountTypeButton: {
    padding: "14px",
    borderRadius: "14px",
    border: "1px solid var(--pm-border)",
    fontWeight: 800,
    fontSize: "14px",
    cursor: "pointer",
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
  passwordWrapper: {
    position: "relative",
    marginBottom: "18px",
  },
  passwordInput: {
    width: "100%",
    boxSizing: "border-box",
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
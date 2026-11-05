"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import Image from "next/image";
import { createSupabaseClient } from "@/lib/supabase-client";
import Recaptcha from "@/components/Recaptcha";

export default function LoginPage() {
  const router = useRouter();

  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [recaptchaToken, setRecaptchaToken] = useState<string | null>(null);
  const [message, setMessage] = useState("");
  const [loading, setLoading] = useState(false);

  async function handleLogin(event: React.FormEvent) {
    event.preventDefault();
    setLoading(true);
    setMessage("");

    if (!recaptchaToken) {
      setMessage("Please complete the reCAPTCHA.");
      setLoading(false);
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
      setMessage(recaptchaResult.error ?? "Please complete the reCAPTCHA.");
      setLoading(false);
      return;
    }

    try {
      const supabase = createSupabaseClient();

      const { data, error } = await supabase.auth.signInWithPassword({
        email: email.trim(),
        password,
      });

      if (error) {
        throw new Error(error.message);
      }

      if (data.session && data.user) {
        localStorage.setItem("access_token", data.session.access_token);

        const accountType = data.user.user_metadata?.account_type;

        if (accountType === "seller") {
          router.push("/seller/dashboard");
        } else {
          router.push("/");
        }

        router.refresh();
      }
    } catch (loginError) {
      setMessage(
        loginError instanceof Error
          ? loginError.message
          : "Unable to sign in. Please try again."
      );
      setLoading(false);
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

        <h1 style={styles.title}>Welcome back</h1>
        <p style={styles.subtitle}>
          Sign in to continue shopping on PadiMarket.
        </p>

        <form onSubmit={handleLogin}>
          <label style={styles.label}>Email address</label>
          <input
            type="email"
            value={email}
            onChange={(event) => setEmail(event.target.value)}
            placeholder="you@example.com"
            required
            style={styles.input}
          />

          <label style={styles.label}>Password</label>
          <div style={styles.passwordWrapper}>
            <input
              type={showPassword ? "text" : "password"}
              value={password}
              onChange={(event) => setPassword(event.target.value)}
              placeholder="Enter your password"
              required
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

          {message && <p style={styles.error}>{message}</p>}

          <div style={styles.forgotPasswordRow}>
            <Link href="/forgot-password" style={styles.forgotPasswordLink}>
              Forgot password?
            </Link>
          </div>

          <div style={{ marginBottom: "18px" }}>
            <Recaptcha
              siteKey={process.env.NEXT_PUBLIC_RECAPTCHA_SITE_KEY ?? ""}
              onChange={setRecaptchaToken}
            />
          </div>

          <button
            type="submit"
            disabled={loading}
            style={{
              ...styles.submitButton,
              background: loading
                ? "#9ca3af"
                : "linear-gradient(145deg, #17d39a, #0b9e77)",
              cursor: loading ? "not-allowed" : "pointer",
            }}
          >
            {loading ? "Signing in..." : "Sign In"}
          </button>

          <p style={styles.footerText}>
            New to PadiMarket?{" "}
            <Link href="/signup" style={styles.footerLink}>
              Create account
            </Link>
          </p>
        </form>
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
  label: {
    display: "block",
    marginBottom: "8px",
    fontSize: "14px",
    fontWeight: 700,
    color: "var(--pm-muted)",
  },
  input: {
    width: "100%",
    boxSizing: "border-box",
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
  forgotPasswordRow: {
    display: "flex",
    justifyContent: "flex-end",
    marginTop: "-6px",
  },
  forgotPasswordLink: {
    color: "#0b9e77",
    fontSize: "14px",
    fontWeight: 700,
    textDecoration: "none",
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
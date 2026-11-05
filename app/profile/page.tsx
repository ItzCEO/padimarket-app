"use client";

import RequireAuth from "@/components/RequireAuth";
import { useEffect, useState } from "react";
import Link from "next/link";
import Image from "next/image";
import { createSupabaseClient } from "@/lib/supabase-client";

function ProfileContent() {
  const [email, setEmail] = useState("");
  const [fullName, setFullName] = useState("");
  const [phone, setPhone] = useState("");
  const [location, setLocation] = useState("");
  const [avatarUrl, setAvatarUrl] = useState("");
  const [previewUrl, setPreviewUrl] = useState("");
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [message, setMessage] = useState("");
  const [loading, setLoading] = useState(false);
  const [showFullImage, setShowFullImage] = useState(false);

  useEffect(() => {
    async function loadProfile() {
      const supabase = createSupabaseClient();
      const { data } = await supabase.auth.getUser();

      if (data.user) {
        setEmail(data.user.email ?? "");
        setFullName(data.user.user_metadata?.full_name ?? "");
        setPhone(data.user.user_metadata?.phone ?? "");
        setLocation(data.user.user_metadata?.location ?? "");
        setAvatarUrl(data.user.user_metadata?.avatar_url ?? "");
      }
    }

    loadProfile();
  }, []);

  function handleImageSelect(event: React.ChangeEvent<HTMLInputElement>) {
    const file = event.target.files?.[0];

    if (!file) return;

    setSelectedFile(file);
    setPreviewUrl(URL.createObjectURL(file));
    setMessage("Photo selected. Click Save profile to upload it.");
  }

  async function handleSave(event: React.FormEvent) {
    event.preventDefault();
    setLoading(true);
    setMessage("");

    try {
      const supabase = createSupabaseClient();
      const { data } = await supabase.auth.getUser();

      if (!data.user) {
        throw new Error("You must be signed in.");
      }

      let finalAvatarUrl = avatarUrl;

      if (selectedFile) {
        const fileExt = selectedFile.name.split(".").pop();
        const timestamp = Date.now();
        const filePath = `${data.user.id}/avatar-${timestamp}.${fileExt}`;

        const { error: uploadError } = await supabase.storage
          .from("avatars")
          .upload(filePath, selectedFile, {
            upsert: true,
            cacheControl: "0",
          });

        if (uploadError) {
          throw new Error(uploadError.message);
        }

        const { data: publicUrl } = supabase.storage
          .from("avatars")
          .getPublicUrl(filePath);

        finalAvatarUrl = publicUrl.publicUrl;
      }

      const { error: updateError } = await supabase.auth.updateUser({
        data: {
          full_name: fullName,
          phone,
          location,
          avatar_url: finalAvatarUrl,
        },
      });

      if (updateError) {
        throw new Error(updateError.message);
      }

      setAvatarUrl(finalAvatarUrl);
      setSelectedFile(null);
      setPreviewUrl("");
      setMessage("Profile saved successfully.");
    } catch (saveError) {
      setMessage(
        saveError instanceof Error
          ? saveError.message
          : "Unable to save your profile. Please try again."
      );
    } finally {
      setLoading(false);
    }
  }

  const displayedImage = previewUrl || avatarUrl;

  return (
    <main style={styles.page}>
      <div style={styles.card}>
        <Link href="/" style={styles.backLink}>
          ← Back to homepage
        </Link>

        <div style={styles.logoRow}>
          <Image
            src="/logo-new.png"
            alt="PadiMarket logo"
            width={48}
            height={48}
            priority
            style={styles.logo}
          />

          <span style={styles.logoText}>
            Padi<span style={styles.logoAccent}>Market</span>
          </span>
        </div>

        <h1 style={styles.title}>Your profile</h1>
        <p style={styles.subtitle}>Add your details and profile picture.</p>

        <div style={styles.avatarSection}>
          {displayedImage ? (
            <button
              type="button"
              onClick={() => setShowFullImage(true)}
              style={styles.avatarButton}
              aria-label="View profile picture"
            >
              <img
                src={displayedImage}
                alt="Profile"
                style={styles.avatar}
              />
            </button>
          ) : (
            <div style={styles.avatarPlaceholder}>
              {email.slice(0, 1).toUpperCase()}
            </div>
          )}

          <label style={styles.uploadButton}>
            Choose photo
            <input
              type="file"
              accept="image/*"
              onChange={handleImageSelect}
              style={{ display: "none" }}
            />
          </label>
        </div>

        <form onSubmit={handleSave} style={styles.form}>
          <input
            placeholder="Full name"
            value={fullName}
            onChange={(event) => setFullName(event.target.value)}
            style={styles.input}
          />

          <input
            placeholder="Phone number"
            value={phone}
            onChange={(event) => setPhone(event.target.value)}
            style={styles.input}
          />

          <input
            placeholder="Location, e.g. Lagos"
            value={location}
            onChange={(event) => setLocation(event.target.value)}
            style={styles.input}
          />

          <input
            placeholder="Email address"
            value={email}
            disabled
            style={{ ...styles.input, opacity: 0.7 }}
          />

          <button type="submit" disabled={loading} style={styles.button}>
            {loading ? "Saving..." : "Save profile"}
          </button>
        </form>

        {message && <p style={styles.message}>{message}</p>}
      </div>

      {showFullImage && displayedImage && (
        <div
          style={styles.fullscreenOverlay}
          onClick={() => setShowFullImage(false)}
        >
          <button
            type="button"
            onClick={() => setShowFullImage(false)}
            style={styles.closeButton}
            aria-label="Close profile picture"
          >
            ✕
          </button>

          <img
            src={displayedImage}
            alt="Profile picture"
            style={styles.fullscreenImage}
            onClick={(event) => event.stopPropagation()}
          />
        </div>
      )}
    </main>
  );
}

const styles: { [key: string]: React.CSSProperties } = {
  page: {
    minHeight: "100vh",
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
    background: "var(--pm-bg)",
    color: "var(--pm-text)",
    padding: "20px",
    fontFamily: "'Plus Jakarta Sans', Arial, sans-serif",
  },
  card: {
    width: "100%",
    maxWidth: "480px",
    background: "var(--pm-surface)",
    borderRadius: "26px",
    padding: "32px",
    boxShadow: "var(--pm-shadow)",
    border: "1px solid var(--pm-border)",
  },
  backLink: {
    color: "#0b9e77",
    textDecoration: "none",
    fontWeight: 700,
    fontSize: "14px",
  },
  logoRow: {
    display: "flex",
    alignItems: "center",
    gap: "12px",
    marginTop: "18px",
    marginBottom: "20px",
  },
  logo: {
    borderRadius: "12px",
    objectFit: "contain",
  },
  logoText: {
    fontSize: "22px",
    fontWeight: 800,
    color: "var(--pm-text)",
  },
  logoAccent: {
    color: "#0b9e77",
  },
  title: {
    margin: "0 0 6px",
    fontSize: "28px",
    fontWeight: 800,
  },
  subtitle: {
    margin: "0 0 24px",
    color: "var(--pm-muted)",
  },
  avatarSection: {
    display: "flex",
    alignItems: "center",
    gap: "16px",
    marginBottom: "24px",
  },
  avatarButton: {
    padding: 0,
    border: "none",
    background: "transparent",
    cursor: "pointer",
    borderRadius: "50%",
  },
  avatar: {
    width: "72px",
    height: "72px",
    borderRadius: "50%",
    objectFit: "cover",
  },
  avatarPlaceholder: {
    width: "72px",
    height: "72px",
    borderRadius: "50%",
    background: "linear-gradient(145deg, #17d39a, #0b9e77)",
    color: "white",
    display: "grid",
    placeItems: "center",
    fontSize: "28px",
    fontWeight: 800,
  },
  uploadButton: {
    background: "var(--pm-bg)",
    border: "1px solid var(--pm-border)",
    borderRadius: "999px",
    padding: "10px 18px",
    cursor: "pointer",
    fontWeight: 700,
    fontSize: "14px",
    color: "var(--pm-text)",
  },
  form: {
    display: "grid",
    gap: "14px",
  },
  input: {
    width: "100%",
    padding: "14px 16px",
    borderRadius: "14px",
    border: "1px solid var(--pm-border)",
    background: "var(--pm-bg)",
    color: "var(--pm-text)",
    fontSize: "15px",
  },
  button: {
    padding: "15px",
    borderRadius: "999px",
    border: "none",
    background: "linear-gradient(145deg, #17d39a, #0b9e77)",
    color: "white",
    fontWeight: 700,
    cursor: "pointer",
  },
  message: {
    marginTop: "16px",
    textAlign: "center",
    color: "#0b9e77",
    fontSize: "14px",
  },
  fullscreenOverlay: {
    position: "fixed",
    inset: 0,
    zIndex: 1000,
    display: "grid",
    placeItems: "center",
    background: "rgba(0, 0, 0, 0.9)",
    padding: "24px",
    cursor: "pointer",
  },
  fullscreenImage: {
    maxWidth: "100%",
    maxHeight: "90vh",
    borderRadius: "20px",
    objectFit: "contain",
    cursor: "default",
    boxShadow: "0 25px 70px rgba(0, 0, 0, 0.5)",
  },
  closeButton: {
    position: "absolute",
    top: "24px",
    right: "24px",
    width: "44px",
    height: "44px",
    borderRadius: "50%",
    border: "none",
    background: "rgba(255, 255, 255, 0.15)",
    color: "white",
    fontSize: "20px",
    cursor: "pointer",
  },
};
export default function ProfilePage() {
  return (
    <RequireAuth>
      <ProfileContent />
    </RequireAuth>
  );
}
"use client";

import { useEffect } from "react";

type ImageLightboxProps = {
  imageUrl: string;
  alt?: string;
  onClose: () => void;
};

export default function ImageLightbox({
  imageUrl,
  alt = "Profile picture",
  onClose,
}: ImageLightboxProps) {
  useEffect(() => {
    function handleKeyDown(event: KeyboardEvent) {
      if (event.key === "Escape") {
        onClose();
      }
    }

    window.addEventListener("keydown", handleKeyDown);

    return () => {
      window.removeEventListener("keydown", handleKeyDown);
    };
  }, [onClose]);

  return (
    <div style={styles.overlay} onClick={onClose}>
      <button
        type="button"
        onClick={onClose}
        style={styles.closeButton}
        aria-label="Close image"
      >
        ✕
      </button>

      <img
        src={imageUrl}
        alt={alt}
        style={styles.image}
        onClick={(event) => event.stopPropagation()}
      />
    </div>
  );
}

const styles: { [key: string]: React.CSSProperties } = {
  overlay: {
    position: "fixed",
    inset: 0,
    zIndex: 1000,
    display: "grid",
    placeItems: "center",
    background: "rgba(0, 0, 0, 0.9)",
    padding: "24px",
    cursor: "pointer",
  },
  image: {
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
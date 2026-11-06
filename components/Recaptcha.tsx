"use client";

import { useEffect, useRef } from "react";

type RecaptchaProps = {
  siteKey: string;
  onChange: (token: string | null) => void;
};

declare global {
  interface Window {
    grecaptcha?: {
      render: (
        element: HTMLElement,
        options: {
          sitekey: string;
          callback: (token: string) => void;
          "expired-callback": () => void;
        }
      ) => number;
      reset: (widgetId?: number) => void;
    };
    onRecaptchaLoad?: () => void;
  }
}

export default function Recaptcha({ siteKey, onChange }: RecaptchaProps) {
  const containerRef = useRef<HTMLDivElement | null>(null);
  const widgetIdRef = useRef<number | null>(null);

  useEffect(() => {
    function renderWidget() {
      if (!containerRef.current || !window.grecaptcha?.render) return;

      if (widgetIdRef.current !== null) return;

      widgetIdRef.current = window.grecaptcha.render(containerRef.current, {
        sitekey: siteKey,
        callback: (token: string) => onChange(token),
        "expired-callback": () => onChange(null),
      });
    }

    if (window.grecaptcha?.render) {
      renderWidget();
      return;
    }

    window.onRecaptchaLoad = renderWidget;

    const script = document.createElement("script");
    script.src =
      "https://www.google.com/recaptcha/api.js?onload=onRecaptchaLoad&render=explicit";
    script.async = true;
    script.defer = true;
    document.head.appendChild(script);

    return () => {
      window.onRecaptchaLoad = undefined;
    };
  }, [siteKey, onChange]);

  return <div ref={containerRef} />;
}
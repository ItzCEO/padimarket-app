"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { createSupabaseClient } from "@/lib/supabase-client";

type RequireAuthProps = {
  children: React.ReactNode;
};

export default function RequireAuth({ children }: RequireAuthProps) {
  const router = useRouter();
  const [isLoading, setIsLoading] = useState(true);
  const [isSignedIn, setIsSignedIn] = useState(false);

  useEffect(() => {
    async function checkUser() {
      const supabase = createSupabaseClient();
      const { data } = await supabase.auth.getUser();

      if (data.user) {
        setIsSignedIn(true);
      } else {
        router.replace("/login");
      }

      setIsLoading(false);
    }

    checkUser();
  }, [router]);

  if (isLoading) {
    return (
      <main
        style={{
          minHeight: "100vh",
          display: "grid",
          placeItems: "center",
          background: "var(--pm-bg)",
          color: "var(--pm-text)",
          fontFamily: "'Plus Jakarta Sans', Arial, sans-serif",
        }}
      >
        <p style={{ fontSize: "16px", fontWeight: 600 }}>
          Checking your account...
        </p>
      </main>
    );
  }

  if (!isSignedIn) {
    return null;
  }

  return <>{children}</>;
}
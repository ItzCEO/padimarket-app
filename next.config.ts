import type { NextConfig } from "next";

const config: NextConfig = {
  images: {
    remotePatterns: [
      {
        protocol: "https",
        hostname: "sfdgwrurbnnttpymdbck.supabase.co",
        pathname: "/storage/v1/object/public/**",
      },
    ],
  },
};

export default config;
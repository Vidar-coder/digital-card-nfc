import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  experimental: {
    serverActions: {
      // Image uploads to Google Drive are sent as base64 through a Server Action.
      bodySizeLimit: "8mb",
    },
  },
  // Ship the bundled Apps Script with the "Copy code / Download Code.gs" route.
  outputFileTracingIncludes: {
    "/api/apps-script/code": ["./apps-script/dist/Code.gs"],
  },
};

export default nextConfig;

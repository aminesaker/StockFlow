import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  // ESLint reste hors du build (lancé en CI/local). On RÉACTIVE la
  // vérification TypeScript au build pour la qualité/prod.
  eslint: {
    ignoreDuringBuilds: true,
  },
};

export default nextConfig;

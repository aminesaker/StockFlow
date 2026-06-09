import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  // Le lint est exécuté en CI/local, pas au build de prod (évite de bloquer
  // le déploiement sur des règles de style comme react/no-unescaped-entities).
  eslint: {
    ignoreDuringBuilds: true,
  },
};

export default nextConfig;

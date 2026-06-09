// Vérification TypeScript ACTIVE au build (pas de typescript.ignoreBuildErrors).
// ESLint exclu du build (lancé en CI/local). Objet non annoté pour éviter
// l'excess-property check sur la clé `eslint` (valide au runtime).
const nextConfig = {
  eslint: {
    ignoreDuringBuilds: true,
  },
};

export default nextConfig;

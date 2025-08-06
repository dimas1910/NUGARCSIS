/** @type {import('next').NextConfig} */
const nextConfig = {
  output: 'export', // Configura o Next.js para exportar como um site estático
  distDir: 'dist', // Onde os arquivos estáticos serão gerados
  eslint: {
    ignoreDuringBuilds: true,
  },
  typescript: {
    ignoreBuildErrors: true,
  },
  images: {
    unoptimized: true, // Desabilita a otimização de imagens para builds estáticos
  },
  // Adiciona um rewrite para que a raiz '/' sirva index.html
  async rewrites() {
    return [
      {
        source: '/',
        destination: '/index.html',
      },
      {
        source: '/transparencia/contratos',
        destination: '/transparencia/contratos.html',
      },
      {
        source: '/registros/doacao',
        destination: '/registros/doacao.html',
      },
    ];
  },
};

export default nextConfig;

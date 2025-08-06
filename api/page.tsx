// Este arquivo é necessário para a configuração do Next.js,
// mas o conteúdo principal da landing page será servido via public/index.html
// devido à configuração 'output: export' e 'rewrites' em next.config.mjs.

export default function HomePage() {
  return (
    <div style={{ display: 'none' }}>
      {/* Conteúdo oculto, a página principal é public/index.html */}
    </div>
  );
}

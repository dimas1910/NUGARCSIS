export default async function handler(req, res) {
  const { pagina = 1 } = req.query;

  const url = `https://dadosabertos.compras.gov.br/modulo-contratos/1_consultarContratos?pagina=${pagina}&tamanhoPagina=10&codigoUnidadeGestora=100001&dataVigenciaInicialMin=2025-01-01&dataVigenciaInicialMax=2025-08-05`;

  try {
    const response = await fetch(url, {
      headers: { 'Accept': 'application/json' }
    });

    if (!response.ok) {
      return res.status(response.status).json({ error: 'Erro ao acessar a API pública.' });
    }

    const data = await response.json();
    res.setHeader('Access-Control-Allow-Origin', '*'); // liberar CORS
    res.status(200).json(data);
  } catch (err) {
    console.error('Erro ao buscar contratos:', err);
    res.status(500).json({ error: 'Erro interno do servidor' });
  }
}

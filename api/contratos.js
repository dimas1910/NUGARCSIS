export default async function handler(req, res) {
  const pagina = req.query.pagina || 1;

  const url = `https://dadosabertos.compras.gov.br/modulo-contratos/1_consultarContratos?pagina=${pagina}&tamanhoPagina=10&codigoUnidadeGestora=100001&dataVigenciaInicialMin=2025-01-01&dataVigenciaInicialMax=2025-12-31`;

  try {
    const response = await fetch(url, {
      headers: { 'Accept': 'application/json' }
    });

    if (!response.ok) {
      console.error(`API error: ${response.status} ${response.statusText}`);
      return res.status(response.status).json({ 
        error: `Failed to fetch data from API: ${response.statusText}`,
        status: response.status
      });
    }

    const data = await response.json();

    if (!data.resultado) {
      console.warn('API response missing "resultado" field:', data);
      return res.status(200).json([]);
    }

    if (data.resultado.length === 0) {
      console.log('No contracts found for codigoUnidadeGestora=100001, date range 2025-01-01 to 2025-12-31');
    }

    res.setHeader('Access-Control-Allow-Origin', '*');
    res.status(200).json(data.resultado);

  } catch (err) {
    console.error('Server error fetching contracts:', err.message);
    res.status(500).json({ 
      error: 'Internal server error',
      details: err.message
    });
  }
}

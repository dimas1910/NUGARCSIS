// Date Utility: Find next business day
export function getNextBusinessDay(date) {
    let d = new Date(date);
    let day = d.getDay(); // 0 = Sunday, 1 = Monday, ..., 6 = Saturday

    // If Sunday, add 1 day to make it Monday
    if (day === 0) {
        d.setDate(d.getDate() + 1);
    }
    // If Saturday, add 2 days to make it Monday
    else if (day === 6) {
        d.setDate(d.getDate() + 2);
    }
    return d;
}

// Date Utility: Add months to a date, ensuring business day end
export function addMonthsAndAdjustBusinessDay(startDate, months) {
    let date = new Date(startDate);
    date.setMonth(date.getMonth() + months);
    return getNextBusinessDay(date);
}

// Date Utility: Add years to a date, ensuring business day end
export function addYearsAndAdjustBusinessDay(startDate, years) {
    let date = new Date(startDate);
    date.setFullYear(date.getFullYear() + years);
    return getNextBusinessDay(date);
}

// Function to extract information from PDF text (Termo de Doação)
export function extractDoacaoInfo(pdfText) {
    const info = {};

    // Número do Termo de Doação: Número com formato XX/XXXX
    let match = pdfText.match(/TERMO DE DOAÇÃO Nº\s*(\d{2}\/\d{4})/i);
    info.numeroTermoDoacao = match ? match[1] : 'Não encontrado';

    // Nome da donatária: nome da entidade encontrado entre a expressão "em favor" e um número de CNPJ
    match = pdfText.match(/em favor da\s*([^,]+?),\s*CNPJ\s*\d{2}\.\d{3}\.\d{3}\/\d{4}-\d{2}/i);
    info.nomeDonataria = match ? match[1].trim() : 'Não encontrado';

    // CNPJ da donatária: logo após o nome da donatária
    match = pdfText.match(/CNPJ\s*(\d{2}\.\d{3}\.\d{3}\/\d{4}-\d{2})/i);
    info.cnpjDonataria = match ? match[1] : 'Não encontrado';

    // E-mail da donatária: indicada nas informações da donatária
    match = pdfText.match(/e-mail:\s*([a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,})/i);
    info.emailDonataria = match ? match[1] : 'Não encontrado';

    // Número do PA SEI: informado na última linha do documento, abaixo do QR CODE no formato XXXXXXX/XXXX
    match = pdfText.match(/(\d{7}\/\d{4})\s*$/m); // Matches at end of line
    info.paSei = match ? match[1] : 'Não encontrado';

    // Descrição do objeto do termo: todo o texto da cláusula primeira "DO OBJETO"
    match = pdfText.match(/CLÁUSULA PRIMEIRA – DO OBJETO\s*([\s\S]+?)(?=CLÁUSULA SEGUNDA|CLÁUSULA TERCEIRA|CLÁUSULA QUARTA|CLÁUSULA QUINTA|CLÁUSULA SEXTA|CLÁUSULA SÉTIMA|CLÁUSULA OITAVA|CLÁUSULA NONA|CLÁUSULA DÉCIMA|$)/i);
    info.objetoTermo = match ? match[1].trim().replace(/^O presente Termo de Doação tem como objeto a doação de\s*/i, '').trim() : 'Não encontrado';

    // Setor responsável pelo controle dos bens: encontrado na cláusula "DA ENTREGA DO BEM"
    match = pdfText.match(/CLÁUSULA TERCEIRA – DA ENTREGA DO BEM\s*Os bens doados serão entregues ao\s*([^,.]+?)[,.]/i);
    info.setorResponsavel = match ? match[1].trim() : 'Não encontrado';

    // Tempo de vigência do termo: encontrado da cláusula "DA VIGÊNCIA"
    let vigenciaValue = 0;
    let vigenciaUnit = '';
    match = pdfText.match(/CLÁUSULA SEGUNDA – DA VIGÊNCIA\s*O presente Termo terá vigência de\s*(\d+)\s*$$([^)]+)$$\s*(meses|anos)/i);
    if (match) {
        vigenciaValue = parseInt(match[1]);
        vigenciaUnit = match[3].toLowerCase();
        info.tempoVigencia = `${match[1]} ${match[3]}`;
    } else {
        info.tempoVigencia = 'Não encontrado';
    }

    // Valor total dos objetos doados: valor em reais (R$) encontrado na cláusula "DO OBJETO"
    match = pdfText.match(/valor total de\s*(R\$\s*[\d\.,]+)/i);
    info.valorTotalObjetos = match ? match[1] : 'Não encontrado';

    // Data da assinatura: encontrado após a expressão "Documento assinado eletronicamente por"
    match = pdfText.match(/Documento assinado eletronicamente por[^em]+em\s*(\d{2}\/\d{2}\/\d{4})/i);
    info.dataAssinatura = match ? match[1] : 'Não encontrado';

    // Data final de vigência (cálculo da data da assinatura + tempo de vigência)
    if (info.dataAssinatura !== 'Não encontrado' && vigenciaValue > 0) {
        const [day, month, year] = info.dataAssinatura.split('/').map(Number);
        const signatureDate = new Date(year, month - 1, day); // Month is 0-indexed

        // Calculate first business day after signature
        let startDateForCalculation = new Date(signatureDate);
        startDateForCalculation.setDate(startDateForCalculation.getDate() + 1); // Start counting from next day
        startDateForCalculation = getNextBusinessDay(startDateForCalculation);

        let finalDate;
        if (vigenciaUnit === 'meses') {
            finalDate = addMonthsAndAdjustBusinessDay(startDateForCalculation, vigenciaValue);
        } else if (vigenciaUnit === 'anos') {
            finalDate = addYearsAndAdjustBusinessDay(startDateForCalculation, vigenciaValue);
        }

        if (finalDate) {
            info.dataFinalVigencia = finalDate.toLocaleDateString('pt-BR');
        } else {
            info.dataFinalVigencia = 'Erro no cálculo';
        }
    } else {
        info.dataFinalVigencia = 'Não calculada (dados insuficientes)';
    }

    return info;
}

// Function to extract information from the second PDF (for comparison)
export function extractComparisonInfo(pdfText) {
    const info = {};

    // Objeto
    let match = pdfText.match(/Objeto:\s*([^\n]+)/i);
    info.objeto = match ? match[1].trim() : 'Não encontrado';

    // Número do Instrumento Contratual
    match = pdfText.match(/Número do Instrumento Contratual:\s*([^\n]+)/i);
    info.numeroInstrumentoContratual = match ? match[1].trim() : 'Não encontrado';

    // Fornecedor
    match = pdfText.match(/Fornecedor:\s*([^\n]+)/i);
    info.fornecedor = match ? match[1].trim() : 'Não encontrado';

    // PA
    match = pdfText.match(/PA:\s*([^\n]+)/i);
    info.pa = match ? match[1].trim() : 'Não encontrado';

    // Órgão Fiscalizador
    match = pdfText.match(/Órgão Fiscalizador:\s*([^\n]+)/i);
    info.orgaoFiscalizador = match ? match[1].trim() : 'Não encontrado';

    // Outros valores
    match = pdfText.match(/Outros valores:\s*(R\$\s*[\d\.,]+)/i);
    info.outrosValores = match ? match[1].trim() : 'Não encontrado';

    return info;
}

// Function to compare extracted data
export function compareData(doacaoData, comparisonData) {
    const results = {};

    const normalizeText = (text) => (text || '').toLowerCase().replace(/[^\w\s]/g, '').replace(/\s+/g, ' ').trim();
    const normalizeValue = (value) => parseFloat((value || '0').replace('R$', '').replace(/\./g, '').replace(',', '.'));

    // Descrição do Objeto do Termo = Objeto
    results.objeto = {
        doacao: doacaoData.objetoTermo,
        comparacao: comparisonData.objeto,
        status: normalizeText(doacaoData.objetoTermo) === normalizeText(comparisonData.objeto) ? 'match' : 'mismatch'
    };

    // Número do Termo de Doação = Número do Instrumento Contratual
    results.numero = {
        doacao: doacaoData.numeroTermoDoacao,
        comparacao: comparisonData.numeroInstrumentoContratual,
        status: normalizeText(doacaoData.numeroTermoDoacao) === normalizeText(comparisonData.numeroInstrumentoContratual) ? 'match' : 'mismatch'
    };

    // Nome da donatária = Fornecedor
    results.nome = {
        doacao: doacaoData.nomeDonataria,
        comparacao: comparisonData.fornecedor,
        status: normalizeText(doacaoData.nomeDonataria) === normalizeText(comparisonData.fornecedor) ? 'match' : 'mismatch'
    };

    // Número do PA SEI = PA
    results.pa = {
        doacao: doacaoData.paSei,
        comparacao: comparisonData.pa,
        status: normalizeText(doacaoData.paSei) === normalizeText(comparisonData.pa) ? 'match' : 'mismatch'
    };

    // Setor responsável pelo controle de bens = Órgão Fiscalizador
    results.setor = {
        doacao: doacaoData.setorResponsavel,
        comparacao: comparisonData.orgaoFiscalizador,
        status: normalizeText(doacaoData.setorResponsavel) === normalizeText(comparisonData.orgaoFiscalizador) ? 'match' : 'mismatch'
    };

    // Valor total dos objetos doados = Outros valores
    results.valor = {
        doacao: doacaoData.valorTotalObjetos,
        comparacao: comparisonData.outrosValores,
        status: normalizeValue(doacaoData.valorTotalObjetos) === normalizeValue(comparisonData.outrosValores) ? 'match' : 'mismatch'
    };

    return results;
}

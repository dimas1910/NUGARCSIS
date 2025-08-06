// DOM Elements
const pdf1UploadInput = document.getElementById('pdf1Upload');
const pdf2UploadInput = document.getElementById('pdf2Upload');
const registerButton = document.getElementById('registerButton');
const clearButton = document.getElementById('clearButton');
const statusMessageDiv = document.getElementById('statusMessage');
const extractedResultsDiv = document.getElementById('extractedResults');
const comparisonResultsDiv = document.getElementById('comparisonResults');

// Extracted Data Display Elements
const doacaoNumeroTermo = document.getElementById('doacaoNumeroTermo');
const doacaoNomeDonataria = document.getElementById('doacaoNomeDonataria');
const doacaoCnpjDonataria = document.getElementById('doacaoCnpjDonataria');
const doacaoEmailDonataria = document.getElementById('doacaoEmailDonataria');
const doacaoPaSei = document.getElementById('doacaoPaSei');
const doacaoObjeto = document.getElementById('doacaoObjeto');
const doacaoSetorResponsavel = document.getElementById('doacaoSetorResponsavel');
const doacaoTempoVigencia = document.getElementById('doacaoTempoVigencia');
const doacaoValorTotal = document.getElementById('doacaoValorTotal');
const doacaoDataAssinatura = document.getElementById('doacaoDataAssinatura');
const doacaoDataFinalVigencia = document.getElementById('doacaoDataFinalVigencia');

// Comparison Data Display Elements
const compObjetoDoacao = document.getElementById('compObjetoDoacao');
const compObjetoComparacao = document.getElementById('compObjetoComparacao');
const compObjetoStatus = document.getElementById('compObjetoStatus');
const compNumeroDoacao = document.getElementById('compNumeroDoacao');
const compNumeroComparacao = document.getElementById('compNumeroComparacao');
const compNumeroStatus = document.getElementById('compNumeroStatus');
const compNomeDoacao = document.getElementById('compNomeDoacao');
const compNomeComparacao = document.getElementById('compNomeComparacao');
const compNomeStatus = document.getElementById('compNomeStatus');
const compPaDoacao = document.getElementById('compPaDoacao');
const compPaComparacao = document.getElementById('compPaComparacao');
const compPaStatus = document.getElementById('compPaStatus');
const compSetorDoacao = document.getElementById('compSetorDoacao');
const compSetorComparacao = document.getElementById('compSetorComparacao');
const compSetorStatus = document.getElementById('compSetorStatus');
const compValorDoacao = document.getElementById('compValorDoacao');
const compValorComparacao = document.getElementById('compValorComparacao');
const compValorStatus = document.getElementById('compValorStatus');

// Helper to display status messages
function showStatus(message, type) {
    statusMessageDiv.textContent = message;
    statusMessageDiv.className = `status-message ${type}`;
    statusMessageDiv.style.display = 'block';
}

function hideStatus() {
    statusMessageDiv.style.display = 'none';
}

// Function to update the UI with extracted data
function updateExtractedUI(data) {
    doacaoNumeroTermo.textContent = data.numeroTermoDoacao;
    doacaoNomeDonataria.textContent = data.nomeDonataria;
    doacaoCnpjDonataria.textContent = data.cnpjDonataria;
    doacaoEmailDonataria.textContent = data.emailDonataria;
    doacaoPaSei.textContent = data.paSei;
    doacaoObjeto.textContent = data.objetoTermo;
    doacaoSetorResponsavel.textContent = data.setorResponsavel;
    doacaoTempoVigencia.textContent = data.tempoVigencia;
    doacaoValorTotal.textContent = data.valorTotalObjetos;
    doacaoDataAssinatura.textContent = data.dataAssinatura;
    doacaoDataFinalVigencia.textContent = data.dataFinalVigencia;
    extractedResultsDiv.style.display = 'block';
}

// Function to update the UI with comparison results
function updateComparisonUI(results) {
    const updateRow = (elementId, doacaoVal, compVal, status) => {
        document.getElementById(`${elementId}Doacao`).textContent = doacaoVal;
        document.getElementById(`${elementId}Comparacao`).textContent = compVal;
        const statusCell = document.getElementById(`${elementId}Status`);
        statusCell.textContent = status === 'match' ? '✅ OK' : (status === 'mismatch' ? '❌ Divergente' : '❓ Ausente');
        statusCell.className = statusCell.className.replace(/match|mismatch|missing/g, ''); // Clear previous classes
        statusCell.classList.add(status);
    };

    updateRow('compObjeto', results.objeto.doacao, results.objeto.comparacao, results.objeto.status);
    updateRow('compNumero', results.numero.doacao, results.numero.comparacao, results.numero.status);
    updateRow('compNome', results.nome.doacao, results.nome.comparacao, results.nome.status);
    updateRow('compPa', results.pa.doacao, results.pa.comparacao, results.pa.status);
    updateRow('compSetor', results.setor.doacao, results.setor.comparacao, results.setor.status);
    updateRow('compValor', results.valor.doacao, results.valor.comparacao, results.valor.status);

    comparisonResultsDiv.style.display = 'block';
}

// Event Listener for Register Button
registerButton.addEventListener('click', async () => {
    hideStatus();
    extractedResultsDiv.style.display = 'none';
    comparisonResultsDiv.style.display = 'none';

    const pdf1File = pdf1UploadInput.files ? pdf1UploadInput.files[0] : null;
    const pdf2File = pdf2UploadInput.files ? pdf2UploadInput.files[0] : null;

    if (!pdf1File || !pdf2File) {
        showStatus('Por favor, selecione ambos os arquivos PDF.', 'error');
        return;
    }

    registerButton.disabled = true;
    clearButton.disabled = true;
    registerButton.innerHTML = '<i class="fas fa-spinner fa-spin"></i> Processando...';

    try {
        const formData = new FormData();
        formData.append('pdf1', pdf1File);
        formData.append('pdf2', pdf2File);

        const response = await fetch('/api/extract-pdf', {
            method: 'POST',
            body: formData,
        });

        if (!response.ok) {
            const errorData = await response.json();
            throw new Error(errorData.error || `Erro HTTP: ${response.status}`);
        }

        const data = await response.json();
        updateExtractedUI(data.extractedDoacao);
        updateComparisonUI(data.comparisonResults);
        showStatus('Extração e comparação concluídas com sucesso!', 'success');

    } catch (e) {
        console.error("Erro durante o processamento de PDFs:", e);
        showStatus(`Ocorreu um erro: ${e.message}.`, 'error');
    } finally {
        registerButton.disabled = false;
        clearButton.disabled = false;
        registerButton.innerHTML = '<i class="fas fa-upload"></i> Registrar e Comparar';
    }
});

// Event Listener for Clear Button
clearButton.addEventListener('click', () => {
    pdf1UploadInput.value = '';
    pdf2UploadInput.value = '';
    hideStatus();
    extractedResultsDiv.style.display = 'none';
    comparisonResultsDiv.style.display = 'none';
});

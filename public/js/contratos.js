let allContracts = [];
let filteredAndSortedContracts = [];
let currentPage = 1;
let itemsPerPage = 25;
let totalPages = 0;
let searchTerm = '';
let currentSortColumn = null;
let currentSortDirection = 'asc'; // 'asc' or 'desc'

// Elementos DOM
const searchInput = document.getElementById('searchInput');
const loadingContainer = document.getElementById('loadingContainer');
const errorContainer = document.getElementById('errorContainer');
const contractsContainer = document.getElementById('contractsContainer');
const contractsTableBody = document.getElementById('contractsTableBody');
const noResultsContainer = document.getElementById('noResultsContainer');
const paginationContainer = document.getElementById('paginationContainer');
const paginationInfo = document.getElementById('paginationInfo');
const statusText = document.getElementById('statusText');
const totalContractsEl = document.getElementById('totalContracts');
const totalValueEl = document.getElementById('totalValue');
const uniqueSuppliersEl = document.getElementById('uniqueSuppliers');
const errorMessage = document.getElementById('errorMessage');

// Filter elements
const modalityFilterSelect = document.getElementById('modalityFilter');
const categoryFilterSelect = document.getElementById('categoryFilter');
const minValueFilterInput = document.getElementById('minValueFilter');
const maxValueFilterInput = document.getElementById('maxValueFilter');
const itemsPerPageSelect = document.getElementById('itemsPerPage');

// Buttons
const applyFiltersBtn = document.getElementById('applyFiltersBtn');
const clearFiltersBtn = document.getElementById('clearFiltersBtn');
const exportCsvBtn = document.getElementById('exportCsvBtn');
const retryLoadContractsBtn = document.getElementById('retryLoadContractsBtn');
const firstButton = document.getElementById('firstButton');
const prevButton = document.getElementById('prevButton');
const nextButton = document.getElementById('nextButton');
const lastButton = document.getElementById('lastButton');
const pageNumbersDiv = document.getElementById('pageNumbers');


// Utility Functions
function formatCurrency(value) {
    return new Intl.NumberFormat('pt-BR', {
        style: 'currency',
        currency: 'BRL'
    }).format(value || 0);
}

function formatDate(dateString) {
    if (!dateString) return '-';
    try {
        return new Date(dateString).toLocaleDateString('pt-BR');
    } catch {
        return dateString; // Fallback for invalid date strings
    }
}

function formatCNPJ(cnpj) {
    if (!cnpj) return '-';
    return cnpj.replace(/^(\d{2})(\d{3})(\d{3})(\d{4})(\d{2})/, '$1.$2.$3/$4-$5');
}

// Carregar TODOS os contratos da API
async function loadAllContracts() {
    try {
        showLoading();
        statusText.textContent = 'Conectado à API via Vercel - Carregando todos os contratos...';
        
        let allData = [];
        let page = 1;
        let hasMoreData = true;

        // Loop para buscar todas as páginas
        while (hasMoreData) {
            const response = await fetch(
                `https://nugarcsis.vercel.app/api/contratos?pagina=${page}`,
                {
                    headers: {
                        'Accept': 'application/json',
                    }
                }
            );

            if (!response.ok) {
                throw new Error(`Erro HTTP: ${response.status}`);
            }

            const data = await response.json();
            const contracts = Array.isArray(data) ? data : [];
            
            if (contracts.length === 0) {
                hasMoreData = false;
            } else {
                allData = [...allData, ...contracts];
                page++;
                
                // Atualizar status
                statusText.textContent = `Carregando contratos... (${allData.length} encontrados)`;
            }
        }
        
        allContracts = allData;
        populateFilterOptions(); // Populate filters after loading all data
        applyFiltersAndSort(); // Apply initial filters and sort
        hideLoading();
        
    } catch (error) {
        console.error('Erro ao carregar contratos:', error);
        showError(error.message);
    }
}

// Populate filter dropdowns
function populateFilterOptions() {
    const modalities = new Set(allContracts.map(c => c.nomeModalidadeCompra).filter(Boolean));
    modalityFilterSelect.innerHTML = '<option value="all">Todas</option>' + 
        Array.from(modalities).sort().map(m => `<option value="${m}">${m}</option>`).join('');

    const categories = new Set(allContracts.map(c => c.nomeCategoria).filter(Boolean));
    categoryFilterSelect.innerHTML = '<option value="all">Todas</option>' +
        Array.from(categories).sort().map(c => `<option value="${c}">${c}</option>`).join('');
}

// Apply all filters and sorting
function applyFiltersAndSort() {
    let tempFiltered = [...allContracts];

    // Search term filter
    if (searchTerm) {
        const lowerSearchTerm = searchTerm.toLowerCase();
        tempFiltered = tempFiltered.filter(contract => 
            (contract.nomeRazaoSocialFornecedor || '').toLowerCase().includes(lowerSearchTerm) ||
            (contract.numeroContrato || '').toLowerCase().includes(lowerSearchTerm) ||
            (contract.objeto || '').toLowerCase().includes(lowerSearchTerm) ||
            (contract.numeroCompra || '').toLowerCase().includes(lowerSearchTerm) ||
            (contract.processo || '').toLowerCase().includes(lowerSearchTerm) ||
            (contract.unidadesRequisitantes || '').toLowerCase().includes(lowerSearchTerm)
        );
    }

    // Modality filter
    const selectedModality = modalityFilterSelect.value;
    if (selectedModality !== 'all') {
        tempFiltered = tempFiltered.filter(contract => contract.nomeModalidadeCompra === selectedModality);
    }

    // Category filter
    const selectedCategory = categoryFilterSelect.value;
    if (selectedCategory !== 'all') {
        tempFiltered = tempFiltered.filter(contract => contract.nomeCategoria === selectedCategory);
    }

    // Value range filter
    const minValue = parseFloat(minValueFilterInput.value);
    const maxValue = parseFloat(maxValueFilterInput.value);

    if (!isNaN(minValue)) {
        tempFiltered = tempFiltered.filter(contract => (contract.valorGlobal || 0) >= minValue);
    }
    if (!isNaN(maxValue)) {
        tempFiltered = tempFiltered.filter(contract => (contract.valorGlobal || 0) <= maxValue);
    }

    // Apply sorting
    if (currentSortColumn) {
        tempFiltered.sort((a, b) => {
            const valA = a[currentSortColumn];
            const valB = b[currentSortColumn];

            if (typeof valA === 'string' && typeof valB === 'string') {
                return currentSortDirection === 'asc' ? valA.localeCompare(valB) : valB.localeCompare(valA);
            }
            if (currentSortColumn.includes('dataVigencia')) {
                const dateA = new Date(valA).getTime();
                const dateB = new Date(valB).getTime();
                return currentSortDirection === 'asc' ? dateA - dateB : dateB - dateA;
            }
            // For numbers (like valorGlobal)
            const numA = parseFloat(valA) || 0;
            const numB = parseFloat(valB) || 0;
            return currentSortDirection === 'asc' ? numA - numB : numB - numA;
        });
    }

    filteredAndSortedContracts = tempFiltered;
    totalPages = Math.ceil(filteredAndSortedContracts.length / itemsPerPage);
    currentPage = 1; // Reset to first page on filter/sort change
    renderContracts();
    updatePagination();
    updateStats();
    updateSortIcons();
}

// Handlers for UI interactions
function handleSort(columnKey) {
    if (currentSortColumn === columnKey) {
        currentSortDirection = currentSortDirection === 'asc' ? 'desc' : 'asc';
    } else {
        currentSortColumn = columnKey;
        currentSortDirection = 'asc';
    }
    applyFiltersAndSort(); // Re-apply filters and sort
}

function changePage(direction) {
    const newPage = currentPage + direction;
    if (newPage >= 1 && newPage <= totalPages) {
        goToPage(newPage);
    }
}

function goToPage(page) {
    currentPage = page;
    renderContracts();
    updatePagination();
    window.scrollTo({ top: 0, behavior: 'smooth' });
}

function changeItemsPerPage() {
    itemsPerPage = parseInt(itemsPerPageSelect.value);
    applyFiltersAndSort(); // Re-apply filters and sort
}

// Update sort icons in table headers
function updateSortIcons() {
    document.querySelectorAll('.contracts-table th').forEach(header => {
        const sortIcon = header.querySelector('.sort-icon');
        if (sortIcon) {
            sortIcon.innerHTML = ''; // Clear previous icon
        }
    });

    if (currentSortColumn) {
        const activeHeader = document.querySelector(`.contracts-table th[data-sort-key="${currentSortColumn}"]`);
        if (activeHeader) {
            const sortIcon = activeHeader.querySelector('.sort-icon');
            if (sortIcon) {
                sortIcon.innerHTML = currentSortDirection === 'asc' ? ' &#9650;' : ' &#9660;'; // Up or Down arrow
            }
        }
    }
}

// Renderizar contratos na tabela
function renderContracts() {
    if (filteredAndSortedContracts.length === 0) {
        showNoResults();
        return;
    }

    contractsContainer.style.display = 'block';
    noResultsContainer.style.display = 'none';
    paginationContainer.style.display = 'flex';
    paginationInfo.style.display = 'block';
    
    const startIndex = (currentPage - 1) * itemsPerPage;
    const endIndex = startIndex + itemsPerPage;
    const contractsToDisplay = filteredAndSortedContracts.slice(startIndex, endIndex);
    
    contractsTableBody.innerHTML = contractsToDisplay.map(contract => `
        <tr>
            <td><span class="font-semibold">${contract.numeroContrato || '-'}</span></td>
            <td>${contract.numeroCompra || '-'}</td>
            <td><span class="badge">${contract.nomeModalidadeCompra || '-'}</span></td>
            <td>${contract.nomeCategoria || '-'}</td>
            <td>${contract.unidadesRequisitantes || '-'}</td>
            <td><span class="font-mono text-xs">${formatCNPJ(contract.niFornecedor)}</span></td>
            <td>${contract.nomeRazaoSocialFornecedor || '-'}</td>
            <td><span class="font-mono text-xs">${contract.processo || '-'}</span></td>
            <td>${contract.objeto || '-'}</td>
            <td><span class="text-xs">${formatDate(contract.dataVigenciaInicial)}</span></td>
            <td><span class="text-xs">${formatDate(contract.dataVigenciaFinal)}</span></td>
            <td><span class="font-bold text-green-600">${formatCurrency(contract.valorGlobal)}</span></td>
        </tr>
    `).join('');

    // Atualizar informações de paginação
    const showingFrom = startIndex + 1;
    const showingTo = Math.min(endIndex, filteredAndSortedContracts.length);
    document.getElementById('showingFrom').textContent = showingFrom;
    document.getElementById('showingTo').textContent = showingTo;
    document.getElementById('totalItems').textContent = filteredAndSortedContracts.length;
}

// Export to CSV (current page only)
function exportToCsv() {
    const headers = Array.from(document.querySelectorAll('.contracts-table th'))
                       .map(th => th.textContent.trim().replace(/ \u25B2| \u25BC/g, '')); // Remove sort icons

    const startIndex = (currentPage - 1) * itemsPerPage;
    const endIndex = startIndex + itemsPerPage;
    const pageContractsToExport = filteredAndSortedContracts.slice(startIndex, endIndex);

    const rows = pageContractsToExport.map(contract => [
        `"${(contract.numeroContrato || '-').replace(/"/g, '""')}"`,
        `"${(contract.numeroCompra || '-').replace(/"/g, '""')}"`,
        `"${(contract.nomeModalidadeCompra || '-').replace(/"/g, '""')}"`,
        `"${(contract.nomeCategoria || '-').replace(/"/g, '""')}"`,
        `"${(contract.unidadesRequisitantes || '-').replace(/"/g, '""')}"`,
        `"${formatCNPJ(contract.niFornecedor).replace(/"/g, '""')}"`,
        `"${(contract.nomeRazaoSocialFornecedor || '-').replace(/"/g, '""')}"`,
        `"${(contract.processo || '-').replace(/"/g, '""')}"`,
        `"${(contract.objeto || '-').replace(/"/g, '""')}"`,
        `"${formatDate(contract.dataVigenciaInicial).replace(/"/g, '""')}"`,
        `"${formatDate(contract.dataVigenciaFinal).replace(/"/g, '""')}"`,
        `"${formatCurrency(contract.valorGlobal).replace(/"/g, '""')}"`
    ].join(';')); // Use semicolon as separator for Brazilian CSVs

    const csvContent = [headers.join(';'), ...rows].join('\n');
    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const link = document.createElement('a');
    link.href = URL.createObjectURL(blob);
    link.download = `contratos_pagina_${currentPage}.csv`;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
}

// Atualizar estatísticas
function updateStats() {
    const totalValue = filteredAndSortedContracts.reduce((sum, contract) => sum + (contract.valorGlobal || 0), 0);
    const uniqueSuppliers = new Set(filteredAndSortedContracts.map(contract => contract.niFornecedor)).size;

    totalContractsEl.textContent = filteredAndSortedContracts.length;
    totalValueEl.textContent = formatCurrency(totalValue);
    uniqueSuppliersEl.textContent = uniqueSuppliers;
}

// Atualizar paginação
function updatePagination() {
    if (totalPages <= 1) {
        paginationContainer.style.display = 'none';
        paginationInfo.style.display = 'none';
        return;
    }

    paginationContainer.style.display = 'flex';
    paginationInfo.style.display = 'block';

    // Botões de navegação
    firstButton.disabled = currentPage <= 1;
    prevButton.disabled = currentPage <= 1;
    nextButton.disabled = currentPage >= totalPages;
    lastButton.disabled = currentPage >= totalPages;

    // Números das páginas
    pageNumbersDiv.innerHTML = '';

    const maxVisiblePages = 5;
    let startPage = Math.max(1, currentPage - Math.floor(maxVisiblePages / 2));
    let endPage = Math.min(totalPages, startPage + maxVisiblePages - 1);

    if (endPage - startPage < maxVisiblePages - 1) {
        startPage = Math.max(1, endPage - maxVisiblePages + 1);
    }

    for (let i = startPage; i <= endPage; i++) {
        const button = document.createElement('button');
        button.textContent = i;
        button.onclick = () => goToPage(i);
        if (i === currentPage) {
            button.classList.add('active');
        }
        pageNumbersDiv.appendChild(button);
    }
}

// Estados da interface
function showLoading() {
    loadingContainer.style.display = 'flex';
    errorContainer.style.display = 'none';
    contractsContainer.style.display = 'none';
    noResultsContainer.style.display = 'none';
    paginationContainer.style.display = 'none';
    paginationInfo.style.display = 'none';
}

function hideLoading() {
    loadingContainer.style.display = 'none';
}

function showError(message) {
    hideLoading();
    errorContainer.style.display = 'block';
    contractsContainer.style.display = 'none';
    noResultsContainer.style.display = 'none';
    paginationContainer.style.display = 'none';
    paginationInfo.style.display = 'none';
    errorMessage.textContent = message;
}

function showNoResults() {
    contractsContainer.style.display = 'none';
    noResultsContainer.style.display = 'block';
    paginationContainer.style.display = 'none';
    paginationInfo.style.display = 'none';
}

// Event Listeners
document.addEventListener('DOMContentLoaded', () => {
    loadAllContracts();

    searchInput.addEventListener('input', (e) => {
        searchTerm = e.target.value.toLowerCase();
        applyFiltersAndSort();
    });

    document.querySelectorAll('.contracts-table th[data-sort-key]').forEach(header => {
        header.addEventListener('click', () => {
            const sortKey = header.dataset.sortKey;
            handleSort(sortKey);
        });
    });

    applyFiltersBtn.addEventListener('click', applyFiltersAndSort);
    clearFiltersBtn.addEventListener('click', () => {
        modalityFilterSelect.value = 'all';
        categoryFilterSelect.value = 'all';
        minValueFilterInput.value = '';
        maxValueFilterInput.value = '';
        applyFiltersAndSort();
    });
    exportCsvBtn.addEventListener('click', exportToCsv);
    retryLoadContractsBtn.addEventListener('click', loadAllContracts);

    itemsPerPageSelect.addEventListener('change', changeItemsPerPage);
    firstButton.addEventListener('click', () => goToPage(1));
    prevButton.addEventListener('click', () => changePage(-1));
    nextButton.addEventListener('click', () => changePage(1));
    lastButton.addEventListener('click', () => goToPage(totalPages));
});

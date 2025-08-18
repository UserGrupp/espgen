"use strict";
// === FUNZIONI HELPER PER PARTI COMUNI ===
Object.defineProperty(exports, "__esModule", { value: true });
exports.resetDatabaseScript = exports.generateSearchScript = exports.checkServer = exports.disattivaScript = exports.generateSearchSection = exports.generateBaseHTML = exports.generateAutoRefreshScript = exports.generateStickyHeaderScript = exports.generatePaginationScript = exports.generatePagination = exports.generateCSSLink = exports.generateNavbar = void 0;
// Funzione per generare la navbar comune
function generateNavbar(activePage) {
    const pages = [
        { href: '/sensor-data', icon: '📊', text: 'Dati Sensori' },
        { href: '/spending-dashboard', icon: '💰', text: 'Dashboard Spese' },
        { href: '/tag-owners', icon: '👥', text: 'Proprietari Tag' },
        { href: '/utility', icon: '🔧', text: 'Utility' }
    ];
    const navItems = pages.map(page => {
        const isActive = page.href.includes(activePage) ? 'active' : '';
        return `<li><a href="${page.href}" class="${isActive}">${page.icon} ${page.text}</a></li>`;
    }).join('');
    return `
    <nav class="navbar">
        <div class="navbar-container">
            <a href="/" class="navbar-brand">🏠 Home</a>
            <ul class="navbar-nav">
                ${navItems}
            </ul>
        </div>
    </nav>
  `;
}
exports.generateNavbar = generateNavbar;
// Funzione per generare il link al file CSS esterno
function generateCSSLink() {
    const version = Date.now(); // Forza il ricaricamento del CSS
    return `<link rel="stylesheet" href="/styles.css?v=${version}">`;
}
exports.generateCSSLink = generateCSSLink;
// Funzione per generare la paginazione comune
function generatePagination(pagination) {
    if (!pagination)
        return '';
    return `
    <div class="pagination">
        <select onchange="changeLimit(this.value)" id="limitSelect">
            <option value="5" ${pagination.limit === 5 ? 'selected' : ''}>5 per pagina</option>
            <option value="10" ${pagination.limit === 10 ? 'selected' : ''}>10 per pagina</option>
            <option value="25" ${pagination.limit === 25 ? 'selected' : ''}>25 per pagina</option>
            <option value="50" ${pagination.limit === 50 ? 'selected' : ''}>50 per pagina</option>
        </select>
        
        ${pagination.page > 1 ? `<button onclick="goToPage(1)">⏮️ Prima</button>` : ''}
        ${pagination.page > 1 ? `<button onclick="goToPage(${pagination.page - 1})">← Precedente</button>` : ''}
        <span>Pagina ${pagination.page} di ${pagination.totalPages}</span>
        ${pagination.page < pagination.totalPages ? `<button onclick="goToPage(${pagination.page + 1})">Successiva →</button>` : ''}
        ${pagination.page < pagination.totalPages ? `<button onclick="goToPage(${pagination.totalPages})">Ultima ⏭️</button>` : ''}
    </div>
  `;
}
exports.generatePagination = generatePagination;
// Funzione per generare il JavaScript comune per la paginazione
function generatePaginationScript() {
    return `
    // Paginazione AJAX: aggiorna solo la tabella + barra paginazione
    async function loadPageData(page, limit) {
        const currentPath = window.location.pathname;
        let pagination = { page: Number(page) || 1, limit: Number(limit) || 10, total: 0, totalPages: 1 };
        let data = [];

        try {
            if (currentPath.includes('/sensor-data')) {
                const response = await fetch('/api/sensor-data?page=' + pagination.page + '&pageSize=' + pagination.limit);
                const result = await response.json();
                if (result.success) {
                    data = result.data || [];
                    pagination.total = result.pagination.total || data.length;
                    pagination.totalPages = result.pagination.totalPages || Math.max(1, Math.ceil(pagination.total / pagination.limit));
                    renderSensorDataTable(data);
                }
            } else if (currentPath.includes('/tag-owners')) {
                const response = await fetch('/api/tag-owners?page=' + pagination.page + '&pageSize=' + pagination.limit);
                const result = await response.json();
                if (result.success) {
                    data = result.data || [];
                    pagination.total = result.pagination.total || data.length;
                    pagination.totalPages = result.pagination.totalPages || Math.max(1, Math.ceil(pagination.total / pagination.limit));
                    renderTagOwnersTable(data);
                }
            } else if (currentPath.includes('/spending-dashboard') && !currentPath.includes('/spending-dashboard/')) {
                const response = await fetch('/api/spending-stats?page=' + pagination.page + '&pageSize=' + pagination.limit);
                const result = await response.json();
                if (result.success) {
                    data = result.data || [];
                    pagination.total = result.pagination.total || data.length;
                    pagination.totalPages = result.pagination.totalPages || Math.max(1, Math.ceil(pagination.total / pagination.limit));
                    renderSpendingDashboardTable(data);
                }
            } else if (currentPath.includes('/spending-dashboard/')) {
                const uid = currentPath.split('/spending-dashboard/')[1];
                const response = await fetch('/api/sensor-data/uid/' + encodeURIComponent(uid) + '/history?limit=10000');
                const result = await response.json();
                const operations = (result && result.data) ? result.data : [];
                pagination.total = operations.length;
                pagination.totalPages = Math.max(1, Math.ceil(pagination.total / pagination.limit));
                const startIndex = (pagination.page - 1) * pagination.limit;
                const endIndex = startIndex + pagination.limit;
                renderUidOperationsTable(operations.slice(startIndex, endIndex));
            }
        } catch (error) {
            console.error('Errore nella paginazione AJAX:', error);
        }

        renderPagination(pagination);
    }

    function renderPagination(p) {
        const container = document.querySelector('.pagination');
        if (!container) return;
        let html = '';
        html += '<select onchange="changeLimit(this.value)" id="limitSelect">';
        html += '<option value="5" ' + (p.limit === 5 ? 'selected' : '') + '>5 per pagina</option>';
        html += '<option value="10" ' + (p.limit === 10 ? 'selected' : '') + '>10 per pagina</option>';
        html += '<option value="25" ' + (p.limit === 25 ? 'selected' : '') + '>25 per pagina</option>';
        html += '<option value="50" ' + (p.limit === 50 ? 'selected' : '') + '>50 per pagina</option>';
        html += '</select>';
        if (p.page > 1) html += '<button onclick="goToPage(1)">⏮️ Prima</button>';
        if (p.page > 1) html += '<button onclick="goToPage(' + (p.page - 1) + ')">← Precedente</button>';
        html += '<span>Pagina ' + p.page + ' di ' + p.totalPages + '</span>';
        if (p.page < p.totalPages) html += '<button onclick="goToPage(' + (p.page + 1) + ')">Successiva →</button>';
        if (p.page < p.totalPages) html += '<button onclick="goToPage(' + p.totalPages + ')">Ultima ⏭️</button>';
        container.innerHTML = html;
        
        // Ripristina il limite salvato dopo aver aggiornato il DOM
        setTimeout(() => {
            restoreSavedLimit();
        }, 0);
    }

    function renderSpendingDashboardTable(stats) {
        const tbody = document.querySelector('tbody');
        if (!tbody) return;
        tbody.innerHTML = '';
        stats.forEach(stat => {
            const row = document.createElement('tr');
            if (typeof generateSpendingDashboardRow === 'function') {
                row.innerHTML = generateSpendingDashboardRow(stat);
            }
            tbody.appendChild(row);
        });
    }

    function renderTagOwnersTable(owners) {
        const tbody = document.querySelector('tbody');
        if (!tbody) return;
        tbody.innerHTML = '';
        owners.forEach(owner => {
            if (typeof generateTagOwnerRow === 'function') {
                const html = generateTagOwnerRow(owner);
                tbody.insertAdjacentHTML('beforeend', html);
            }
        });
    }

    function renderSensorDataTable(records) {
        const tbody = document.querySelector('tbody');
        if (!tbody) return;
        tbody.innerHTML = '';
        records.forEach(record => {
            if (typeof generateSensorDataRow === 'function') {
                const html = generateSensorDataRow(record);
                tbody.insertAdjacentHTML('beforeend', html);
            }
        });
    }

    function renderUidOperationsTable(ops) {
        const bodies = document.querySelectorAll('tbody');
        const tbody = bodies && bodies.length ? bodies[bodies.length - 1] : null;
        if (!tbody) return;
        tbody.innerHTML = '';
        ops.forEach(op => {
            const spesa = Number(op.credito_precedente) - Number(op.credito_attuale);
            const row =
              '<tr>' +
                '<td>' + op.datetime + '</td>' +
                '<td>' + Number(op.credito_precedente).toFixed(2) + '€</td>' +
                '<td>' + Number(op.credito_attuale).toFixed(2) + '€</td>' +
                '<td><span class="spesa">' + spesa.toFixed(2) + '€</span></td>' +
                '<td><span class="status ' + op.status + '">' + op.status + '</span></td>' +
              '</tr>';
            tbody.insertAdjacentHTML('beforeend', row);
        });
    }

    // Funzione per salvare il limite nel localStorage
    function saveLimitToStorage(limit) {
        const currentPath = window.location.pathname;
        const storageKey = 'tableLimit_' + currentPath.replace(/\//g, '_');
        localStorage.setItem(storageKey, limit.toString());
    }
    
    // Funzione per recuperare il limite dal localStorage
    function getLimitFromStorage() {
        const currentPath = window.location.pathname;
        const storageKey = 'tableLimit_' + currentPath.replace(/\//g, '_');
        const savedLimit = localStorage.getItem(storageKey);
        return savedLimit ? Number(savedLimit) : 10; // Default a 10 se non trovato
    }
    
    // Funzione per ripristinare il limite salvato
    function restoreSavedLimit() {
        const savedLimit = getLimitFromStorage();
        const select = document.querySelector('#limitSelect');
        if (select) {
            select.value = savedLimit.toString();
        }
        return savedLimit;
    }
    
    window.goToPage = function(page) {
        const select = document.querySelector('.pagination select');
        const limit = select ? Number(select.value) : getLimitFromStorage();
        loadPageData(Number(page), limit);
    };
    
    window.changeLimit = function(limit) {
        saveLimitToStorage(limit);
        loadPageData(1, Number(limit));
    };
    
    // Ripristina il limite salvato quando la pagina viene caricata
    document.addEventListener('DOMContentLoaded', function() {
        restoreSavedLimit();
    });
  `;
}
exports.generatePaginationScript = generatePaginationScript;
// Funzione per generare il JavaScript comune per sticky header
function generateStickyHeaderScript() {
    return `
    // Funzione per gestire il sticky header
    function initStickyHeader() {
        const tableContainer = document.querySelector('.table-container');
        const thead = tableContainer?.querySelector('thead');
        
        if (tableContainer && thead) {
            // Aggiungi ombra quando si fa scroll
            tableContainer.addEventListener('scroll', function() {
                if (this.scrollTop > 0) {
                    thead.style.boxShadow = '0 2px 8px rgba(0,0,0,0.15)';
                } else {
                    thead.style.boxShadow = '0 2px 4px rgba(0,0,0,0.1)';
                }
            });
            
            // Evidenzia la colonna quando si passa sopra con il mouse
            const thElements = thead.querySelectorAll('th');
            thElements.forEach((th, index) => {
                th.addEventListener('mouseenter', function() {
                    const tbody = tableContainer.querySelector('tbody');
                    const rows = tbody?.querySelectorAll('tr');
                    rows?.forEach(row => {
                        const cell = row.cells[index];
                        if (cell) {
                            cell.style.backgroundColor = '#e8f5e8';
                            cell.style.transition = 'background-color 0.2s';
                        }
                    });
                });
                
                th.addEventListener('mouseleave', function() {
                    const tbody = tableContainer.querySelector('tbody');
                    const rows = tbody?.querySelectorAll('tr');
                    rows?.forEach((row, rowIndex) => {
                        const cell = row.cells[index];
                        if (cell) {
                            cell.style.backgroundColor = rowIndex % 2 === 0 ? 'white' : '#f2f2f2';
                        }
                    });
                });
            });
        }
    }
    
    // Inizializza il sticky header quando la pagina è caricata
    document.addEventListener('DOMContentLoaded', function() {
        initStickyHeader();
    });
  `;
}
exports.generateStickyHeaderScript = generateStickyHeaderScript;
// Funzione per generare il JavaScript comune per il refresh automatico
function generateAutoRefreshScript() {
    return `
    // Variabili per gestire l'aggiornamento intelligente
    let refreshCountdown = 5;
    let isUserEditing = false;
    let refreshInterval;
    let countdownInterval;
    let autoRefreshEnabled = localStorage.getItem('autoRefreshEnabled') !== 'false';
    
    // Mostra un indicatore di aggiornamento
    const countdownElement = document.createElement('div');
    countdownElement.style.cssText = 'position: fixed; top: 10px; right: 10px; background: #2196F3; color: white; padding: 8px 12px; border-radius: 4px; font-size: 12px; z-index: 1000; cursor: pointer;';
    countdownElement.title = "Clicca per interrompere l'aggiornamento automatico";
    countdownElement.addEventListener('click', toggleAutoRefresh);
    document.body.appendChild(countdownElement);
    
    // Imposta lo stato iniziale del countdown
    if (!autoRefreshEnabled) {
        countdownElement.style.background = '#FF5722';
        countdownElement.textContent = 'Aggiornamento disabilitato';
        countdownElement.title = "Clicca per riprendere l'aggiornamento automatico";
    }
    
    // Funzione per controllare se l'utente sta modificando i campi
    function checkUserEditing() {
        if (!autoRefreshEnabled) return;
        
        const activeElement = document.activeElement;
        const isEditing = activeElement && (
            activeElement.tagName === 'INPUT' || 
            activeElement.tagName === 'TEXTAREA' ||
            activeElement.contentEditable === 'true'
        );
        
        if (isEditing !== isUserEditing) {
            isUserEditing = isEditing;
            if (isUserEditing) {
                // Pausa l'aggiornamento quando l'utente sta modificando
                pauseAutoRefresh();
                countdownElement.style.background = '#FF9800';
                countdownElement.textContent = 'Modifica in corso...';
            } else {
                // Riprendi l'aggiornamento quando l'utente smette di modificare
                resumeAutoRefresh();
                countdownElement.style.background = '#2196F3';
            }
        }
    }
    
    // Funzione per mettere in pausa l'aggiornamento automatico
    function pauseAutoRefresh() {
        if (refreshInterval) {
            clearInterval(refreshInterval);
            refreshInterval = null;
        }
        if (countdownInterval) {
            clearInterval(countdownInterval);
            countdownInterval = null;
        }
    }
    
    // Funzione per riprendere l'aggiornamento automatico
    function resumeAutoRefresh() {
        if (!refreshInterval && autoRefreshEnabled) {
            refreshCountdown = 5;
            startAutoRefresh();
        }
    }
    
    // Funzione per avviare l'aggiornamento automatico
    function startAutoRefresh() {
        if (!autoRefreshEnabled) return;
        
        refreshInterval = setInterval(async function() {
            if (!isUserEditing && autoRefreshEnabled) {
            try {
                const controller = new AbortController();
                const timeoutId = setTimeout(() => controller.abort(), 4000);

                const response = await fetch('/nRecords', { signal: controller.signal });
                clearTimeout(timeoutId);
                const result = await response.json();
                if (result.record.change)
                  location.reload();
                //alert(result.record.record);
            }
                catch (error)
                { console.log(error);};
            }
        }, 5000);
        
        countdownInterval = setInterval(function() {
            if (!isUserEditing && autoRefreshEnabled) {
                refreshCountdown--;
                countdownElement.textContent = 'Aggiornamento in ' + refreshCountdown + 's';
                
                if (refreshCountdown <= 0) {
                    clearInterval(countdownInterval);
                    countdownElement.textContent = 'Aggiornamento...';
                }
            }
        }, 1000);
    }
    
    // Funzione per attivare/disattivare l'aggiornamento automatico
    function toggleAutoRefresh() {
        if (autoRefreshEnabled) {
            // Disabilita l'aggiornamento
            pauseAutoRefresh();
            autoRefreshEnabled = false;
            localStorage.setItem('autoRefreshEnabled', 'false');
            countdownElement.style.background = '#FF5722';
            countdownElement.textContent = 'Aggiornamento disabilitato';
            countdownElement.title = "Clicca per riprendere l'aggiornamento automatico";
        } else {
            // Riabilita l'aggiornamento
            autoRefreshEnabled = true;
            localStorage.setItem('autoRefreshEnabled', 'true');
            refreshCountdown = 5;
            startAutoRefresh();
            countdownElement.style.background = '#2196F3';
            countdownElement.title = "Clicca per interrompere l'aggiornamento automatico";
        }
    }
    
    // Rendi la funzione globale
    window.toggleAutoRefresh = toggleAutoRefresh;
    
    // Controlla periodicamente se l'utente sta modificando
    setInterval(checkUserEditing, 100);
    
    // Avvia l'aggiornamento automatico solo se abilitato
    if (autoRefreshEnabled) {
        startAutoRefresh();
    }
  `;
}
exports.generateAutoRefreshScript = generateAutoRefreshScript;
// Funzione per generare il template HTML base
function generateBaseHTML(title, activePage, content, additionalStyles = '', additionalScripts = '') {
    return `
<!DOCTYPE html>
<html lang="it">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>${title}</title>
    ${generateCSSLink()}
    ${additionalStyles ? `<style>${additionalStyles}</style>` : ''}
    <script>
        document.addEventListener('DOMContentLoaded', function() {
            ${generateAutoRefreshScript()}
            ${generatePaginationScript()}
            ${generateStickyHeaderScript()}
            ${additionalScripts}
        });
    </script>
</head>
<body>
    ${generateNavbar(activePage)}
    ${content}
</body>
</html>
  `;
}
exports.generateBaseHTML = generateBaseHTML;
// Funzione per generare la sezione di ricerca comune
function generateSearchSection(searchId, placeholder, clearFunction) {
    return `
    <div class="search-section">
        <input type="text" id="${searchId}" placeholder="${placeholder}" class="search-input">
        <button onclick="${clearFunction}" class="clear-btn">❌</button>
    </div>
  `;
}
exports.generateSearchSection = generateSearchSection;
function disattivaScript(btnid, disattivaFunction) {
    return `
       function ${disattivaFunction}() {
          console.log('Funzione disattiva chiamata per ${btnid}');
          
          fetch('/api/toggle-server', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' }
          })
          .then(response => response.json())
          .then(data => {
            if (data.success) {
              const btn = document.getElementById("${btnid}");
              
              // Usa il valore reale di attivaServer dal server
              if (data.attivaServer) {
                btn.style.backgroundColor = '#4CAF50';
                console.log('Server ATTIVO');
              } else {
                btn.style.backgroundColor = 'red';
                console.log('Server DISATTIVO');
              }
            }
          })
          .catch(error => console.error('Errore:', error));
        }
          window.${disattivaFunction} = ${disattivaFunction};
           
    `;
}
exports.disattivaScript = disattivaScript;
function checkServer(btnid, chekServer) {
    return `
       function ${chekServer}() {
          console.log('Funzione disattiva chiamata per ${btnid}');
          
          fetch('/api/check-server', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' }
          })
          .then(response => response.json())
          .then(data => {
            if (data.success) {
              const btn = document.getElementById("${btnid}");
              
              // Usa il valore reale di attivaServer dal server
              if (data.attivaServer) {
                btn.style.backgroundColor = '#4CAF50';
                console.log('Server ATTIVO');
              } else {
                btn.style.backgroundColor = 'red';
                console.log('Server DISATTIVO');
              }
            }
          })
          .catch(error => console.error('Errore:', error));
        };
            window.${chekServer} = ${chekServer};
          window.${chekServer}();
          
    `;
}
exports.checkServer = checkServer;
// Funzione per generare il JavaScript comune per la ricerca
function generateSearchScript(searchId, clearFunction) {
    return `
    // Funzione per la ricerca AJAX nelle tabelle
    let searchTimeout;
    
    async function filterTable() {
        const searchTerm = document.getElementById('${searchId}').value.toLowerCase();
        
        // Cancella il timeout precedente per evitare troppe chiamate
        if (searchTimeout) {
            clearTimeout(searchTimeout);
        }
        
        // Aspetta 300ms dopo che l'utente smette di digitare
        searchTimeout = setTimeout(async () => {
            try {
                // Determina l'endpoint in base alla pagina corrente
                let endpoint = '';
                const currentPath = window.location.pathname;
                
                if (currentPath.includes('/spending-dashboard') && !currentPath.includes('/spending-dashboard/')) {
                    // Dashboard generale spese - usa endpoint con ricerca
                    endpoint = '/api/spending-stats/search?q=' + encodeURIComponent(searchTerm);
                } else if (currentPath.includes('/tag-owners')) {
                    // Proprietari tag - usa endpoint con ricerca
                    endpoint = '/api/tag-owners/search?q=' + encodeURIComponent(searchTerm);
                } else if (currentPath.includes('/sensor-data')) {
                    // Dati sensori - usa endpoint con ricerca
                    endpoint = '/api/sensor-data/search?q=' + encodeURIComponent(searchTerm);
                } else if (currentPath.includes('/spending-dashboard/')) {
                    // Dashboard specifica UID - usa la ricerca locale
                    filterTableLocal();
                    return;
                }
                
                if (endpoint) {
                    // Chiamata AJAX per ottenere i dati filtrati dal server
                    const response = await fetch(endpoint);
                    const result = await response.json();
                    
                    if (result.success && result.data) {
                        // Aggiorna la tabella con i risultati filtrati
                        updateTableWithFilteredData(result.data, searchTerm, currentPath);
                    } else {
                        // Se non ci sono risultati, mostra messaggio
                        showNoResultsMessage(searchTerm);
                    }
                } else {
                    // Fallback alla ricerca locale per pagine non supportate
                    filterTableLocal();
                }
            } catch (error) {
                console.error('Errore nella ricerca:', error);
                // Fallback alla ricerca locale
                filterTableLocal();
            }
        }, 300);
    }
    
    // Funzione per aggiornare la tabella con i dati filtrati
    function updateTableWithFilteredData(filteredData, searchTerm, currentPath) {
        console.log('updateTableWithFilteredData called with:', { filteredData, searchTerm, currentPath });
        
        const tableBody = document.querySelector('tbody');
        if (!tableBody) {
            console.error('Table body not found');
            return;
        }
        
        // Pulisci la tabella
        tableBody.innerHTML = '';
        
        if (filteredData.length === 0) {
            showNoResultsMessage(searchTerm);
            return;
        }
        
        console.log('Filtered data length:', filteredData.length);
        
        // Determina il tipo di tabella e genera le righe appropriate
        if (currentPath.includes('/spending-dashboard') && !currentPath.includes('/spending-dashboard/')) {
            // Dashboard generale spese
            console.log('Generating spending dashboard rows');
            filteredData.forEach((stat, index) => {
                const row = document.createElement('tr');
                row.innerHTML = generateSpendingDashboardRow(stat);
                tableBody.appendChild(row);
                console.log('Added spending dashboard row', index);
            });
        } else if (currentPath.includes('/tag-owners')) {
            // Proprietari tag - le funzioni restituiscono già l'elemento tr completo
            console.log('Generating tag owner rows');
            filteredData.forEach((owner, index) => {
                const html = generateTagOwnerRow(owner);
                console.log('Generated tag owner HTML:', html);
                tableBody.insertAdjacentHTML('beforeend', html);
                console.log('Added tag owner row', index);
            });
        } else if (currentPath.includes('/sensor-data')) {
            // Dati sensori - le funzioni restituiscono già l'elemento tr completo
            console.log('Generating sensor data rows');
            filteredData.forEach((record, index) => {
                const html = generateSensorDataRow(record);
                console.log('Generated sensor data HTML:', html);
                tableBody.insertAdjacentHTML('beforeend', html);
                console.log('Added sensor data row', index);
            });
        }
        
        console.log('Final table body HTML:', tableBody.innerHTML);
        
        // Evidenzia il termine di ricerca
        highlightSearchTerm(searchTerm);
    }
    
    // Funzione per mostrare messaggio "nessun risultato"
    function showNoResultsMessage(searchTerm) {
        const tableBody = document.querySelector('tbody');
        if (tableBody) {
            const currentPath = window.location.pathname;
            let colspan = 6; // Default
            
            if (currentPath.includes('/tag-owners')) {
                colspan = 7; // Proprietari tag hanno 7 colonne
            } else if (currentPath.includes('/sensor-data')) {
                colspan = 5; // Dati sensori hanno 5 colonne
            } else if (currentPath.includes('/spending-dashboard') && !currentPath.includes('/spending-dashboard/')) {
                colspan = 7; // Dashboard generale spese ha 7 colonne (aggiunta accrediti)
            }
            
            tableBody.innerHTML = '<tr><td colspan="' + colspan + '" class="no-data">Nessun risultato trovato per: <strong>' + searchTerm + '</strong></td></tr>';
        }
    }
    
    // Funzioni helper per generare le righe delle tabelle
    function generateSpendingDashboardRow(stat) {
        // Debug: verifica i dati ricevuti
        console.log('Generating spending dashboard row:', stat);
        
        // Assicurati che il nominativo sia disponibile
        const nominativo = stat.nominativo || '';
        const uidCell = \`
            <div>
                <a href="/spending-dashboard/\${stat.uid}" class="uid-link">\${stat.uid}</a>\${stat.fromBackup ? ' 📊' : ''}
                \${nominativo ? \`<br><small class="nominativo">👤 \${nominativo}</small>\` : ''}
            </div>
        \`;
        
        return \`
            <td>\${uidCell}</td>
            <td>\${stat.creditoAttuale ? stat.creditoAttuale.toFixed(2) + '€' : '0.00€'}\${stat.fromBackup ? ' 📊' : ''}</td>
            <td>\${stat.totalSpent ? stat.totalSpent.toFixed(2) + '€' : '0.00€'}</td>
            <td>\${stat.totalOperations || 0}</td>
            <td>\${stat.averageSpentPerSpending ? stat.averageSpentPerSpending.toFixed(2) + '€' : '0.00€'}</td>
            
            <td>\${stat.totalAccrediti ? stat.totalAccrediti.toFixed(2) + '€' : '0.00€'}</td>
            <td>\${stat.lastOperation || '-'}</td>
        \`;
    }
    
    function generateTagOwnerRow(owner) {
        // Debug: verifica i dati ricevuti
        console.log('Generating tag owner row:', owner);
        
        const isAutoAssigned = owner.nominativo === 'INSERISCI' || owner.indirizzo === 'INSERISCI';
        const statusIcon = isAutoAssigned ? '⚠️ ' : '';
        const nominativoValue = owner.nominativo === 'INSERISCI' ? '' : owner.nominativo;
        const indirizzoValue = owner.indirizzo === 'INSERISCI' ? '' : owner.indirizzo;
        const rowClass = isAutoAssigned ? 'auto-assigned' : '';
        
        const nominativoField = \`<input type="text" class="edit-field" id="nominativo_\${owner.uid}" value="\${nominativoValue}" placeholder="Inserisci nominativo" oninput="checkSaveButton('\${owner.uid}')">\`;
        const indirizzoField = \`<textarea class="edit-field" id="indirizzo_\${owner.uid}" placeholder="Inserisci indirizzo">\${indirizzoValue}</textarea>\`;
        const noteField = \`<textarea class="edit-field" id="note_\${owner.uid}" placeholder="Inserisci note">\${owner.note || ''}</textarea>\`;
        
        const actionButtons = \`
            <div class="action-buttons">
                <button class="save-btn" id="save_\${owner.uid}" onclick="window.saveTagOwner('\${owner.uid}')" \${nominativoValue === '' ? 'disabled' : ''}>💾 Salva</button>
                <button class="delete-btn" onclick="window.deleteTagOwner('\${owner.uid}')">🗑️ Elimina</button>
            </div>
        \`;
        
        return \`
            <tr class="\${rowClass}">
                <td>
                    <div>
                        <a href="/spending-dashboard/\${owner.uid}" class="uid-link">\${statusIcon}\${owner.uid}</a>
                        \${nominativoValue ? \`<br><small class="nominativo">👤 \${nominativoValue}</small>\` : ''}
                    </div>
                </td>
                <td>\${nominativoField}</td>
                <td>\${indirizzoField}</td>
                <td>\${noteField}</td>
                <td>\${owner.created_at || ''}</td>
                <td>\${owner.updated_at || ''}</td>
                <td>\${actionButtons}</td>
            </tr>
        \`;
    }
    
    function generateSensorDataRow(record) {
        // Debug: verifica i dati ricevuti
        console.log('Generating sensor data row:', record);
        
        // Controlla se esiste un proprietario per questo UID
        const nominativo = record.nominativo || '';
        const uidCell = \`
            <div>
                <a href="/spending-dashboard/\${record.uid}" class="uid-link">\${record.uid}</a>
                \${nominativo ? \`<br><small class="nominativo">👤 \${nominativo}</small>\` : ''}
            </div>
        \`;
        
        return \`
            <tr>
                <td>\${uidCell}</td>
                <td>\${record.datetime}</td>
                <td>\${Number(record.credito_precedente).toFixed(2)}€</td>
                <td>\${Number(record.credito_attuale).toFixed(2)}€</td>
                <td><span class="status \${record.status}">\${record.status}</span></td>
            </tr>
        \`;
    }
    
    // Funzione per evidenziare il termine di ricerca
    function highlightSearchTerm(searchTerm) {
        if (!searchTerm) return;
        
        const cells = document.querySelectorAll('td');
        cells.forEach(cell => {
            // Preserva l'HTML esistente e applica l'evidenziazione solo al testo
            const originalHTML = cell.innerHTML;
            
            // Crea un elemento temporaneo per manipolare l'HTML
            const tempDiv = document.createElement('div');
            tempDiv.innerHTML = originalHTML;
            
            // Funzione ricorsiva per evidenziare il testo nei nodi
            function highlightTextInNode(node) {
                if (node.nodeType === Node.TEXT_NODE) {
                    // È un nodo di testo, applica l'evidenziazione
                    const text = node.textContent;
                    const regex = new RegExp('(' + searchTerm + ')', 'gi');
                    if (regex.test(text)) {
                        const highlightedText = text.replace(regex, '<mark>$1</mark>');
                        const span = document.createElement('span');
                        span.innerHTML = highlightedText;
                        
                        // Sostituisci il nodo di testo con il contenuto evidenziato
                        const fragment = document.createDocumentFragment();
                        while (span.firstChild) {
                            fragment.appendChild(span.firstChild);
                        }
                        node.parentNode.replaceChild(fragment, node);
                    }
                } else if (node.nodeType === Node.ELEMENT_NODE) {
                    // È un elemento, processa i suoi figli
                    const children = Array.from(node.childNodes);
                    children.forEach(child => highlightTextInNode(child));
                }
            }
            
            // Applica l'evidenziazione a tutto il contenuto
            highlightTextInNode(tempDiv);
            
            // Aggiorna la cella con l'HTML modificato
            cell.innerHTML = tempDiv.innerHTML;
        });
    }
    
    // Funzione per la ricerca locale (fallback)
    function filterTableLocal() {
        const searchTerm = document.getElementById('${searchId}').value.toLowerCase();
        const tableRows = document.querySelectorAll('tbody tr');
        
        tableRows.forEach(row => {
            const cells = row.querySelectorAll('td');
            let shouldShow = false;
            
            cells.forEach(cell => {
                const cellText = cell.textContent.toLowerCase();
                if (cellText.includes(searchTerm)) {
                    shouldShow = true;
                }
            });
            
            if (shouldShow) {
                row.classList.remove('hidden-row');
            } else {
                row.classList.add('hidden-row');
            }
        });
    }
    
    // Funzione per pulire la ricerca
    function ${clearFunction}() {
        document.getElementById('${searchId}').value = '';
        
        // Ricarica la pagina per mostrare tutti i dati
        window.location.reload();
    }
    
    // Rendi le funzioni globali per essere accessibili dall'HTML
    window.${clearFunction} = ${clearFunction};
    window.filterTable = filterTable;
    
    // Aggiungi event listener per la ricerca in tempo reale
    const searchInput = document.getElementById('${searchId}');
    if (searchInput) {
        searchInput.addEventListener('input', filterTable);
    }
  `;
}
exports.generateSearchScript = generateSearchScript;
function resetDatabaseScript(btnid, resetFunction) {
    return `
       function ${resetFunction}() {
          if (!confirm('⚠️ Sei sicuro di voler azzerare TUTTO il database? Questa operazione è IRREVERSIBILE!')) return;
          const btn = document.getElementById("${btnid}");
          btn.disabled = true;
          btn.textContent = 'Azzero...';
          fetch('/api/reset-db', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' }
          })
          .then(response => response.json())
          .then(data => {
            if (data.success) {
              alert('Database azzerato con successo!');
              location.reload();
            } else {
              alert('Errore: ' + (data.message || 'Impossibile azzerare il database.'));
              btn.disabled = false;
              btn.textContent = 'Azzera Database';
            }
          })
          .catch(error => {
            alert('Errore: ' + error);
            btn.disabled = false;
            btn.textContent = 'Azzera Database';
          });
        }
        window.${resetFunction} = ${resetFunction};
    `;
}
exports.resetDatabaseScript = resetDatabaseScript;

import { Router, Request, Response } from 'express';
import { database } from '../database';
import { generateBaseHTML } from '../helpers';

const router = Router();

// Endpoint per visualizzare tutti i log con paginazione
router.get('/logs', async (req: Request, res: Response) => {
  try {
    const page = parseInt(req.query.page as string) || 1;
    const pageSize = parseInt(req.query.pageSize as string) || 50;
    const userId = req.query.userId as string;
    
    let result;
    if (userId) {
      // Log per utente specifico
      const logs = await database.getLogsByUser(userId, pageSize);
      result = {
        logs,
        total: logs.length,
        page,
        pageSize,
        userId
      };
    } else {
      // Tutti i log
      result = await database.getAllLogs(page, pageSize);
      result.page = page;
      result.pageSize = pageSize;
    }
    
    res.json({
      success: true,
      data: result
    });
  } catch (error) {
    console.error('Errore recupero log:', error);
    res.status(500).json({
      success: false,
      message: 'Errore interno del server'
    });
  }
});

// Endpoint per visualizzare i log come pagina HTML
router.get('/logs-view', async (req: Request, res: Response) => {
  try {
    const page = parseInt(req.query.page as string) || 1;
    const pageSize = parseInt(req.query.pageSize as string) || 50;
    const userId = req.query.userId as string;
    
    let result;
    if (userId) {
      const logs = await database.getLogsByUser(userId, pageSize);
      result = {
        logs,
        total: logs.length,
        page,
        pageSize,
        userId
      };
    } else {
      result = await database.getAllLogs(page, pageSize);
      result.page = page;
      result.pageSize = pageSize;
    }
    
    const html = generateLogsTable(result);
    res.send(html);
  } catch (error) {
    console.error('Errore generazione pagina log:', error);
    res.status(500).send('Errore interno del server');
  }
});

// Endpoint per pulire log vecchi
router.delete('/logs/clean', async (req: Request, res: Response) => {
  try {
    const daysToKeep = parseInt(req.query.days as string) || 30;
    const deletedCount = await database.cleanOldLogs(daysToKeep);
    
    res.json({
      success: true,
      message: `Eliminati ${deletedCount} log vecchi`,
      deletedCount
    });
  } catch (error) {
    console.error('Errore pulizia log:', error);
    res.status(500).json({
      success: false,
      message: 'Errore interno del server'
    });
  }
});

function generateLogsTable(data: any): string {
  const { logs, total, page, pageSize, userId } = data;
  const totalPages = Math.ceil(total / pageSize);
  
  const tableRows = logs.map((log: any) => {
    const date = new Date(log.timestamp);
    const formattedDate = date.toLocaleString('it-IT');
    
    return `
      <tr>
        <td>${log.user_id}</td>
        <td>${log.action}</td>
        <td>${formattedDate}</td>
        <td>${log.ip_address || '-'}</td>
        <td>${log.user_agent ? log.user_agent.substring(0, 50) + '...' : '-'}</td>
        <td>${log.details ? log.details.substring(0, 100) + '...' : '-'}</td>
      </tr>
    `;
  }).join('');
  
  const content = `
    <div class="container">
        <h1>📊 Log Utenti</h1>
        
        <div class="stats-grid">
            <div class="stat-card">
                <div class="stat-value">${total}</div>
                <div class="stat-label">Totale Log</div>
            </div>
            <div class="stat-card">
                <div class="stat-value">${page}</div>
                <div class="stat-label">Pagina ${page} di ${totalPages}</div>
            </div>
            <div class="stat-card">
                <div class="stat-value">${pageSize}</div>
                <div class="stat-label">Log per Pagina</div>
            </div>
            ${userId ? `
            <div class="stat-card">
                <div class="stat-value">👤</div>
                <div class="stat-label">Filtrato: ${userId}</div>
            </div>
            ` : ''}
        </div>
        
        <div class="search-section">
            <input type="text" id="userId" class="search-input" placeholder="🔍 ID Utente" value="${userId || ''}">
            <select id="pageSize" class="search-input" style="width: auto; margin-left: 10px;">
                <option value="25" ${pageSize === 25 ? 'selected' : ''}>25 per pagina</option>
                <option value="50" ${pageSize === 50 ? 'selected' : ''}>50 per pagina</option>
                <option value="100" ${pageSize === 100 ? 'selected' : ''}>100 per pagina</option>
            </select>
            <button onclick="applyFilters()" class="refresh-btn">Applica Filtri</button>
            <button onclick="location.reload()" class="refresh-btn">🔄 Aggiorna</button>
        </div>
        
        <div class="table-container">
            <table>
                <thead>
                    <tr>
                        <th>ID Utente</th>
                        <th>Azione</th>
                        <th>Data/Ora</th>
                        <th>IP</th>
                        <th>User Agent</th>
                        <th>Dettagli</th>
                    </tr>
                </thead>
                <tbody>
                    ${logs.length > 0 ? tableRows : '<tr><td colspan="6" class="no-data">Nessun log trovato</td></tr>'}
                </tbody>
            </table>
        </div>
        
        <div class="pagination">
            ${page > 1 ? `<button onclick="goToPage(${page-1})">← Precedente</button>` : ''}
            ${Array.from({length: Math.min(5, totalPages)}, (_, i) => {
              const pageNum = Math.max(1, Math.min(totalPages - 4, page - 2)) + i;
              return `<button onclick="goToPage(${pageNum})" ${pageNum === page ? 'style="background: linear-gradient(135deg, #007bff 0%, #0056b3 100%);"' : ''}>${pageNum}</button>`;
            }).join('')}
            ${page < totalPages ? `<button onclick="goToPage(${page+1})">Successiva →</button>` : ''}
        </div>
    </div>
    
    <script>
        function applyFilters() {
            const userId = document.getElementById('userId').value;
            const pageSize = document.getElementById('pageSize').value;
            let url = '?page=1&pageSize=' + pageSize;
            if (userId) url += '&userId=' + encodeURIComponent(userId);
            window.location.href = url;
        }
        
        function goToPage(pageNum) {
            const userId = document.getElementById('userId').value;
            const pageSize = document.getElementById('pageSize').value;
            let url = '?page=' + pageNum + '&pageSize=' + pageSize;
            if (userId) url += '&userId=' + encodeURIComponent(userId);
            window.location.href = url;
        }
        
        // Aggiorna automaticamente ogni 30 secondi
        setInterval(function() {
            location.reload();
        }, 30000);
    </script>
  `;

  return generateBaseHTML('Log Utenti', 'logs', content);
}

export default router; 
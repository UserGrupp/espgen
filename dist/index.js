"use strict";
var __awaiter = (this && this.__awaiter) || function (thisArg, _arguments, P, generator) {
    function adopt(value) { return value instanceof P ? value : new P(function (resolve) { resolve(value); }); }
    return new (P || (P = Promise))(function (resolve, reject) {
        function fulfilled(value) { try { step(generator.next(value)); } catch (e) { reject(e); } }
        function rejected(value) { try { step(generator["throw"](value)); } catch (e) { reject(e); } }
        function step(result) { result.done ? resolve(result.value) : adopt(result.value).then(fulfilled, rejected); }
        step((generator = generator.apply(thisArg, _arguments || [])).next());
    });
};
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.attivaServer = void 0;
// Configurazione Scenari di Conservazione Dati
// const SCENARIO = 1;  // Periodo di Conservazione Configurabile
const SCENARIO = 2; // Backup delle Statistiche (attivo)
exports.attivaServer = true;
const fs = require('fs');
const logger_1 = require("./middleware/logger");
const auth_1 = require("./middleware/auth");
const logs_1 = __importDefault(require("./routes/logs"));
const database_1 = require("./database");
const helpers_1 = require("./helpers");
const http = require('http');
const https = require('https');
const express = require('express');
const app = express();
const port = 3000;
const path = require('path');
// Autenticazione per tutte le rotte (inclusi asset statici e homepage)
app.use(auth_1.basicAuth);
app.use(express.static(path.join(__dirname, '../public')));
let test = (process.env.TEST || 'false') == 'true' ? true : false;
let server;
if (test) 
//***** ******************TEST**********************+
{
    const sslOptions = {
        key: fs.readFileSync('key.key'),
        cert: fs.readFileSync('key.crt')
    };
    server = https.createServer(sslOptions, app);
}
//**************************************************
else
    server = http.createServer(app);
//const WebSocket = require('ws')
const PORT = process.env.PORT || 3000;
// Avvio del server HTTP
server.listen(port, "0.0.0.0", () => {
    console.log("Server is running on port " + port);
});
// Gestione errori del server
server.on('error', (error) => {
    console.error('Errore del server:', error);
});
server.on('connection', (socket) => {
    // console.log('Nuova connessione da:', socket.remoteAddress + ':' + socket.remotePort);
    socket.on('error', (error) => {
        console.error('Errore socket:', error);
    });
    socket.on('close', (hadError) => {
        if (hadError) {
            //   console.log('Connessione chiusa con errore da:', socket.remoteAddress + ':' + socket.remotePort);
        }
        else {
            // console.log('Connessione chiusa normalmente da:', socket.remoteAddress + ':' + socket.remotePort);
        }
    });
});
app.use(express.json());
// Middleware per loggare le azioni degli utenti
app.use(logger_1.userLogger);
// Route per i log
app.use('/api', logs_1.default);
/************************************************** */
/****************************************************************** */
app.use(express.urlencoded({ extended: true }));
// Funzione per aggiungere zero iniziale se necessario
function pad(num) {
    return String(num).padStart(2, '0');
}
function formatDataIta(date) {
    let x = date.split('-');
    return pad(x[2]) + "-" + pad(x[1]) + "-" + pad(x[0]);
}
// Funzione per formattare data e ora da SQLite (YYYY-MM-DD HH:MM:SS) a formato italiano (GG-MM-YYYY HH:MM:SS)
function formatDateTimeIta(dateTime) {
    if (!dateTime || dateTime === '-')
        return '-';
    // Separa data e ora
    const [datePart, timePart] = dateTime.split(' ');
    if (!datePart)
        return '-';
    // Formatta la data usando formatDataIta
    const formattedDate = formatDataIta(datePart);
    // Se c'è anche l'ora, aggiungila
    return timePart ? `${formattedDate} ${timePart}` : formattedDate;
}
app.post("/postjson", (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    if (exports.attivaServer) {
        try {
            console.log("Richiesta POST ricevuta su /postjson");
            console.log("Headers:", req.headers);
            console.log("Body completo:", JSON.stringify(req.body, null, 2));
            const { uid, timestamp, datetime, credito_precedente, credito_attuale, status } = req.body;
            // Validazione dei dati ricevuti
            if (!uid || !timestamp || !datetime || credito_precedente === undefined || credito_attuale === undefined || !status) {
                console.error("Dati mancanti o invalidi:", req.body);
                return res.status(400).json({
                    success: false,
                    message: "Dati mancanti o invalidi",
                    required: ["uid", "timestamp", "datetime", "credito_precedente", "credito_attuale", "status"]
                });
            }
            const record = req.body;
            console.log("Dati ricevuti:", {
                uid,
                timestamp,
                datetime,
                credito_precedente,
                credito_attuale,
                status
            });
            // Salva i dati nel file JSON e nel database SQLite
            yield saveRecordToFile(record);
            res.json({
                success: true,
                message: "Dati ricevuti correttamente",
                received: req.body
            });
        }
        catch (error) {
            console.error("Errore nel processing dei dati:", error);
            res.status(500).json({
                success: false,
                message: "Errore interno del server",
                error: error instanceof Error ? error.message : 'Errore sconosciuto'
            });
        }
    }
    else
        res.status(500);
}));
// Funzione per salvare i record in un file JSON e nel database SQLite
function saveRecordToFile(record) {
    return __awaiter(this, void 0, void 0, function* () {
        /*   const dataFile = 'sensor_data.json';
          let records: recor[] = [];
        
          // Leggi i dati esistenti se il file esiste
          if (fs.existsSync(dataFile)) {
            try {
              const fileContent = fs.readFileSync(dataFile, 'utf8');
              records = JSON.parse(fileContent);
            } catch (error) {
              console.error('Errore nella lettura del file:', error);
              records = [];
            }
          }
        
          // Aggiungi il nuovo record
          records.push(record);
        
          // Mantieni solo gli ultimi 100 record per evitare file troppo grandi
          // if (records.length > 100) {
          //   records = records.slice(-100);
          // }
        
          // Salva i dati nel file JSON (mantiene compatibilità)
          try {
            fs.writeFileSync(dataFile, JSON.stringify(records, null, 2));
            console.log('Record salvato nel file:', dataFile);
          } catch (error) {
            console.error('Errore nel salvataggio del file:', error);
          } */
        // Salva anche nel database SQLite
        try {
            yield database_1.database.addSensorRecord(record);
            console.log('Record salvato anche nel database SQLite');
        }
        catch (error) {
            console.error('Errore nel salvataggio nel database:', error);
        }
    });
}
// Endpoint per visualizzare i dati dei sensori in una tabella HTML (dal database SQLite)
app.get('/sensor-data', (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    try {
        const page = parseInt(req.query.page) || 1;
        const limit = parseInt(req.query.limit) || 5;
        const startDate = req.query.startDate;
        const endDate = req.query.endDate;
        let records;
        let total;
        // Se sono specificati i filtri delle date, usa la funzione specifica
        if (startDate && endDate) {
            const filteredRecords = yield database_1.database.getSensorRecordsByDateRange(startDate, endDate);
            records = filteredRecords;
            total = filteredRecords.length;
        }
        else {
            // Altrimenti usa la funzione normale con paginazione
            const result = yield database_1.database.getAllSensorRecords(page, limit);
            records = result.records;
            total = result.total;
        }
        // Ottieni tutti i possessori dei tag per mostrare i nominativi
        const tagOwners = yield database_1.database.getAllTagOwners();
        // Crea una mappa per accesso rapido ai possessori per UID
        const tagOwnersMap = new Map();
        tagOwners.forEach(owner => {
            tagOwnersMap.set(owner.uid, owner);
        });
        // Genera la tabella HTML con i dati dei possessori e paginazione
        const html = generateSensorDataTable(records, tagOwnersMap, {
            page,
            limit,
            total,
            totalPages: Math.ceil(total / limit)
        }, { startDate, endDate });
        res.send(html);
    }
    catch (error) {
        console.error('Errore nel recupero dei dati dal database:', error);
        res.status(500).send('Errore nel recupero dei dati');
    }
}));
// Endpoint per ottenere i dati dei sensori in formato JSON (dal database SQLite)
app.get('/api/sensor-data', (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    try {
        const page = parseInt(req.query.page) || 1;
        const pageSize = parseInt(req.query.pageSize) || 50;
        const result = yield database_1.database.getAllSensorRecords(page, pageSize);
        res.json({
            success: true,
            data: result.records,
            pagination: {
                page,
                pageSize,
                total: result.total,
                totalPages: Math.ceil(result.total / pageSize)
            }
        });
    }
    catch (error) {
        console.error('Errore nel recupero dei dati dal database:', error);
        res.status(500).json({
            success: false,
            message: 'Errore nel recupero dei dati'
        });
    }
}));
// Endpoint per ottenere un record specifico per UID (ultima operazione)
app.get('/api/sensor-data/uid/:uid', (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    try {
        const uid = req.params.uid;
        const record = yield database_1.database.getSensorRecordByUID(uid);
        if (!record) {
            return res.status(404).json({
                success: false,
                message: 'Record non trovato'
            });
        }
        res.json({
            success: true,
            data: record
        });
    }
    catch (error) {
        console.error('Errore nel recupero del record per UID:', error);
        res.status(500).json({
            success: false,
            message: 'Errore nel recupero del record'
        });
    }
}));
// Endpoint per ottenere tutte le operazioni di un UID specifico
app.get('/api/sensor-data/uid/:uid/history', (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    try {
        const uid = req.params.uid;
        const limit = parseInt(req.query.limit) || 100;
        const records = yield database_1.database.getSensorRecordsByUID(uid, limit);
        if (records.length === 0) {
            return res.status(404).json({
                success: false,
                message: 'Nessuna operazione trovata per questo UID'
            });
        }
        res.json({
            success: true,
            data: records,
            count: records.length,
            uid: uid
        });
    }
    catch (error) {
        console.error('Errore nel recupero dello storico per UID:', error);
        res.status(500).json({
            success: false,
            message: 'Errore nel recupero dello storico'
        });
    }
}));
// Endpoint per pulire i dati vecchi dei sensori
app.delete('/api/sensor-data/cleanup', (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    try {
        const daysToKeep = parseInt(req.query.days) || 30;
        const deletedCount = yield database_1.database.cleanOldSensorRecords(daysToKeep);
        res.json({
            success: true,
            message: `Puliti ${deletedCount} record più vecchi di ${daysToKeep} giorni`,
            deletedCount
        });
    }
    catch (error) {
        console.error('Errore nella pulizia dei dati:', error);
        res.status(500).json({
            success: false,
            message: 'Errore nella pulizia dei dati'
        });
    }
}));
// Funzione per generare la tabella HTML dei dati dei sensori
function generateSensorDataTable(records, tagOwnersMap, pagination, filters) {
    const tableRows = records.map(record => {
        var _a;
        const nominativo = ((_a = tagOwnersMap === null || tagOwnersMap === void 0 ? void 0 : tagOwnersMap.get(record.uid)) === null || _a === void 0 ? void 0 : _a.nominativo) || '';
        const uidCell = `
        <div>
            <a href="/spending-dashboard/${record.uid}" class="uid-link">${record.uid}</a>
            ${nominativo ? `<br><small class="nominativo">👤 ${nominativo}</small>` : ''}
        </div>
    `;
        return `
        <tr>
            <td>${uidCell}</td>
            <td>${record.datetime}</td>
            <td>${Number(record.credito_precedente).toFixed(2)}€</td>
            <td>${Number(record.credito_attuale).toFixed(2)}€</td>
            <td><span class="status ${record.status}">${record.status}</span></td>
        </tr>
    `;
    }).join('');
    // Stili aggiuntivi specifici per questa pagina (solo quelli non presenti nel CSS comune)
    const additionalStyles = "";
    //  `
    //   .filter-info {
    //     background: #e3f2fd;
    //     border: 1px solid #2196f3;
    //     border-radius: 6px;
    //     padding: 15px;
    //     margin: 20px 0;
    //     text-align: center;
    //   }
    //   .filter-info p {
    //     margin: 5px 0;
    //     color: #1976d2;
    //   }
    //   .filter-info p:first-child {
    //     font-weight: bold;
    //     font-size: 16px;
    //   }
    // `;
    // Script aggiuntivi specifici per questa pagina
    const additionalScripts = `
    ${(0, helpers_1.generateSearchScript)('searchInput', 'clearSearch')}
    ${(0, helpers_1.generateDateRangeScript)('startDate', 'endDate', 'applyDateFilter')}
    ${(0, helpers_1.disattivaScript)('btn-a', 'disattiva')}
    ${(0, helpers_1.checkServer)('btn-a', 'checkServer')}
    ${(0, helpers_1.resetDatabaseScript)('btn-reset-db', 'resetDatabase')}
    
  `;
    // Contenuto della pagina
    const content = `
    ${(0, helpers_1.generatePagination)(pagination)}
    <div class="container">
        <h1>📊 Raccolta Dati</h1>
        
        <!-- Controlli per il filtro delle date -->
       
      <!--  ${(0, helpers_1.generateSearchSectionWithDateFilter)('searchInput', '🔍 Cerca per UID o nominativo possessore...', 'clearSearch', 'startDate', 'endDate', 'applyDateFilter')} -->
        <button id='btn-a' class="server-btn" onclick="disattiva()"> Disattiva/Attiva</button>
        <button id='btn-reset-db' class="danger-btn" onclick="resetDatabase()">🗑️ Azzera Database</button>
          ${(0, helpers_1.generateDateRangeControls)('startDate', 'endDate', 'applyDateFilter', (0, helpers_1.generateDateFilterIndicator)(filters === null || filters === void 0 ? void 0 : filters.startDate, filters === null || filters === void 0 ? void 0 : filters.endDate))}
       <!--   ${(filters === null || filters === void 0 ? void 0 : filters.startDate) && (filters === null || filters === void 0 ? void 0 : filters.endDate) ? `
          <div class="filter-info">
            <p>📅 Filtro Date Applicato</p>
            <p>Periodo: Dal ${filters.startDate} al ${filters.endDate}</p>
            <p><em>I dati mostrati si riferiscono solo a questo intervallo temporale</em></p>
          </div>
        ` : ''} -->
            ${(0, helpers_1.generateSearchSection)('searchOperations', '🔍 Cerca per UID o nominativo possessore...', 'clearOperationsSearch()')}
       
        <div class="table-container">
            <table>
                <thead>
                    <tr>
                        <th>UID</th>
                        <th>Data/Ora</th>
                        <th>Credito Precedente</th>
                        <th>Credito Attuale</th>
                        <th>Stato</th>
                    </tr>
                </thead>
                <tbody>
                    ${records.length > 0 ? tableRows : '<tr><td colspan="5" class="no-data">Nessun dato disponibile</td></tr>'}
                </tbody>
            </table>
        </div>
    </div>
  `;
    return (0, helpers_1.generateBaseHTML)('Dati Sensori', 'sensor-data', content, additionalStyles, additionalScripts);
}
// Endpoint per ottenere tutti i possessori dei tag
app.get('/api/tag-owners', (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    try {
        const page = parseInt(req.query.page) || 1;
        const pageSize = parseInt(req.query.pageSize) || 10;
        const allTagOwners = yield database_1.database.getAllTagOwners();
        const total = allTagOwners.length;
        const totalPages = Math.ceil(total / pageSize) || 1;
        const startIndex = (page - 1) * pageSize;
        const endIndex = startIndex + pageSize;
        const tagOwners = allTagOwners.slice(startIndex, endIndex);
        res.json({
            success: true,
            data: tagOwners,
            pagination: {
                page,
                pageSize,
                total,
                totalPages
            }
        });
    }
    catch (error) {
        console.error('Errore nel recupero dei possessori dei tag:', error);
        res.status(500).json({
            success: false,
            message: 'Errore nel recupero dei possessori dei tag'
        });
    }
}));
// Endpoint per ottenere un possessore specifico per UID
app.get('/api/tag-owners/:uid', (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    try {
        const uid = req.params.uid;
        const tagOwner = yield database_1.database.getTagOwnerByUID(uid);
        if (!tagOwner) {
            return res.status(404).json({
                success: false,
                message: 'possessore non trovato'
            });
        }
        res.json({
            success: true,
            data: tagOwner
        });
    }
    catch (error) {
        console.error('Errore nel recupero del possessore:', error);
        res.status(500).json({
            success: false,
            message: 'Errore nel recupero del possessore'
        });
    }
}));
// Endpoint per cercare possessori per nominativo
app.get('/api/tag-owners/search/:nominativo', (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    try {
        const nominativo = req.params.nominativo;
        const tagOwners = yield database_1.database.searchTagOwnersByNominativo(nominativo);
        res.json({
            success: true,
            data: tagOwners,
            count: tagOwners.length
        });
    }
    catch (error) {
        console.error('Errore nella ricerca dei possessori:', error);
        res.status(500).json({
            success: false,
            message: 'Errore nella ricerca dei possessori'
        });
    }
}));
// Endpoint per aggiungere/aggiornare un possessore
app.post('/api/tag-owners', (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    try {
        const { uid, nominativo, indirizzo, note, created_at } = req.body;
        // Validazione dei dati
        if (!uid || !nominativo || !indirizzo) {
            return res.status(400).json({
                success: false,
                message: 'Dati mancanti',
                required: ['uid', 'nominativo', 'indirizzo']
            });
        }
        const tagOwner = {
            uid,
            nominativo,
            indirizzo,
            note: note || undefined,
            created_at
        };
        yield database_1.database.addTagOwner(tagOwner);
        res.json({
            success: true,
            message: 'possessore salvato con successo',
            data: tagOwner
        });
    }
    catch (error) {
        console.error('Errore nel salvataggio del possessore:', error);
        res.status(500).json({
            success: false,
            message: 'Errore nel salvataggio del possessore'
        });
    }
}));
// Endpoint per eliminare un possessore
app.delete('/api/tag-owners/:uid', (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    try {
        const uid = req.params.uid;
        const deleted = yield database_1.database.deleteTagOwner(uid);
        if (!deleted) {
            return res.status(404).json({
                success: false,
                message: 'possessore non trovato'
            });
        }
        res.json({
            success: true,
            message: 'possessore eliminato con successo'
        });
    }
    catch (error) {
        console.error('Errore nell\'eliminazione del possessore:', error);
        res.status(500).json({
            success: false,
            message: 'Errore nell\'eliminazione del possessore'
        });
    }
}));
// Endpoint per visualizzare i possessori dei tag in formato HTML
app.get('/tag-owners', (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    try {
        const page = parseInt(req.query.page) || 1;
        const limit = parseInt(req.query.limit) || 10;
        // Ottieni tutti i possessori dei tag
        const allTagOwners = yield database_1.database.getAllTagOwners();
        // Calcola la paginazione
        const total = allTagOwners.length;
        const totalPages = Math.ceil(total / limit);
        const startIndex = (page - 1) * limit;
        const endIndex = startIndex + limit;
        // Estrai solo i record per la pagina corrente
        const tagOwners = allTagOwners.slice(startIndex, endIndex);
        const html = generateTagOwnersTable(tagOwners, {
            page,
            limit,
            total,
            totalPages
        });
        res.send(html);
    }
    catch (error) {
        console.error('Errore nel recupero dei possessori dei tag:', error);
        res.status(500).send('Errore nel recupero dei dati');
    }
}));
// === ENDPOINT PER LA DASHBOARD SPESE ===
// Endpoint per ottenere la spesa totale di un UID specifico
app.get('/api/spending/:uid', (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    try {
        const { uid } = req.params;
        const spendingData = yield database_1.database.getTotalSpendingByUID(uid);
        res.json({
            success: true,
            data: spendingData
        });
    }
    catch (error) {
        console.error('Errore nel calcolo della spesa per UID:', error);
        res.status(500).json({
            success: false,
            message: 'Errore nel calcolo della spesa'
        });
    }
}));
// Endpoint per ottenere le statistiche di spesa di tutti gli UID
app.get('/api/spending-stats', (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    try {
        const page = parseInt(req.query.page) || 1;
        const pageSize = parseInt(req.query.pageSize) || 10;
        const stats = yield database_1.database.getAllSpendingStats();
        // Enrich con nominativo per coerenza con le viste
        const tagOwners = yield database_1.database.getAllTagOwners();
        const tagOwnersMap = new Map();
        tagOwners.forEach(owner => tagOwnersMap.set(owner.uid, owner));
        const enriched = stats.map(s => {
            var _a;
            return (Object.assign(Object.assign({}, s), { nominativo: ((_a = tagOwnersMap.get(s.uid)) === null || _a === void 0 ? void 0 : _a.nominativo) || null }));
        });
        const total = enriched.length;
        const totalPages = Math.ceil(total / pageSize) || 1;
        const startIndex = (page - 1) * pageSize;
        const endIndex = startIndex + pageSize;
        const paginated = enriched.slice(startIndex, endIndex);
        res.json({
            success: true,
            data: paginated,
            pagination: {
                page,
                pageSize,
                total,
                totalPages
            }
        });
    }
    catch (error) {
        console.error('Errore nel recupero delle statistiche di spesa:', error);
        res.status(500).json({
            success: false,
            message: 'Errore nel recupero delle statistiche'
        });
    }
}));
// Endpoint per cercare nelle statistiche di spesa
app.get('/api/spending-stats/search', (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    try {
        const searchTerm = req.query.q;
        if (!searchTerm) {
            return res.json({
                success: true,
                data: []
            });
        }
        const stats = yield database_1.database.getAllSpendingStats();
        // Ottieni tutti i possessori dei tag per mostrare i nominativi
        const tagOwners = yield database_1.database.getAllTagOwners();
        const tagOwnersMap = new Map();
        tagOwners.forEach(owner => {
            tagOwnersMap.set(owner.uid, owner);
        });
        // Filtra i risultati
        const filteredStats = stats.filter(stat => {
            const tagOwner = tagOwnersMap.get(stat.uid);
            const searchFields = [
                stat.uid,
                (tagOwner === null || tagOwner === void 0 ? void 0 : tagOwner.nominativo) || '',
                (tagOwner === null || tagOwner === void 0 ? void 0 : tagOwner.indirizzo) || '',
                stat.totalSpent.toString(),
                stat.totalOperations.toString(),
                stat.lastOperation
            ];
            return searchFields.some(field => field.toLowerCase().includes(searchTerm.toLowerCase()));
        });
        // Aggiungi i nominativi ai risultati filtrati
        const enrichedStats = filteredStats.map(stat => {
            var _a;
            return (Object.assign(Object.assign({}, stat), { nominativo: ((_a = tagOwnersMap.get(stat.uid)) === null || _a === void 0 ? void 0 : _a.nominativo) || null }));
        });
        res.json({
            success: true,
            data: enrichedStats
        });
    }
    catch (error) {
        console.error('Errore nella ricerca delle statistiche di spesa:', error);
        res.status(500).json({
            success: false,
            message: 'Errore nella ricerca'
        });
    }
}));
// Endpoint per visualizzare la dashboard di spesa di un UID specifico
app.get('/spending-dashboard/:uid', (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    try {
        const { uid } = req.params;
        const page = parseInt(req.query.page) || 1;
        const limit = parseInt(req.query.limit) || 10;
        const startDate = req.query.startDate;
        const endDate = req.query.endDate;
        let spendingData;
        let monthlyStats;
        // Se sono specificati i filtri delle date, usa la funzione specifica
        if (startDate && endDate) {
            spendingData = yield database_1.database.getTotalSpendingByUIDAndDateRange(uid, startDate, endDate);
            monthlyStats = yield database_1.database.getMonthlyStatsByUIDAndDateRange(uid, startDate, endDate);
        }
        else {
            // Altrimenti usa la funzione normale
            spendingData = yield database_1.database.getTotalSpendingByUID(uid);
            monthlyStats = yield database_1.database.getMonthlyStatsByUID(uid);
        }
        // Calcola la paginazione per le operazioni
        const total = spendingData.operations.length;
        const totalPages = Math.ceil(total / limit);
        const startIndex = (page - 1) * limit;
        const endIndex = startIndex + limit;
        // Estrai solo le operazioni per la pagina corrente
        const paginatedOperations = spendingData.operations.slice(startIndex, endIndex);
        // Crea una copia dei dati con le operazioni paginate
        const paginatedSpendingData = Object.assign(Object.assign({}, spendingData), { operations: paginatedOperations, monthlyStats // aggiunto per la tabella mensile
         });
        const html = generateSpendingDashboard(paginatedSpendingData, {
            page,
            limit,
            total,
            totalPages
        }, { startDate, endDate });
        res.send(html);
    }
    catch (error) {
        console.error('Errore nella generazione della dashboard:', error);
        res.status(500).send('Errore nella generazione della dashboard');
    }
}));
// Endpoint per visualizzare la dashboard generale delle spese
app.get('/spending-dashboard', (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    try {
        const page = parseInt(req.query.page) || 1;
        const limit = parseInt(req.query.limit) || 10;
        const startDate = req.query.startDate;
        const endDate = req.query.endDate;
        let stats;
        // Se sono specificati i filtri delle date, usa la funzione specifica
        if (startDate && endDate) {
            stats = yield database_1.database.getSpendingStatsByDateRange(startDate, endDate);
        }
        else {
            // Altrimenti usa la funzione normale
            stats = yield database_1.database.getAllSpendingStats();
        }
        // Ottieni tutti i possessori dei tag per mostrare i nominativi
        const tagOwners = yield database_1.database.getAllTagOwners();
        // Crea una mappa per accesso rapido ai possessori per UID
        const tagOwnersMap = new Map();
        tagOwners.forEach(owner => {
            tagOwnersMap.set(owner.uid, owner);
        });
        // Calcola i totali GLOBALI (indipendenti dalla paginazione)
        const globalTotalSpent = stats.reduce((sum, stat) => sum + stat.totalSpent, 0);
        const globalTotalOperations = stats.reduce((sum, stat) => sum + stat.totalOperations, 0);
        const globalTotalSpendingOperations = stats.reduce((sum, stat) => sum + stat.spendingOperations, 0);
        const globalTotalAccrediti = stats.reduce((sum, stat) => sum + stat.totalAccrediti, 0);
        // Calcola la paginazione
        const total = stats.length;
        const totalPages = Math.ceil(total / limit);
        const startIndex = (page - 1) * limit;
        const endIndex = startIndex + limit;
        // Estrai solo i record per la pagina corrente
        const paginatedStats = stats.slice(startIndex, endIndex);
        const html = generateGeneralSpendingDashboard(paginatedStats, tagOwnersMap, {
            page,
            limit,
            total,
            totalPages
        }, {
            totalSpent: globalTotalSpent,
            totalOperations: globalTotalOperations,
            totalSpendingOperations: globalTotalSpendingOperations,
            totalAccrediti: globalTotalAccrediti
        }, { startDate, endDate });
        res.send(html);
    }
    catch (error) {
        console.error('Errore nella generazione della dashboard generale:', error);
        res.status(500).send('Errore nella generazione della dashboard generale');
    }
}));
// Funzione per generare la tabella HTML dei possessori dei tag
// Funzione per generare la dashboard di spesa per un UID specifico
function generateSpendingDashboard(spendingData, pagination, filters) {
    const operationsRows = spendingData.operations.map(op => {
        return `
      <tr>
        <td>${op.datetime}</td>
        <td>${Number(op.credito_precedente).toFixed(2)}€</td>
        <td>${Number(op.credito_attuale).toFixed(2)}€</td>
        <td><span class="spesa">${op.spesa.toFixed(2)}€</span></td>
        <td><span class="status ${op.status}">${op.status}</span></td>
      </tr>
    `;
    }).join('');
    // Tabella riepilogo mensile
    const monthlyRows = (spendingData.monthlyStats || []).map(row => `
    <tr>
      <td>${row.yearMonth}</td>
      <td>${row.totalOperations}</td>
      <td>${row.totalSpendingOperations}</td>
      <td>${row.totalSpent.toFixed(2)}€</td>
      <td>${row.totalAccrediti.toFixed(2)}€</td>
    </tr>
  `).join('');
    // Stili aggiuntivi specifici per questa pagina (solo quelli non presenti nel CSS comune)
    const additionalStyles = ``;
    // Script aggiuntivi specifici per questa pagina
    const additionalScripts = `
    ${(0, helpers_1.generateSearchScript)('searchOperations', 'clearOperationsSearch')}
    ${(0, helpers_1.generateDateRangeScript)('startDate', 'endDate', 'applyDateFilter')}
  `;
    // Contenuto della pagina
    const content = `
    ${(0, helpers_1.generatePagination)(pagination)}
    <div class="container">
        <h1>💰 Dashboard Spese - UID: ${spendingData.uid}</h1>
        
        <!-- Controlli per il filtro delle date -->
        ${(0, helpers_1.generateDateRangeControls)('startDate', 'endDate', 'applyDateFilter', (0, helpers_1.generateDateFilterIndicator)(filters === null || filters === void 0 ? void 0 : filters.startDate, filters === null || filters === void 0 ? void 0 : filters.endDate))}
        ${spendingData.fromBackup ? '<div class="backup-notice">📊 Dati completati con backup delle statistiche</div>' : ''}
        
        ${spendingData.tagOwner ? `
        <div class="tag-owner-info">
            <h2>👤 Possessore Tag</h2>
            <div class="owner-details">
                <p><strong>Nominativo:</strong> ${spendingData.tagOwner.nominativo}</p>
                <p><strong>Indirizzo:</strong> ${spendingData.tagOwner.indirizzo}</p>
                ${spendingData.tagOwner.note ? `<p><strong>Note:</strong> ${spendingData.tagOwner.note}</p>` : ''}
                <p><strong>Assegnato il:</strong> ${formatDateTimeIta(spendingData.tagOwner.created_at || '')}</p>
            </div>
        </div>
        ` : ''}
        <div class="stats-grid">
           <div class="stat-card">
                <div class="stat-value">${Number(spendingData.lastOperation ? (spendingData.lastOperation.credito_attuale) : 0).toFixed(2)}€</div>
                <div class="stat-label">Credito Attuale</div>
            </div>
             <div class="stat-card">
                 <div class="stat-value">${spendingData.totalSpent.toFixed(2)}€</div>
                 <div class="stat-label">Spesa Totale</div>
             </div>
             
        <div class="stat-card">
            <div class="stat-value">${spendingData.averageSpentPerSpending.toFixed(2)}€</div>
            <div class="stat-label">Spesa Media</div>
        </div>

             <div class="stat-card">
                 <div class="stat-value">${spendingData.totalOperations}</div>
                 <div class="stat-label">Operazioni Totali</div>
             </div>
                     <div class="stat-card">
            <div class="stat-value">${spendingData.spendingOperations}</div>
            <div class="stat-label">Operazioni di Spesa</div>
        </div>
       
            <div class="stat-card">
                <div class="stat-value">${spendingData.firstOperation ? spendingData.firstOperation.datetime : 'N/A'}</div>
                <div class="stat-label">Prima Operazione</div>
            </div>
            <div class="stat-card">
                <div class="stat-value">${spendingData.lastOperation ? spendingData.lastOperation.datetime : 'N/A'}</div>
                <div class="stat-label">Ultima Operazione</div>
            </div>
         
        </div>
        <h2 class="section-title">📅 Riepilogo Mensile</h2>
        <div class="table-container">
          <table>
            <thead>
              <tr>
                <th>Mese</th>
                <th>Operazioni Totali</th>
                <th>Operazioni di Spesa</th>
                <th>Spesa Totale</th>
                <th>Accrediti Totali</th>
              </tr>
            </thead>
            <tbody>
              ${monthlyRows || '<tr><td colspan="5">Nessun dato mensile disponibile</td></tr>'}
            </tbody>
          </table>
        </div>
        <h2 class="section-title">📊 Dettaglio Operazioni</h2>
        ${(0, helpers_1.generateSearchSection)('searchOperations', '🔍 Cerca nelle operazioni...', 'clearOperationsSearch()')}
        <div class="table-container">
            <table>
                <thead>
                    <tr>
                        <th>Data/Ora ESP32</th>
                        <th>Credito Precedente</th>
                        <th>Credito Attuale</th>
                        <th>Valore Operaz.</th>
                        <th>Operazione</th>
                    </tr>
                </thead>
                <tbody>
                    ${spendingData.operations.length > 0 ? operationsRows : '<tr><td colspan="5" class="no-data">Nessuna operazione disponibile</td></tr>'}
                </tbody>
            </table>
        </div>
    </div>
  `;
    return (0, helpers_1.generateBaseHTML)(`Dashboard Spese - UID ${spendingData.uid}`, 'spending-dashboard', content, additionalStyles, additionalScripts);
}
// Funzione per generare la dashboard generale delle spese
function generateGeneralSpendingDashboard(stats, tagOwnersMap, pagination, globalTotals, filters) {
    const tableRows = stats.map(stat => {
        // Controlla se esiste un possessore per questo UID
        const tagOwner = tagOwnersMap === null || tagOwnersMap === void 0 ? void 0 : tagOwnersMap.get(stat.uid);
        const nominativo = tagOwner ? tagOwner.nominativo : null;
        // Genera il contenuto della cella UID con link e nominativo
        const uidCell = `
        <div>
            <a href="/spending-dashboard/${stat.uid}" class="uid-link">${stat.uid}</a>${stat.fromBackup ? ' 📊' : ''}
            ${nominativo ? `<br><small class="nominativo">👤 ${nominativo}</small>` : ''}
        </div>
    `;
        return `
      <tr>
        <td>${uidCell}</td>
        <td>${stat.creditoAttuale.toFixed(2)}€${stat.fromBackup ? ' 📊' : ''}</td>
        <td>${stat.totalSpent.toFixed(2)}€</td>
        <td>${stat.totalOperations}</td>
                    <td>${stat.averageSpentPerSpending.toFixed(2)}€</td>
        <td>${stat.totalAccrediti.toFixed(2)}€</td>
        <td>${stat.lastOperation}</td>
      </tr>
    `;
    }).join('');
    const totalSpent = globalTotals ? globalTotals.totalSpent : stats.reduce((sum, stat) => sum + stat.totalSpent, 0);
    const totalOperations = globalTotals ? globalTotals.totalOperations : stats.reduce((sum, stat) => sum + stat.totalOperations, 0);
    const totalSpendingOperations = globalTotals ? globalTotals.totalSpendingOperations : stats.reduce((sum, stat) => sum + stat.spendingOperations, 0);
    const totalAccrediti = globalTotals ? globalTotals.totalAccrediti : stats.reduce((sum, stat) => sum + stat.totalAccrediti, 0);
    // Stili aggiuntivi specifici per questa pagina
    const additionalStyles = "";
    //  `
    //   .filter-info {
    //     background: #e3f2fd;
    //     border: 1px solid #2196f3;
    //     border-radius: 6px;
    //     padding: 15px;
    //     margin: 20px 0;
    //     text-align: center;
    //   }
    //   .filter-info p {
    //     margin: 5px 0;
    //     color: #1976d2;
    //   }
    //   .filter-info p:first-child {
    //     font-weight: bold;
    //     font-size: 16px;
    //   }
    // `;
    // Script aggiuntivi specifici per questa pagina
    const additionalScripts = `
    ${(0, helpers_1.generateSearchScript)('searchOperations', 'clearOperationsSearch')}
    ${(0, helpers_1.generateDateRangeScript)('startDate', 'endDate', 'applyDateFilter')}
    
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
    // Contenuto della pagina
    const content = `
    ${(0, helpers_1.generatePagination)(pagination)}
    <div class="container">
        <h1>💰 Dashboard Generale Spese</h1>
        
        
        
        <div class="stats-grid">
            <div class="stat-card">
                <div class="stat-value">${pagination ? pagination.total : stats.length}</div>
                <div class="stat-label">UID Attivi</div>
            </div>
            
            <div class="stat-card">
                <div class="stat-value">${totalAccrediti.toFixed(2)}€</div>
                <div class="stat-label">Accrediti Totali</div>
            </div>

            <div class="stat-card">
                <div class="stat-value">${totalSpent.toFixed(2)}€</div>
                <div class="stat-label">Spesa Totale</div>
            </div>
          
            <div class="stat-card">
                <div class="stat-value">${totalOperations}</div>
                <div class="stat-label">Operazioni Totali</div>
            </div>
            <div class="stat-card">
                <div class="stat-value">${totalSpendingOperations}</div>
                <div class="stat-label">Operazioni di Spesa</div>
            </div>
            <div class="stat-card">
                <div class="stat-value">${totalSpendingOperations > 0 ? (totalSpent / totalSpendingOperations).toFixed(2) : '0.00'}€</div>
                <div class="stat-label">Spesa Media</div>
            </div>
        </div>

        <h2 class="section-title">📊 Riepilogo per UID</h2>
        <p class="backup-info">
          📊 = Dati provenienti da backup (record operativi cancellati)
        </p>
        <!-- Controlli per il filtro delle date -->
        ${(0, helpers_1.generateDateRangeControls)('startDate', 'endDate', 'applyDateFilter', (0, helpers_1.generateDateFilterIndicator)(filters === null || filters === void 0 ? void 0 : filters.startDate, filters === null || filters === void 0 ? void 0 : filters.endDate))}
        
       <!-- ${(filters === null || filters === void 0 ? void 0 : filters.startDate) && (filters === null || filters === void 0 ? void 0 : filters.endDate) ? `
          <div class="filter-info">
            <p>📅 Filtro Date Applicato</p>
            <p>Periodo: Dal ${filters.startDate} al ${filters.endDate}</p>
            <p><em>I dati mostrati si riferiscono solo a questo intervallo temporale</em></p>
          </div>
        ` : ''} -->
        ${(0, helpers_1.generateSearchSection)('searchOperations', '🔍 Cerca per UID o nominativo possessore...', 'clearOperationsSearch()')}
        
        <div class="table-container">
            <table>
                <thead>
                    <tr>
                        <th>UID</th>
                        <th>Credito Attuale</th>
                        <th>Spesa Totale</th>
                        <th>Operazioni</th>
                        <th>Spesa media</th>
                        <th>Accrediti Totali</th>
                        <th>Ultima Operazione</th>
                    </tr>
                </thead>
                <tbody>
                    ${stats.length > 0 ? tableRows : '<tr><td colspan="7" class="no-data">Nessun dato disponibile</td></tr>'}
                </tbody>
            </table>
        </div>
    </div>
  `;
    return (0, helpers_1.generateBaseHTML)('Dashboard Generale Spese', 'spending-dashboard', content, additionalStyles, additionalScripts);
}
function generateTagOwnersTable(tagOwners, pagination) {
    const tableRows = tagOwners.map(tagOwner => {
        // Controlla se il tag è stato assegnato automaticamente ma non ancora configurato
        const isAutoAssigned = tagOwner.nominativo === 'INSERISCI' || tagOwner.indirizzo === 'INSERISCI';
        const rowClass = isAutoAssigned ? 'auto-assigned' : '';
        const statusIcon = isAutoAssigned ? '⚠️ ' : '';
        // Genera input fields per tutti i campi editabili - rimuovi "INSERISCI" e lascia vuoti
        const nominativoValue = tagOwner.nominativo === 'INSERISCI' ? '' : tagOwner.nominativo;
        const indirizzoValue = tagOwner.indirizzo === 'INSERISCI' ? '' : tagOwner.indirizzo;
        const nominativoField = `<input type="text" class="edit-field" id="nominativo_${tagOwner.uid}" value="${nominativoValue}" placeholder="Inserisci nominativo" oninput="checkSaveButton('${tagOwner.uid}')">`;
        const indirizzoField = `<textarea class="edit-field" id="indirizzo_${tagOwner.uid}" placeholder="Inserisci indirizzo">${indirizzoValue}</textarea>`;
        const noteField = `<textarea class="edit-field" id="note_${tagOwner.uid}" placeholder="Inserisci note">${tagOwner.note || ''}</textarea>`;
        const created_at = `${tagOwner.created_at};`;
        const create_atField = `<input type="hidden" id="created_at_${tagOwner.uid}" value="${tagOwner.created_at}">`;
        // Pulsanti di azione con migliore posizionamento
        const actionButtons = `
      <div class="action-buttons">
        <button class="save-btn" id="save_${tagOwner.uid}" onclick="window.saveTagOwner('${tagOwner.uid}')" ${nominativoValue === '' ? 'disabled' : ''}>💾 Salva</button>
        <button class="delete-btn" onclick="window.deleteTagOwner('${tagOwner.uid}')">🗑️ Elimina</button>
      </div>
    `;
        return `
    
    ${create_atField}
    
      <tr class="${rowClass}">
        <td>
          <div>
            <a href="/spending-dashboard/${tagOwner.uid}" class="uid-link">${statusIcon}${tagOwner.uid}</a>
            ${nominativoValue ? `<br><small class="nominativo">👤 ${nominativoValue}</small>` : ''}
          
            </div>
        </td>
        <td>${nominativoField}</td>
        <td>${indirizzoField}</td>
        <td>${noteField}</td>
        <td>${formatDateTimeIta(tagOwner.created_at || '')}</td>
        <td>${formatDateTimeIta(tagOwner.updated_at || '')}</td>
        <td>${actionButtons}</td>
      </tr>
    `;
    }).join('');
    // Stili aggiuntivi specifici per questa pagina
    const additionalStyles = ``;
    // Script aggiuntivi specifici per questa pagina
    const additionalScripts = `
    ${(0, helpers_1.generateSearchScript)('searchOperations', 'clearOperationsSearch')}
    
    window.saveTagOwner = async function(uid) {
        const nominativo = document.getElementById('nominativo_' + uid).value.trim();
        const indirizzo = document.getElementById('indirizzo_' + uid).value.trim();
        const note = document.getElementById('note_' + uid).value.trim();
        const created_at = document.getElementById('created_at_' + uid).value.trim();
        // Validazione
        if (!nominativo) {
            window.showStatus('Inserisci un nominativo valido', 'error');
            return;
        }
        
        if (!indirizzo) {
            window.showStatus('Inserisci un indirizzo valido', 'error');
            return;
        }
        
        try {
            const response = await fetch('/api/tag-owners', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify({
                    uid: uid,
                    nominativo: nominativo,
                    indirizzo: indirizzo,
                    note: note,
                    created_at
                })
            });
            
            const result = await response.json();
            
            if (result.success) {
                window.showStatus('Tag possessore aggiornato con successo!', 'success');
                // Ricarica la pagina dopo 2 secondi per mostrare i dati aggiornati
                setTimeout(() => {
                    location.reload();
                }, 2000);
            } else {
                window.showStatus("Errore durante il salvataggio: " + result.message, 'error');
                 const nominativo = document.getElementById('nominativo_' + uid);
                nominativo.value="";
               
            }
        } catch (error) {
            window.showStatus("Errore di connessione: " + error.message, 'error');
        }
    }
    
    window.showStatus = function(message, type) {
        const statusDiv = document.getElementById('statusMessage');
        statusDiv.innerHTML = '<div class="status-message status-' + type + '">' + message + '</div>';
        
        setTimeout(() => {
            statusDiv.innerHTML = '';
        }, 5000);
    }
    
    // Funzioni globali per la ricerca e controllo pulsanti
    // Le funzioni di ricerca sono già rese globali da generateSearchScript
    
    window.checkSaveButton = function(uid) {
        const nominativoInput = document.getElementById('nominativo_' + uid);
        const saveButton = document.getElementById('save_' + uid);
        
        if (nominativoInput && saveButton) {
            const nominativo = nominativoInput.value.trim();
            if (nominativo === '') {
                saveButton.disabled = true;
            } else {
                saveButton.disabled = false;
            }
        }
    }
    
    window.deleteTagOwner = async function(uid) {
        if (!confirm('Sei sicuro di voler eliminare questo possessore tag?')) {
            return;
        }
        
        try {
            const response = await fetch('/api/tag-owners/' + uid, {
                method: 'DELETE',
                headers: {
                    'Content-Type': 'application/json',
                }
            });
            
            const result = await response.json();
            
            if (result.success) {
                window.showStatus('Possessore tag eliminato con successo!', 'success');
                // Ricarica la pagina dopo 2 secondi
                setTimeout(() => {
                    location.reload();
                }, 2000);
            } else {
                window.showStatus("Errore durante l'eliminazione: " + result.message, 'error');
            }
        } catch (error) {
            window.showStatus("Errore di connessione: " + error.message, 'error');
        }
    }
    
    // Funzioni per la paginazione
    window.goToPage = function(page) {
        const url = new URL(window.location);
        url.searchParams.set('page', page);
        
        // Usa il limite salvato se non è specificato nell'URL
        if (!url.searchParams.has('limit')) {
            const currentPath = window.location.pathname;
            const storageKey = 'tableLimit_' + currentPath.replace(/\\//g, '_');
            
             const savedLimit = localStorage.getItem(storageKey);
            if (savedLimit) {
                url.searchParams.set('limit', savedLimit);
            }
        }
        
        window.location.href = url.toString();
    };
    
    window.changeLimit = function(limit) {
        // Salva il nuovo limite nel localStorage
        const currentPath = window.location.pathname;
        const storageKey = 'tableLimit_' + currentPath.replace(/\\//g, '_');
        localStorage.setItem(storageKey, limit.toString());
        
        const url = new URL(window.location);
        url.searchParams.set('limit', limit);
        url.searchParams.set('page', '1'); // Torna alla prima pagina
        window.location.href = url.toString();
    };
    
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
    // Contenuto della pagina
    const content = `
    ${(0, helpers_1.generatePagination)(pagination)}
    <div class="container">
        <h1>Possessori Tag NFC</h1>
        <div id="statusMessage"></div>
        
        ${(0, helpers_1.generateSearchSection)('searchOperations', '🔍 Cerca per UID, nominativo o indirizzo...', 'clearOperationsSearch()')}
        
        <button class="refresh-btn" onclick="location.reload()">🔄 Aggiorna</button>
        <div class="table-container">
            <table>
                <thead>
                    <tr>
                        <th>UID</th>
                        <th>Nominativo</th>
                        <th>Indirizzo</th>
                        <th>Note</th>
                        <th>Data Creazione</th>
                        <th>Ultimo Aggiornamento</th>
                        <th>Azioni</th>
                    </tr>
                </thead>
                <tbody>
                    ${tagOwners.length > 0 ? tableRows : '<tr><td colspan="7" class="no-data">Nessun possessore trovato</td></tr>'}
                </tbody>
            </table>
        </div>
    </div>
  `;
    return (0, helpers_1.generateBaseHTML)('possessori Tag NFC', 'tag-owners', content, additionalStyles, additionalScripts);
}
// Endpoint per la pagina utility/impostazioni
app.get('/utility', (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    try {
        // Ottieni statistiche del database per mostrare info utili
        const backupTablesStats = yield database_1.database.getBackupTablesStats();
        const allRecords = yield database_1.database.getAllSensorRecords(1, 1); // Solo per contare
        const loggingStatus = database_1.database.isLogAttivo();
        const html = generateUtilityPage({
            backupTablesStats,
            totalRecords: allRecords.total,
            retentionSettings: global.retentionSettings,
            autoCleanupSettings: global.autoCleanupSettings,
            loggingStatus
        });
        res.send(html);
    }
    catch (error) {
        console.error('Errore nella pagina utility:', error);
        res.status(500).send('Errore interno del server');
    }
}));
app.get('/download-db', (req, res) => {
    // *** MODIFICA QUI: 'dati.db' diventa 'logs.db' ***
    const dbPath = path.join("./", 'logs.db'); // Il tuo database si chiama logs.db
    //__dirname
    res.download(dbPath, 'logs.db', (err) => {
        if (err) {
            console.error('Errore durante il download del database:', err);
            res.status(500).send('Impossibile scaricare il file del database.');
        }
        else {
            console.log('File logs.db scaricato con successo.');
        }
    });
});
// Endpoint per eseguire pulizia immediata
app.post('/api/utility/cleanup-now', (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    try {
        const { daysToKeep } = req.body;
        let days = parseInt(daysToKeep);
        // Scenario 2: Backup delle Statistiche
        if (!days || isNaN(days)) {
            days = global.retentionSettings.operationsRetentionDays;
        }
        // Prima fa il backup delle statistiche
        yield database_1.database.backupStatisticsBeforeCleanup();
        const deletedCount = yield database_1.database.cleanOldSensorRecords(days);
        res.json({
            success: true,
            message: `Backup statistiche + puliti ${deletedCount} record operazioni più vecchi di ${days} giorni`,
            deletedCount
        });
    }
    catch (error) {
        console.error('Errore nella pulizia immediata:', error);
        res.status(500).json({
            success: false,
            message: 'Errore nella pulizia del database'
        });
    }
}));
// Endpoint per attivare/disattivare pulizia automatica
app.post('/api/utility/auto-cleanup', (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    try {
        const { enabled, intervalHours, daysToKeep } = req.body;
        // Per ora salviamo le impostazioni in memoria
        // In futuro potremmo salvarle in un file di configurazione
        global.autoCleanupSettings = {
            enabled: enabled === 'true',
            intervalHours: parseInt(intervalHours) || 24,
            daysToKeep: parseInt(daysToKeep) || 30
        };
        // Se abilitato, avvia il timer
        if (global.autoCleanupSettings.enabled) {
            startAutoCleanup();
        }
        else {
            stopAutoCleanup();
        }
        res.json({
            success: true,
            message: `Pulizia automatica ${enabled === 'true' ? 'attivata' : 'disattivata'} (con backup statistiche)`,
            settings: global.autoCleanupSettings
        });
    }
    catch (error) {
        console.error('Errore nella configurazione pulizia automatica:', error);
        res.status(500).json({
            success: false,
            message: 'Errore nella configurazione'
        });
    }
}));
// Endpoint per configurare i periodi di conservazione
app.post('/api/utility/retention-settings', (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    try {
        const { operationsRetentionDays, statisticsRetentionDays } = req.body;
        global.retentionSettings = {
            operationsRetentionDays: parseInt(operationsRetentionDays) || 30,
            statisticsRetentionDays: parseInt(statisticsRetentionDays) || 365
        };
        res.json({
            success: true,
            message: `Periodi di conservazione aggiornati (con backup statistiche)`,
            settings: global.retentionSettings
        });
    }
    catch (error) {
        console.error('Errore nella configurazione periodi di conservazione:', error);
        res.status(500).json({
            success: false,
            message: 'Errore nella configurazione'
        });
    }
}));
// === ENDPOINT PER CONTROLLO LOGGING ===
// Endpoint per controllare lo stato del logging
app.get('/api/logging/status', (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    try {
        const isActive = database_1.database.isLogAttivo();
        res.json({
            success: true,
            loggingActive: isActive,
            message: `Logging ${isActive ? 'attivo' : 'disattivato'}`
        });
    }
    catch (error) {
        console.error('Errore nel controllo stato logging:', error);
        res.status(500).json({
            success: false,
            message: 'Errore nel controllo stato logging'
        });
    }
}));
// Endpoint per attivare il logging
app.post('/api/logging/activate', (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    try {
        database_1.database.attivaLogging();
        res.json({
            success: true,
            message: 'Logging attivato con successo'
        });
    }
    catch (error) {
        console.error('Errore nell\'attivazione logging:', error);
        res.status(500).json({
            success: false,
            message: 'Errore nell\'attivazione logging'
        });
    }
}));
// Endpoint per disattivare il logging
app.post('/api/logging/deactivate', (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    try {
        database_1.database.disattivaLogging();
        res.json({
            success: true,
            message: 'Logging disattivato con successo'
        });
    }
    catch (error) {
        console.error('Errore nella disattivazione logging:', error);
        res.status(500).json({
            success: false,
            message: 'Errore nella disattivazione logging'
        });
    }
}));
// Inizializza le impostazioni globali
global.autoCleanupSettings = {
    enabled: false,
    intervalHours: 24,
    daysToKeep: 30
};
global.autoCleanupTimer = null;
global.retentionSettings = {
    operationsRetentionDays: 30,
    statisticsRetentionDays: 365 // Conserva statistiche per 1 anno
};
// Funzione per avviare la pulizia automatica
function startAutoCleanup() {
    if (global.autoCleanupTimer) {
        clearInterval(global.autoCleanupTimer);
    }
    const intervalMs = global.autoCleanupSettings.intervalHours * 60 * 60 * 1000;
    global.autoCleanupTimer = setInterval(() => __awaiter(this, void 0, void 0, function* () {
        try {
            console.log('Esecuzione pulizia automatica...');
            // Scenario 2: Backup delle Statistiche
            try {
                // 1. Prima fa il backup delle statistiche
                yield database_1.database.backupStatisticsBeforeCleanup();
                // 2. Poi elimina i record vecchi
                const deletedCount = yield database_1.database.cleanOldSensorRecords(global.retentionSettings.operationsRetentionDays);
                console.log(`Pulizia automatica completata: backup statistiche + eliminati ${deletedCount} record operazioni (conservazione: ${global.retentionSettings.operationsRetentionDays} giorni)`);
            }
            catch (error) {
                console.error('Errore nel backup delle statistiche:', error);
            }
        }
        catch (error) {
            console.error('Errore nella pulizia automatica:', error);
        }
    }), intervalMs);
    console.log(`Pulizia automatica avviata: ogni ${global.autoCleanupSettings.intervalHours} ore`);
}
// Funzione per fermare la pulizia automatica
function stopAutoCleanup() {
    if (global.autoCleanupTimer) {
        clearInterval(global.autoCleanupTimer);
        global.autoCleanupTimer = null;
        console.log('Pulizia automatica fermata');
    }
}
// Funzione per generare la homepage generale
function generateHomePage() {
    const content = `
    <div class="welcome-section">
        <h1>🏠 ESP Home Server</h1>
        <p>Sistema di gestione integrato per sensori NFC</p>
    </div>
<div class="container">
    <div class="quick-stats">
        <a href="/sensor-data" class="nav-card">
            <h3><span class="icon">📊</span>Dati Sensori</h3>
            <p>Visualizza e gestisci tutti i dati dei sensori NFC, operazioni di credito e storico transazioni.</p>
        </a>

        <a href="/spending-dashboard" class="nav-card">
            <h3><span class="icon">💰</span>Dashboard Spese</h3>
            <p>Analizza le spese per UID, statistiche aggregate e monitoraggio del credito con backup automatico.</p>
        </a>

        <a href="/tag-owners" class="nav-card">
            <h3><span class="icon">👥</span>Possessori Tag</h3>
            <p>Gestisci i possessori dei tag NFC, associa UID a nominativi e indirizzi.</p>
        </a>

        <a href="/utility" class="nav-card">
            <h3><span class="icon">⚙️</span>Utility & Impostazioni</h3>
            <p>Configura periodi di conservazione, pulizia automatica e monitora lo stato del database.</p>
        </a>
         
        <a href="/api/logs-view" class="nav-card">
            <h3><span class="icon">📝</span>Log Sistema</h3>
            <p>Visualizza i log delle attività del sistema e monitora le operazioni degli utenti.</p>
        </a>

        <div class="nav-card" onclick="window.open('/api/sensor-data', '_blank')">
            <h3><span class="icon">🔗</span>API JSON</h3>
            <p>Accedi direttamente alle API JSON per integrazione con altri sistemi o sviluppo.</p>
        </div>
    </div>

    
        <h2  style="text-align: center;" >  Stato Sistema</h2>
        <div class="stats-grid">
         
            <div class="stat-card">
                <div class="stat-value">✅ Attivo</div>
                <div class="stat-label">Backup Statistiche</div>
            </div> 
            <div class="stat-card">
                <div class="stat-value">⚙️ Configurabile</div>
                <div class="stat-label">Pulizia Automatica</div>
            </div>
            <div class="stat-card">
                <div class="stat-value">SQLite</div>
                <div class="stat-label">Database</div>
            </div>
        </div>
    </div>

    <div class="footer">
        <p>ESP Home Server v3.0 - Sistema di gestione integrato</p>
        <p>Backup automatico statistiche • Periodi conservazione configurabili • Dashboard avanzate</p>
    </div>
  `;
    return (0, helpers_1.generateBaseHTML)('ESP Home Server - Dashboard Principale', 'home', content);
}
// Funzione per generare la pagina utility/impostazioni
function generateUtilityPage(data) {
    const content = `
    <div class="container">
        <h1>🔧 Utility e Impostazioni Database</h1>
        
        <!-- Sezione Statistiche Database -->
        <div class="utility-section">
            <h2>📊 Statistiche Database</h2>
            <div class="status-message status-success">
                <strong>Record totali nel database:</strong> ${data.totalRecords.toLocaleString()}
            </div>
            
            <h3>💾 Tabelle di Backup Statistiche</h3>
            <p><em>Statistiche aggregate conservate per Scenario 2 (Backup delle Statistiche).</em></p>
            <table class="stats-table">
                <thead>
                    <tr>
                        <th>Tabella</th>
                        <th>Record Conservati</th>
                        <th>Descrizione</th>
                    </tr>
                </thead>
                <tbody>
                    ${data.backupTablesStats.map(stat => {
        let description = '';
        if (stat.table === 'spending_summary') {
            description = 'Statistiche aggregate per UID (Scenario 2)';
        }
        else if (stat.table === 'spending_monthly_stats') {
            description = 'Backup mensili delle statistiche (Scenario 2)';
        }
        return `
                            <tr>
                                <td><strong>${stat.table}</strong></td>
                                <td>${stat.recordCount.toLocaleString()}</td>
                                <td>${description}</td>
                            </tr>
                        `;
    }).join('')}
                </tbody>
            </table>
             <p class="save-btn" style="text-align: center;">
                <a href="/download-db" download="logs.db" class="button-link">Scarica database SQLite</a>
            </p>
        </div>
        
        <!-- Sezione Controllo Logging -->
        <div class="utility-section">
            <h2>📝 Controllo Logging</h2>
            <p>Gestisci la memorizzazione dei log delle attività nel database.</p>
            
            <div class="status-message status-success">
                <strong>Stato attuale:</strong> 
                <span class="status ${data.loggingStatus ? 'success' : 'error'}">
                    ${data.loggingStatus ? '✅ Attivo' : '❌ Disattivato'}
                </span>
            </div>
            
            <div class="button-group">
                <button onclick="toggleLogging(true)" class="save-btn" ${data.loggingStatus ? 'disabled' : ''}>
                    ✅ Attiva Logging
                </button>
                <button onclick="toggleLogging(false)" class="reset-btn" ${!data.loggingStatus ? 'disabled' : ''}>
                    ❌ Disattiva Logging
                </button>
            </div>
            
            <div class="info-box">
                <h4>ℹ️ Informazioni</h4>
                <ul>
                    <li><strong>Attivo:</strong> I log delle attività vengono memorizzati nel database</li>
                    <li><strong>Disattivato:</strong> I log non vengono memorizzati (risparmio spazio)</li>
                    <li>Le operazioni di sistema continuano a funzionare normalmente</li>
                    <li>I log esistenti rimangono disponibili anche se disattivato</li>
                </ul>
            </div>
        </div>
        
        <!-- Sezione Pulizia Immediata -->
        <div class="utility-section">
            <h2>🧹 Pulizia Immediata</h2>
            <p>Elimina i record più vecchi di un numero specifico di giorni.</p>
            
            <div class="setting-item">
                <label for="daysToKeep">Giorni da mantenere:</label>
                <input type="number" id="daysToKeep" value="${data.retentionSettings.operationsRetentionDays}" min="1" max="365">
            </div>
            
            <button onclick="cleanupNow()" id="cleanupBtn" class="save-btn">Esegui Pulizia Immediata</button>
            <div id="cleanupStatus"></div>
        </div>
        
        <!-- Sezione Periodi di Conservazione -->
        <div class="utility-section">
            <h2>📅 Periodi di Conservazione</h2>
            <p>Configura i periodi di conservazione per operazioni e statistiche (con backup automatico delle statistiche).</p>
            
            <div class="setting-item">
                <label for="operationsRetentionDays">Conservazione Operazioni (giorni):</label>
                <input type="number" id="operationsRetentionDays" value="${data.retentionSettings.operationsRetentionDays}" min="1" max="3650">
                <small>Record delle operazioni verranno eliminati dopo questo periodo</small>
            </div>
            
            <div class="setting-item disabled-section">
                <label for="statisticsRetentionDays" class="disabled-label">Conservazione Statistiche (giorni):</label>
                <input type="number" id="statisticsRetentionDays" value="${data.retentionSettings.statisticsRetentionDays}" min="1" max="3650" disabled>
                <small class="disabled-text">⚠️ <strong>DISATTIVATO</strong> - Le statistiche non vengono mai eliminate (crescono indefinitamente)</small>
            </div>
            
            <button onclick="configureRetentionSettings()" id="retentionBtn" class="save-btn">Salva Configurazione</button>
            <div id="retentionStatus"></div>
        </div>
        
        <!-- Sezione Pulizia Automatica -->
        <div class="utility-section">
            <h2>⏰ Pulizia Automatica</h2>
            <p>Configura la pulizia automatica del database a intervalli regolari.</p>
            
            <div class="setting-item">
                <div class="checkbox-group">
                    <input type="checkbox" id="autoCleanupEnabled" ${data.autoCleanupSettings.enabled ? 'checked' : ''}>
                    <label for="autoCleanupEnabled">Abilita pulizia automatica</label>
                </div>
            </div>
            
            <div class="setting-item">
                <label for="intervalHours">Intervallo (ore):</label>
                <input type="number" id="intervalHours" value="${data.autoCleanupSettings.intervalHours}" min="1" max="168">
            </div>
            
            <div class="setting-item">
                <label for="autoDaysToKeep">Giorni da mantenere:</label>
                <input type="number" id="autoDaysToKeep" value="${data.autoCleanupSettings.daysToKeep}" min="1" max="365">
            </div>
            
            <button onclick="configureAutoCleanup()" id="autoCleanupBtn" class="save-btn">Salva Configurazione</button>
            <div id="autoCleanupStatus"></div>
        </div>
    </div>

    <script>
        async function cleanupNow() {
            const daysToKeep = document.getElementById('daysToKeep').value;
            const btn = document.getElementById('cleanupBtn');
            const status = document.getElementById('cleanupStatus');
            
            btn.disabled = true;
            btn.textContent = 'Pulizia in corso...';
            status.innerHTML = '<div class="status-message status-success">Pulizia in corso...</div>';
            
            try {
                const response = await fetch('/api/utility/cleanup-now', {
                    method: 'POST',
                    headers: {
                        'Content-Type': 'application/json'
                    },
                    body: JSON.stringify({ daysToKeep: parseInt(daysToKeep) })
                });
                
                const result = await response.json();
                
                if (result.success) {
                    status.innerHTML = \`<div class="status-message status-success">\${result.message}</div>\`;
                    // Ricarica la pagina per aggiornare le statistiche
                    setTimeout(() => location.reload(), 2000);
                } else {
                    status.innerHTML = \`<div class="status-message status-error">Errore: \${result.message}</div>\`;
                }
            } catch (error) {
                status.innerHTML = '<div class="status-message status-error">Errore di connessione</div>';
            } finally {
                btn.disabled = false;
                btn.textContent = 'Esegui Pulizia Immediata';
            }
        }
        
        async function configureAutoCleanup() {
            const enabled = document.getElementById('autoCleanupEnabled').checked;
            const intervalHours = document.getElementById('intervalHours').value;
            const daysToKeep = document.getElementById('autoDaysToKeep').value;
            const btn = document.getElementById('autoCleanupBtn');
            const status = document.getElementById('autoCleanupStatus');
            
            btn.disabled = true;
            btn.textContent = 'Salvataggio...';
            
            try {
                const response = await fetch('/api/utility/auto-cleanup', {
                    method: 'POST',
                    headers: {
                        'Content-Type': 'application/json'
                    },
                    body: JSON.stringify({
                        enabled: enabled.toString(),
                        intervalHours: parseInt(intervalHours),
                        daysToKeep: parseInt(daysToKeep)
                    })
                });
                
                const result = await response.json();
                
                if (result.success) {
                    status.innerHTML = \`<div class="status-message status-success">\${result.message}</div>\`;
                } else {
                    status.innerHTML = \`<div class="status-message status-error">Errore: \${result.message}</div>\`;
                }
            } catch (error) {
                status.innerHTML = '<div class="status-message status-error">Errore di connessione</div>';
            } finally {
                btn.disabled = false;
                btn.textContent = 'Salva Configurazione';
            }
        }
        
        async function configureRetentionSettings() {
            const operationsRetentionDays = document.getElementById('operationsRetentionDays').value;
            const statisticsRetentionDays = document.getElementById('statisticsRetentionDays').value;
            const btn = document.getElementById('retentionBtn');
            const status = document.getElementById('retentionStatus');
            
            btn.disabled = true;
            btn.textContent = 'Salvataggio...';
            
            try {
                const response = await fetch('/api/utility/retention-settings', {
                    method: 'POST',
                    headers: {
                        'Content-Type': 'application/json'
                    },
                    body: JSON.stringify({
                        operationsRetentionDays: parseInt(operationsRetentionDays),
                        statisticsRetentionDays: parseInt(statisticsRetentionDays)
                    })
                });
                
                const result = await response.json();
                
                if (result.success) {
                    status.innerHTML = \`<div class="status-message status-success">\${result.message}</div>\`;
                } else {
                    status.innerHTML = \`<div class="status-message status-error">Errore: \${result.message}</div>\`;
                }
            } catch (error) {
                status.innerHTML = '<div class="status-message status-error">Errore di connessione</div>';
            } finally {
                btn.disabled = false;
                btn.textContent = 'Salva Configurazione';
            }
        }
        
        async function toggleLogging(activate) {
            const action = activate ? 'activate' : 'deactivate';
            const actionText = activate ? 'Attivazione' : 'Disattivazione';
            
            try {
                const response = await fetch(\`/api/logging/\${action}\`, {
                    method: 'POST',
                    headers: {
                        'Content-Type': 'application/json'
                    }
                });
                
                const result = await response.json();
                
                if (result.success) {
                    // Mostra messaggio di successo
                    alert(\`\${actionText} logging completata con successo!\`);
                    // Ricarica la pagina per aggiornare lo stato
                    location.reload();
                } else {
                    alert(\`Errore durante \${actionText.toLowerCase()} logging: \${result.message}\`);
                }
            } catch (error) {
                alert(\`Errore di connessione durante \${actionText.toLowerCase()} logging\`);
            }
        }
    </script>
  `;
    return (0, helpers_1.generateBaseHTML)('Utility e Impostazioni', 'utility', content);
}
app.get("/nRecords", (req, res) => {
    database_1.database.RecordsChanged()
        .then(record => { res.status(200).json({ record }); })
        .catch(err => res.status(500).json({ record: false }));
});
/*

app.get("/nRecods", async (req, res) => {
  try {
    const record = await database.getNumberRecords();
    res.status(200).json({ total: record });
  } catch (err) {
    res.status(500).json({ error: "Errore nel conteggio dei record" });
  }
});

*/
app.post('/api/toggle-server', (req, res) => {
    exports.attivaServer = !exports.attivaServer;
    console.log(`Server ${exports.attivaServer ? 'attivato' : 'disattivato'}`);
    res.status(200).json({ success: true, attivaServer: exports.attivaServer });
});
app.post('/api/check-server', (req, res) => {
    console.log(`Server ${exports.attivaServer ? 'attivato' : 'disattivato'}`);
    res.status(200).json({ success: true, attivaServer: exports.attivaServer });
});
app.get('/health', (req, res) => {
    res.status(200).send('<html><h1>ok</h1> </html>');
});
// Endpoint per la homepage generale
app.get('/', (req, res) => {
    const html = generateHomePage();
    res.send(html);
});
// Endpoint per cercare nei possessori dei tag
app.get('/api/tagowners/search', (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    try {
        const searchTerm = req.query.q;
        if (!searchTerm) {
            return res.json({
                success: true,
                data: []
            });
        }
        const tagOwners = yield database_1.database.getAllTagOwners();
        // Filtra i risultati
        const filteredOwners = tagOwners.filter(owner => {
            const searchFields = [
                owner.uid,
                owner.nominativo || '',
                owner.indirizzo || '',
                owner.note || ''
            ];
            return searchFields.some(field => field.toLowerCase().includes(searchTerm.toLowerCase()));
        });
        res.json({
            success: true,
            data: filteredOwners
        });
    }
    catch (error) {
        console.error('Errore nella ricerca dei possessori dei tag:', error);
        res.status(500).json({
            success: false,
            message: 'Errore nella ricerca'
        });
    }
}));
// Endpoint per cercare nei dati dei sensori
app.get('/api/sensor-data/search', (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    try {
        const searchTerm = req.query.q;
        if (!searchTerm) {
            return res.json({
                success: true,
                data: []
            });
        }
        // Ottieni tutti i record (senza paginazione per la ricerca)
        const result = yield database_1.database.getAllSensorRecords(1, 10000); // Numero grande per ottenere tutti i record
        // Ottieni tutti i possessori dei tag per mostrare i nominativi
        const tagOwners = yield database_1.database.getAllTagOwners();
        const tagOwnersMap = new Map();
        tagOwners.forEach(owner => {
            tagOwnersMap.set(owner.uid, owner);
        });
        // Filtra i risultati
        const filteredRecords = result.records.filter(record => {
            const tagOwner = tagOwnersMap.get(record.uid);
            const searchFields = [
                record.uid,
                (tagOwner === null || tagOwner === void 0 ? void 0 : tagOwner.nominativo) || '',
                record.datetime,
                record.status,
                record.credito_precedente.toString(),
                record.credito_attuale.toString()
            ];
            return searchFields.some(field => field.toLowerCase().includes(searchTerm.toLowerCase()));
        });
        // Aggiungi i nominativi ai risultati filtrati
        const enrichedRecords = filteredRecords.map(record => {
            var _a;
            return (Object.assign(Object.assign({}, record), { nominativo: ((_a = tagOwnersMap.get(record.uid)) === null || _a === void 0 ? void 0 : _a.nominativo) || null }));
        });
        res.json({
            success: true,
            data: enrichedRecords
        });
    }
    catch (error) {
        console.error('Errore nella ricerca dei dati dei sensori:', error);
        res.status(500).json({
            success: false,
            message: 'Errore nella ricerca'
        });
    }
}));
// Endpoint per ottenere un possessore specifico per UID
/* app.get('/api/tag-owners/:uid', async (req, res) => {
  try {
    const uid = req.params.uid;

    const tagOwner = await database.getTagOwnerByUID(uid);

    if (!tagOwner) {
      return res.status(404).json({
        success: false,
        message: 'possessore non trovato'
      });
    }

    res.json({
      success: true,
      data: tagOwner
    });
  } catch (error) {
    console.error('Errore nel recupero del possessore:', error);
    res.status(500).json({
      success: false,
      message: 'Errore nel recupero del possessore'
    });
  }
});
 */
// Endpoint per azzerare tutte le tabelle del database (e reset autoincrementali)
app.post('/api/reset-db', (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    try {
        yield database_1.database.resetAllTables();
        res.json({ success: true });
    }
    catch (error) {
        console.error('Errore reset database:', error);
        res.status(500).json({ success: false, message: 'Errore nel reset del database' });
    }
}));
// Endpoint per ottenere i dati dei sensori filtrati per intervallo di date
app.get('/api/sensor-data/date-range', (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    try {
        const { startDate, endDate } = req.query;
        if (!startDate || !endDate) {
            return res.status(400).json({
                success: false,
                message: 'Parametri startDate e endDate sono richiesti'
            });
        }
        const records = yield database_1.database.getSensorRecordsByDateRange(startDate, endDate);
        res.json({
            success: true,
            data: records,
            count: records.length,
            filters: { startDate, endDate }
        });
    }
    catch (error) {
        console.error('Errore nel recupero dei dati filtrati per date:', error);
        res.status(500).json({
            success: false,
            message: 'Errore nel recupero dei dati filtrati'
        });
    }
}));
// Endpoint per ottenere le statistiche di spesa filtrate per intervallo di date
app.get('/api/spending-stats/date-range', (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    try {
        const { startDate, endDate } = req.query;
        if (!startDate || !endDate) {
            return res.status(400).json({
                success: false,
                message: 'Parametri startDate e endDate sono richiesti'
            });
        }
        const stats = yield database_1.database.getSpendingStatsByDateRange(startDate, endDate);
        // Enrich con nominativo per coerenza con le viste
        const tagOwners = yield database_1.database.getAllTagOwners();
        const tagOwnersMap = new Map();
        tagOwners.forEach(owner => tagOwnersMap.set(owner.uid, owner));
        const enriched = stats.map(s => {
            var _a;
            return (Object.assign(Object.assign({}, s), { nominativo: ((_a = tagOwnersMap.get(s.uid)) === null || _a === void 0 ? void 0 : _a.nominativo) || null }));
        });
        res.json({
            success: true,
            data: enriched,
            count: enriched.length,
            filters: { startDate, endDate }
        });
    }
    catch (error) {
        console.error('Errore nel recupero delle statistiche filtrate per date:', error);
        res.status(500).json({
            success: false,
            message: 'Errore nel recupero delle statistiche filtrate'
        });
    }
}));
// Endpoint per ottenere le statistiche di spesa di un UID specifico filtrate per intervallo di date
app.get('/api/spending-stats/uid/:uid/date-range', (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    try {
        const { uid } = req.params;
        const { startDate, endDate } = req.query;
        if (!startDate || !endDate) {
            return res.status(400).json({
                success: false,
                message: 'Parametri startDate e endDate sono richiesti'
            });
        }
        const spendingData = yield database_1.database.getTotalSpendingByUIDAndDateRange(uid, startDate, endDate);
        res.json({
            success: true,
            data: spendingData,
            filters: { startDate, endDate }
        });
    }
    catch (error) {
        console.error('Errore nel recupero delle statistiche UID filtrate per date:', error);
        res.status(500).json({
            success: false,
            message: 'Errore nel recupero delle statistiche UID filtrate'
        });
    }
}));
// Endpoint per ottenere i dati dei sensori filtrati per intervallo di date con paginazione
app.get('/api/sensor-data/date-range/paginated', (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    try {
        const { startDate, endDate, page = '1', pageSize = '50' } = req.query;
        if (!startDate || !endDate) {
            return res.status(400).json({
                success: false,
                message: 'Parametri startDate e endDate sono richiesti'
            });
        }
        const pageNum = parseInt(page);
        const limit = parseInt(pageSize);
        const records = yield database_1.database.getSensorRecordsByDateRange(startDate, endDate);
        // Paginazione lato server
        const total = records.length;
        const totalPages = Math.ceil(total / limit);
        const startIndex = (pageNum - 1) * limit;
        const endIndex = startIndex + limit;
        const paginatedRecords = records.slice(startIndex, endIndex);
        res.json({
            success: true,
            data: paginatedRecords,
            pagination: {
                page: pageNum,
                pageSize: limit,
                total,
                totalPages
            },
            filters: { startDate, endDate }
        });
    }
    catch (error) {
        console.error('Errore nel recupero dei dati filtrati per date con paginazione:', error);
        res.status(500).json({
            success: false,
            message: 'Errore nel recupero dei dati filtrati'
        });
    }
}));
// Endpoint di debug per testare i filtri di data
app.get('/api/debug/date-filter', (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    try {
        const { startDate, endDate } = req.query;
        if (!startDate || !endDate) {
            return res.status(400).json({
                success: false,
                message: 'Parametri startDate e endDate sono richiesti'
            });
        }
        console.log(`[DEBUG] Test filtro date: startDate=${startDate}, endDate=${endDate}`);
        // Test della conversione delle date
        const startTimestamp = database_1.database.convertDateToTimestamp(startDate);
        const endTimestamp = database_1.database.convertDateToEndOfDayTimestamp(endDate);
        const startDateObj = new Date(startTimestamp * 1000); // Converti da secondi a millisecondi
        const endDateObj = new Date(endTimestamp * 1000); // Converti da secondi a millisecondi
        // Ottieni alcuni record di esempio dal database
        const sampleRecords = yield new Promise((resolve, reject) => {
            database_1.database.db.all('SELECT timestamp, datetime, typeof(timestamp) as timestamp_type FROM sensor_data ORDER BY CAST(timestamp AS INTEGER) DESC LIMIT 10', [], (err, rows) => {
                if (err)
                    reject(err);
                else
                    resolve(rows);
            });
        });
        // Ottieni informazioni sulla struttura della tabella
        const tableInfo = yield new Promise((resolve, reject) => {
            database_1.database.db.all("PRAGMA table_info(sensor_data)", [], (err, rows) => {
                if (err)
                    reject(err);
                else
                    resolve(rows);
            });
        });
        res.json({
            success: true,
            debug: {
                inputDates: { startDate, endDate },
                convertedTimestamps: { startTimestamp, endTimestamp },
                convertedDates: {
                    startDate: startDateObj.toISOString(),
                    endDate: endDateObj.toISOString()
                },
                sampleRecords: sampleRecords,
                tableStructure: tableInfo
            }
        });
    }
    catch (error) {
        console.error('Errore nel debug del filtro date:', error);
        res.status(500).json({
            success: false,
            message: 'Errore nel debug del filtro date'
        });
    }
}));

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
exports.database = void 0;
const sqlite3_1 = __importDefault(require("sqlite3"));
class Database {
    constructor() {
        this.attivaLog = false; // Flag per controllare se memorizzare i log
        this.Nrecords = 0;
        this.db = new sqlite3_1.default.Database('./logs.db');
        this.initDatabase();
    }
    initDatabase() {
        // Tabella per i log utenti
        const createUserLogsTable = `
      CREATE TABLE IF NOT EXISTS user_logs (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        user_id TEXT NOT NULL,
        action TEXT NOT NULL,
        timestamp INTEGER NOT NULL,
        ip_address TEXT,
        user_agent TEXT,
        details TEXT,
        created_at DATETIME DEFAULT CURRENT_TIMESTAMP
      )
    `;
        // Tabella per i dati dei sensori
        const createSensorDataTable = `
       CREATE TABLE IF NOT EXISTS sensor_data (
         id INTEGER PRIMARY KEY AUTOINCREMENT,
         uid TEXT NOT NULL,
         timestamp INTEGER NOT NULL,
         datetime TEXT NOT NULL,
         credito_precedente REAL NOT NULL,
         credito_attuale REAL NOT NULL,
         status TEXT NOT NULL,
         created_at DATETIME DEFAULT CURRENT_TIMESTAMP
       )
     `;
        // Tabella per i possessori dei tag NFC
        const createTagOwnersTable = `
      CREATE TABLE IF NOT EXISTS tag_owners (
        uid TEXT PRIMARY KEY,
        nominativo TEXT  NOT NULL UNIQUE,
        indirizzo TEXT NOT NULL,
        note TEXT,
        created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
        updated_at DATETIME DEFAULT CURRENT_TIMESTAMP
      )
    `;
        // Tabella per le statistiche aggregate (Scenario 2)
        const createSpendingSummaryTable = `
      CREATE TABLE IF NOT EXISTS spending_summary (
        uid TEXT PRIMARY KEY,
        total_operations INTEGER DEFAULT 0,
        spending_operations INTEGER DEFAULT 0,
        total_spent REAL DEFAULT 0,
        total_credits REAL DEFAULT 0,
        last_operation_timestamp INTEGER,
        last_credito_attuale REAL,
        period_start_date TEXT,
        period_end_date TEXT,
        updated_at DATETIME DEFAULT CURRENT_TIMESTAMP
      )
    `;
        // Tabella per i backup mensili delle statistiche (Scenario 2)
        const createSpendingMonthlyStatsTable = `
      CREATE TABLE IF NOT EXISTS spending_monthly_stats (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        uid TEXT NOT NULL,
        year_month TEXT NOT NULL,
        total_operations INTEGER DEFAULT 0,
        total_spending_operations INTEGER DEFAULT 0,
        total_spent REAL DEFAULT 0,
        total_credits REAL DEFAULT 0,
        created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
        UNIQUE(uid, year_month)
      )
    `;
        // Indici per user_logs
        const createUserLogsIndexes = `
      CREATE INDEX IF NOT EXISTS idx_user_id ON user_logs(user_id);
      CREATE INDEX IF NOT EXISTS idx_timestamp ON user_logs(timestamp);
      CREATE INDEX IF NOT EXISTS idx_action ON user_logs(action);
    `;
        // Indici per sensor_data
        const createSensorDataIndexes = `
       CREATE INDEX IF NOT EXISTS idx_sensor_uid ON sensor_data(uid);
       CREATE INDEX IF NOT EXISTS idx_sensor_timestamp ON sensor_data(timestamp);
       CREATE INDEX IF NOT EXISTS idx_sensor_datetime ON sensor_data(datetime);
     `;
        // Indici per tag_owners
        const createTagOwnersIndexes = `
      CREATE INDEX IF NOT EXISTS idx_tag_owner_nominativo ON tag_owners(nominativo);
      CREATE INDEX IF NOT EXISTS idx_tag_owner_indirizzo ON tag_owners(indirizzo);
    `;
        // Crea le tabelle
        this.db.run(createUserLogsTable, (err) => {
            if (err) {
                console.error('Errore creazione tabella user_logs:', err);
            }
            else {
                console.log('Tabella user_logs creata/verificata');
                this.db.run(createUserLogsIndexes, (err) => {
                    if (err) {
                        console.error('Errore creazione indici user_logs:', err);
                    }
                    else {
                        console.log('Indici user_logs creati/verificati');
                    }
                });
            }
        });
        this.db.run(createSensorDataTable, (err) => {
            if (err) {
                console.error('Errore creazione tabella sensor_data:', err);
            }
            else {
                console.log('Tabella sensor_data creata/verificata');
                this.db.run(createSensorDataIndexes, (err) => {
                    if (err) {
                        console.error('Errore creazione indici sensor_data:', err);
                    }
                    else {
                        console.log('Indici sensor_data creati/verificati');
                    }
                });
            }
        });
        this.db.run(createTagOwnersTable, (err) => {
            if (err) {
                console.error('Errore creazione tabella tag_owners:', err);
            }
            else {
                console.log('Tabella tag_owners creata/verificata');
                this.db.run(createTagOwnersIndexes, (err) => {
                    if (err) {
                        console.error('Errore creazione indici tag_owners:', err);
                    }
                    else {
                        console.log('Indici tag_owners creati/verificati');
                    }
                });
            }
        });
        // Crea tabelle per Scenario 2 (backup statistiche)
        this.db.run(createSpendingSummaryTable, (err) => {
            if (err) {
                console.error('Errore creazione tabella spending_summary:', err);
            }
            else {
                console.log('Tabella spending_summary creata/verificata');
            }
        });
        this.db.run(createSpendingMonthlyStatsTable, (err) => {
            if (err) {
                console.error('Errore creazione tabella spending_monthly_stats:', err);
            }
            else {
                console.log('Tabella spending_monthly_stats creata/verificata');
            }
        });
    }
    // === FUNZIONI PER I LOG UTENTI ===
    // Controlla se i log sono attivi
    isLogAttivo() {
        return this.attivaLog;
    }
    // Attiva la memorizzazione dei log
    attivaLogging() {
        this.attivaLog = true;
        console.log('Memorizzazione log attivata');
    }
    // Disattiva la memorizzazione dei log
    disattivaLogging() {
        this.attivaLog = false;
        console.log('Memorizzazione log disattivata');
    }
    // Aggiungi un nuovo log
    addLog(log) {
        return __awaiter(this, void 0, void 0, function* () {
            // Se i log sono disattivati, non memorizzare nulla
            if (!this.attivaLog) {
                //  console.log('Log disattivato - operazione non memorizzata:', log.action);
                return Promise.resolve();
            }
            return new Promise((resolve, reject) => {
                const sql = `
        INSERT INTO user_logs (user_id, action, timestamp, ip_address, user_agent, details)
        VALUES (?, ?, ?, ?, ?, ?)
      `;
                this.db.run(sql, [
                    log.user_id,
                    log.action,
                    log.timestamp,
                    log.ip_address || null,
                    log.user_agent || null,
                    log.details || null
                ], function (err) {
                    if (err) {
                        console.error('Errore inserimento log:', err);
                        reject(err);
                    }
                    else {
                        resolve();
                    }
                });
            });
        });
    }
    // Ottieni log per utente specifico
    getLogsByUser(userId, limit = 100) {
        return __awaiter(this, void 0, void 0, function* () {
            return new Promise((resolve, reject) => {
                const sql = `
        SELECT * FROM user_logs 
        WHERE user_id = ? 
        ORDER BY timestamp DESC 
        LIMIT ?
      `;
                this.db.all(sql, [userId, limit], (err, rows) => {
                    if (err) {
                        reject(err);
                    }
                    else {
                        resolve(rows);
                    }
                });
            });
        });
    }
    // Ottieni tutti i log con paginazione
    getAllLogs(page = 1, pageSize = 50) {
        return __awaiter(this, void 0, void 0, function* () {
            return new Promise((resolve, reject) => {
                const offset = (page - 1) * pageSize;
                // Conta totale
                this.db.get('SELECT COUNT(*) as total FROM user_logs', (err, row) => {
                    if (err) {
                        reject(err);
                        return;
                    }
                    // Ottieni log paginati
                    const sql = `
          SELECT * FROM user_logs 
          ORDER BY timestamp DESC 
          LIMIT ? OFFSET ?
        `;
                    this.db.all(sql, [pageSize, offset], (err, rows) => {
                        if (err) {
                            reject(err);
                        }
                        else {
                            resolve({
                                logs: rows,
                                total: row.total
                            });
                        }
                    });
                });
            });
        });
    }
    // Pulisci log vecchi (es. più di 30 giorni)
    cleanOldLogs(daysToKeep = 30) {
        return __awaiter(this, void 0, void 0, function* () {
            return new Promise((resolve, reject) => {
                const cutoffTime = Date.now() - (daysToKeep * 24 * 60 * 60 * 1000);
                this.db.run('DELETE FROM user_logs WHERE timestamp < ?', [cutoffTime], function (err) {
                    if (err) {
                        reject(err);
                    }
                    else {
                        resolve(this.changes || 0);
                    }
                });
            });
        });
    }
    // === FUNZIONI PER I DATI DEI SENSORI ===
    // Aggiungi un nuovo record dei sensori
    addSensorRecord(record) {
        return __awaiter(this, void 0, void 0, function* () {
            return new Promise((resolve, reject) => {
                // Usa INSERT normale per aggiungere ogni operazione come nuovo record
                const sql = `
        INSERT INTO sensor_data (uid, timestamp, datetime, credito_precedente, credito_attuale, status)
        VALUES (?, ?, ?, ?, ?, ?)
      `;
                this.db.run(sql, [
                    record.uid,
                    record.timestamp,
                    record.datetime,
                    record.credito_precedente,
                    record.credito_attuale,
                    record.status
                ], function (err) {
                    return __awaiter(this, void 0, void 0, function* () {
                        if (err) {
                            console.error('Errore inserimento record sensore:', err);
                            reject(err);
                        }
                        else {
                            console.log(`Nuova operazione registrata nel database per UID: ${record.uid} )`); //(ID: ${this.lastID}
                            // Gestione speciale per status "Assegnazione"
                            if (record.status === 'assegnazione') {
                                try {
                                    yield exports.database.handleTagAssignment(record);
                                }
                                catch (assignmentError) {
                                    console.error('Errore nella gestione assegnazione tag:', assignmentError);
                                    // Non rifiutiamo l'intera operazione se fallisce l'assegnazione
                                }
                            }
                            resolve();
                        }
                    });
                }.bind(this)); // Bind 'this' per mantenere il contesto della classe
            });
        });
    }
    // Gestisce l'assegnazione di un tag quando status = "Assegnazione"
    handleTagAssignment(record) {
        return __awaiter(this, void 0, void 0, function* () {
            return new Promise((resolve, reject) => {
                // Controlla se esiste già un record per questo UID
                const checkSql = `SELECT uid FROM tag_owners WHERE uid = ?`;
                this.db.get(checkSql, [record.uid], (err, existingRow) => {
                    if (err) {
                        reject(err);
                        return;
                    }
                    if (existingRow) {
                        // Se esiste già, aggiorna solo updated_at usando il datetime dell'ESP32
                        const updateSql = `
            UPDATE tag_owners 
            SET updated_at = ? 
            WHERE uid = ?
          `;
                        // Converti il datetime dell'ESP32 in formato SQLite mantenendo l'orario locale
                        // record.datetime è nel formato "03-08-2025 23:33:44"
                        const [datePart, timePart] = record.datetime.split(' ');
                        const [day, month, year] = datePart.split('-');
                        const sqliteDate = `${year}-${month}-${day} ${timePart}`;
                        this.db.run(updateSql, [sqliteDate, record.uid], function (updateErr) {
                            if (updateErr) {
                                console.error('Errore aggiornamento possessore tag esistente:', updateErr);
                                reject(updateErr);
                            }
                            else {
                                console.log(`Aggiornato timestamp per possessore tag esistente UID: ${record.uid} con datetime ESP32: ${record.datetime}`);
                                resolve();
                            }
                        });
                    }
                    else {
                        // Se non esiste, crea un nuovo record con valori temporanei
                        const insertSql = `
            INSERT INTO tag_owners (uid, nominativo, indirizzo, note, created_at, updated_at)
            VALUES (?, ?, ?, ?, ?, ?)
          `;
                        // Converti il datetime dell'ESP32 in formato SQLite mantenendo l'orario locale
                        // record.datetime è nel formato "03-08-2025 23:33:44"
                        const [datePart, timePart] = record.datetime.split(' ');
                        const [day, month, year] = datePart.split('-');
                        const sqliteDate = `${year}-${month}-${day} ${timePart}`;
                        this.db.run(insertSql, [
                            record.uid,
                            '',
                            '',
                            ``,
                            sqliteDate,
                            sqliteDate
                        ], function (insertErr) {
                            if (insertErr) {
                                console.error('Errore inserimento possessore tag:', insertErr);
                                reject(insertErr);
                            }
                            else {
                                console.log(`Nuovo possessore tag creato per UID: ${record.uid} (ID: ${this.lastID})`);
                                resolve();
                            }
                        });
                    }
                });
            });
        });
    }
    /*  async getNumberRecords(): Promise<number> {
       return new Promise<number>((resolve, reject) => {
         this.db.get("SELECT COUNT(*) as total FROM sensor_data", (err, row:{total}) => {
           if (err) {
             reject(err);
           } else {
             resolve(row.total || 0);
           }
         });
       });
     } */
    RecordsChanged() {
        return __awaiter(this, void 0, void 0, function* () {
            return new Promise((resolve, reject) => {
                this.db.get("SELECT COUNT(*) as total FROM sensor_data", (err, row) => {
                    if (err) {
                        reject(false);
                    }
                    else {
                        let result = (row.total || 0) != this.Nrecords ? true : false;
                        this.Nrecords = row.total;
                        resolve({ record: this.Nrecords, change: result });
                    }
                });
            });
        });
    }
    // Ottieni tutti i record dei sensori con paginazione
    getAllSensorRecords(page = 1, pageSize = 100) {
        return __awaiter(this, void 0, void 0, function* () {
            return new Promise((resolve, reject) => {
                const offset = (page - 1) * pageSize;
                // Conta totale
                this.db.get('SELECT COUNT(*) as total FROM sensor_data', (err, row) => {
                    if (err) {
                        reject(err);
                        return;
                    }
                    // Ottieni record paginati
                    const sql = `
          SELECT * FROM sensor_data 
          ORDER BY timestamp DESC 
          LIMIT ? OFFSET ?
        `;
                    this.db.all(sql, [pageSize, offset], (err, rows) => {
                        if (err) {
                            reject(err);
                        }
                        else {
                            // Converti i record per mantenere la compatibilità con l'interfaccia
                            const records = rows.map((row) => ({
                                uid: row.uid,
                                timestamp: row.timestamp,
                                datetime: row.datetime,
                                credito_precedente: row.credito_precedente,
                                credito_attuale: row.credito_attuale,
                                status: row.status
                            }));
                            resolve({
                                records: records,
                                total: row.total
                            });
                        }
                    });
                });
            });
        });
    }
    // Ottieni record in un intervallo di tempo
    getSensorRecordsByTimeRange(startTime, endTime) {
        return __awaiter(this, void 0, void 0, function* () {
            return new Promise((resolve, reject) => {
                const sql = `
        SELECT * FROM sensor_data 
        WHERE timestamp BETWEEN ? AND ? 
        ORDER BY timestamp DESC
      `;
                this.db.all(sql, [startTime, endTime], (err, rows) => {
                    if (err) {
                        reject(err);
                    }
                    else {
                        const records = rows.map((row) => ({
                            uid: row.uid,
                            timestamp: row.timestamp,
                            datetime: row.datetime,
                            credito_precedente: row.credito_precedente,
                            credito_attuale: row.credito_attuale,
                            status: row.status
                        }));
                        resolve(records);
                    }
                });
            });
        });
    }
    // Ottieni record per UID specifico
    getSensorRecordByUID(uid) {
        return __awaiter(this, void 0, void 0, function* () {
            return new Promise((resolve, reject) => {
                const sql = `
        SELECT * FROM sensor_data 
        WHERE uid = ?
        ORDER BY timestamp DESC
        LIMIT 1
      `;
                this.db.get(sql, [uid], (err, row) => {
                    if (err) {
                        reject(err);
                    }
                    else if (!row) {
                        resolve(null);
                    }
                    else {
                        const record = {
                            uid: row.uid,
                            timestamp: row.timestamp,
                            datetime: row.datetime,
                            credito_precedente: row.credito_precedente,
                            credito_attuale: row.credito_attuale,
                            status: row.status
                        };
                        resolve(record);
                    }
                });
            });
        });
    }
    // Ottieni tutte le operazioni per UID specifico
    getSensorRecordsByUID(uid, limit = 100) {
        return __awaiter(this, void 0, void 0, function* () {
            return new Promise((resolve, reject) => {
                const sql = `
        SELECT * FROM sensor_data 
        WHERE uid = ?
        ORDER BY timestamp DESC
        LIMIT ?
      `;
                this.db.all(sql, [uid, limit], (err, rows) => {
                    if (err) {
                        reject(err);
                    }
                    else {
                        const records = rows.map((row) => ({
                            uid: row.uid,
                            timestamp: row.timestamp,
                            datetime: row.datetime,
                            credito_precedente: row.credito_precedente,
                            credito_attuale: row.credito_attuale,
                            status: row.status
                        }));
                        resolve(records);
                    }
                });
            });
        });
    }
    // Pulisci record vecchi dei sensori
    cleanOldSensorRecords(daysToKeep = 30) {
        return __awaiter(this, void 0, void 0, function* () {
            return new Promise((resolve, reject) => {
                const cutoffTime = Date.now() - (daysToKeep * 24 * 60 * 60 * 1000);
                // Elimina tutti i record più vecchi di cutoffTime, ma NON elimina mai l'ultimo record per ogni uid
                const sql = `
        DELETE FROM sensor_data
        WHERE timestamp < ?
          AND rowid NOT IN (
            SELECT rowid FROM (
              SELECT rowid, uid, MAX(datetime) OVER (PARTITION BY uid) as max_dt
              FROM sensor_data
            )
            WHERE datetime = max_dt
          )
      `;
                this.db.run(sql, [cutoffTime], function (err) {
                    if (err) {
                        reject(err);
                    }
                    else {
                        resolve(this.changes || 0);
                    }
                });
            });
        });
    }
    // Conta tutte le transazioni reali (tutte le righe di sensor_data)
    countAllSensorData() {
        return __awaiter(this, void 0, void 0, function* () {
            return new Promise((resolve, reject) => {
                const sql = 'SELECT COUNT(*) as total FROM sensor_data';
                this.db.get(sql, (err, row) => {
                    if (err) {
                        reject(err);
                    }
                    else {
                        resolve(row.total || 0);
                    }
                });
            });
        });
    }
    // Controlla lo stato dell'AUTOINCREMENT
    checkAutoIncrementStatus() {
        return __awaiter(this, void 0, void 0, function* () {
            return new Promise((resolve, reject) => {
                const sql = `
        SELECT name, seq FROM sqlite_sequence
        WHERE name IN ('sensor_data', 'user_logs', 'spending_monthly_stats')
      `;
                this.db.all(sql, (err, rows) => {
                    if (err) {
                        reject(err);
                    }
                    else {
                        const maxValue = 9223372036854775807; // Valore massimo di INTEGER
                        const status = rows.map((row) => ({
                            table: row.name,
                            currentValue: row.seq,
                            maxValue: maxValue,
                            percentage: Math.round((row.seq / maxValue) * 100 * 1000000) / 1000000 // Arrotondato a 6 decimali
                        }));
                        resolve(status);
                    }
                });
            });
        });
    }
    // Ottieni statistiche delle tabelle di backup
    getBackupTablesStats() {
        return __awaiter(this, void 0, void 0, function* () {
            return new Promise((resolve, reject) => {
                const sql = `
        SELECT 
          'spending_summary' as table_name,
          COUNT(*) as record_count
        FROM spending_summary
        UNION ALL
        SELECT 
          'spending_monthly_stats' as table_name,
          COUNT(*) as record_count
        FROM spending_monthly_stats
      `;
                this.db.all(sql, (err, rows) => {
                    if (err) {
                        reject(err);
                    }
                    else {
                        const stats = rows.map((row) => ({
                            table: row.table_name,
                            recordCount: row.record_count
                        }));
                        resolve(stats);
                    }
                });
            });
        });
    }
    // === FUNZIONI PER I possessori DEI TAG NFC ===
    // Aggiungi un nuovo possessore di tag
    addTagOwner(tagOwner) {
        return __awaiter(this, void 0, void 0, function* () {
            return new Promise((resolve, reject) => {
                tagOwner.nominativo = tagOwner.nominativo.toUpperCase();
                tagOwner.indirizzo = tagOwner.indirizzo.toUpperCase();
                console.log("questo è il nominativo: ");
                console.log(tagOwner.nominativo);
                //  const sql = `
                //     INSERT OR REPLACE INTO tag_owners (uid, nominativo, indirizzo, note,created_at,updated_at  )
                //     VALUES (?, ?, ?, ?, ?,?)
                //   `;
                //   const sql = `
                //   INSERT   INTO tag_owners (uid, nominativo, indirizzo, note,created_at,updated_at  )
                //   VALUES (?, ?, ?, ?, ?,?)
                // `;
                const sql = `
    INSERT INTO tag_owners (uid, nominativo, indirizzo, note, created_at, updated_at)
    VALUES (?, ?, ?, ?, ?, ?)
    ON CONFLICT(uid) DO UPDATE SET
     
      nominativo = COALESCE(EXCLUDED.nominativo, tag_owners.nominativo), -- Mantieni vecchio se nuovo è vuoto
      indirizzo = COALESCE(EXCLUDED.indirizzo, tag_owners.indirizzo),
     note = COALESCE(EXCLUDED.note, tag_owners.note),
     updated_at = EXCLUDED.updated_at;
  `;
                // NOTA: Se vuoi che i campi nominativo, indirizzo, note si aggiornino
                // quando un UID già esiste e viene fornito un nuovo record, dovresti aggiungerli al DO UPDATE SET:
                // SET
                this.db.run(sql, [
                    tagOwner.uid,
                    tagOwner.nominativo,
                    tagOwner.indirizzo,
                    tagOwner.note || null,
                    tagOwner.created_at,
                    tagOwner.created_at,
                ], function (err) {
                    if (err) {
                        console.error('Errore inserimento possessore tag:', err);
                        reject(err);
                    }
                    else {
                        // Controlla se è stato inserito nuovo record o aggiornato esistente
                        const action = this.changes > 0 ? (this.changes === 1 ? 'inserito' : 'aggiornato') : 'nessuna modifica';
                        console.log(`possessore tag ${action} nel database per UID: ${tagOwner.uid}`);
                        resolve();
                    }
                });
            });
        });
    }
    // Ottieni possessore per UID specifico
    getTagOwnerByUID(uid) {
        return __awaiter(this, void 0, void 0, function* () {
            return new Promise((resolve, reject) => {
                const sql = `
        SELECT * FROM tag_owners 
        WHERE uid = ?
      `;
                this.db.get(sql, [uid], (err, row) => {
                    if (err) {
                        reject(err);
                    }
                    else if (!row) {
                        resolve(null);
                    }
                    else {
                        const tagOwner = {
                            uid: row.uid,
                            nominativo: row.nominativo,
                            indirizzo: row.indirizzo,
                            note: row.note,
                            created_at: row.created_at,
                            updated_at: row.updated_at
                        };
                        resolve(tagOwner);
                    }
                });
            });
        });
    }
    // Ottieni tutti i possessori dei tag
    getAllTagOwners() {
        return __awaiter(this, void 0, void 0, function* () {
            return new Promise((resolve, reject) => {
                const sql = `
        SELECT * FROM tag_owners 
        ORDER BY nominativo ASC
      `;
                this.db.all(sql, (err, rows) => {
                    if (err) {
                        reject(err);
                    }
                    else {
                        const tagOwners = rows.map((row) => ({
                            uid: row.uid,
                            nominativo: row.nominativo,
                            indirizzo: row.indirizzo,
                            note: row.note,
                            created_at: row.created_at,
                            updated_at: row.updated_at
                        }));
                        resolve(tagOwners);
                    }
                });
            });
        });
    }
    // Cerca possessori per nominativo
    searchTagOwnersByNominativo(searchTerm) {
        return __awaiter(this, void 0, void 0, function* () {
            return new Promise((resolve, reject) => {
                const sql = `
        SELECT * FROM tag_owners 
        WHERE nominativo LIKE ? 
        ORDER BY nominativo ASC
      `;
                this.db.all(sql, [`%${searchTerm}%`], (err, rows) => {
                    if (err) {
                        reject(err);
                    }
                    else {
                        const tagOwners = rows.map((row) => ({
                            uid: row.uid,
                            nominativo: row.nominativo,
                            indirizzo: row.indirizzo,
                            note: row.note,
                            created_at: row.created_at,
                            updated_at: row.updated_at
                        }));
                        resolve(tagOwners);
                    }
                });
            });
        });
    }
    // Elimina possessore per UID
    deleteTagOwner(uid) {
        return __awaiter(this, void 0, void 0, function* () {
            return new Promise((resolve, reject) => {
                const sql = `
        DELETE FROM tag_owners 
        WHERE uid = ?
      `;
                this.db.run(sql, [uid], function (err) {
                    if (err) {
                        reject(err);
                    }
                    else {
                        resolve(this.changes > 0);
                    }
                });
            });
        });
    }
    // === FUNZIONI PER LA DASHBOARD SPESE ===
    // Calcola la spesa totale per un UID specifico (con supporto backup Scenario 2)
    getTotalSpendingByUID(uid) {
        return __awaiter(this, void 0, void 0, function* () {
            return new Promise((resolve, reject) => {
                const sql = `
        SELECT * FROM sensor_data 
        WHERE uid = ?
        ORDER BY timestamp DESC
      `;
                this.db.all(sql, [uid], (err, rows) => __awaiter(this, void 0, void 0, function* () {
                    if (err) {
                        reject(err);
                    }
                    else if (rows.length === 0) {
                        // Se non ci sono record operativi, prova a usare il backup
                        try {
                            const backupStats = yield this.getSpendingSummary(uid);
                            if (backupStats) {
                                resolve({
                                    uid,
                                    totalSpent: backupStats.totalSpent,
                                    firstOperation: null,
                                    lastOperation: null,
                                    totalOperations: backupStats.totalOperations,
                                    spendingOperations: backupStats.spendingOperations,
                                    averageSpentPerSpending: backupStats.spendingOperations > 0
                                        ? Math.round((backupStats.totalSpent / backupStats.spendingOperations) * 100) / 100
                                        : 0,
                                    operations: [],
                                    fromBackup: true
                                });
                                return;
                            }
                        }
                        catch (backupError) {
                            console.log('Nessun backup disponibile per UID:', uid);
                        }
                        // Recupera informazioni del possessore del tag
                        const tagOwner = yield this.getTagOwnerByUID(uid);
                        resolve({
                            uid,
                            totalSpent: 0,
                            firstOperation: null,
                            lastOperation: null,
                            totalOperations: 0,
                            spendingOperations: 0,
                            averageSpentPerSpending: 0,
                            operations: [],
                            tagOwner
                        });
                    }
                    else {
                        // Calcola statistiche dai dati correnti
                        let currentTotalSpent = 0;
                        let currentTotalCredits = 0;
                        const operations = [];
                        // Calcola la spesa per ogni operazione
                        rows.forEach((row) => {
                            let spesa = 0;
                            // Calcola la spesa solo per operazioni di tipo "spesa"
                            if (row.status === 'spesa') {
                                spesa = Math.round((row.credito_precedente - row.credito_attuale) * 100) / 100;
                                currentTotalSpent += spesa;
                            }
                            // Per "accredito" calcola il valore dell'accredito (credito_attuale - credito_precedente)
                            else if (row.status === 'accredito') {
                                spesa = Math.round((row.credito_attuale - row.credito_precedente) * 100) / 100;
                                currentTotalCredits += spesa;
                            }
                            // Per "azzeramento" calcola il valore dell'azzeramento (credito_precedente, perché credito_attuale è sempre 0)
                            else if (row.status === 'azzeramento') {
                                spesa = Math.round(row.credito_precedente * 100) / 100; // Valore dell'azzeramento
                                currentTotalCredits += spesa;
                            }
                            operations.push({
                                timestamp: row.timestamp,
                                datetime: row.datetime,
                                credito_precedente: row.credito_precedente,
                                credito_attuale: row.credito_attuale,
                                spesa: spesa,
                                status: row.status
                            });
                        });
                        const currentTotalOperations = rows.length;
                        const currentSpendingOperations = operations.filter(op => op.status === 'spesa').length;
                        // Recupera dati dal backup
                        const backupStats = yield this.getSpendingSummary(uid);
                        // Combina i dati correnti con quelli del backup
                        const combinedTotalSpent = currentTotalSpent + ((backupStats === null || backupStats === void 0 ? void 0 : backupStats.totalSpent) || 0);
                        const combinedTotalCredits = currentTotalCredits + ((backupStats === null || backupStats === void 0 ? void 0 : backupStats.totalCredits) || 0);
                        const combinedTotalOperations = currentTotalOperations + ((backupStats === null || backupStats === void 0 ? void 0 : backupStats.totalOperations) || 0);
                        const combinedSpendingOperations = currentSpendingOperations + ((backupStats === null || backupStats === void 0 ? void 0 : backupStats.spendingOperations) || 0);
                        // Calcola la spesa media combinata
                        const averageSpentPerSpending = combinedSpendingOperations > 0
                            ? Math.round((combinedTotalSpent / combinedSpendingOperations) * 100) / 100
                            : 0;
                        // Prima e ultima operazione solo dai dati correnti
                        const firstOperation = {
                            uid: rows[rows.length - 1].uid,
                            timestamp: rows[rows.length - 1].timestamp,
                            datetime: rows[rows.length - 1].datetime,
                            credito_precedente: rows[rows.length - 1].credito_precedente,
                            credito_attuale: rows[rows.length - 1].credito_attuale,
                            status: rows[rows.length - 1].status
                        };
                        const lastOperation = {
                            uid: rows[0].uid,
                            timestamp: rows[0].timestamp,
                            datetime: rows[0].datetime,
                            credito_precedente: rows[0].credito_precedente,
                            credito_attuale: rows[0].credito_attuale,
                            status: rows[0].status
                        };
                        // Recupera informazioni del possessore del tag
                        const tagOwner = yield this.getTagOwnerByUID(uid);
                        resolve({
                            uid,
                            totalSpent: combinedTotalSpent,
                            firstOperation,
                            lastOperation,
                            totalOperations: combinedTotalOperations,
                            spendingOperations: combinedSpendingOperations,
                            averageSpentPerSpending: averageSpentPerSpending,
                            operations,
                            tagOwner,
                            fromBackup: backupStats ? true : false
                        });
                    }
                }));
            });
        });
    }
    // Ottieni statistiche di spesa per tutti gli UID (con supporto backup Scenario 2)
    getAllSpendingStats() {
        return __awaiter(this, void 0, void 0, function* () {
            return new Promise((resolve, reject) => {
                // Query per ottenere tutte le statistiche (incluso l'ultimo record) - PER LA DASHBOARD
                const sql = `
        SELECT uid, 
               COUNT(*) as total_operations,
               SUM(CASE 
                 WHEN status = 'spesa' THEN (credito_precedente - credito_attuale)
                 ELSE 0 
               END) as total_spent,
               COUNT(CASE WHEN status = 'spesa' THEN 1 END) as spending_operations,
               SUM(CASE 
                 WHEN status = 'accredito' THEN (credito_attuale - credito_precedente)
                 WHEN status = 'azzeramento' THEN (-credito_precedente)
                 ELSE 0 
               END) as total_accrediti,
               MAX(datetime) as last_operation,
               (SELECT credito_attuale FROM sensor_data WHERE uid = sd.uid ORDER BY datetime DESC LIMIT 1) as credito_attuale
        FROM sensor_data sd
        GROUP BY uid
        ORDER BY total_spent DESC
      `;
                this.db.all(sql, (err, rows) => __awaiter(this, void 0, void 0, function* () {
                    if (err) {
                        reject(err);
                    }
                    else {
                        const stats = rows.map((row) => {
                            // Calcola la media solo per le operazioni di spesa
                            const spendingOperations = row.spending_operations || 0;
                            const averageSpentPerSpending = spendingOperations > 0
                                ? Math.round((row.total_spent / spendingOperations) * 100) / 100
                                : 0;
                            return {
                                uid: row.uid,
                                totalSpent: Math.round((row.total_spent || 0) * 100) / 100,
                                totalOperations: row.total_operations,
                                spendingOperations: spendingOperations,
                                averageSpentPerSpending: averageSpentPerSpending,
                                totalAccrediti: Math.round((row.total_accrediti || 0) * 100) / 100,
                                lastOperation: row.last_operation,
                                creditoAttuale: Math.round((row.credito_attuale || 0) * 100) / 100,
                                fromBackup: false
                            };
                        });
                        // Per ogni UID, controlla se ci sono statistiche di backup da aggiungere
                        const enhancedStats = yield Promise.all(stats.map((stat) => __awaiter(this, void 0, void 0, function* () {
                            try {
                                const backupStats = yield this.getSpendingSummary(stat.uid);
                                if (backupStats) {
                                    // Combina i dati operativi con quelli del backup
                                    const combinedTotalSpent = (stat.totalSpent || 0) + (backupStats.totalSpent || 0);
                                    const combinedTotalOperations = (stat.totalOperations || 0) + (backupStats.totalOperations || 0);
                                    const combinedSpendingOperations = (stat.spendingOperations || 0) + (backupStats.spendingOperations || 0);
                                    const combinedTotalAccrediti = (stat.totalAccrediti || 0) + (backupStats.totalCredits || 0);
                                    // Calcola la spesa media combinata (operativi + backup)
                                    const averageSpentPerSpending = combinedSpendingOperations > 0
                                        ? Math.round((combinedTotalSpent / combinedSpendingOperations) * 100) / 100
                                        : 0;
                                    return Object.assign(Object.assign({}, stat), { totalSpent: Math.round(combinedTotalSpent * 100) / 100, totalOperations: combinedTotalOperations, spendingOperations: combinedSpendingOperations, averageSpentPerSpending: averageSpentPerSpending, totalAccrediti: Math.round(combinedTotalAccrediti * 100) / 100, fromBackup: true });
                                }
                            }
                            catch (e) { }
                            return stat;
                        })));
                        resolve(enhancedStats);
                    }
                }));
            });
        });
    }
    // Ottieni statistiche di spesa per il backup (escludendo l'ultimo record per ogni UID)
    getSpendingStatsForBackup() {
        return __awaiter(this, void 0, void 0, function* () {
            return new Promise((resolve, reject) => {
                // Query per il backup - esclude l'ultimo record per ogni UID
                const sql = `
        SELECT uid, 
               COUNT(*) as total_operations,
               COUNT(CASE WHEN status = 'spesa' THEN 1 END) as spending_operations,
               SUM(CASE 
                 WHEN status = 'spesa' THEN (credito_precedente - credito_attuale)
                 ELSE 0 
               END) as total_spent,
               SUM(CASE 
                 WHEN status = 'accredito' THEN (credito_attuale - credito_precedente)
                 WHEN status = 'azzeramento' THEN (-credito_precedente)
                 ELSE 0 
               END) as total_accrediti
        FROM sensor_data sd
        WHERE (uid, datetime) NOT IN (
          SELECT uid, MAX(datetime) FROM sensor_data GROUP BY uid
        )
        GROUP BY uid
        ORDER BY total_spent DESC
      `;
                this.db.all(sql, (err, rows) => {
                    if (err) {
                        reject(err);
                    }
                    else {
                        const stats = rows.map((row) => ({
                            uid: row.uid,
                            totalSpent: Math.round((row.total_spent || 0) * 100) / 100,
                            totalOperations: row.total_operations,
                            spendingOperations: row.spending_operations || 0,
                            totalAccrediti: Math.round((row.total_accrediti || 0) * 100) / 100
                        }));
                        resolve(stats);
                    }
                });
            });
        });
    }
    // === FUNZIONI PER SCENARIO 2: BACKUP STATISTICHE ===
    // Salva/aggiorna statistiche aggregate per un UID
    saveSpendingSummary(uid, stats) {
        return __awaiter(this, void 0, void 0, function* () {
            return new Promise((resolve, reject) => {
                const sql = `
        INSERT OR REPLACE INTO spending_summary 
        (uid, total_operations, spending_operations, total_spent, total_credits, last_operation_timestamp, last_credito_attuale, period_start_date, period_end_date, updated_at)
        VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, CURRENT_TIMESTAMP)
      `;
                const now = new Date().toISOString().split('T')[0]; // YYYY-MM-DD
                this.db.run(sql, [
                    uid,
                    stats.totalOperations,
                    stats.spendingOperations,
                    stats.totalSpent,
                    stats.totalCredits,
                    stats.lastOperationTimestamp,
                    stats.lastCreditoAttuale,
                    now,
                    now // period_end_date (per ora usa oggi)
                ], function (err) {
                    if (err) {
                        console.error('Errore salvataggio spending summary:', err);
                        reject(err);
                    }
                    else {
                        console.log(`Statistiche aggregate salvate per UID: ${uid}`);
                        resolve();
                    }
                });
            });
        });
    }
    // Ottieni statistiche aggregate per un UID
    getSpendingSummary(uid) {
        return __awaiter(this, void 0, void 0, function* () {
            return new Promise((resolve, reject) => {
                const sql = `
        SELECT * FROM spending_summary 
        WHERE uid = ?
      `;
                this.db.get(sql, [uid], (err, row) => {
                    if (err) {
                        reject(err);
                    }
                    else if (!row) {
                        resolve(null);
                    }
                    else {
                        resolve({
                            uid: row.uid,
                            totalOperations: row.total_operations,
                            spendingOperations: row.spending_operations || 0,
                            totalSpent: row.total_spent,
                            totalCredits: row.total_credits,
                            lastOperationTimestamp: row.last_operation_timestamp,
                            lastCreditoAttuale: row.last_credito_attuale,
                            periodStartDate: row.period_start_date,
                            periodEndDate: row.period_end_date
                        });
                    }
                });
            });
        });
    }
    // Ottieni UID che hanno solo backup (nessun record operativo)
    getUIDsWithBackupOnly() {
        return __awaiter(this, void 0, void 0, function* () {
            return new Promise((resolve, reject) => {
                const sql = `
        SELECT ss.uid, ss.total_operations, ss.total_spent, ss.total_credits, 
               ss.last_operation_timestamp, ss.last_credito_attuale
        FROM spending_summary ss
        WHERE NOT EXISTS (
          SELECT 1 FROM sensor_data sd WHERE sd.uid = ss.uid
        )
      `;
                this.db.all(sql, (err, rows) => {
                    if (err) {
                        console.error('Errore nella query getUIDsWithBackupOnly:', err);
                        reject(err);
                    }
                    else {
                        const backupStats = rows.map((row) => ({
                            uid: row.uid,
                            totalOperations: row.total_operations,
                            totalSpent: row.total_spent,
                            totalCredits: row.total_credits,
                            lastOperationTimestamp: row.last_operation_timestamp,
                            lastCreditoAttuale: row.last_credito_attuale
                        }));
                        resolve(backupStats);
                    }
                });
            });
        });
    }
    // Crea backup mensile delle statistiche
    createMonthlyBackup(yearMonth, stats) {
        return __awaiter(this, void 0, void 0, function* () {
            return new Promise((resolve, reject) => {
                // Inizia transazione
                this.db.serialize(() => {
                    this.db.run('BEGIN TRANSACTION');
                    const insertPromises = stats.map(stat => {
                        return new Promise((resolveStat, rejectStat) => {
                            const sql = `
              INSERT OR REPLACE INTO spending_monthly_stats 
              (uid, year_month, total_operations, total_spending_operations, total_spent, total_credits)
              VALUES (?, ?, ?, ?, ?, ?)
            `;
                            this.db.run(sql, [
                                stat.uid,
                                yearMonth,
                                stat.totalOperations,
                                stat.spendingOperations,
                                stat.totalSpent,
                                stat.totalAccrediti
                            ], function (err) {
                                if (err) {
                                    rejectStat(err);
                                }
                                else {
                                    resolveStat();
                                }
                            });
                        });
                    });
                    Promise.all(insertPromises)
                        .then(() => {
                        this.db.run('COMMIT', (err) => {
                            if (err) {
                                reject(err);
                            }
                            else {
                                console.log(`Backup mensile completato per ${yearMonth}`);
                                resolve();
                            }
                        });
                    })
                        .catch((error) => {
                        this.db.run('ROLLBACK', () => {
                            reject(error);
                        });
                    });
                });
            });
        });
    }
    // Backup delle statistiche prima della pulizia (Scenario 2)
    backupStatisticsBeforeCleanup() {
        return __awaiter(this, void 0, void 0, function* () {
            try {
                console.log('Inizio backup statistiche prima della pulizia...');
                // 1. Calcola statistiche correnti per il backup (escludendo l'ultimo record per ogni UID)
                const currentStats = yield this.getSpendingStatsForBackup();
                // 2. Salva in tabella spending_summary (SOMMANDO con i dati precedenti)
                for (const stat of currentStats) {
                    // Recupera statistiche precedenti dal backup
                    const previousStats = yield this.getSpendingSummary(stat.uid);
                    // Somma le statistiche correnti con quelle precedenti
                    const combinedStats = {
                        totalOperations: ((previousStats === null || previousStats === void 0 ? void 0 : previousStats.totalOperations) || 0) + stat.totalOperations,
                        spendingOperations: ((previousStats === null || previousStats === void 0 ? void 0 : previousStats.spendingOperations) || 0) + stat.spendingOperations,
                        totalSpent: Math.round((((previousStats === null || previousStats === void 0 ? void 0 : previousStats.totalSpent) || 0) + stat.totalSpent) * 100) / 100,
                        totalCredits: Math.round((((previousStats === null || previousStats === void 0 ? void 0 : previousStats.totalCredits) || 0) + stat.totalAccrediti) * 100) / 100,
                        lastOperationTimestamp: Date.now(),
                        lastCreditoAttuale: 0 // Sarà aggiornato dal record rimanente
                    };
                    yield this.saveSpendingSummary(stat.uid, combinedStats);
                    console.log(`Backup UID ${stat.uid}: ${stat.totalOperations} operazioni sommate a ${(previousStats === null || previousStats === void 0 ? void 0 : previousStats.totalOperations) || 0} precedenti = ${combinedStats.totalOperations} totali`);
                }
                // 3. Crea backup mensile
                const currentMonth = new Date().toISOString().slice(0, 7); // "2025-01"
                yield this.createMonthlyBackup(currentMonth, currentStats);
                console.log('Backup statistiche completato');
            }
            catch (error) {
                console.error('Errore nel backup delle statistiche:', error);
                throw error;
            }
        });
    }
    // Aggrega per mese le operazioni e la spesa di un UID, sommando sensor_data e spending_monthly_stats
    getMonthlyStatsByUID(uid) {
        return __awaiter(this, void 0, void 0, function* () {
            return new Promise((resolve, reject) => {
                // Query per sensor_data (transazioni ancora presenti) - formato MM-YYYY
                const sqlSensor = `
        SELECT   SUBSTR(datetime, 4, 2) || '-' || SUBSTR(datetime, 7, 4) as yearMonth,
               COUNT(*) as totalOperations,
               COUNT(CASE WHEN status = 'spesa' THEN 1 END) as totalSpendingOperations,
               SUM(CASE WHEN status = 'spesa' THEN (credito_precedente - credito_attuale) ELSE 0 END) as totalSpent,
               SUM(CASE 
                 WHEN status = 'accredito' THEN (credito_attuale - credito_precedente)
                 WHEN status = 'azzeramento' THEN (-credito_precedente)
                 ELSE 0 
               END) as totalAccrediti
        FROM sensor_data
        WHERE uid = ?
        GROUP BY yearMonth
      `;
                this.db.all(sqlSensor, [uid], (err, sensorRows) => {
                    if (err) {
                        reject(err);
                    }
                    else {
                        // Query per spending_monthly_stats (backup mensile) - converti YYYY-MM in MM-YYYY
                        const sqlBackup = `
            SELECT 
              SUBSTR(year_month, 6, 2) || '-' || SUBSTR(year_month, 1, 4) as yearMonth,
              total_operations as totalOperations,
              total_spending_operations as totalSpendingOperations,
              total_spent as totalSpent, 
              total_credits as totalAccrediti
            FROM spending_monthly_stats
            WHERE uid = ?
          `;
                        this.db.all(sqlBackup, [uid], (err2, backupRows) => {
                            if (err2) {
                                reject(err2);
                            }
                            else {
                                // Unisci i risultati per mese
                                const monthlyMap = new Map();
                                for (const row of sensorRows) {
                                    monthlyMap.set(row.yearMonth, {
                                        totalOperations: row.totalOperations || 0,
                                        totalSpendingOperations: row.totalSpendingOperations || 0,
                                        totalSpent: row.totalSpent || 0,
                                        totalAccrediti: row.totalAccrediti || 0
                                    });
                                }
                                for (const row of backupRows) {
                                    if (monthlyMap.has(row.yearMonth)) {
                                        const prev = monthlyMap.get(row.yearMonth);
                                        monthlyMap.set(row.yearMonth, {
                                            totalOperations: prev.totalOperations + (row.totalOperations || 0),
                                            totalSpendingOperations: prev.totalSpendingOperations + (row.totalSpendingOperations || 0),
                                            totalSpent: prev.totalSpent + (row.totalSpent || 0),
                                            totalAccrediti: prev.totalAccrediti + (row.totalAccrediti || 0)
                                        });
                                    }
                                    else {
                                        monthlyMap.set(row.yearMonth, {
                                            totalOperations: row.totalOperations || 0,
                                            totalSpendingOperations: row.totalSpendingOperations || 0,
                                            totalSpent: row.totalSpent || 0,
                                            totalAccrediti: row.totalAccrediti || 0
                                        });
                                    }
                                }
                                // Ordina per mese
                                const result = Array.from(monthlyMap.entries())
                                    .map(([yearMonth, data]) => (Object.assign({ yearMonth }, data)))
                                    .sort((a, b) => a.yearMonth.localeCompare(b.yearMonth));
                                resolve(result);
                            }
                        });
                    }
                });
            });
        });
    }
    // Elimina tutti i dati da tutte le tabelle e resetta gli autoincrementali
    resetAllTables() {
        return __awaiter(this, void 0, void 0, function* () {
            return new Promise((resolve, reject) => {
                this.db.serialize(() => {
                    this.db.run('DELETE FROM sensor_data');
                    this.db.run('DELETE FROM user_logs');
                    this.db.run('DELETE FROM tag_owners');
                    this.db.run('DELETE FROM spending_summary');
                    this.db.run('DELETE FROM spending_monthly_stats');
                    // Reset autoincrementali
                    this.db.run("DELETE FROM sqlite_sequence WHERE name='sensor_data'");
                    this.db.run("DELETE FROM sqlite_sequence WHERE name='user_logs'");
                    this.db.run("DELETE FROM sqlite_sequence WHERE name='spending_monthly_stats'");
                    // Non serve per tag_owners/spending_summary (no autoincrement)
                    this.db.run('VACUUM', (err) => {
                        if (err)
                            reject(err);
                        else
                            resolve();
                    });
                });
            });
        });
    }
    // Chiudi connessione database
    close() {
        this.db.close();
    }
}
exports.database = new Database();

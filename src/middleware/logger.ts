import { Request, Response, NextFunction } from 'express';
import { database, UserLog } from '../database';

// Middleware per loggare le azioni degli utenti
export function userLogger(req: Request, res: Response, next: NextFunction): void {
  // Salva il timestamp originale
  const startTime = Date.now();
  
  // Estrai informazioni utente
  const userId = req.headers['user-id'] as string || req.ip || 'unknown';
  const userAgent = req.headers['user-agent'] || 'unknown';
  const ipAddress = req.ip || req.connection.remoteAddress || 'unknown';
  
  // Intercetta la risposta per loggare il risultato
  const originalSend = res.send;
  res.send = function(data: any) {
    const endTime = Date.now();
    const duration = endTime - startTime;
    
    // Determina l'azione basata sul metodo HTTP e path
    let action = `${req.method} ${req.path}`;
    
    // Aggiungi dettagli specifici per alcune azioni
    if (req.path === '/postjson') {
      action = 'POST_SENSOR_DATA';
    } else if (req.path === '/sensor-data') {
      action = 'VIEW_SENSOR_DATA';
    } else if (req.path.startsWith('/api/')) {
      action = `API_${req.method}_${req.path.replace('/api/', '')}`;
    }
    
    // Crea il log
    const log: UserLog = {
      user_id: userId,
      action: action,
      timestamp: startTime,
      ip_address: ipAddress,
      user_agent: userAgent,
      details: JSON.stringify({
        method: req.method,
        path: req.path,
        statusCode: res.statusCode,
        duration: `${duration}ms`,
        query: req.query,
        body: req.method === 'POST' ? '***' : undefined // Non loggare body per sicurezza
      })
    };
    
    // Salva il log in background (non bloccare la risposta)
    database.addLog(log).catch(err => {
      console.error('Errore salvataggio log:', err);
    });
    
    // Chiama il metodo send originale
    return originalSend.call(this, data);
  };
  
  next();
}

// Funzione per loggare azioni specifiche
export function logUserAction(userId: string, action: string, details?: any): void {
  const log: UserLog = {
    user_id: userId,
    action: action,
    timestamp: Date.now(),
    details: details ? JSON.stringify(details) : undefined
  };
  
  database.addLog(log).catch(err => {
    console.error('Errore salvataggio log azione:', err);
  });
} 
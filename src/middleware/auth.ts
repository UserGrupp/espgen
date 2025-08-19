import { Request, Response, NextFunction } from 'express';

// Autenticazione Basic HTTP per proteggere tutte le rotte
// Usa variabili d'ambiente ADMIN_USER e ADMIN_PASSWORD, con default sicuri
const ADMIN_USER = process.env.ADMIN_USER || 'admin0';
const ADMIN_PASSWORD = process.env.ADMIN_PASSWORD || 'esp32';

export function basicAuth(req: Request, res: Response, next: NextFunction): void {
  const authHeader = req.headers['authorization'];

  if (!authHeader || !authHeader.startsWith('Basic ')) {
    res.setHeader('WWW-Authenticate', 'Basic realm="ESP Home Server"');
    res.status(401).send('Autenticazione richiesta');
    return;
  }

  const base64Credentials = authHeader.split(' ')[1];
  let decoded: string;
  try {
    decoded = Buffer.from(base64Credentials, 'base64').toString('utf8');
  } catch {
    res.setHeader('WWW-Authenticate', 'Basic realm="ESP Home Server"');
    res.status(401).send('Credenziali non valide');
    return;
  }

  const separatorIndex = decoded.indexOf(':');
  const username = separatorIndex >= 0 ? decoded.slice(0, separatorIndex) : '';
  const password = separatorIndex >= 0 ? decoded.slice(separatorIndex + 1) : '';

  const isValid = username === ADMIN_USER && password === ADMIN_PASSWORD;
  if (!isValid) {
    res.setHeader('WWW-Authenticate', 'Basic realm="ESP Home Server"');
    res.status(401).send('Accesso negato');
    return;
  }

  // Opzionale: memorizza l'utente autenticato per i log
  (req as any).authenticatedUser = username;
  next();
}



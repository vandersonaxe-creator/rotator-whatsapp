/**
 * Environment configuration loader
 * Supports both direct env vars and Docker Swarm secrets (via _FILE suffix)
 */
import * as fs from 'fs';

function getEnvVar(key: string, defaultValue?: string): string {
  // Try _FILE suffix first (Docker Swarm secrets)
  const fileKey = `${key}_FILE`;
  const filePath = process.env[fileKey];
  
  if (filePath) {
    try {
      if (fs.existsSync(filePath)) {
        const value = fs.readFileSync(filePath, 'utf8').trim();
        if (value) {
          return value;
        }
      }
    } catch (error) {
      console.warn(`Failed to read ${fileKey} from ${filePath}:`, error);
    }
  }
  
  // Fallback to direct env var
  const value = process.env[key];
  if (value) {
    return value;
  }
  
  if (defaultValue !== undefined) {
    return defaultValue;
  }
  
  throw new Error(`Environment variable ${key} is required`);
}

export const config = {
  port: parseInt(getEnvVar('PORT', '3000'), 10),
  databaseUrl: getEnvVar('DATABASE_URL'),
  evolutionBaseUrl: getEnvVar('EVOLUTION_BASE_URL'),
  evolutionApikey: getEnvVar('EVOLUTION_APIKEY'),
  internalToken: getEnvVar('INTERNAL_TOKEN'),
};

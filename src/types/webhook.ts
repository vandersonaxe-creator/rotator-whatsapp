/**
 * Tipos para webhook do Evolution API
 */

export interface EvolutionWebhookMessage {
  event: 'messages.upsert';
  instance: string;
  data: {
    key: {
      remoteJid: string;
      fromMe: boolean;
      id: string;
    };
    message: {
      conversation?: string;
      extendedTextMessage?: {
        text: string;
      };
    };
    messageType: string;
    messageTimestamp: number;
    pushName?: string;
  };
}

export interface EvolutionWebhookEvent {
  event: string;
  instance: string;
  data: any;
}

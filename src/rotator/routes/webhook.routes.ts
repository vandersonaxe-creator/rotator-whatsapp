import { FastifyPluginAsync, FastifyRequest } from 'fastify';
import { EvolutionWebhookMessage, EvolutionWebhookEvent } from '../../types/webhook';
import { EvolutionClient } from '../services/evolution.client';
import { JoinService } from '../services/joinService';

const webhookRoutes: FastifyPluginAsync = async (fastify) => {
  const evolutionClient = new EvolutionClient();
  const joinService = new JoinService(fastify, evolutionClient);

  /**
   * Webhook para receber eventos do Evolution API
   * POST /webhook/evolution
   */
  fastify.post<{ Body: EvolutionWebhookEvent }>('/webhook/evolution', async (request, reply) => {
    try {
      const event = request.body;

      // Log do evento recebido (para debug)
      console.log('[Webhook] Event received:', {
        event: event.event,
        instance: event.instance,
      });

      // Processar apenas eventos de mensagem recebida
      if (event.event === 'messages.upsert') {
        const messageData = event.data as EvolutionWebhookMessage['data'];

        // Ignorar mensagens enviadas por nós mesmos
        if (messageData.key.fromMe) {
          return reply.code(200).send({ received: true, ignored: 'fromMe' });
        }

        // Extrair texto da mensagem
        let messageText = '';
        if (messageData.message?.conversation) {
          messageText = messageData.message.conversation.trim().toUpperCase();
        } else if (messageData.message?.extendedTextMessage?.text) {
          messageText = messageData.message.extendedTextMessage.text.trim().toUpperCase();
        }

        // Processar apenas se a mensagem for "ENTRAR"
        if (messageText === 'ENTRAR') {
          // Extrair número do remetente
          // remoteJid pode ser: 5521999999999@s.whatsapp.net ou 5521999999999@c.us
          const remoteJid = messageData.key.remoteJid;
          const participantPhone = remoteJid.split('@')[0];

          console.log('[Webhook] Processing ENTRAR request:', {
            instance: event.instance,
            participantPhone,
            remoteJid,
          });

          // Processar entrada no grupo
          const result = await joinService.processJoinRequest(
            event.instance,
            participantPhone
          );

          // Enviar resposta ao usuário
          if (result.success) {
            try {
              await evolutionClient.sendTextMessage(
                event.instance,
                remoteJid,
                `✅ ${result.message}`
              );
            } catch (error) {
              console.error('Error sending confirmation message:', error);
            }
          } else {
            try {
              await evolutionClient.sendTextMessage(
                event.instance,
                remoteJid,
                `❌ ${result.message}`
              );
            } catch (error) {
              console.error('Error sending error message:', error);
            }
          }

          return reply.code(200).send({
            received: true,
            processed: true,
            result,
          });
        }

        // Mensagem não é "ENTRAR", ignorar
        return reply.code(200).send({
          received: true,
          ignored: 'not ENTRAR command',
        });
      }

      // Outros tipos de eventos são ignorados
      return reply.code(200).send({
        received: true,
        ignored: 'event type not handled',
      });
    } catch (error: any) {
      console.error('[Webhook] Error processing webhook:', error);
      // Sempre retornar 200 para evitar retries desnecessários
      return reply.code(200).send({
        received: true,
        error: error.message,
      });
    }
  });
};

export default webhookRoutes;

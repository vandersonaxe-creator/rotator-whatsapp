import { FastifyPluginAsync } from 'fastify';
import { WaGroupPool, WaGroup } from '../../types';

const joinRoutes: FastifyPluginAsync = async (fastify) => {
  // Endpoint público: GET /join/:slug
  // NÃO MEXER - Link de anúncios, sempre 302 redirect
  fastify.get<{ Params: { slug: string } }>('/join/:slug', async (request, reply) => {
    const { slug } = request.params;

    try {
      // Query pool by slug
      const poolResult = await fastify.pg.query<WaGroupPool>(
        `SELECT * FROM rotator.wa_group_pools WHERE slug = $1`,
        [slug]
      );

      if (poolResult.rows.length === 0) {
        return reply
          .code(200)
          .header('Cache-Control', 'no-store')
          .type('text/html')
          .send(`
            <!DOCTYPE html>
            <html>
            <head>
              <meta charset="UTF-8">
              <title>Grupo Indisponível</title>
            </head>
            <body>
              <h1>Grupo temporariamente indisponível.</h1>
              <p>Tente novamente em instantes.</p>
            </body>
            </html>
          `);
      }

      const pool = poolResult.rows[0];

      // If no current group, return HTML
      if (!pool.current_group_id) {
        return reply
          .code(200)
          .header('Cache-Control', 'no-store')
          .type('text/html')
          .send(`
            <!DOCTYPE html>
            <html>
            <head>
              <meta charset="UTF-8">
              <title>Grupo Indisponível</title>
            </head>
            <body>
              <h1>Grupo temporariamente indisponível.</h1>
              <p>Tente novamente em instantes.</p>
            </body>
            </html>
          `);
      }

      // Get active group
      const groupResult = await fastify.pg.query<WaGroup>(
        `SELECT * FROM rotator.wa_groups 
         WHERE id = $1 AND status = 'ACTIVE'`,
        [pool.current_group_id]
      );

      if (groupResult.rows.length === 0 || !groupResult.rows[0].invite_url) {
        return reply
          .code(200)
          .header('Cache-Control', 'no-store')
          .type('text/html')
          .send(`
            <!DOCTYPE html>
            <html>
            <head>
              <meta charset="UTF-8">
              <title>Grupo Indisponível</title>
            </head>
            <body>
              <h1>Grupo temporariamente indisponível.</h1>
              <p>Tente novamente em instantes.</p>
            </body>
            </html>
          `);
      }

      const group = groupResult.rows[0];

      // Redirect to invite URL
      if (!group.invite_url) {
        return reply
          .code(200)
          .header('Cache-Control', 'no-store')
          .type('text/html')
          .send(`
            <!DOCTYPE html>
            <html>
            <head>
              <meta charset="UTF-8">
              <title>Grupo Indisponível</title>
            </head>
            <body>
              <h1>Grupo temporariamente indisponível.</h1>
              <p>Tente novamente em instantes.</p>
            </body>
            </html>
          `);
      }

      return reply
        .code(302)
        .header('Cache-Control', 'no-store')
        .redirect(group.invite_url);
    } catch (error) {
      // Never throw exception, always return HTML
      return reply
        .code(200)
        .header('Cache-Control', 'no-store')
        .type('text/html')
        .send(`
          <!DOCTYPE html>
          <html>
          <head>
            <meta charset="UTF-8">
            <title>Grupo Indisponível</title>
          </head>
          <body>
            <h1>Grupo temporariamente indisponível.</h1>
            <p>Tente novamente em instantes.</p>
          </body>
          </html>
        `);
    }
  });

  // Endpoint de UX: GET /join/:slug/page
  // Retorna HTML leve com botão "Abrir no WhatsApp" e auto-forward
  fastify.get<{ Params: { slug: string } }>('/join/:slug/page', async (request, reply) => {
    const { slug } = request.params;

    try {
      // Query pool by slug
      const poolResult = await fastify.pg.query<WaGroupPool>(
        `SELECT * FROM rotator.wa_group_pools WHERE slug = $1`,
        [slug]
      );

      if (poolResult.rows.length === 0) {
        return reply
          .code(200)
          .header('Cache-Control', 'no-store')
          .header('Pragma', 'no-cache')
          .header('Expires', '0')
          .header('X-Robots-Tag', 'noindex, nofollow')
          .type('text/html')
          .send(`
            <!DOCTYPE html>
            <html>
            <head>
              <meta charset="UTF-8">
              <meta name="viewport" content="width=device-width, initial-scale=1.0">
              <title>Grupo Indisponível</title>
            </head>
            <body>
              <h1>Grupo temporariamente indisponível.</h1>
              <p>Tente novamente em instantes.</p>
            </body>
            </html>
          `);
      }

      const pool = poolResult.rows[0];

      // If no current group, return HTML
      if (!pool.current_group_id) {
        return reply
          .code(200)
          .header('Cache-Control', 'no-store')
          .header('Pragma', 'no-cache')
          .header('Expires', '0')
          .header('X-Robots-Tag', 'noindex, nofollow')
          .type('text/html')
          .send(`
            <!DOCTYPE html>
            <html>
            <head>
              <meta charset="UTF-8">
              <meta name="viewport" content="width=device-width, initial-scale=1.0">
              <title>Grupo Indisponível</title>
            </head>
            <body>
              <h1>Grupo temporariamente indisponível.</h1>
              <p>Tente novamente em instantes.</p>
            </body>
            </html>
          `);
      }

      // Get active group
      const groupResult = await fastify.pg.query<WaGroup>(
        `SELECT * FROM rotator.wa_groups 
         WHERE id = $1 AND status = 'ACTIVE'`,
        [pool.current_group_id]
      );

      if (groupResult.rows.length === 0 || !groupResult.rows[0].invite_url) {
        return reply
          .code(200)
          .header('Cache-Control', 'no-store')
          .header('Pragma', 'no-cache')
          .header('Expires', '0')
          .header('X-Robots-Tag', 'noindex, nofollow')
          .type('text/html')
          .send(`
            <!DOCTYPE html>
            <html>
            <head>
              <meta charset="UTF-8">
              <meta name="viewport" content="width=device-width, initial-scale=1.0">
              <title>Grupo Indisponível</title>
            </head>
            <body>
              <h1>Grupo temporariamente indisponível.</h1>
              <p>Tente novamente em instantes.</p>
            </body>
            </html>
          `);
      }

      const group = groupResult.rows[0];

      if (!group.invite_url) {
        return reply
          .code(200)
          .header('Cache-Control', 'no-store')
          .header('Pragma', 'no-cache')
          .header('Expires', '0')
          .header('X-Robots-Tag', 'noindex, nofollow')
          .type('text/html')
          .send(`
            <!DOCTYPE html>
            <html>
            <head>
              <meta charset="UTF-8">
              <meta name="viewport" content="width=device-width, initial-scale=1.0">
              <title>Grupo Indisponível</title>
            </head>
            <body>
              <h1>Grupo temporariamente indisponível.</h1>
              <p>Tente novamente em instantes.</p>
            </body>
            </html>
          `);
      }

      // HTML leve com botão e auto-forward
      const html = `
<!DOCTYPE html>
<html>
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>Entrar no Grupo</title>
  <style>
    * { margin: 0; padding: 0; box-sizing: border-box; }
    body {
      font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Oxygen, Ubuntu, Cantarell, sans-serif;
      display: flex;
      justify-content: center;
      align-items: center;
      min-height: 100vh;
      background: linear-gradient(135deg, #25D366 0%, #128C7E 100%);
      padding: 20px;
    }
    .container {
      background: white;
      border-radius: 16px;
      padding: 40px;
      text-align: center;
      box-shadow: 0 10px 40px rgba(0,0,0,0.2);
      max-width: 400px;
      width: 100%;
    }
    h1 {
      color: #128C7E;
      margin-bottom: 20px;
      font-size: 24px;
    }
    p {
      color: #666;
      margin-bottom: 30px;
      line-height: 1.6;
    }
    .button {
      display: inline-block;
      background: #25D366;
      color: white;
      text-decoration: none;
      padding: 16px 32px;
      border-radius: 8px;
      font-weight: 600;
      font-size: 18px;
      transition: background 0.3s;
      cursor: pointer;
    }
    .button:hover {
      background: #20BA5A;
    }
    .button:active {
      transform: scale(0.98);
    }
  </style>
</head>
<body>
  <div class="container">
    <h1>${pool.title}</h1>
    <p>Clique no botão abaixo para entrar no grupo do WhatsApp</p>
    <a href="${group.invite_url}" class="button" id="whatsapp-btn">Abrir no WhatsApp</a>
  </div>
  <script>
    // Auto-forward após 2 segundos
    setTimeout(function() {
      window.location.href = '${group.invite_url}';
    }, 2000);
    
    // Click no botão também funciona
    document.getElementById('whatsapp-btn').addEventListener('click', function(e) {
      // Deixa o link funcionar normalmente
    });
  </script>
</body>
</html>
      `;

      return reply
        .code(200)
        .header('Cache-Control', 'no-store')
        .header('Pragma', 'no-cache')
        .header('Expires', '0')
        .header('X-Robots-Tag', 'noindex, nofollow')
        .type('text/html')
        .send(html);
    } catch (error) {
      // Never throw exception, always return HTML
      return reply
        .code(200)
        .header('Cache-Control', 'no-store')
        .header('Pragma', 'no-cache')
        .header('Expires', '0')
        .header('X-Robots-Tag', 'noindex, nofollow')
        .type('text/html')
        .send(`
          <!DOCTYPE html>
          <html>
          <head>
            <meta charset="UTF-8">
            <meta name="viewport" content="width=device-width, initial-scale=1.0">
            <title>Grupo Indisponível</title>
          </head>
          <body>
            <h1>Grupo temporariamente indisponível.</h1>
            <p>Tente novamente em instantes.</p>
          </body>
          </html>
        `);
    }
  });
};

export default joinRoutes;

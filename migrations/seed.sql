-- Seed data for rotator.wa_group_pools
INSERT INTO rotator.wa_group_pools (
  slug,
  title,
  instance_name,
  threshold,
  photo_url,
  description,
  current_group_id,
  next_sequence,
  bootstrap_participants,
  created_at,
  updated_at
) VALUES (
  'descontinho',
  'Descontinho Bom',
  'vander-pro',
  950,
  'https://descontinbom.com.br/assets/whatsapp/descontinho-bom.jpg',
  '🟢 OFERTAS REAIS • CUPONS • PROMOS DIÁRIAS

⚠️ Leia as regras fixadas
🚫 Proibido spam
✅ Aproveite os descontos!',
  NULL,
  1,
  ARRAY['+5521979197180', '+5522992379748'],
  now(),
  now()
);

-- Migration: Add bootstrap_participants to rotator.wa_group_pools
-- Date: 2024

ALTER TABLE rotator.wa_group_pools
ADD COLUMN IF NOT EXISTS bootstrap_participants text[] NOT NULL DEFAULT '{}'::text[];

COMMENT ON COLUMN rotator.wa_group_pools.bootstrap_participants IS 'Array de números de telefone para criar grupos (mínimo 2 participantes)';

-- Populate bootstrap_participants for existing pools
UPDATE rotator.wa_group_pools
SET bootstrap_participants = ARRAY['+5521979197180', '+5522992379748']
WHERE slug = 'descontinho';

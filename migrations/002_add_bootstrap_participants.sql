-- Migration: Add bootstrap_participants to rotator.wa_group_pools
-- Date: 2024

ALTER TABLE rotator.wa_group_pools
ADD COLUMN bootstrap_participants text[] NOT NULL DEFAULT '{}'::text[];

COMMENT ON COLUMN rotator.wa_group_pools.bootstrap_participants IS 'Array de números de telefone para criar grupos (mínimo 2 participantes)';

#!/bin/bash
# Script para criar secrets no Docker Swarm
# Execute no manager node

set -e

echo "🔐 Criando secrets no Docker Swarm..."

# Verificar se já existe
if docker secret ls | grep -q "database_url"; then
  echo "⚠️  Secret 'database_url' já existe. Removendo..."
  docker secret rm database_url
fi

if docker secret ls | grep -q "evolution_base_url"; then
  echo "⚠️  Secret 'evolution_base_url' já existe. Removendo..."
  docker secret rm evolution_base_url
fi

if docker secret ls | grep -q "evolution_apikey"; then
  echo "⚠️  Secret 'evolution_apikey' já existe. Removendo..."
  docker secret rm evolution_apikey
fi

if docker secret ls | grep -q "internal_token"; then
  echo "⚠️  Secret 'internal_token' já existe. Removendo..."
  docker secret rm internal_token
fi

# Criar secrets (use suas variáveis reais)
echo "📝 Criando novos secrets..."
echo "postgresql://user:pass@host:5432/db?sslmode=require" | docker secret create database_url -
echo "https://evolution.hubplay.pro" | docker secret create evolution_base_url -
echo "sua-api-key-aqui" | docker secret create evolution_apikey -
echo "seu-token-interno-seguro" | docker secret create internal_token -

echo "✅ Secrets criados com sucesso!"
echo ""
echo "📋 Secrets disponíveis:"
docker secret ls

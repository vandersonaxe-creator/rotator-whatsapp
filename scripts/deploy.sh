#!/bin/bash
# Script de deploy completo para Docker Swarm
# Execute no manager node

set -e

STACK_NAME="rotator-grupos"
IMAGE_NAME="rotator-grupos:latest"

echo "🚀 Iniciando deploy do Rotator Grupos WhatsApp..."

# 1. Build da imagem
echo "📦 Building image..."
docker build -t ${IMAGE_NAME} .

# 2. Verificar se stack existe
if docker stack ls | grep -q "${STACK_NAME}"; then
  echo "⚠️  Stack '${STACK_NAME}' já existe. Atualizando..."
  docker stack deploy -c docker-compose.swarm.yml ${STACK_NAME}
else
  echo "✨ Criando nova stack '${STACK_NAME}'..."
  docker stack deploy -c docker-compose.swarm.yml ${STACK_NAME}
fi

# 3. Aguardar alguns segundos
echo "⏳ Aguardando inicialização..."
sleep 10

# 4. Verificar status
echo ""
echo "📊 Status do serviço:"
docker service ls | grep ${STACK_NAME} || echo "Serviço não encontrado"

echo ""
echo "📋 Tasks do serviço:"
docker service ps ${STACK_NAME}_rotator-grupos --no-trunc || echo "Nenhuma task encontrada"

echo ""
echo "📝 Logs recentes:"
docker service logs --tail 20 ${STACK_NAME}_rotator-grupos || echo "Nenhum log disponível"

echo ""
echo "✅ Deploy concluído!"
echo ""
echo "🔍 Para monitorar:"
echo "  docker service logs -f ${STACK_NAME}_rotator-grupos"
echo ""
echo "🌐 Acesse: https://rotator.descontinbom.com.br/health"

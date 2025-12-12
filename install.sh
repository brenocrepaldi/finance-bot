#!/bin/bash

# Script de instalação do Finance WhatsApp Bot
echo "🚀 Instalando dependências do Finance WhatsApp Bot..."

# Instala dependências principais
npm install

# Verifica se o arquivo .env existe
if [ ! -f .env ]; then
  echo "📝 Criando arquivo .env..."
  cp .env.example .env
  echo "⚠️  Por favor, configure o arquivo .env com suas credenciais!"
else
  echo "✅ Arquivo .env já existe"
fi

echo ""
echo "✨ Instalação concluída!"
echo ""
echo "Próximos passos:"
echo "1. Configure o arquivo .env com suas credenciais do Google"
echo "2. Execute 'npm run dev' para iniciar o bot"
echo ""

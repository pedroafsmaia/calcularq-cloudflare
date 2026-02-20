#!/bin/bash

# Script para iniciar frontend e backend em desenvolvimento

echo "🚀 Iniciando Calcularq em modo desenvolvimento..."
echo ""

# Verificar se as dependências estão instaladas
if [ ! -d "node_modules" ]; then
    echo "📦 Instalando dependências do frontend..."
    npm install
fi

if [ ! -d "server/node_modules" ]; then
    echo "📦 Instalando dependências do backend..."
    cd server
    npm install
    cd ..
fi

# Verificar se o arquivo .env existe no backend
if [ ! -f "server/.env" ]; then
    echo "⚠️  Arquivo server/.env não encontrado!"
    echo "📝 Crie o arquivo server/.env com as seguintes variáveis:"
    echo "   STRIPE_SECRET_KEY=sk_test_..."
    echo "   STRIPE_WEBHOOK_SECRET=whsec_..."
    echo "   PORT=3001"
    echo "   FRONTEND_URL=http://localhost:5173"
    echo ""
    read -p "Deseja continuar mesmo assim? (s/n) " -n 1 -r
    echo
    if [[ ! $REPLY =~ ^[Ss]$ ]]; then
        exit 1
    fi
fi

# Iniciar backend em background
echo "🔧 Iniciando backend na porta 3001..."
cd server
npm run dev > ../server.log 2>&1 &
BACKEND_PID=$!
cd ..

# Aguardar backend iniciar
sleep 3

# Iniciar frontend
echo "🎨 Iniciando frontend na porta 5173..."
echo ""
echo "✅ Backend rodando (PID: $BACKEND_PID)"
echo "✅ Frontend iniciando..."
echo ""
echo "📝 Logs do backend: tail -f server.log"
echo "🛑 Para parar: kill $BACKEND_PID"
echo ""

npm run dev

# Limpar ao sair
trap "kill $BACKEND_PID 2>/dev/null" EXIT

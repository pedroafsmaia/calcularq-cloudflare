#!/bin/bash

echo "🔍 Verificando configuração do Calcularq..."
echo ""

# Cores
GREEN='\033[0;32m'
RED='\033[0;31m'
YELLOW='\033[1;33m'
NC='\033[0m' # No Color

# Verificar Node.js
echo "📦 Verificando Node.js..."
if command -v node &> /dev/null; then
    NODE_VERSION=$(node --version)
    echo -e "${GREEN}✅ Node.js instalado: $NODE_VERSION${NC}"
else
    echo -e "${RED}❌ Node.js não encontrado. Instale em: https://nodejs.org${NC}"
    exit 1
fi

# Verificar npm
echo "📦 Verificando npm..."
if command -v npm &> /dev/null; then
    NPM_VERSION=$(npm --version)
    echo -e "${GREEN}✅ npm instalado: $NPM_VERSION${NC}"
else
    echo -e "${RED}❌ npm não encontrado${NC}"
    exit 1
fi

# Verificar arquivo .env do servidor
echo ""
echo "📁 Verificando arquivo .env do servidor..."
if [ -f "server/.env" ]; then
    echo -e "${GREEN}✅ Arquivo server/.env encontrado${NC}"
    
    # Verificar variáveis
    if grep -q "STRIPE_SECRET_KEY=" server/.env; then
        STRIPE_KEY=$(grep "STRIPE_SECRET_KEY=" server/.env | cut -d'=' -f2)
        if [ -z "$STRIPE_KEY" ] || [ "$STRIPE_KEY" = "sk_test_..." ] || [ "$STRIPE_KEY" = "COLE_AQUI_A_CHAVE" ]; then
            echo -e "${YELLOW}⚠️  STRIPE_SECRET_KEY não configurado corretamente${NC}"
        else
            echo -e "${GREEN}✅ STRIPE_SECRET_KEY configurado${NC}"
        fi
    else
        echo -e "${RED}❌ STRIPE_SECRET_KEY não encontrado no .env${NC}"
    fi
    
    if grep -q "STRIPE_WEBHOOK_SECRET=" server/.env; then
        WEBHOOK_SECRET=$(grep "STRIPE_WEBHOOK_SECRET=" server/.env | cut -d'=' -f2)
        if [ -z "$WEBHOOK_SECRET" ] || [ "$WEBHOOK_SECRET" = "whsec_..." ] || [ "$WEBHOOK_SECRET" = "COLE_AQUI_O_SECRET" ]; then
            echo -e "${YELLOW}⚠️  STRIPE_WEBHOOK_SECRET não configurado corretamente${NC}"
        else
            echo -e "${GREEN}✅ STRIPE_WEBHOOK_SECRET configurado${NC}"
        fi
    else
        echo -e "${RED}❌ STRIPE_WEBHOOK_SECRET não encontrado no .env${NC}"
    fi
else
    echo -e "${RED}❌ Arquivo server/.env não encontrado${NC}"
    echo -e "${YELLOW}💡 Crie o arquivo seguindo o GUIA_COMPLETO_INTEGRACAO.md${NC}"
fi

# Verificar arquivo .env do frontend
echo ""
echo "📁 Verificando arquivo .env do frontend..."
if [ -f ".env" ]; then
    echo -e "${GREEN}✅ Arquivo .env encontrado${NC}"
    if grep -q "VITE_API_URL=" .env; then
        echo -e "${GREEN}✅ VITE_API_URL configurado${NC}"
    else
        echo -e "${YELLOW}⚠️  VITE_API_URL não encontrado no .env${NC}"
    fi
else
    echo -e "${YELLOW}⚠️  Arquivo .env não encontrado na raiz${NC}"
    echo -e "${YELLOW}💡 Crie o arquivo com: VITE_API_URL=http://localhost:3001${NC}"
fi

# Verificar dependências
echo ""
echo "📦 Verificando dependências..."
if [ -d "node_modules" ]; then
    echo -e "${GREEN}✅ Dependências do frontend instaladas${NC}"
else
    echo -e "${YELLOW}⚠️  Dependências do frontend não instaladas${NC}"
    echo -e "${YELLOW}💡 Execute: npm install${NC}"
fi

if [ -d "server/node_modules" ]; then
    echo -e "${GREEN}✅ Dependências do backend instaladas${NC}"
else
    echo -e "${YELLOW}⚠️  Dependências do backend não instaladas${NC}"
    echo -e "${YELLOW}💡 Execute: cd server && npm install${NC}"
fi

# Verificar Stripe CLI
echo ""
echo "🔔 Verificando Stripe CLI..."
if command -v stripe &> /dev/null; then
    echo -e "${GREEN}✅ Stripe CLI instalado${NC}"
    echo -e "${YELLOW}💡 Para iniciar o webhook local, execute:${NC}"
    echo -e "${YELLOW}   stripe listen --forward-to localhost:3001/api/webhook/stripe${NC}"
else
    echo -e "${YELLOW}⚠️  Stripe CLI não instalado${NC}"
    echo -e "${YELLOW}💡 Instale em: https://stripe.com/docs/stripe-cli${NC}"
fi

echo ""
echo "✅ Verificação concluída!"
echo ""
echo "📚 Para mais detalhes, consulte: GUIA_COMPLETO_INTEGRACAO.md"










# Dockerfile otimizado para produção
FROM node:20-alpine

# Instala dependências do sistema necessárias para o Baileys
RUN apk add --no-cache \
    python3 \
    make \
    g++ \
    cairo-dev \
    jpeg-dev \
    pango-dev \
    giflib-dev

# Define diretório de trabalho
WORKDIR /app

# Copia arquivos de dependências
COPY package*.json ./

# Instala dependências de produção
RUN npm ci --only=production

# Copia o código fonte
COPY . .

# Compila TypeScript
RUN npm run build

# Cria diretório para sessão do WhatsApp
RUN mkdir -p /app/auth

# Expõe porta (opcional, o bot não usa servidor HTTP)
# EXPOSE 3000

# Comando para iniciar o bot
CMD ["node", "dist/index.js"]

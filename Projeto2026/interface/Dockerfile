FROM node:18-alpine

# Definir working directory
WORKDIR /usr/src/app

# Instalar dumb-init para melhor gestão de processos
RUN apk add --no-cache dumb-init

# Copiar package files
COPY package*.json ./

# Instalar dependências (separado para melhor cache)
RUN npm ci --only=production && npm cache clean --force

# Copiar código fonte
COPY . .

# Criar diretório para uploads com permissões apropriadas
RUN mkdir -p uploads && chmod 777 uploads

# Comentado para evitar problemas de permissão com volumes montados (UID mismatch)
# RUN addgroup -g 1001 -S nodejs && \
#     adduser -S nodejs -u 1001 && \
#     chown -R nodejs:nodejs /usr/src/app

# USER nodejs

# Healthcheck
HEALTHCHECK --interval=30s --timeout=10s --start-period=5s --retries=3 \
    CMD node -e "require('http').get('http://localhost:16001/', (r) => {if (r.statusCode !== 200) throw new Error(r.statusCode)})"

EXPOSE 16001

# Usar dumb-init para executar node
ENTRYPOINT ["dumb-init", "--"]
CMD ["node", "app.js"]

# Multi-stage Dockerfile voor VerhuisManager
# Stage 1: Build stage (Debian slim voor 100% glibc compatibiliteit)
FROM node:22-slim AS builder

WORKDIR /app

# Kopieer package.json en installeer alle build dependencies
COPY package.json ./
RUN npm install --legacy-peer-deps

# Kopieer alle bronbestanden
COPY . .

# Bouw de frontend en bundel de Express server expliciet met --bundle (zodat routes.ts en db.ts gegarandeerd worden ingesloten)
RUN rm -rf dist && \
    npx vite build && \
    npx esbuild server.ts --bundle --platform=node --format=esm --packages=external --target=node20 --outfile=dist/server.js

# Stage 2: Productie runtime
FROM node:22-slim AS runner

WORKDIR /app

ENV NODE_ENV=production
ENV PORT=3000
ENV DATA_DIR=/app/data

# Alleen productie dependencies installeren
COPY package.json ./
RUN npm install --omit=dev --legacy-peer-deps

# Kopieer uitsluitend de gebouwde dist map met de samengevoegde server.js
COPY --from=builder /app/dist ./dist

# Zorg dat de data directory bestaat
RUN mkdir -p /app/data

VOLUME ["/app/data"]
EXPOSE 3000

CMD ["node", "dist/server.js"]

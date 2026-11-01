# ---------- Build ----------
FROM node:20-alpine AS build
RUN apk add --no-cache openssl
WORKDIR /app
COPY package*.json ./
RUN npm install
COPY prisma ./prisma
COPY tsconfig.json ./
COPY src ./src
RUN npm run build && npm prune --omit=dev

# ---------- Runtime ----------
FROM node:20-alpine
RUN apk add --no-cache openssl dos2unix
WORKDIR /app
ENV NODE_ENV=production
COPY --from=build /app/node_modules ./node_modules
COPY --from=build /app/dist ./dist
COPY --from=build /app/prisma ./prisma
COPY package.json ./
COPY wait-for-it.sh docker-entrypoint.sh ./
RUN dos2unix wait-for-it.sh docker-entrypoint.sh && chmod +x wait-for-it.sh docker-entrypoint.sh
EXPOSE 4000
ENTRYPOINT ["/app/docker-entrypoint.sh"]

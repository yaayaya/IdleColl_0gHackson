FROM node:24.18.1-bookworm-slim AS builder
WORKDIR /app
COPY package*.json tsconfig.json ./
RUN npm ci
COPY src/ ./src/
RUN npm run build

FROM node:24.18.1-bookworm-slim AS runner
WORKDIR /app
ENV NODE_ENV=production
COPY package*.json ./
RUN npm ci --omit=dev
COPY --from=builder /app/dist ./dist
COPY --from=builder /app/src/contracts ./dist/contracts
COPY --from=builder /app/src/contracts ./src/contracts
EXPOSE 3001
CMD ["node", "dist/index.js"]

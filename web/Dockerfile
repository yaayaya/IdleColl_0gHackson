FROM node:24.18.1-bookworm-slim AS base
RUN apt-get update && apt-get install -y --no-install-recommends python3 make g++ && rm -rf /var/lib/apt/lists/*
WORKDIR /app
COPY package*.json ./
RUN npm ci

FROM base AS development
COPY . .
EXPOSE 80 5173
CMD ["npm", "run", "dev", "--", "--host", "0.0.0.0", "--port", "80"]

FROM base AS builder
COPY . .
RUN npm run build

FROM nginx:alpine AS runner
COPY --from=builder /app/dist /usr/share/nginx/html
COPY nginx.conf /etc/nginx/conf.d/default.conf
EXPOSE 80
CMD ["nginx", "-g", "daemon off;"]

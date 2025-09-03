# ---------- Build stage (with dev deps) ----------
FROM node:20-alpine AS build
WORKDIR /app

# Install deps (uses server-level package.json/lock)
COPY package*.json ./
RUN npm ci

# Copy source and build TS -> JS
COPY tsconfig.json tsconfig.json
COPY src src
RUN npm run build  # produces dist/

# ---------- Runtime stage (prod deps only) ----------
FROM node:20-alpine AS runtime
WORKDIR /app
ENV NODE_ENV=production

# Install only production deps
COPY package*.json ./
RUN npm ci --omit=dev

# Copy built app and runtime assets
COPY --from=build /app/dist dist
COPY data data

# Ports & start
EXPOSE 8080
CMD ["node", "dist/index.js"]

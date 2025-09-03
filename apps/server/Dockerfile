# ---------- Build ----------
FROM node:20-alpine AS build
WORKDIR /app
COPY package*.json ./
RUN npm install                # 👈 was: npm ci
COPY tsconfig.json tsconfig.json
COPY src src
RUN npm run build              # -> dist/

# ---------- Runtime ----------
FROM node:20-alpine AS runtime
WORKDIR /app
ENV NODE_ENV=production
COPY package*.json ./
RUN npm install --omit=dev     # 👈 was: npm ci --omit=dev
COPY --from=build /app/dist dist
COPY data data
EXPOSE 8080
CMD ["node","dist/index.js"]

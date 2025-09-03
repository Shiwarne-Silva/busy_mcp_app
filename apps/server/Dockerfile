FROM node:20-slim
WORKDIR /app
COPY package.json package.json
COPY tsconfig.json tsconfig.json
COPY src src
COPY .env .env
COPY data data
RUN npm i --omit=dev
RUN npm run build
ENV PORT=8080
EXPOSE 8080
CMD ["npm","run","start"]

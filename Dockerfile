# Stage 1: Build the React application
FROM node:20-alpine AS builder
WORKDIR /app
COPY package*.json ./
RUN npm install
COPY . .
RUN npm run build

# Stage 2: Just store the static files in a lightweight image
FROM alpine:latest
WORKDIR /app
COPY --from=builder /app/dist /app/dist

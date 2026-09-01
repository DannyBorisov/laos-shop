# Build stage
FROM node:22-alpine AS builder

WORKDIR /app

# Copy package files
COPY package*.json ./
COPY client/package*.json ./client/
COPY prisma ./prisma

# Install all dependencies (including devDependencies for build)
RUN npm ci
RUN cd client && npm ci

# Generate Prisma client
RUN npx prisma generate

# Copy source files
COPY tsconfig.json ./
COPY src ./src
COPY client ./client

# Build server (TypeScript)
RUN npx tsc

# Build client (Vite)
RUN cd client && npm run build

# Production stage
FROM node:22-alpine AS runner

WORKDIR /app

ENV NODE_ENV=production

# Copy package files
COPY package*.json ./
COPY prisma ./prisma

# Install production dependencies only
RUN npm ci --omit=dev

# Generate Prisma client in production
RUN npx prisma generate

# Copy built server
COPY --from=builder /app/dist ./dist

# Copy built client
COPY --from=builder /app/client/dist ./client/dist

# Cloud Run uses PORT env variable (default 8080)
ENV PORT=8080
EXPOSE 8080

# Start server
CMD ["node", "dist/index.js"]

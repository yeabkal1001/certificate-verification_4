# Stage 1: Dependencies
FROM node:18-alpine AS deps
WORKDIR /app

# Install pnpm
RUN npm install -g pnpm

# Install dependencies based on the preferred package manager
COPY package.json pnpm-lock.yaml* ./
RUN apk add --no-cache libc6-compat && \
    pnpm install --frozen-lockfile

# Stage 2: Builder
FROM node:18-alpine AS builder
WORKDIR /app

# Install pnpm
RUN npm install -g pnpm

COPY --from=deps /app/node_modules ./node_modules
COPY . .

# Install additional build dependencies
RUN apk add --no-cache python3 make g++

# Create a .env.local file with default values for build
RUN echo "NEXTAUTH_URL=http://localhost:3000\nNEXTAUTH_SECRET=dummy-secret-for-build\nJWT_SECRET=dummy-jwt-secret-for-build\nCERTIFICATE_SECRET=dummy-certificate-secret-for-build" > .env.local

# Generate Prisma client
RUN pnpm exec prisma generate

# Build the Next.js application
ENV NEXT_TELEMETRY_DISABLED 1
RUN pnpm run build

# Stage 3: Runner
FROM node:18-alpine AS runner
WORKDIR /app

# Install pnpm
RUN npm install -g pnpm

ENV NODE_ENV production
ENV NEXT_TELEMETRY_DISABLED 1

# Create a non-root user
RUN addgroup --system --gid 1001 nodejs && \
    adduser --system --uid 1001 nextjs

# Copy necessary files
COPY --from=builder /app/public ./public
COPY --from=builder /app/.next ./.next
COPY --from=builder /app/node_modules ./node_modules
COPY --from=builder /app/package.json ./package.json
COPY --from=builder /app/prisma ./prisma
COPY --from=builder /app/next.config.mjs ./next.config.mjs

# Set proper permissions
RUN chown -R nextjs:nodejs /app

# Switch to non-root user
USER nextjs

# Expose the port
EXPOSE 3000

# Add health check
HEALTHCHECK --interval=30s --timeout=5s --start-period=5s --retries=3 CMD wget -qO- http://localhost:3000/api/health || exit 1

# Start the application
CMD ["pnpm", "start"]

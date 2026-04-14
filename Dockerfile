# Build Stage
FROM node:20-alpine AS builder

WORKDIR /app

# Install pnpm
RUN npm install -g pnpm

# Copy manifests
COPY package.json pnpm-lock.yaml ./

# Install dependencies
RUN pnpm install --no-frozen-lockfile

# Copy source and config
COPY . .

# Build the generic bundle
RUN pnpm run build

# Run Stage
FROM grafana/k6:latest

WORKDIR /app

# Copy the built bundle from the builder stage
COPY --from=builder /app/dist /app/dist

# The entrypoint for k6 is already set in the base image
# We will override the command in docker-compose
ENTRYPOINT ["k6"]

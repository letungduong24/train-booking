# ---- Base ----
FROM node:22-alpine AS base
RUN corepack enable && corepack prepare pnpm@latest --activate

# ---- Dependencies ----
FROM base AS deps
WORKDIR /app
COPY package.json pnpm-lock.yaml ./
RUN pnpm install --frozen-lockfile

# ---- Builder ----
FROM base AS builder
WORKDIR /app
COPY --from=deps /app/node_modules ./node_modules
COPY . .

# Dummy DATABASE_URL so prisma generate & build succeed without a real DB
ARG DATABASE_URL=postgresql://postgres:postgres@localhost:5432/postgres
ENV DATABASE_URL=${DATABASE_URL}

RUN node_modules/.bin/prisma generate
RUN pnpm run build

# ---- Runner ----
FROM base AS runner
WORKDIR /app
ENV NODE_ENV=production

COPY --from=builder /app/dist ./dist
COPY --from=builder /app/node_modules ./node_modules
COPY --from=builder /app/prisma ./prisma
COPY --from=builder /app/prisma.config.ts ./prisma.config.ts
# seed.ts imports from src/generated — cần copy để tsx chạy được
COPY --from=builder /app/src/generated ./src/generated
COPY package.json ./

EXPOSE 9000

# DATABASE_URL thật được inject qua env_file lúc container start, override dummy ở trên
# Set RUN_SEED=true trong .env để chạy seed (chỉ dùng lần đầu, seed sẽ xóa toàn bộ data!)
CMD ["sh", "-c", "node_modules/.bin/prisma migrate deploy && ([ \"$(echo $RUN_SEED | tr '[:upper:]' '[:lower:]')\" = \"true\" ] && node_modules/.bin/tsx prisma/seed.ts || true) && node dist/src/main"]

#!/bin/sh
set -e
/app/wait-for-it.sh "${DB_HOST:-db}:${DB_PORT:-5432}" -t 90
echo "📦 Migrations Prisma..."
npx prisma migrate deploy
echo "🌱 Seed..."
node dist/prisma/seed.js
exec node dist/src/index.js

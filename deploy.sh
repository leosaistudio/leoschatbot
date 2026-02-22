#!/bin/bash
# ============================================
# deploy.sh - Deployment script for Hostinger VPS
# ============================================
set -e

echo "🚀 Starting deployment..."

# Step 1: Check if .env.production exists
if [ ! -f .env.production ]; then
    echo "❌ Error: .env.production file not found!"
    echo "Copy the example file and fill in your values:"
    echo "  cp .env.production.example .env.production"
    exit 1
fi

# Step 2: Load environment variables
export $(grep -v '^#' .env.production | xargs)

# Step 3: Build and start containers
echo "🐳 Building Docker containers..."
docker compose --env-file .env.production up -d --build

# Step 4: Wait for MySQL to be ready
echo "⏳ Waiting for MySQL to be ready..."
sleep 15

# Step 5: Run Prisma migrations
echo "📦 Running database migrations..."
docker compose exec app npx prisma db push --accept-data-loss

# Step 6: Create admin user (first time only)
echo ""
echo "============================================"
echo "✅ Deployment complete!"
echo "============================================"
echo ""
echo "🌐 Your app is running at: http://$(curl -s ifconfig.me):3000"
echo ""
echo "📌 To create an admin user, run:"
echo "   docker compose exec app npx tsx scripts/create-admin.ts"
echo ""
echo "📌 Useful commands:"
echo "   docker compose logs -f app    # View app logs"
echo "   docker compose logs -f db     # View database logs"
echo "   docker compose restart app    # Restart the app"
echo "   docker compose down           # Stop everything"
echo "   docker compose up -d          # Start everything"
echo ""

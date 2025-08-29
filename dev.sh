#!/bin/bash

echo "🚀 Starting Data Visualization Dashboard Development Environment..."

# Check if Docker is available
if command -v docker &> /dev/null && command -v docker-compose &> /dev/null; then
    echo "🐳 Starting PostgreSQL with Docker..."
    docker-compose up -d postgres
    
    echo "⏰ Waiting for PostgreSQL to be ready..."
    sleep 5
    
    echo "📋 Running database migrations..."
    npx prisma db push
    
    echo "🌱 Seeding database..."
    npm run db:seed
else
    echo "⚠️  Docker not found. Please ensure PostgreSQL is running manually."
    echo "   Connection string: postgresql://postgres:password@localhost:5432/dashboard_db"
fi

echo "🚀 Starting development server..."
npm run dev

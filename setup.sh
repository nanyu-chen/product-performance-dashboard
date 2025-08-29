#!/bin/bash

echo "🚀 Setting up Data Visualization Dashboard..."

echo "📦 Installing dependencies..."
npm install

echo "🗄️ Setting up database..."
echo "Please ensure PostgreSQL is running and update the DATABASE_URL in .env file if needed."
echo "Current DATABASE_URL: postgresql://postgres:password@localhost:5432/dashboard_db?schema=public"

echo "📋 Running database migrations..."
npx prisma db push

echo "🌱 Seeding database with test user..."
npm run db:seed

echo "✅ Setup complete!"
echo ""
echo "To start the application:"
echo "npm run dev"
echo ""
echo "Test credentials:"
echo "Username: admin"
echo "Password: admin123"
echo ""
echo "Don't forget to upload the ProductData.xlsx file to view the dashboard!"

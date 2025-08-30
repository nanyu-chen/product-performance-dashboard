# Vercel Deployment Guide

## Environment Variables Needed:

1. DATABASE_URL
   - Your Supabase connection string
   - Format: postgresql://postgres.vzaoepkkozzecsarvewo:Ppd.1234@aws-1-ap-southeast-2.pooler.supabase.com:5432/postgres

2. JWT_SECRET  
   - Your JWT secret key
   - Current value: a8f3d2c9b7e1f4a6d8c2e5b9f7a3d1c6e8f2a9d4b7c1e5f8a2d6c9b3e7f1a4d8c5b2e9f6a3d7c1

## Deployment Commands:

1. First deployment:
   ```bash
   vercel --prod
   ```

2. Add environment variables during deployment or via Vercel dashboard

3. Subsequent deployments:
   ```bash
   vercel --prod
   ```

## Post-deployment:
- Test login with: admin / admin
- Upload product data via the dashboard
- Check database connectivity

## Important Notes:
- Make sure Supabase database is accessible from Vercel
- Verify all environment variables are set correctly
- Test the application thoroughly after deployment

# Product Performance Dashboard

A full-stack data visualization application with secure authentication for product managers to analyze performance metrics with dual-axis charts.

## Features

- 🔐 **Secure Authentication**: JWT-based authentication with bcrypt password hashing
- 📊 **Advanced Data Visualization**: Interactive dual-axis charts with inventory and monetary values
- 📄 **Excel File Processing**: Client-side Excel parsing with real-time transformation
- 🎯 **Product Manager Focus**: Multi-product comparison with adaptive legend layouts
- 📱 **Responsive Design**: Mobile-friendly interface with Tailwind CSS 4
- 🗄️ **Database Integration**: PostgreSQL with Prisma ORM for authentication

## Tech Stack

- **Frontend**: Next.js 15, React 19, TypeScript, Tailwind CSS 4
- **Backend**: Next.js API Routes (serverless)
- **Database**: PostgreSQL with Prisma ORM
- **Authentication**: JWT + bcrypt with HttpOnly cookies
- **Charts**: Recharts 3.1 with dual-axis support
- **Data Processing**: xlsx library with custom transformation pipeline

## Prerequisites

- Node.js 18+ 
- PostgreSQL database
- npm or yarn

## Quick Start

1. **Clone and setup**:
   ```bash
   cd dashboard-app
   ./setup.sh        # Sets up everything
   npm run dev       # Starts the application
   ```

2. **Configure database** (if needed):
   ```bash
   # Update .env file with your PostgreSQL connection string
   DATABASE_URL="postgresql://username:password@localhost:5432/database_name?schema=public"
   ```

3. **Access the application**:
   - Open [http://localhost:3000](http://localhost:3000)
   - Login with: `admin` / `admin123`
   - Upload your ProductData Excel file
   - Analyze product performance with dual-axis charts!

## Core Features

### 🎯 **Product Manager Dashboard**
- **File Upload**: Drag-and-drop Excel file processing
- **Multi-Product Selection**: Choose up to multiple products for comparison
- **Dual-Axis Charts**: Left axis (inventory), Right axis (monetary values)
- **Interactive Legend**: Click to toggle line visibility
- **Adaptive Layout**: Horizontal legend (≤6 products), vertical grid (>6)
- **Real-time Statistics**: Total revenue, inventory levels, growth metrics

### 📊 **Data Visualization**
- **Composed Charts**: Inventory quantities + procurement/sales amounts
- **Fixed Chart Container**: Consistent 500px chart area
- **Scrollable Product Selector**: Clean interface for product management
- **Color-coded Lines**: Accessible color palette for multiple products
- **Responsive Tooltips**: Detailed data on hover

### 🔧 **Data Processing**
- **Currency Parsing**: Converts "$13.72" format to numeric values
- **Cumulative Calculations**: Opening + Procurement - Sales inventory
- **Wide-to-Long Format**: Transforms Excel wide format to chart-ready data
- **Real-time Transformation**: Client-side processing for immediate feedback

## Default Test User

- **Username**: `admin`
- **Password**: `admin123`

## Expected Excel Format

Your Excel file should have columns following this pattern:
```
Product Name | Opening Inventory | Procurement Qty (Day 1) | Procurement Price (Day 1) | Sales Qty (Day 1) | Sales Price (Day 1) | ...
```

The system automatically handles:
- Currency string parsing ("$13.72" → 13.72)
- Multiple day columns (Day 1, Day 2, Day 3, etc.)
- Cumulative inventory calculations
- Data validation and error handling

# Product Performance Dashboard

A full-stack data visualisation application with secure authentication for product managers to analyse performance metrics with dual-axis charts.

## 🎯 Live Demo

**Repository**: [https://github.com/nanyu-chen/product-performance-dashboard](https://github.com/nanyu-chen/product-performance-dashboard)

## ✨ Features

- 🔐 **Secure Authentication**: JWT-based authentication with bcrypt password hashing
- 📊 **Advanced Data Visualisation**: Interactive dual-axis charts with inventory and monetary values
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

### Local Development

1. **Clone and setup**:
   ```bash
   git clone https://github.com/nanyu-chen/product-performance-dashboard.git
   cd dashboard-app
   ./setup.sh        # Installs dependencies, sets up DB, seeds admin user
   npm run dev       # Starts the app at http://localhost:3000
   ```

2. **Configure database** (if needed):
   - Edit `.env` with your PostgreSQL connection string
   - Example: `DATABASE_URL="postgresql://USER:PASSWORD@HOST:PORT/DATABASE?schema=public"`

3. **Access the application**:
   - Open [http://localhost:3000](http://localhost:3000)
   - Login: `admin` / `admin123`
   - Upload your ProductData Excel file
   - Analyse product performance with dual-axis charts!

> **Note:**
> - `setup.sh` is the recommended way to set up locally. It installs dependencies, runs migrations, and seeds the admin user.
> - `dev.sh` is optional and only needed if you want to use Docker for local Postgres. If you don't use Docker, you can ignore or remove it.

## Core Features

### 🎯 **Product Manager Dashboard**
- **File Upload**: Drag-and-drop Excel file processing
- **Multi-Product Selection**: Choose up to multiple products for comparison
- **Dual-Axis Charts**: Left axis (inventory), Right axis (monetary values)
- **Interactive Legend**: Click to toggle line visibility
- **Adaptive Layout**: Horizontal legend (≤6 products), vertical grid (>6)
- **Real-time Statistics**: Total revenue, inventory levels, growth metrics

### 📊 **Data Visualisation**
- **Composed Charts**: Inventory quantities + procurement/sales amounts
- **Fixed Chart Container**: Consistent 500px chart area
- **Scrollable Product Selector**: Clean interface for product management
- **Colour-coded Lines**: Accessible colour palette for multiple products
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

## 🚀 Deployment

### Deploy to Vercel
   - Use the same login: `admin` / `admin123`
   - All features work as in local dev

## 📱 Screenshots

### Dashboard Overview
<img width="1274" height="960" alt="image" src="https://github.com/user-attachments/assets/d991d78b-02ad-4b41-b618-ccf7e142ca04" />


### Multi-Product Comparison  
<img width="1284" height="1126" alt="image" src="https://github.com/user-attachments/assets/a2748af9-b18a-43aa-a8a2-0bf7add3bd9d" />

## 🤝 Contributing

1. Fork the repository
2. Create your feature branch (`git checkout -b feature/amazing-feature`)
3. Commit your changes (`git commit -m 'Add amazing feature'`)
4. Push to the branch (`git push origin feature/amazing-feature`)
5. Open a Pull Request

## 📄 License

This project is licensed under the MIT License - see the [LICENSE](LICENSE) file for details.

## 🙏 Acknowledgments

- Built with [Next.js](https://nextjs.org/) and [React](https://reactjs.org/)
- Charts powered by [Recharts](https://recharts.org/)
- Database integration with [Prisma](https://www.prisma.io/)
- Styling with [Tailwind CSS](https://tailwindcss.com/)

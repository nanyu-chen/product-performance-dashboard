# Product Dashboard System Architecture

## Overview

This document outlines the system architecture, design decisions, and implementation approach for the full-stack product performance dashboard. The system provides secure authentication and advanced data visualisation capabilities specifically designed for product managers to analyse performance metrics using dual-axis charts.

## System Requirements Analysis

### Primary Requirements
1. **Full-stack data visualisation application** with secure login system
2. **Interactive dashboard** for product manager to analyse individual product performance
3. **Excel data processing** capability with client-side transformation
4. **Dual-axis charts** showing inventory quantities and monetary values
5. **Real-time data processing** with immediate visualisation feedback

### Derived Requirements
- User authentication and session management
- Client-side Excel file processing capabilities
- Responsive and intuitive user interface optimised for product managers
- Real-time chart updates without server round-trips
- Cross-browser compatibility and performance optimisation

## System Architecture

### Technology Stack

#### Frontend
- **Next.js 15** with App Router
- **React 19** with TypeScript for type safety
- **Tailwind CSS 4** for styling and responsive design
- **Recharts 3.1** for advanced data visualisation

#### Backend
- **Next.js API Routes** for serverless backend
- **PostgreSQL** with Prisma ORM for data persistence
- **JWT Authentication** with HttpOnly cookies
- **bcryptjs** for password hashing

#### Data Processing
- **xlsx library** for Excel file parsing
- **Custom transformation utilities** for data normalisation
- **Client-side processing** for real-time chart updates

### Architecture Diagram

```
┌─────────────────┐    ┌─────────────────┐    ┌─────────────────┐
│   Frontend      │    │   Backend       │    │   Database      │
│                 │    │                 │    │                 │
│ • React/Next.js │◄──►│ • API Routes    │◄──►│ • PostgreSQL    │
│ • TypeScript    │    │ • JWT Auth      │    │ • Prisma ORM    │
│ • Recharts      │    │ • Data API      │    │ • User Data     │
│ • Client Excel  │    │ • Upload API    │    │ • Session Mgmt  │
│ • Tailwind CSS  │    │                 │    │                 │
└─────────────────┘    └─────────────────┘    └─────────────────┘
         │                       │
         └───────────────────────┘
          Real-time Data Flow
```

## Data Flow Architecture

### 1. Authentication Flow
```
User Login → API Route → Database Verification → JWT Generation → HttpOnly Cookie → Protected Routes
```

### 2. Data Processing Flow
```
Excel Upload → Client-side Reading → Data Transformation → Chart Preparation → Real-time Visualisation
```

### 3. Dashboard Interaction Flow
```
Product Selection → Data Filtering → Chart Re-rendering → Statistics Calculation → UI Updates
```

## Detailed Component Design

### Frontend Architecture

#### Core Components
1. **Authentication Layer**
   - Login page with form validation
   - Session management with JWT cookies
   - Protected route middleware

2. **Product Dashboard**
   - File upload interface with drag-and-drop
   - Multi-product selection with scrollable interface
   - Dual-axis composed charts (inventory + monetary values)
   - Interactive legend with line visibility controls
   - Real-time statistics display

3. **Data Visualisation**
   - Fixed 500px chart container for consistency
   - Adaptive legend layout (horizontal ≤6 products, vertical grid >6)
   - Colour-coded product lines with accessible palette
   - Responsive tooltips and hover interactions

#### State Management
- **React Hooks** for local component state
- **useMemo/useCallback** for performance optimisation
- **Custom hooks** for data transformation logic

### Backend Architecture

#### API Endpoints
1. **Authentication APIs**
   - `POST /api/auth/login` - User authentication with JWT token generation
   - `POST /api/auth/logout` - Session termination and cookie cleanup

2. **Data APIs**
   - `GET /api/data` - Retrieve product list or specific product data
   - `POST /api/upload` - Excel file upload and database storage (legacy support)

#### Database Schema
```sql
-- Users table for authentication
CREATE TABLE User (
  id          SERIAL PRIMARY KEY,
  username    VARCHAR(50) UNIQUE NOT NULL,
  password    VARCHAR(255) NOT NULL,
  createdAt   TIMESTAMP DEFAULT NOW(),
  updatedAt   TIMESTAMP DEFAULT NOW()
);

-- ProductData table for uploaded Excel data
CREATE TABLE ProductData (
  id                INTEGER PRIMARY KEY,
  productName       VARCHAR(255) NOT NULL,
  inventory         INTEGER NOT NULL,
  procurementAmount DECIMAL(10,2) NOT NULL,
  salesAmount       DECIMAL(10,2) NOT NULL,
  date              TIMESTAMP NOT NULL,
  createdAt         TIMESTAMP DEFAULT NOW()
);
```

## Data Transformation Design

### Excel Data Processing

#### Input Format (Wide Format)
```
Product Name | Opening Inventory Day 1 | Procurement Qty Day 1 | Sales Qty Day 1 | ...
Product A    | 100                     | 50                     | 30              | ...
Product B    | 200                     | 75                     | 45              | ...
```

#### Transformation to Long Format
```typescript
interface TransformedData {
  productName: string;
  day: number;
  inventory: number;
  procurementAmount: number;
  salesAmount: number;
}
```

#### Key Processing Features
1. **Currency String Parsing**: Converts "$13.72" → 13.72
2. **Cumulative Inventory Calculation**: Opening + Procurement - Sales
3. **Data Validation**: Ensures numeric values and proper formatting
4. **Error Handling**: Graceful degradation for malformed data

### Chart Data Preparation

#### Dual-Axis Implementation
- **Left Y-Axis**: Inventory quantities (integer values)
- **Right Y-Axis**: Monetary values (currency formatting)
- **X-Axis**: Time series (Day 1, Day 2, Day 3)

#### Performance Optimisations
- **Memoised calculations** for chart data preparation
- **Selective re-rendering** based on product selection
- **Efficient data filtering** using Set operations

## Security Implementation

### Authentication Security
1. **Password Hashing**: bcryptjs with salt rounds
2. **JWT Tokens**: Secure token generation with expiration
3. **HttpOnly Cookies**: XSS protection for token storage
4. **Route Protection**: Middleware for authenticated routes

### Data Security
1. **Input Validation**: Type checking and sanitization
2. **File Upload Limits**: Size and type restrictions
3. **SQL Injection Prevention**: Prisma ORM parameterized queries
4. **CORS Configuration**: Controlled cross-origin requests

## Design Decisions & Rationale

### 1. Next.js App Router Choice
**Decision**: Use Next.js 15 with App Router
**Rationale**: 
- Server-side rendering for better SEO and performance
- Built-in API routes eliminate need for separate backend
- Type-safe routing and modern React features

### 2. Client-Side Data Processing
**Decision**: Process Excel files in the browser
**Rationale**:
- Reduces server load and improves responsiveness
- Enables real-time chart updates without API calls
- Better user experience with immediate feedback

### 3. Dual-Axis Chart Design
**Decision**: Separate Y-axes for inventory and monetary values
**Rationale**:
- Different scale ranges (hundreds vs. dollars)
- Clearer visual distinction between metric types
- Product manager workflow optimisation

### 4. Adaptive Legend Layout
**Decision**: Horizontal ≤6 products, vertical grid >6 products
**Rationale**:
- Maintains chart readability with many products
- Responsive design principles
- User experience optimisation

## Assumptions & Limitations

### Assumptions
1. **Excel File Format**: Standardized column naming convention
2. **Data Quality**: Numeric values in procurement/sales columns
3. **Browser Support**: Modern browsers with ES6+ support
4. **Network Connectivity**: Stable connection for authentication
5. **User Behavior**: Single-user session management sufficient

### Current Limitations

#### Technical Limitations
1. **File Size**: Large Excel files may impact browser performance
2. **Concurrent Users**: No real-time collaboration features
3. **Data Persistence**: Chart state not saved between sessions
4. **Mobile Optimisation**: Desktop-first responsive design

#### Business Limitations
1. **Single Tenant**: No multi-organization support
2. **Role Management**: Basic admin-only authentication
3. **Audit Trail**: No data modification tracking
4. **Backup Strategy**: Manual database backup required

### Future Enhancement Opportunities

#### Performance Improvements
1. **Virtual Scrolling**: For large product lists
2. **Data Pagination**: Server-side data chunking
3. **Caching Strategy**: Redis for frequently accessed data
4. **CDN Integration**: Static asset optimisation

#### Feature Enhancements
1. **Export Capabilities**: PDF/PNG chart export
2. **Data Filters**: Date range and metric filtering
3. **Comparison Mode**: Side-by-side product analysis
4. **Alerts System**: Threshold-based notifications

#### Scalability Considerations
1. **Microservices**: API separation for larger scale
2. **Message Queues**: Async file processing
3. **Load Balancing**: Multi-instance deployment
4. **Database Sharding**: Horizontal scaling strategy

## Development Workflow

### Code Organization
```
src/
├── app/                      # Next.js App Router pages
│   ├── api/auth/            # Authentication endpoints
│   │   ├── login/           # JWT login implementation
│   │   └── logout/          # Session termination
│   ├── api/data/            # Data retrieval API (optional)
│   ├── api/upload/          # File upload API (legacy)
│   ├── login/               # Authentication page
│   ├── product-dashboard/   # Main dashboard application
│   ├── layout.tsx           # Root layout component
│   ├── page.tsx            # Home page (redirects to login)
│   ├── globals.css         # Global Tailwind styles
│   └── favicon.ico         # Application icon
├── components/              # Reusable React components
│   └── NoSSR.tsx           # Hydration fix utility
└── lib/                    # Utility functions and core logic
    ├── auth.ts             # JWT authentication utilities
    ├── db.ts               # Prisma database connection
    └── dataTransformation.ts # Excel processing pipeline
```

### Testing Strategy
1. **Unit Tests**: Utility functions and data transformation
2. **Integration Tests**: API endpoints and database operations
3. **E2E Tests**: User workflows and authentication flows
4. **Performance Tests**: Chart rendering and large data sets

### Deployment Pipeline
1. **Development**: Local development with hot reload
2. **Staging**: Docker containerization for testing
3. **Production**: Vercel deployment with PostgreSQL
4. **Monitoring**: Error tracking and performance metrics

## Conclusion

This system architecture provides a robust, scalable foundation for product performance analysis while maintaining simplicity and user experience focus. The modular design allows for incremental improvements and feature additions based on user feedback and business requirements.

The chosen technology stack balances modern development practices with proven reliability, ensuring both developer productivity and end-user satisfaction. The comprehensive data transformation pipeline handles real-world Excel data complexities while providing the flexibility needed for diverse product management workflows.

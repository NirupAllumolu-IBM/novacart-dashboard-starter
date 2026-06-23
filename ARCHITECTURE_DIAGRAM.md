# NovaCart Account Dashboard - Architecture Diagram

## System Architecture Overview

This document describes the architecture of the NovaCart Account Dashboard application, showing the data flow between components in both local development and SPCS (Snowflake Container Services) deployment environments.

---

## High-Level Architecture Diagram

```
┌─────────────────────────────────────────────────────────────────────────┐
│                              USER BROWSER                                │
│                         (Chrome, Firefox, Safari)                        │
└────────────────────────────────┬────────────────────────────────────────┘
                                 │
                                 │ HTTPS Requests
                                 │ (Port 443 in SPCS / Port 3000 in Dev)
                                 │
                                 ▼
┌─────────────────────────────────────────────────────────────────────────┐
│                           NGINX ROUTER                                   │
│                      (Reverse Proxy / Load Balancer)                     │
│                                                                           │
│  Routes:                                                                  │
│    /          → React Frontend (Static Files)                            │
│    /api/*     → FastAPI Backend                                          │
│    /docs      → Swagger UI (API Documentation)                           │
└────────────────┬────────────────────────────┬───────────────────────────┘
                 │                            │
                 │ Static Files               │ API Requests
                 │ (HTML, CSS, JS)            │ (JSON)
                 │                            │
                 ▼                            ▼
┌─────────────────────────────┐  ┌──────────────────────────────────────┐
│    REACT FRONTEND           │  │      FASTAPI BACKEND                 │
│    (Port 3000)              │  │      (Port 8000)                     │
│                             │  │                                      │
│  Components:                │  │  Endpoints:                          │
│  • OrdersView.js            │  │  • GET /health                       │
│  • ProductsView.js          │  │  • GET /authorize                    │
│  • CustomersView.js         │  │  • GET /franchise/summary            │
│  • Navbar.js                │  │  • GET /franchise/orders    ✓        │
│  • ServiceStatus.js         │  │  • GET /franchise/products           │
│                             │  │  • GET /franchise/customers          │
│  Libraries:                 │  │  • GET /franchise/cities             │
│  • React 18                 │  │                                      │
│  • Recharts (Charts)        │  │  Features:                           │
│  • Axios (HTTP Client)      │  │  • Date validation                   │
│                             │  │  • Error handling                    │
│                             │  │  • CORS support (Dev mode)           │
│                             │  │  • Auto-generated docs (Swagger)     │
└─────────────────────────────┘  └──────────────┬───────────────────────┘
                                                 │
                                                 │ SQL Queries
                                                 │ (SQLite in Dev / Snowflake in SPCS)
                                                 │
                                                 ▼
                    ┌────────────────────────────────────────────────────┐
                    │              DATA LAYER                            │
                    │                                                    │
                    │  Development:                                      │
                    │  ┌──────────────────────────────────────┐         │
                    │  │  SQLite Database                      │         │
                    │  │  (novacart_gold.db)                  │         │
                    │  │  • fact_orders                       │         │
                    │  │  • dim_customer                      │         │
                    │  │  • dim_product                       │         │
                    │  │  • dim_date                          │         │
                    │  └──────────────────────────────────────┘         │
                    │                                                    │
                    │  Production (SPCS):                                │
                    │  ┌──────────────────────────────────────┐         │
                    │  │  SNOWFLAKE                           │         │
                    │  │  Database: NOVACART_DB               │         │
                    │  │  Schema: APP                         │         │
                    │  │  Warehouse: NOVACART_APP_WH          │         │
                    │  │                                      │         │
                    │  │  Tables (Gold Layer):                │         │
                    │  │  • fact_orders                       │         │
                    │  │  • dim_customer                      │         │
                    │  │  • dim_product                       │         │
                    │  │  • dim_date                          │         │
                    │  │                                      │         │
                    │  │  Authentication:                     │         │
                    │  │  • OAuth (SPCS mounted token)        │         │
                    │  │  • Keypair (Local development)       │         │
                    │  └──────────────────────────────────────┘         │
                    └────────────────────────────────────────────────────┘
```

---

## Data Flow Diagram

### Request Flow (Orders Endpoint Example)

```
1. User Action
   └─> User clicks "Orders" in browser
       │
2. Frontend Request
   └─> React calls: GET /api/franchise/orders?start=2022-01-01&end=2022-12-31
       │
3. NGINX Routing
   └─> NGINX forwards to FastAPI backend at /franchise/orders
       │
4. Backend Processing
   └─> FastAPI endpoint:
       ├─> Validates date parameters
       ├─> Connects to database (SQLite/Snowflake)
       ├─> Executes SQL query:
       │   SELECT month, month_name, COUNT(*) as order_count, SUM(amount) as revenue
       │   FROM fact_orders JOIN dim_date
       │   WHERE order_date BETWEEN ? AND ?
       │   AND status IN ('delivered', 'shipped')
       │   GROUP BY year, month, month_name
       │   ORDER BY year, month
       └─> Returns JSON response
           │
5. Frontend Rendering
   └─> React receives data and renders:
       ├─> Stat cards (total revenue, orders, customers)
       ├─> Monthly revenue chart (Recharts BarChart)
       └─> Revenue by city chart (Recharts BarChart)
```

---

## Component Interaction Matrix

| Component | Communicates With | Protocol | Purpose |
|-----------|------------------|----------|---------|
| Browser | NGINX Router | HTTPS | Access application |
| NGINX Router | React Frontend | HTTP | Serve static files |
| NGINX Router | FastAPI Backend | HTTP | Proxy API requests |
| React Frontend | FastAPI Backend | HTTP/JSON | Fetch data via REST API |
| FastAPI Backend | SQLite (Dev) | SQLite Protocol | Query local database |
| FastAPI Backend | Snowflake (Prod) | Snowflake Connector | Query cloud database |

---

## Deployment Environments

### Local Development
```
┌─────────────┐     ┌─────────────┐     ┌─────────────┐
│   Browser   │────▶│   React     │────▶│   FastAPI   │
│ localhost:  │     │ localhost:  │     │ localhost:  │
│   3000      │     │   3000      │     │   8000      │
└─────────────┘     └─────────────┘     └──────┬──────┘
                                               │
                                               ▼
                                        ┌─────────────┐
                                        │   SQLite    │
                                        │ novacart_   │
                                        │  gold.db    │
                                        └─────────────┘
```

### SPCS Production
```
┌─────────────┐     ┌─────────────────────────────────────┐
│   Browser   │────▶│         NGINX Router                │
│  (Public    │     │  (Single Entry Point - Port 443)    │
│   Internet) │     └────────┬──────────────┬─────────────┘
└─────────────┘              │              │
                             ▼              ▼
                    ┌─────────────┐  ┌─────────────┐
                    │   React     │  │   FastAPI   │
                    │  Container  │  │  Container  │
                    └─────────────┘  └──────┬──────┘
                                            │
                                            ▼
                                    ┌───────────────┐
                                    │   Snowflake   │
                                    │   (OAuth)     │
                                    └───────────────┘
```

---

## Technology Stack

### Frontend Layer
- **Framework**: React 18
- **UI Components**: Custom components + Recharts for data visualization
- **State Management**: React Hooks (useState, useEffect)
- **HTTP Client**: Axios
- **Styling**: CSS with theme support (light/dark mode)

### Backend Layer
- **Framework**: FastAPI (Python)
- **API Documentation**: Swagger/OpenAPI (auto-generated)
- **Database Connector**: 
  - SQLite3 (development)
  - Snowflake Connector (production)
- **Authentication**: OAuth 2.0 (SPCS) / Keypair (local)

### Infrastructure Layer
- **Reverse Proxy**: NGINX
- **Container Runtime**: Docker
- **Orchestration**: Snowflake Container Services (SPCS)
- **Database**: Snowflake (production) / SQLite (development)

---

## Security Considerations

1. **Authentication**
   - SPCS: OAuth token automatically mounted at `/snowflake/session/token`
   - Local: Keypair authentication with private key

2. **CORS**
   - Enabled in development mode for localhost:3000
   - Disabled in production (NGINX handles routing)

3. **Data Access**
   - Backend enforces date validation
   - SQL queries use parameterized statements (prevents SQL injection)
   - Only delivered/shipped orders included in revenue calculations

4. **Network Security**
   - HTTPS in production
   - All traffic routed through NGINX
   - Backend not directly exposed to internet

---

## Scalability & Performance

1. **Horizontal Scaling**
   - Multiple backend containers can be deployed
   - NGINX load balances requests
   - Snowflake warehouse auto-scales

2. **Caching Strategy**
   - Frontend caches API responses
   - Snowflake query result caching
   - Static assets served with cache headers

3. **Database Optimization**
   - Indexed columns: date_key, customer_id, product_id
   - Pre-aggregated data in Gold layer
   - Efficient JOIN operations with dimension tables

---

## Monitoring & Observability

1. **Health Checks**
   - `/health` endpoint monitors backend and database connectivity
   - Frontend ServiceStatus component displays real-time status

2. **Logging**
   - Backend: Uvicorn access logs
   - Frontend: Console logging in development
   - NGINX: Access and error logs

3. **Metrics**
   - API response times
   - Database query performance
   - Error rates and status codes

---

## Implementation Status

✅ **Completed Components**
- NGINX Router configuration
- React Frontend structure
- FastAPI Backend framework
- Database connection layer (SQLite + Snowflake)
- Orders Endpoint (GET /franchise/orders) ✓
- Health check endpoint
- Authorization endpoint
- Swagger documentation

⏳ **Pending Implementation**
- Summary endpoint (GET /franchise/summary)
- Products endpoint (GET /franchise/products)
- Customers endpoint (GET /franchise/customers)
- Cities endpoint (GET /franchise/cities)
- Frontend UI components (charts, tables)

---

## Appendix: Database Schema

### fact_orders
- order_id (PK)
- customer_id (FK)
- product_id (FK)
- order_date
- amount
- currency
- status
- quantity
- date_key (FK)

### dim_customer
- customer_id (PK)
- name
- email
- addr_city
- addr_state
- valid_from
- valid_to
- is_current

### dim_product
- product_id (PK)
- name
- category
- price

### dim_date
- date_key (PK)
- full_date
- year
- quarter
- month
- month_name
- day_of_week
- is_weekend

---

**Document Version**: 1.0  
**Last Updated**: 2026-06-23  
**Author**: App Consultant Team
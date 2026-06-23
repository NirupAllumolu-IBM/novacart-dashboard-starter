# NovaCart Architecture - Mermaid Diagrams

## System Architecture (Mermaid Format)

### High-Level Component Diagram

```mermaid
graph TB
    subgraph "User Layer"
        Browser[🌐 Web Browser<br/>Chrome, Firefox, Safari]
    end
    
    subgraph "Application Layer - SPCS Container Services"
        NGINX[⚙️ NGINX Router<br/>Port 443<br/>Reverse Proxy]
        
        subgraph "Frontend Container"
            React[⚛️ React Frontend<br/>Port 3000<br/>- OrdersView<br/>- ProductsView<br/>- CustomersView]
        end
        
        subgraph "Backend Container"
            FastAPI[🚀 FastAPI Backend<br/>Port 8000<br/>- /franchise/orders ✓<br/>- /franchise/products<br/>- /franchise/customers<br/>- /franchise/cities]
        end
    end
    
    subgraph "Data Layer"
        subgraph "Development"
            SQLite[(📁 SQLite<br/>novacart_gold.db)]
        end
        
        subgraph "Production"
            Snowflake[(❄️ Snowflake<br/>NOVACART_DB.APP<br/>- fact_orders<br/>- dim_customer<br/>- dim_product<br/>- dim_date)]
        end
    end
    
    Browser -->|HTTPS| NGINX
    NGINX -->|Static Files| React
    NGINX -->|API Requests /api/*| FastAPI
    React -.->|Fetch Data| FastAPI
    FastAPI -->|SQL Queries| SQLite
    FastAPI -->|SQL Queries| Snowflake
    
    style Browser fill:#e1f5ff
    style NGINX fill:#fff3e0
    style React fill:#e8f5e9
    style FastAPI fill:#f3e5f5
    style SQLite fill:#fce4ec
    style Snowflake fill:#e3f2fd
```

### Data Flow - Orders Endpoint

```mermaid
sequenceDiagram
    participant User as 👤 User Browser
    participant NGINX as ⚙️ NGINX Router
    participant React as ⚛️ React Frontend
    participant API as 🚀 FastAPI Backend
    participant DB as 💾 Database<br/>(SQLite/Snowflake)
    
    User->>React: 1. Navigate to Orders page
    React->>React: 2. Load OrdersView component
    React->>NGINX: 3. GET /api/franchise/orders?start=2022-01-01&end=2022-12-31
    NGINX->>API: 4. Forward request to backend
    
    API->>API: 5. Validate date parameters
    alt Invalid dates
        API-->>NGINX: HTTP 400 - Invalid date format
        NGINX-->>React: Error response
        React-->>User: Display error message
    else Valid dates
        API->>DB: 6. Execute SQL query<br/>JOIN fact_orders + dim_date<br/>GROUP BY month<br/>WHERE status IN ('delivered','shipped')
        DB-->>API: 7. Return aggregated data
        API->>API: 8. Format JSON response
        API-->>NGINX: 9. HTTP 200 + JSON data
        NGINX-->>React: 10. Forward response
        React->>React: 11. Render charts & stats
        React-->>User: 12. Display dashboard
    end
```

### Deployment Architecture

```mermaid
graph LR
    subgraph "Local Development"
        Dev[💻 Developer Machine]
        DevReact[React :3000]
        DevAPI[FastAPI :8000]
        DevDB[(SQLite)]
        
        Dev --> DevReact
        Dev --> DevAPI
        DevAPI --> DevDB
    end
    
    subgraph "SPCS Production"
        Internet[🌍 Internet]
        LB[Load Balancer]
        
        subgraph "Container 1"
            N1[NGINX]
            R1[React]
            A1[FastAPI]
        end
        
        subgraph "Container 2"
            N2[NGINX]
            R2[React]
            A2[FastAPI]
        end
        
        SF[(❄️ Snowflake<br/>Auto-scaling)]
        
        Internet --> LB
        LB --> N1
        LB --> N2
        N1 --> R1
        N1 --> A1
        N2 --> R2
        N2 --> A2
        A1 --> SF
        A2 --> SF
    end
    
    style Dev fill:#e1f5ff
    style Internet fill:#fff3e0
    style SF fill:#e3f2fd
```

### Database Schema Relationships

```mermaid
erDiagram
    FACT_ORDERS ||--o{ DIM_DATE : "date_key"
    FACT_ORDERS ||--o{ DIM_CUSTOMER : "customer_id"
    FACT_ORDERS ||--o{ DIM_PRODUCT : "product_id"
    
    FACT_ORDERS {
        int order_id PK
        int customer_id FK
        int product_id FK
        date order_date
        decimal amount
        string currency
        string status
        int quantity
        int date_key FK
    }
    
    DIM_CUSTOMER {
        int customer_id PK
        string name
        string email
        string addr_city
        string addr_state
        date valid_from
        date valid_to
        boolean is_current
    }
    
    DIM_PRODUCT {
        int product_id PK
        string name
        string category
        decimal price
    }
    
    DIM_DATE {
        int date_key PK
        date full_date
        int year
        int quarter
        int month
        string month_name
        string day_of_week
        boolean is_weekend
    }
```

### API Request Flow

```mermaid
flowchart TD
    Start([User Request]) --> Validate{Validate<br/>Parameters}
    
    Validate -->|Invalid Format| Error400[Return 400<br/>Invalid date format]
    Validate -->|Start > End| Error400b[Return 400<br/>Invalid date range]
    Validate -->|Valid| Connect[Connect to Database]
    
    Connect --> Query[Execute SQL Query:<br/>- JOIN tables<br/>- Filter by dates<br/>- Filter by status<br/>- GROUP BY month<br/>- ORDER BY date]
    
    Query --> CheckResults{Has<br/>Results?}
    
    CheckResults -->|No| EmptyArray[Return empty array]
    CheckResults -->|Yes| Format[Format Response:<br/>- month<br/>- month_name<br/>- order_count<br/>- revenue]
    
    Format --> Return200[Return 200 OK<br/>with JSON data]
    
    Query -->|Error| Error500[Return 500<br/>Database error]
    
    Error400 --> End([Response])
    Error400b --> End
    EmptyArray --> End
    Return200 --> End
    Error500 --> End
    
    style Start fill:#e8f5e9
    style End fill:#e8f5e9
    style Error400 fill:#ffebee
    style Error400b fill:#ffebee
    style Error500 fill:#ffebee
    style Return200 fill:#e3f2fd
    style EmptyArray fill:#fff9c4
```

### Technology Stack

```mermaid
mindmap
  root((NovaCart<br/>Dashboard))
    Frontend
      React 18
      Recharts
      Axios
      CSS Themes
    Backend
      FastAPI
      Python 3.11
      Uvicorn
      Pydantic
    Infrastructure
      NGINX
      Docker
      SPCS
    Database
      Development
        SQLite
      Production
        Snowflake
        OAuth
    Security
      HTTPS
      CORS
      Parameterized Queries
      Date Validation
```

### Component Communication Matrix

```mermaid
graph TD
    subgraph Legend
        direction LR
        L1[HTTP/HTTPS] 
        L2[SQL]
        L3[OAuth]
    end
    
    Browser[Browser] -->|HTTPS| NGINX[NGINX]
    NGINX -->|HTTP| React[React Frontend]
    NGINX -->|HTTP| FastAPI[FastAPI Backend]
    React -.->|REST API| FastAPI
    FastAPI -->|SQL| SQLite[(SQLite)]
    FastAPI -->|SQL + OAuth| Snowflake[(Snowflake)]
    
    style Browser fill:#e1f5ff
    style NGINX fill:#fff3e0
    style React fill:#e8f5e9
    style FastAPI fill:#f3e5f5
    style SQLite fill:#fce4ec
    style Snowflake fill:#e3f2fd
```

## How to Use These Diagrams

### In Markdown Viewers
Most modern markdown viewers (GitHub, GitLab, VS Code, etc.) support Mermaid diagrams natively. Simply paste the code blocks above.

### In Documentation Tools
- **Confluence**: Use the Mermaid plugin
- **Notion**: Use the Mermaid block
- **GitBook**: Native Mermaid support
- **MkDocs**: Use the mermaid2 plugin

### Export as Images
Use online tools like:
- https://mermaid.live/
- https://mermaid.ink/

### In Presentations
1. Render diagrams using mermaid.live
2. Export as PNG/SVG
3. Import into PowerPoint/Google Slides

---

**Note**: These diagrams complement the detailed ASCII diagrams in `ARCHITECTURE_DIAGRAM.md`
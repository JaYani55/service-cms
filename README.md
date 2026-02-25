# Booking Content Management System (Working Title)
## Project Setup

The project consists of two separate services that need to be started independently during development.

### 1. Install Dependencies
```sh
npm install
```

### 2. Start Services

Open two separate terminal windows:

**Terminal 1: CMS Dashboard (Frontend)**
```sh
# Starts Vite dev server on http://localhost:5173
npm run dev
```

**Terminal 2: CMS API (Backend Worker)**
```sh
# Starts Cloudflare Wrangler on http://localhost:8787
npm run dev:api
```

## Technologies

This project uses a modern decoupled architecture:

### Frontend (SPA)
- **Vite & React 18**: High-performance dashboard
- **Tailwind CSS & Shadcn UI**: Consistent design system
- **TanStack Query**: Efficient state management

### Backend (API & Worker)
- **Hono & Cloudflare Workers**: Serverless API layer
- **MCP (Model Context Protocol)**: Direct integration for AI Agents
- **Supabase**: PostgreSQL database, Authentication, and Storage
- **Seatable**: External data source for mentor management

## API & Agent Integration

The API provides two main entry points for automation:

1. **REST Discovery**: `http://localhost:8787/api/schemas` lists all available page schemas and their specifications.
2. **MCP Endpoint**: `http://localhost:8787/mcp` provides a Model Context Protocol interface for AI agents (like Claude Desktop) to discover, read, and register schemas automatically.

## Production
```sh
# Build Frontend
npm run build

# Deploy API to Cloudflare
npm run deploy:api
```

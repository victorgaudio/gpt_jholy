# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Project Overview

AnythingLLM is a full-stack application that enables users to turn documents into context for LLM conversations. It's a monorepo with three main applications:

- **frontend**: ViteJS + React frontend for document management and chat interface
- **server**: Node.js Express server handling LLM interactions, vector operations, and API endpoints
- **collector**: Node.js Express server for document processing and parsing

## Development Commands

### Quick Start (Lean Setup)
```bash
scripts/setup-simple.sh         # Setup in 2 minutes with API keys
scripts/manage-env-simple.sh dev # Start development (opens multiple terminals)
scripts/manage-env-simple.sh status # Check services status
scripts/manage-env-simple.sh stop   # Stop all services
```

### Initial Setup
```bash
scripts/setup-simple.sh      # Complete setup with API configuration
# OR manual setup:
yarn setup                   # Install dependencies and configure ENV files for all modules
yarn prisma:setup           # Generate Prisma client, run migrations, and seed database
```

### Development Environments

#### Native Development (Recommended)
```bash
yarn dev:server              # Start server in development mode (port 3002)
yarn dev:frontend            # Start frontend dev server (port 3000 or first available)
yarn dev:collector           # Start document collector (port 8888)
yarn dev:all                 # Start all three services concurrently
```

#### Docker Development (Optional)
```bash
docker-compose -f docker-compose.light.yml up -d                  # Lean development container
docker-compose -f docker-compose.light.yml --profile postgres up -d # With PostgreSQL
```

#### Production Testing (Local)
```bash
docker-compose -f docker-compose.production.yml --profile production up -d
```

### Production Build
```bash
yarn prod:frontend           # Build frontend for production
yarn prod:server             # Start server in production mode
```

### Code Quality
```bash
yarn lint                    # Run prettier/ESLint across all modules
yarn test                    # Run jest tests
```

### Database Operations
```bash
yarn prisma:generate         # Generate Prisma client after schema changes
yarn prisma:migrate          # Create and apply new migration
yarn prisma:seed             # Seed database with initial data
yarn prisma:reset            # Reset database (truncate and re-migrate)
```

### Digital Ocean Deployment
```bash
cd cloud-deployments/digitalocean/terraform/
cp terraform.tfvars.example terraform.tfvars  # Configure your settings
terraform init && terraform plan && terraform apply
```

## Architecture Overview

### Server (Node.js + Express)
- **Database**: Uses Prisma ORM with SQLite (default) or PostgreSQL/MySQL
- **Vector Storage**: Supports LanceDB (default), Pinecone, Chroma, Weaviate, Qdrant, Milvus
- **LLM Providers**: OpenAI, Anthropic, local models via Ollama/LM Studio, and 20+ others
- **Authentication**: JWT-based with bcrypt password hashing
- **API Structure**: REST endpoints organized by feature in `/endpoints`
- **Models**: Database models in `/models` using Prisma
- **Key Directories**:
  - `/endpoints`: API route handlers organized by feature
  - `/models`: Database models and business logic
  - `/utils`: Shared utilities for LLM providers, vector operations, etc.
  - `/prisma`: Database schema and migrations
  - `/storage`: File storage, vector cache, and models

### Frontend (React + Vite)
- **State Management**: React Context for auth, themes, and global state
- **Styling**: TailwindCSS with custom components
- **Routing**: React Router for SPA navigation
- **Key Features**: Workspace management, document upload, chat interface, admin panel
- **Key Directories**:
  - `/src/components`: Reusable UI components
  - `/src/pages`: Page-level components and routes
  - `/src/models`: API client functions
  - `/src/utils`: Frontend utilities and helpers
  - `/src/locales`: Internationalization files

### Collector (Node.js + Express)
- **Purpose**: Processes and parses various document types (PDF, DOCX, web pages, etc.)
- **Processing**: Converts documents to vectorizable text chunks
- **Supported Formats**: PDF, Word docs, text files, web scraping, YouTube transcripts, and more

## Core Concepts

### Workspaces
- Container units that isolate document collections and chat contexts
- Each workspace has its own document set and chat history
- Users can have different permissions per workspace

### Document Processing Flow
1. Documents uploaded via frontend
2. Collector processes and chunks documents
3. Server generates embeddings and stores in vector database
4. Documents become available for chat context in workspaces

### Chat System
- Supports both workspace chat and embedded chat widgets
- Integrates with 20+ LLM providers
- Uses Retrieval Augmented Generation (RAG) with vector similarity search
- Supports custom AI agents and multi-modal interactions

## Testing

- Uses Jest for unit testing
- Test files should be placed alongside source files with `.test.js` extension
- Run tests with `yarn test`

## Environment Configuration

### Lean Development Setup
- `server/.env.development` - Main config with OpenAI API key
- `server/.env.local` - Optimized lean configuration (alternative)
- `frontend/.env` - Frontend configuration (auto-configured)
- `collector/.env` - Collector configuration (auto-configured)

### Production
- `docker/.env.production` - Production config (same LLM provider as dev)

**Key difference**: Development uses SQLite + OpenAI, Production uses PostgreSQL + OpenAI
No configuration changes needed for LLM providers between environments.

**Port Configuration**:
- Default: Server 3001, Frontend 3000
- Alternative (if conflicts): Server 3002, Frontend auto-detects free port
- Always update frontend/.env when changing server port

## Documentation Structure

### Branch-Specific Documentation
- All development documentation is organized by branch: `docs/[branch-name]/`
- Current branch documentation: `docs/feat_deploy_local/`
- This approach tracks development progress and decisions per feature
- When merging branches, relevant docs can be moved to main docs folder

### Documentation Files
- `sessao-[branch-name].md` - Complete session documentation with commit messages
- `desenvolvimento-local.md` - Local development guide
- `troubleshooting-*.md` - Specific troubleshooting guides
- `prompts-utilizados.md` - Prompt knowledge base for the session

## Code Style

- Uses ESLint + Prettier for consistent formatting
- Hermes parser for JavaScript/JSX
- Flow type annotations supported but not required
- Run `yarn lint` before committing changes

## Troubleshooting e Debug

### Conflitos de Porta
```bash
# Verificar portas em uso
lsof -i :3001 :3002 :3000 :8888

# Server alternativo se 3001 ocupada
echo "SERVER_PORT=3002" >> server/.env.development
echo "VITE_API_BASE='http://localhost:3002/api'" > frontend/.env
```

### Problemas CORS
```bash
# Verificar configuração frontend
cat frontend/.env | grep VITE_API_BASE

# Deve apontar para mesma porta do servidor
# Se servidor na 3002, frontend deve usar:
VITE_API_BASE='http://localhost:3002/api'
```

### Debug com Playwright
```bash
# Teste visual automatizado
node test-frontend.js

# Debug detalhado
node debug-frontend.js
```

### Comandos de Emergency Reset
```bash
# Parar todos os processos
killall node

# Reset configurações
rm -f server/.env.development frontend/.env collector/.env
yarn setup

# Restart serviços
./scripts/manage-env-simple.sh dev
```

### Validação Rápida
```bash
# Status de todos os serviços
./scripts/manage-env-simple.sh status

# Health check manual
curl http://localhost:3002/api/ping  # Server
curl http://localhost:8888/ping      # Collector
open http://localhost:3004           # Frontend
```
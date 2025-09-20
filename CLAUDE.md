# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Project Overview

AnythingLLM is a full-stack application that enables users to turn documents into context for LLM conversations. It's a monorepo with three main applications:

- **frontend**: ViteJS + React frontend for document management and chat interface
- **server**: Node.js Express server handling LLM interactions, vector operations, and API endpoints
- **collector**: Node.js Express server for document processing and parsing

## Development Commands

### Initial Setup
```bash
yarn setup                    # Install dependencies and configure ENV files for all modules
yarn prisma:setup            # Generate Prisma client, run migrations, and seed database
```

### Development (run each in separate terminals)
```bash
yarn dev:server              # Start server in development mode (port varies, check ENV)
yarn dev:frontend            # Start frontend dev server (typically port 3000)
yarn dev:collector           # Start document collector (typically port 8888)
yarn dev:all                 # Start all three services concurrently
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

Each module requires its own `.env` file:
- `server/.env.development` - Server configuration (database, LLM keys, etc.)
- `frontend/.env` - Frontend configuration
- `collector/.env` - Collector configuration
- `docker/.env` - Docker deployment configuration

Use `yarn setup:envs` to copy example files, then fill in required values.

## Code Style

- Uses ESLint + Prettier for consistent formatting
- Hermes parser for JavaScript/JSX
- Flow type annotations supported but not required
- Run `yarn lint` before committing changes
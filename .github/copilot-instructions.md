# GitHub Copilot Instructions

## 🚀 About This Project

This is a comprehensive CRM and sales optimization suite for the automotive industry, built on Next.js. The application's core is the "Sistema de Perfilamiento y Potencial de Cliente" (SPPC), a sophisticated 15-point lead qualification system designed to classify and prioritize sales leads.

## 🏗️ Architecture & Tech Stack

- **Framework**: Next.js 14 (App Router)
- **Language**: TypeScript
- **Backend**: Next.js API Routes (`app/api/**/route.ts`)
- **Database**: PostgreSQL with Prisma ORM. The schema is the source of truth for our data models and is located at `prisma/schema.prisma`.
- **Authentication**: `NextAuth.js` handles user sessions. Configuration is in `lib/auth.ts`, and the API endpoint is at `app/api/auth/[...nextauth]/route.ts`.
- **UI**: Tailwind CSS with `shadcn/ui` components. Core UI components are in `components/ui`.
- **State Management**: Primarily React Server Components for data fetching, with client-side state managed by `jotai` or React hooks where necessary.

## 🧠 AI Integration

A key feature is the AI-powered sales training module.

- **Roleplay Simulation**: The `app/api/roleplay/simulate/route.ts` endpoint drives an interactive roleplay simulation between a salesperson and an AI-powered customer.
- **AI Provider Abstraction**: We use a custom AI router in `lib/ai-router.ts` to dynamically select the most cost-effective and available AI provider (e.g., Abacus.ai, OpenAI, DeepSeek).
- **Provider Configuration**: All AI provider details, including models and API keys, are managed in `lib/ai-providers.ts`. Environment variables are required for the API keys (e.g., `ABACUSAI_API_KEY`).

## 📋 Key Conventions & Patterns

- **API Routes**: All backend logic resides in Next.js API routes. Each feature has its own directory under `app/api/`. For example, lead management logic is in `app/api/prospectos/`.
- **Prisma Client**: The Prisma client is instantiated in `lib/prisma.ts` and imported from there into any file that needs database access.
- **Data Flow**:
    1.  Client-side components in `components/` or `app/dashboard/` make API requests to `app/api/`.
    2.  API routes handle business logic, using Prisma to interact with the database.
    3.  Data is returned to the client as JSON.
- **Error Handling**: API routes should use `try...catch` blocks and return standardized JSON error responses with appropriate HTTP status codes.

## 🛠️ Development Workflow

1.  **Environment Setup**:
    - Copy `.env.example` to `.env` and fill in the required variables, especially `DATABASE_URL` and `NEXTAUTH_SECRET`.
2.  **Dependencies**:
    - Install with `npm install`.
3.  **Database**:
    - To apply schema changes: `npx prisma db push`.
    - To generate the Prisma client: `npx prisma generate`.
4.  **Run Development Server**:
    - `npm run dev`. The application will be available at `http://localhost:3000`.
5.  **Seeding Data**:
    - The `scripts/` directory contains seed files. Run them with `npx tsx scripts/<seed_file_name>.ts` to populate the database with test data.

## 📂 Important Files & Directories

- `prisma/schema.prisma`: The single source of truth for the database schema.
- `lib/auth.ts`: Configuration for `NextAuth.js`.
- `lib/prisma.ts`: Prisma client instance.
- `lib/ai-router.ts` & `lib/ai-providers.ts`: Core of the AI integration.
- `app/api/`: Location of all backend API endpoints.
- `app/dashboard/`: Contains the main pages and components for the authenticated user experience.
- `components/`: Shared React components used throughout the application.

# TechnAI Dashboard

A professional freelancer business dashboard for AI consulting companies. Built with Next.js 14+, TailwindCSS, Prisma, and PostgreSQL.

![TechnAI Dashboard](https://via.placeholder.com/1200x630/0a192f/00ffff?text=TechnAI+Dashboard)

## Features

- 📊 **Dashboard** - Monthly revenue, expenses, profit overview with visual charts
- 📁 **Projects** - Manage client projects with hourly rates and progress tracking
- ⏱️ **Timesheets** - Track working hours per project with weekly/monthly views
- 📄 **Invoices** - Auto-generated invoice numbers, VAT calculations, PDF export
- 💸 **Expenses** - Track business expenses by category with VAT deductions
- 🔐 **Authentication** - Ready for Supabase or NextAuth integration

## Tech Stack

- **Framework**: Next.js 14+ (App Router)
- **Styling**: TailwindCSS + Custom Design System
- **Database**: PostgreSQL + Prisma ORM
- **Validation**: Zod
- **Charts**: Recharts
- **Icons**: Lucide React

## Getting Started

### Prerequisites

- Node.js 18+
- PostgreSQL database

### Installation

1. **Clone and install dependencies**
   ```bash
   cd "TechnAI Dashboard"
   npm install
   ```

2. **Set up environment variables**
   
   Create a `.env` file in the root directory:
   ```env
   # Database
   DATABASE_URL="postgresql://user:password@localhost:5432/technai_dashboard?schema=public"
   
   # NextAuth (optional)
   NEXTAUTH_SECRET="your-super-secret-key-here"
   NEXTAUTH_URL="http://localhost:3000"
   ```

3. **Set up the database**
   ```bash
   # Generate Prisma client
   npm run db:generate
   
   # Push schema to database
   npm run db:push
   
   # Seed with sample data
   npm run db:seed
   ```

4. **Run the development server**
   ```bash
   npm run dev
   ```

5. Open [http://localhost:3000](http://localhost:3000)

## Project Structure

```
├── prisma/
│   ├── schema.prisma      # Database schema
│   └── seed.ts            # Sample data seeder
├── src/
│   ├── app/
│   │   ├── api/           # API route handlers
│   │   ├── projects/      # Projects page
│   │   ├── timesheets/    # Timesheets page
│   │   ├── invoices/      # Invoices page
│   │   ├── expenses/      # Expenses page
│   │   ├── layout.tsx     # Root layout
│   │   └── page.tsx       # Dashboard home
│   ├── components/
│   │   ├── ui/            # Base UI components
│   │   ├── dashboard/     # Dashboard widgets
│   │   ├── forms/         # Form components
│   │   ├── layout/        # Layout components
│   │   ├── projects/      # Project components
│   │   └── invoices/      # Invoice components
│   └── lib/
│       ├── prisma.ts      # Database client
│       ├── utils.ts       # Utility functions
│       ├── validations.ts # Zod schemas
│       ├── invoice-utils.ts
│       └── timesheet-utils.ts
```

## API Endpoints

### Dashboard
- `GET /api/dashboard` - Get dashboard summary data

### Clients
- `GET /api/clients` - List all clients
- `POST /api/clients` - Create client
- `GET /api/clients/[id]` - Get client
- `PUT /api/clients/[id]` - Update client
- `DELETE /api/clients/[id]` - Delete client

### Projects
- `GET /api/projects` - List projects (with ?status filter)
- `POST /api/projects` - Create project
- `GET /api/projects/[id]` - Get project with stats
- `PUT /api/projects/[id]` - Update project
- `DELETE /api/projects/[id]` - Delete project

### Timesheets
- `GET /api/timesheets` - List entries (with ?view=week|month)
- `POST /api/timesheets` - Create entry
- `GET /api/timesheets/[id]` - Get entry
- `PUT /api/timesheets/[id]` - Update entry
- `DELETE /api/timesheets/[id]` - Delete entry

### Invoices
- `GET /api/invoices` - List invoices (with ?status filter)
- `POST /api/invoices` - Create invoice (auto-generates number)
- `GET /api/invoices/[id]` - Get invoice (with ?format=pdf for PDF-ready JSON)
- `PUT /api/invoices/[id]` - Update invoice
- `DELETE /api/invoices/[id]` - Delete invoice

### Expenses
- `GET /api/expenses` - List expenses (with ?summary=true for totals)
- `POST /api/expenses` - Create expense
- `GET /api/expenses/[id]` - Get expense
- `PUT /api/expenses/[id]` - Update expense
- `DELETE /api/expenses/[id]` - Delete expense

## Design System

The dashboard uses a futuristic electric-cyan + navy color palette:

- **Primary**: Electric Cyan `#00FFFF`
- **Background**: Deep Navy `#0a192f`
- **Surface**: Lighter Navy for cards
- **Accents**: Gradient effects and glow shadows

## License

MIT License - Feel free to use this for your own projects!

---

Built with ❤️ by TechnAI

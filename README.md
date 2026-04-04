# Taskly — Kanban Task Board

A polished, professional Kanban-style task board built with React, TypeScript, and Supabase. Inspired by Linear and Asana, with a neumorphic design system and multiple theme options.

## Features

### Core
- **Kanban Board** — Four columns: To Do, In Progress, In Review, Done
- **Drag & Drop** — Smooth drag-and-drop task management between columns
- **Guest Auth** — Automatic anonymous sign-in via Supabase Auth
- **Row Level Security** — Each user only sees their own data

### Advanced
- **Team Members & Multi-Assignee** — Create a team, assign one or more members to any task
- **Labels / Tags** — Custom labels, assign multiple per task, filter by label
- **Comments** — Add timestamped comments to any task
- **Activity Log** — Detailed history of status changes, assignments, labels, edits
- **Due Date Indicators** — Visual badges for overdue and due-soon tasks
- **Search & Filtering** — Filter by title, priority, due date, assignee, or label
- **Sorting** — Sort by priority or due date
- **Board Analytics** — Pie charts (status, priority), team workload bar chart, deadline overview, AI insights
- **AI Insights** — Optional Gemini 2.5 Flash integration for intelligent board analysis (with heuristic fallback)

### Design
- Three neumorphic themes: Soft Dark (default), Soft Lavender, Retro (pixel art)
- Cohesive design system with CSS variables
- Smooth Framer Motion animations throughout
- Custom DatePicker and CustomSelect components
- Loading screen, empty states, error handling
- Fully responsive layout (4 → 2×2 → 1×4 column stacking)
- Confetti celebration when completing tasks

## Tech Stack

- **Frontend**: React 19, TypeScript, Vite
- **Styling**: Tailwind CSS v4, CSS custom properties
- **Drag & Drop**: @dnd-kit
- **Animations**: Framer Motion
- **Charts**: Recharts
- **Icons**: Lucide React
- **Dates**: date-fns
- **Database & Auth**: Supabase (PostgreSQL + Anonymous Auth)

## Setup

### 1. Clone & Install

```bash
git clone https://github.com/your-username/Taskly.git
cd Taskly
npm install
```

### 2. Supabase Setup

1. Create a free project at [supabase.com](https://supabase.com)
2. Enable **Anonymous Sign-in** in Authentication → Settings → Auth Providers
3. Run the SQL schema in the SQL Editor:
   - Copy the contents of `src/lib/database.sql`
   - Paste into the Supabase SQL Editor and click **Run**
4. Copy your project URL and anon key from Settings → API

### 3. Environment Variables

```bash
cp .env.example .env
```

Edit `.env` with your Supabase credentials:

```
VITE_SUPABASE_URL=https://your-project.supabase.co
VITE_SUPABASE_ANON_KEY=your-anon-key-here
VITE_GEMINI_API_KEY=your-gemini-api-key-here  # Optional, for AI insights
```

### 4. Run Locally

```bash
npm run dev
```

Open [http://localhost:5173](http://localhost:5173)

### 5. Build for Production

```bash
npm run build
```

### 6. Deploy

Deploy the `dist` folder to Vercel, Netlify, or Cloudflare Pages.

**Vercel:**
```bash
npx vercel --prod
```

## Database Schema

See `src/lib/database.sql` for the complete schema with:
- 7 tables: `tasks`, `labels`, `task_labels`, `task_assignees`, `team_members`, `comments`, `activity_log`
- Full RLS policies for data isolation
- Performance indexes
- Auto-updating `updated_at` trigger

## License

MIT

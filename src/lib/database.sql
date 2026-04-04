-- ============================================
-- Taskly Database Schema
-- Run this in the Supabase SQL editor
-- ============================================

-- Enable UUID extension
create extension if not exists "uuid-ossp";

-- ============================================
-- Team Members table (created first — referenced by tasks)
-- ============================================
create table if not exists team_members (
  id uuid primary key default uuid_generate_v4(),
  name text not null,
  color text not null default '#6366f1',
  avatar_url text,
  user_id uuid not null references auth.users(id) on delete cascade,
  created_at timestamptz not null default now()
);

-- ============================================
-- Tasks table
-- ============================================
create table if not exists tasks (
  id uuid primary key default uuid_generate_v4(),
  title text not null,
  description text,
  status text not null default 'todo' check (status in ('todo', 'in_progress', 'in_review', 'done')),
  priority text not null default 'normal' check (priority in ('low', 'normal', 'high')),
  user_id uuid not null references auth.users(id) on delete cascade,
  assignee_id uuid references team_members(id) on delete set null,
  due_date date,
  position integer not null default 0,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

-- ============================================
-- Labels table
-- ============================================
create table if not exists labels (
  id uuid primary key default uuid_generate_v4(),
  name text not null,
  color text not null default '#6366f1',
  user_id uuid not null references auth.users(id) on delete cascade,
  created_at timestamptz not null default now()
);

-- ============================================
-- Task-Labels junction table
-- ============================================
create table if not exists task_labels (
  task_id uuid not null references tasks(id) on delete cascade,
  label_id uuid not null references labels(id) on delete cascade,
  primary key (task_id, label_id)
);

-- ============================================
-- Task-Assignees junction table (multi-assignee)
-- ============================================
create table if not exists task_assignees (
  task_id uuid not null references tasks(id) on delete cascade,
  member_id uuid not null references team_members(id) on delete cascade,
  primary key (task_id, member_id)
);

-- ============================================
-- Comments table
-- ============================================
create table if not exists comments (
  id uuid primary key default uuid_generate_v4(),
  task_id uuid not null references tasks(id) on delete cascade,
  user_id uuid not null references auth.users(id) on delete cascade,
  content text not null,
  created_at timestamptz not null default now()
);

-- ============================================
-- Activity Log table
-- ============================================
create table if not exists activity_log (
  id uuid primary key default uuid_generate_v4(),
  task_id uuid not null references tasks(id) on delete cascade,
  user_id uuid not null references auth.users(id) on delete cascade,
  action text not null,
  details text,
  created_at timestamptz not null default now()
);

-- ============================================
-- Row Level Security
-- ============================================

alter table tasks enable row level security;
alter table labels enable row level security;
alter table task_labels enable row level security;
alter table task_assignees enable row level security;
alter table team_members enable row level security;
alter table comments enable row level security;
alter table activity_log enable row level security;

-- Tasks policies
create policy "Users can view their own tasks"
  on tasks for select using (auth.uid() = user_id);
create policy "Users can create their own tasks"
  on tasks for insert with check (auth.uid() = user_id);
create policy "Users can update their own tasks"
  on tasks for update using (auth.uid() = user_id);
create policy "Users can delete their own tasks"
  on tasks for delete using (auth.uid() = user_id);

-- Labels policies
create policy "Users can view their own labels"
  on labels for select using (auth.uid() = user_id);
create policy "Users can create their own labels"
  on labels for insert with check (auth.uid() = user_id);
create policy "Users can update their own labels"
  on labels for update using (auth.uid() = user_id);
create policy "Users can delete their own labels"
  on labels for delete using (auth.uid() = user_id);

-- Task Labels policies
create policy "Users can view their own task labels"
  on task_labels for select using (
    exists (select 1 from tasks where tasks.id = task_labels.task_id and tasks.user_id = auth.uid())
  );
create policy "Users can create their own task labels"
  on task_labels for insert with check (
    exists (select 1 from tasks where tasks.id = task_labels.task_id and tasks.user_id = auth.uid())
    and exists (select 1 from labels where labels.id = task_labels.label_id and labels.user_id = auth.uid())
  );
create policy "Users can delete their own task labels"
  on task_labels for delete using (
    exists (select 1 from tasks where tasks.id = task_labels.task_id and tasks.user_id = auth.uid())
  );

-- Task Assignees policies
create policy "Users can view their own task assignees"
  on task_assignees for select using (
    exists (select 1 from tasks where tasks.id = task_assignees.task_id and tasks.user_id = auth.uid())
  );
create policy "Users can create their own task assignees"
  on task_assignees for insert with check (
    exists (select 1 from tasks where tasks.id = task_assignees.task_id and tasks.user_id = auth.uid())
    and exists (select 1 from team_members where team_members.id = task_assignees.member_id and team_members.user_id = auth.uid())
  );
create policy "Users can delete their own task assignees"
  on task_assignees for delete using (
    exists (select 1 from tasks where tasks.id = task_assignees.task_id and tasks.user_id = auth.uid())
  );

-- Team Members policies
create policy "Users can view their own team members"
  on team_members for select using (auth.uid() = user_id);
create policy "Users can create their own team members"
  on team_members for insert with check (auth.uid() = user_id);
create policy "Users can update their own team members"
  on team_members for update using (auth.uid() = user_id);
create policy "Users can delete their own team members"
  on team_members for delete using (auth.uid() = user_id);

-- Comments policies (scoped to task ownership so all comments on a user's task are visible)
create policy "Users can view comments on their tasks"
  on comments for select using (
    exists (select 1 from tasks where tasks.id = comments.task_id and tasks.user_id = auth.uid())
  );
create policy "Users can create comments on their tasks"
  on comments for insert with check (
    auth.uid() = user_id
    and exists (select 1 from tasks where tasks.id = comments.task_id and tasks.user_id = auth.uid())
  );
create policy "Users can delete their own comments"
  on comments for delete using (auth.uid() = user_id);

-- Activity Log policies
create policy "Users can view their own activity log"
  on activity_log for select using (auth.uid() = user_id);
create policy "Users can create their own activity log"
  on activity_log for insert with check (auth.uid() = user_id);

-- ============================================
-- Updated at trigger
-- ============================================
create or replace function update_updated_at()
returns trigger as $$
begin
  new.updated_at = now();
  return new;
end;
$$ language plpgsql;

create trigger tasks_updated_at
  before update on tasks
  for each row
  execute function update_updated_at();

-- ============================================
-- Indexes for performance
-- ============================================
create index if not exists idx_tasks_user_id on tasks(user_id);
create index if not exists idx_tasks_status on tasks(status);
create index if not exists idx_tasks_user_status on tasks(user_id, status);
create index if not exists idx_labels_user_id on labels(user_id);
create index if not exists idx_comments_task_id on comments(task_id);
create index if not exists idx_activity_log_task_id on activity_log(task_id);
create index if not exists idx_team_members_user_id on team_members(user_id);
create index if not exists idx_task_assignees_task_id on task_assignees(task_id);
create index if not exists idx_task_assignees_member_id on task_assignees(member_id);

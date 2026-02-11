-- Create study_tasks table
create table if not exists study_tasks (
  id uuid default gen_random_uuid() primary key,
  user_id uuid not null,
  task text not null,
  subject text not null,
  date date not null,
  completed boolean default false,
  priority text check (priority in ('low', 'medium', 'high')),
  estimated_hours numeric,
  source text default 'study',
  application_id integer,
  reminder boolean default false,
  reminder_date timestamptz,
  created_at timestamptz default now()
);

-- Enable Row Level Security
alter table study_tasks enable row level security;

-- Create policy to allow users to see only their own tasks
create policy "Users can view their own study tasks"
on study_tasks for select
using (auth.uid() = user_id);

-- Create policy to allow users to insert their own tasks
create policy "Users can insert their own study tasks"
on study_tasks for insert
with check (auth.uid() = user_id);

-- Create policy to allow users to update their own tasks
create policy "Users can update their own study tasks"
on study_tasks for update
using (auth.uid() = user_id);

-- Create policy to allow users to delete their own tasks
create policy "Users can delete their own study tasks"
on study_tasks for delete
using (auth.uid() = user_id);

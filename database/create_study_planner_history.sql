-- Create table for storing study planner history
create table if not exists study_planner_history (
  id uuid default gen_random_uuid() primary key,
  user_id uuid references auth.users(id) on delete cascade not null,
  created_at timestamp with time zone default timezone('utc'::text, now()) not null,
  roadmap_data jsonb not null, -- The parsed roadmap structure (weeks/tasks)
  webhook_response jsonb not null, -- The raw webhook response
  title text -- Optional title (e.g. "Study Plan - Oct 24")
);

-- Enable Row Level Security
alter table study_planner_history enable row level security;

-- Create policies
create policy "Users can insert their own history"
  on study_planner_history for insert
  with check (auth.uid() = user_id);

create policy "Users can view their own history"
  on study_planner_history for select
  using (auth.uid() = user_id);

create policy "Users can delete their own history"
  on study_planner_history for delete
  using (auth.uid() = user_id);


-- Create folders table
create table if not exists folders (
  id uuid default gen_random_uuid() primary key,
  user_id uuid references auth.users not null,
  name text not null,
  document_ids text[] default '{}',
  color text,
  created_at timestamptz default now()
);

-- Enable RLS
alter table folders enable row level security;

-- Policies
create policy "Users can view their own folders"
  on folders for select
  using (auth.uid() = user_id);

create policy "Users can insert their own folders"
  on folders for insert
  with check (auth.uid() = user_id);

create policy "Users can update their own folders"
  on folders for update
  using (auth.uid() = user_id);

create policy "Users can delete their own folders"
  on folders for delete
  using (auth.uid() = user_id);

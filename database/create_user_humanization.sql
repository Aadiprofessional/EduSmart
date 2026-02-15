create table if not exists public.user_humanization ( 
   id uuid default gen_random_uuid() primary key, 
   humanization_id uuid not null, 
   uid text not null, 
   original_text text not null, 
   humanized_text text not null, 
   title text default 'Untitled', 
   tags text[] default '{}', 
   language text default 'en', 
   created_at timestamptz default now() 
 );

-- Report Discussions Table (Audit Trail)
-- Allows strict communication between Citizens, NGOs, and Government

create table if not exists public.report_discussions (
    id uuid default uuid_generate_v4() primary key,
    report_id uuid references public.reports(id) on delete cascade,
    user_id uuid references auth.users(id) on delete cascade,
    message_type text not null, -- INFO_REQUEST, STATUS_UPDATE, CLARIFICATION, FIELD_UPDATE, PROOF_UPLOAD, CLOSURE_NOTE
    content text not null,
    photo_url text, -- For attachments (PROOF_UPLOAD)
    created_at timestamp with time zone default timezone('utc'::text, now()) not null
);

-- RLS Policies
alter table public.report_discussions enable row level security;

-- Everyone can read discussions for reports (Transparency)
create policy "Public discussions are viewable by everyone"
    on public.report_discussions for select
    using ( true );

-- Authenticated users can insert discussion messages
create policy "Users can insert discussion messages"
    on public.report_discussions for insert
    with check ( auth.uid() = user_id );

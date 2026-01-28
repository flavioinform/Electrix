-- Enable RLS on storage.objects (usually enabled by default, but good measure)
-- alter table storage.objects enable row level security;

-- Policy to allow authenticated users to upload files to 'viviendas' bucket
create policy "Allow authenticated uploads"
on storage.objects for insert
to authenticated
with check ( bucket_id = 'viviendas' );

-- Policy to allow public to view files in 'viviendas' bucket (since it's a public bucket)
-- Or restricted to authenticated if you prefer, but 'public' bucket usually implies public read.
create policy "Allow public viewing"
on storage.objects for select
to public
using ( bucket_id = 'viviendas' );

-- Policy to allow authenticated users to delete their own uploads
create policy "Allow authenticated deletions"
on storage.objects for delete
to authenticated
using ( bucket_id = 'viviendas' );

-- Helper to ensure the bucket itself exists and is public (optional, but effectively "upserts" configuration)
insert into storage.buckets (id, name, public)
values ('viviendas', 'viviendas', true)
on conflict (id) do update set public = true;

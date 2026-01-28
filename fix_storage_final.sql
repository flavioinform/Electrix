-- 1. Ensure the bucket exists and is public
insert into storage.buckets (id, name, public)
values ('viviendas', 'viviendas', true)
on conflict (id) do update set public = true;

-- 2. Drop existing policies to avoid conflicts (and ensure we are starting fresh)
drop policy if exists "Allow authenticated uploads" on storage.objects;
drop policy if exists "Allow public viewing" on storage.objects;
drop policy if exists "Allow authenticated deletions" on storage.objects;
drop policy if exists "Give access to viviendas bucket" on storage.objects;
-- Also drop policies that might have been created with specific names for this bucket
drop policy if exists "viviendas_insert" on storage.objects;
drop policy if exists "viviendas_select" on storage.objects;
drop policy if exists "viviendas_delete" on storage.objects;
drop policy if exists "viviendas_update" on storage.objects;

-- 3. Re-create policies with correct permissions
-- Allow anyone (public) to view/download images (since it's a public bucket)
create policy "viviendas_select"
on storage.objects for select
to public
using ( bucket_id = 'viviendas' );

-- Allow authenticated users to upload files to 'viviendas'
create policy "viviendas_insert"
on storage.objects for insert
to authenticated
with check ( bucket_id = 'viviendas' );

-- Allow authenticated users to update/delete files in this bucket
create policy "viviendas_update"
on storage.objects for update
to authenticated
using ( bucket_id = 'viviendas' );

create policy "viviendas_delete"
on storage.objects for delete
to authenticated
using ( bucket_id = 'viviendas' );

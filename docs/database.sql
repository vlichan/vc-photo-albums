create table if not exists public.categories (
  id uuid primary key default gen_random_uuid(),
  name text not null,
  slug text not null unique,
  created_at timestamptz not null default now()
);

create table if not exists public.albums (
  id uuid primary key default gen_random_uuid(),
  title text not null,
  slug text not null unique,
  description text default '',
  cover_image text,
  category_id uuid references public.categories(id) on delete set null,
  password text,
  is_public boolean not null default false,
  created_at timestamptz not null default now()
);

create table if not exists public.photos (
  id uuid primary key default gen_random_uuid(),
  album_id uuid not null references public.albums(id) on delete cascade,
  image_url text not null,
  thumbnail_url text not null,
  sort_order integer not null default 0,
  image_code text not null,
  mime_type text,
  file_size bigint,
  width integer,
  height integer,
  created_at timestamptz not null default now()
);

create index if not exists albums_category_id_idx on public.albums(category_id);
create index if not exists photos_album_id_sort_order_idx
  on public.photos(album_id, sort_order);

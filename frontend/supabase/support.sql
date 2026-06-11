create extension if not exists pgcrypto;

create table if not exists public.admin_users (
  user_id uuid primary key references auth.users(id) on delete cascade,
  created_at timestamptz not null default now()
);

create or replace function public.is_admin()
returns boolean
language sql
stable
security definer
set search_path = public
as $$
  select exists (
    select 1 from public.admin_users
    where user_id = auth.uid()
  );
$$;

create table if not exists public.support_categories (
  id text primary key,
  name text not null check (char_length(trim(name)) > 0),
  description text,
  sort_order integer not null default 0,
  is_active boolean not null default true,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table if not exists public.faqs (
  id uuid primary key default gen_random_uuid(),
  category_id text not null references public.support_categories(id) on update cascade,
  title text not null check (char_length(trim(title)) > 0),
  body_markdown text not null check (char_length(trim(body_markdown)) > 0),
  status text not null default 'draft' check (status in ('draft', 'published', 'archived')),
  is_popular boolean not null default false,
  sort_order integer not null default 0,
  created_by uuid references auth.users(id) on delete set null,
  updated_by uuid references auth.users(id) on delete set null,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table if not exists public.contacts (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  category_id text references public.support_categories(id) on update cascade,
  title text not null check (char_length(trim(title)) > 0),
  body text not null check (char_length(trim(body)) > 0),
  status text not null default 'open' check (status in ('open', 'answered', 'closed')),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table if not exists public.contact_replies (
  id uuid primary key default gen_random_uuid(),
  contact_id uuid not null references public.contacts(id) on delete cascade,
  author_id uuid references auth.users(id) on delete set null,
  body text not null check (char_length(trim(body)) > 0),
  is_staff boolean not null default false,
  created_at timestamptz not null default now()
);

create index if not exists support_categories_order_idx on public.support_categories (sort_order);
create index if not exists faqs_public_idx on public.faqs (category_id, is_popular desc, sort_order)
  where status = 'published';
create index if not exists contacts_user_idx on public.contacts (user_id, updated_at desc);
create index if not exists contact_replies_contact_idx on public.contact_replies (contact_id, created_at);

create or replace function public.touch_support_updated_at()
returns trigger
language plpgsql
as $$
begin
  new.updated_at = now();
  return new;
end;
$$;

drop trigger if exists support_categories_touch_updated_at on public.support_categories;
create trigger support_categories_touch_updated_at
before update on public.support_categories
for each row execute function public.touch_support_updated_at();

drop trigger if exists faqs_touch_updated_at on public.faqs;
create trigger faqs_touch_updated_at
before update on public.faqs
for each row execute function public.touch_support_updated_at();

drop trigger if exists contacts_touch_updated_at on public.contacts;
create trigger contacts_touch_updated_at
before update on public.contacts
for each row execute function public.touch_support_updated_at();

alter table public.support_categories enable row level security;
alter table public.faqs enable row level security;
alter table public.contacts enable row level security;
alter table public.contact_replies enable row level security;

drop policy if exists "Public can read active support categories" on public.support_categories;
create policy "Public can read active support categories"
on public.support_categories
for select
using (is_active = true or public.is_admin());

drop policy if exists "Admins can manage support categories" on public.support_categories;
create policy "Admins can manage support categories"
on public.support_categories
for all
using (public.is_admin())
with check (public.is_admin());

drop policy if exists "Public can read published faqs" on public.faqs;
create policy "Public can read published faqs"
on public.faqs
for select
using (status = 'published' or public.is_admin());

drop policy if exists "Admins can manage faqs" on public.faqs;
create policy "Admins can manage faqs"
on public.faqs
for all
using (public.is_admin())
with check (public.is_admin());

drop policy if exists "Users can read own contacts" on public.contacts;
create policy "Users can read own contacts"
on public.contacts
for select
using (user_id = auth.uid() or public.is_admin());

drop policy if exists "Users can create own contacts" on public.contacts;
create policy "Users can create own contacts"
on public.contacts
for insert
with check (user_id = auth.uid());

drop policy if exists "Admins can update contacts" on public.contacts;
create policy "Admins can update contacts"
on public.contacts
for update
using (public.is_admin())
with check (public.is_admin());

drop policy if exists "Users can read contact replies" on public.contact_replies;
create policy "Users can read contact replies"
on public.contact_replies
for select
using (
  public.is_admin()
  or exists (
    select 1 from public.contacts
    where contacts.id = contact_replies.contact_id
      and contacts.user_id = auth.uid()
  )
);

drop policy if exists "Admins can create contact replies" on public.contact_replies;
create policy "Admins can create contact replies"
on public.contact_replies
for insert
with check (public.is_admin());

insert into public.support_categories (id, name, description, sort_order)
values
  ('account', '계정 및 인증', '로그인, 프로필, 본인 인증', 1),
  ('payment', '결제 · 구독 · 환불', '피스, 구독, 환불', 2),
  ('chat', '플롯 제작', '플롯과 캐릭터 제작', 3),
  ('ai', 'AI 대화', '응답 품질과 모델 설정', 4),
  ('safety', '문제 해결', '차단, 오류, 정책 조치', 5),
  ('feedback', '제안 및 제보', '기능 제안, 권리 침해 제보', 6)
on conflict (id) do update
set name = excluded.name,
    description = excluded.description,
    sort_order = excluded.sort_order,
    is_active = true;

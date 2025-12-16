-- Core enums
create type public.app_role as enum ('admin','doctor','radiologist','nurse','ecg_tech','lab_tech','pharmacist','receptionist','patient');
create type public.order_type as enum ('radiology','ecg');
create type public.order_status as enum ('pending','in_progress','completed');

-- Profiles mirror auth.users
create table if not exists public.profiles (
  user_id uuid primary key references auth.users on delete cascade,
  full_name text not null,
  email text not null,
  phone text,
  role public.app_role not null,
  staff_category public.app_role,
  is_active boolean default true,
  created_by uuid references auth.users,
  medical_record_number text unique,
  created_at timestamptz default now()
);

-- Optional patient demographics
create table if not exists public.patients (
  user_id uuid primary key references auth.users on delete cascade,
  date_of_birth date,
  sex text,
  address text,
  emergency_contact jsonb,
  created_at timestamptz default now()
);

-- Care assignments map staff to patients
create table if not exists public.care_assignments (
  id bigserial primary key,
  patient_id uuid references public.profiles(user_id) on delete cascade,
  clinician_id uuid references public.profiles(user_id) on delete cascade,
  role public.app_role not null,
  created_at timestamptz default now()
);

create table if not exists public.clinical_visits (
  id bigserial primary key,
  patient_id uuid references public.profiles(user_id) on delete cascade,
  doctor_id uuid references public.profiles(user_id) on delete set null,
  symptoms text,
  diagnosis text,
  plan text,
  created_at timestamptz default now()
);

create table if not exists public.care_orders (
  id bigserial primary key,
  patient_id uuid references public.profiles(user_id) on delete cascade,
  ordering_doctor uuid references public.profiles(user_id) on delete set null,
  assigned_to uuid references public.profiles(user_id) on delete set null,
  order_type public.order_type not null,
  modality text not null,
  notes text,
  status public.order_status default 'pending',
  created_at timestamptz default now(),
  updated_at timestamptz default now()
);

create table if not exists public.order_results (
  id bigserial primary key,
  order_id bigint references public.care_orders(id) on delete cascade,
  findings text,
  impression text,
  status public.order_status,
  created_by uuid references public.profiles(user_id) on delete set null,
  report_path text,
  created_at timestamptz default now()
);

create table if not exists public.nurse_notes (
  id bigserial primary key,
  patient_id uuid references public.profiles(user_id) on delete cascade,
  nurse_id uuid references public.profiles(user_id) on delete set null,
  vitals jsonb,
  notes text,
  created_at timestamptz default now()
);

create table if not exists public.notifications (
  id bigserial primary key,
  recipient_id uuid references public.profiles(user_id) on delete cascade,
  title text not null,
  body text,
  related_type text,
  related_id bigint,
  is_read boolean default false,
  created_at timestamptz default now()
);

create table if not exists public.activity_logs (
  id bigserial primary key,
  actor_id uuid references public.profiles(user_id),
  action text not null,
  entity text,
  payload jsonb,
  created_at timestamptz default now()
);

-- Updated at trigger
create or replace function public.touch_updated_at()
returns trigger as $$
begin
  new.updated_at = now();
  return new;
end;
$$ language plpgsql;

drop trigger if exists care_orders_touch on public.care_orders;
create trigger care_orders_touch before update on public.care_orders
for each row execute function public.touch_updated_at();

-- Indexes
create index if not exists idx_care_orders_patient on public.care_orders(patient_id);
create index if not exists idx_care_orders_assignee on public.care_orders(assigned_to);
create index if not exists idx_notifications_recipient on public.notifications(recipient_id);
create index if not exists idx_clinical_visits_patient on public.clinical_visits(patient_id);

-- Storage bucket for imaging
insert into storage.buckets (id, name, public) values ('imaging', 'imaging', false)
on conflict (id) do nothing;

-- Storage policies (authenticated users can upload; bucket enforced by RLS in tables)
begin;
  create policy if not exists "Allow authenticated uploads" on storage.objects
    for insert to authenticated
    with check (bucket_id = 'imaging');
  create policy if not exists "Allow authenticated read" on storage.objects
    for select using (bucket_id = 'imaging');
commit;

-- Row Level Security policies
alter table public.profiles enable row level security;
alter table public.patients enable row level security;
alter table public.care_assignments enable row level security;
alter table public.clinical_visits enable row level security;
alter table public.care_orders enable row level security;
alter table public.order_results enable row level security;
alter table public.nurse_notes enable row level security;
alter table public.notifications enable row level security;

-- Profiles: everyone can read themselves; admins everything; service role bypasses
create policy "Admin manage profiles" on public.profiles for all
  using (auth.jwt() ->> 'role' = 'service_role' or exists (select 1 from public.profiles p where p.user_id = auth.uid() and p.role = 'admin'))
  with check (true);
create policy "Users view self" on public.profiles for select using (user_id = auth.uid());
create policy "Staff view coworkers" on public.profiles for select
  using (
    profiles.role != 'patient' and exists (select 1 from public.profiles p where p.user_id = auth.uid() and p.role != 'patient')
  );
create policy "Clinicians view assigned patients" on public.profiles for select
  using (
    user_id = auth.uid()
    or exists (
      select 1 from public.care_assignments ca where ca.patient_id = profiles.user_id and ca.clinician_id = auth.uid()
    )
    or exists (select 1 from public.profiles p where p.user_id = auth.uid() and p.role = 'admin')
  );
create policy "Patients can view staff identities" on public.profiles for select
  using (profiles.role != 'patient' and auth.uid() is not null);

-- Patients table
create policy "Patients view self" on public.patients for select using (user_id = auth.uid());
create policy "Admin manage patients" on public.patients for all using (exists (select 1 from public.profiles p where p.user_id = auth.uid() and p.role = 'admin'));

-- Care assignments
create policy "Assignments for clinicians" on public.care_assignments
  for select using (clinician_id = auth.uid() or patient_id = auth.uid() or exists (select 1 from public.profiles p where p.user_id = auth.uid() and p.role = 'admin'));
create policy "Admin insert assignments" on public.care_assignments for insert
  with check (exists (select 1 from public.profiles p where p.user_id = auth.uid() and p.role = 'admin'));

-- Clinical visits
create policy "Clinical visits readable" on public.clinical_visits for select
  using (patient_id = auth.uid() or doctor_id = auth.uid() or exists (select 1 from public.profiles p where p.user_id = auth.uid() and p.role = 'admin'));
create policy "Doctors add visits" on public.clinical_visits for insert
  with check (doctor_id = auth.uid());

-- Care orders
create policy "Orders readable" on public.care_orders for select
  using (
    patient_id = auth.uid()
    or ordering_doctor = auth.uid()
    or assigned_to = auth.uid()
    or exists (select 1 from public.profiles p where p.user_id = auth.uid() and p.role = 'admin')
  );
create policy "Doctors create orders" on public.care_orders for insert
  with check (ordering_doctor = auth.uid());
create policy "Assigned staff update status" on public.care_orders for update
  using (assigned_to = auth.uid() or ordering_doctor = auth.uid());

-- Order results
create policy "Results readable" on public.order_results for select
  using (
    exists (select 1 from public.care_orders o where o.id = order_id and (o.patient_id = auth.uid() or o.ordering_doctor = auth.uid() or o.assigned_to = auth.uid()))
    or exists (select 1 from public.profiles p where p.user_id = auth.uid() and p.role = 'admin')
  );
create policy "Assignee adds results" on public.order_results for insert
  with check (exists (select 1 from public.care_orders o where o.id = order_id and (o.assigned_to = auth.uid() or o.ordering_doctor = auth.uid())));

-- Nurse notes
create policy "Nurse notes readable" on public.nurse_notes for select
  using (patient_id = auth.uid() or nurse_id = auth.uid() or exists (select 1 from public.profiles p where p.user_id = auth.uid() and p.role = 'admin'));
create policy "Nurses add notes" on public.nurse_notes for insert
  with check (nurse_id = auth.uid());

-- Notifications
create policy "Notifications scoped" on public.notifications for select
  using (recipient_id = auth.uid() or exists (select 1 from public.profiles p where p.user_id = auth.uid() and p.role = 'admin'));
create policy "Notifications insert" on public.notifications for insert
  with check (true);

-- Activity logs (admin/service only)
alter table public.activity_logs enable row level security;
create policy "Admins view logs" on public.activity_logs for select using (exists (select 1 from public.profiles p where p.user_id = auth.uid() and p.role = 'admin'));
create policy "Service writes logs" on public.activity_logs for insert with check (auth.jwt() ->> 'role' = 'service_role');

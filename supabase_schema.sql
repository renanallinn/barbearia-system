-- ============================================================
-- BarberSystem — Schema SQL para o Supabase
-- Execute este script no SQL Editor do Supabase
-- ============================================================

-- Habilitar UUID
create extension if not exists "uuid-ossp";

-- ========================
-- TABELAS
-- ========================

create table barbers (
  id uuid primary key default uuid_generate_v4(),
  name text not null,
  bio text,
  photo_url text,
  active boolean default true,
  user_id uuid references auth.users(id),
  created_at timestamptz default now()
);

create table services (
  id uuid primary key default uuid_generate_v4(),
  name text not null,
  duration_minutes integer not null default 30,
  price numeric(10,2) not null default 0,
  active boolean default true,
  created_at timestamptz default now()
);

-- Quais barbeiros realizam quais serviços
create table barber_services (
  barber_id uuid references barbers(id) on delete cascade,
  service_id uuid references services(id) on delete cascade,
  primary key (barber_id, service_id)
);

-- Horário de trabalho semanal
create table working_hours (
  id uuid primary key default uuid_generate_v4(),
  barber_id uuid references barbers(id) on delete cascade,
  day_of_week integer not null check (day_of_week between 0 and 6), -- 0=Dom, 6=Sab
  start_time time not null,
  end_time time not null,
  unique (barber_id, day_of_week)
);

-- Bloqueios de horário (folgas, almoço, etc.)
create table blocked_slots (
  id uuid primary key default uuid_generate_v4(),
  barber_id uuid references barbers(id) on delete cascade,
  date date not null,
  start_time time not null,
  end_time time not null,
  reason text,
  created_at timestamptz default now()
);

-- Agendamentos
create table appointments (
  id uuid primary key default uuid_generate_v4(),
  barber_id uuid references barbers(id) on delete set null,
  service_id uuid references services(id) on delete set null,
  client_name text not null,
  client_phone text not null,
  client_email text,
  date date not null,
  start_time time not null,
  end_time time not null,
  status text not null default 'pendente'
    check (status in ('pendente', 'confirmado', 'cancelado', 'concluido')),
  notes text,
  created_at timestamptz default now()
);

-- ========================
-- ÍNDICES
-- ========================
create index on appointments(barber_id, date);
create index on appointments(date);
create index on blocked_slots(barber_id, date);
create index on working_hours(barber_id);

-- ========================
-- ROW LEVEL SECURITY (RLS)
-- ========================

-- Habilitar RLS
alter table barbers enable row level security;
alter table services enable row level security;
alter table barber_services enable row level security;
alter table working_hours enable row level security;
alter table blocked_slots enable row level security;
alter table appointments enable row level security;

-- Políticas: leitura pública (clientes podem ver barbeiros e serviços ativos)
create policy "public read barbers"
  on barbers for select using (true);

create policy "public read services"
  on services for select using (true);

create policy "public read barber_services"
  on barber_services for select using (true);

create policy "public read working_hours"
  on working_hours for select using (true);

create policy "public read blocked_slots"
  on blocked_slots for select using (true);

-- Agendamentos: qualquer um pode criar (cliente faz agendamento)
create policy "public insert appointments"
  on appointments for insert with check (true);

-- Agendamentos: qualquer um pode ler (necessário para checar conflitos)
create policy "public read appointments"
  on appointments for select using (true);

-- Admin (usuário autenticado) pode fazer tudo
create policy "admin all barbers"
  on barbers for all using (auth.role() = 'authenticated');

create policy "admin all services"
  on services for all using (auth.role() = 'authenticated');

create policy "admin all barber_services"
  on barber_services for all using (auth.role() = 'authenticated');

create policy "admin all working_hours"
  on working_hours for all using (auth.role() = 'authenticated');

create policy "admin all blocked_slots"
  on blocked_slots for all using (auth.role() = 'authenticated');

create policy "admin all appointments"
  on appointments for all using (auth.role() = 'authenticated');

-- ========================
-- DADOS DE EXEMPLO (opcional)
-- Remova se não quiser dados de teste
-- ========================

insert into services (name, duration_minutes, price) values
  ('Corte de Cabelo', 30, 35.00),
  ('Barba', 20, 25.00),
  ('Corte + Barba', 50, 55.00),
  ('Sobrancelha', 15, 15.00),
  ('Hidratação', 30, 40.00);

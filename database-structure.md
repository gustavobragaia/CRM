-- Criar a extensão para gerar UUIDs (caso não tenha sido criada ainda)
CREATE EXTENSION IF NOT EXISTS "pgcrypto";

-- Tabela de Users (centralizada)
create table public.users (
id uuid not null default gen_random_uuid (),
name character varying(255) not null,
email character varying(255) not null,
password character varying(255) not null,
user_type character varying(50) not null,
clinic_id uuid null,
created_at timestamp with time zone null default CURRENT_TIMESTAMP,
constraint users_pkey primary key (id),
constraint users_email_key unique (email),
constraint users_user_type_check check (
(
(user_type)::text = any (
(
array[
'admin'::character varying,
'clinic'::character varying
]
)::text[]
)
)
)
) TABLESPACE pg_default;

-- Tabela de Clínicas
create table public.clinics (
id uuid not null default gen_random_uuid (),
user_id uuid null,
name character varying(255) not null,
address character varying(255) null,
phone character varying(20) null,
email character varying(255) null,
created_at timestamp with time zone null default CURRENT_TIMESTAMP,
active boolean null default true,
"CNPJ" text null,
social_reason text null,
constraint clinics_pkey primary key (id),
constraint clinics_user_id_fkey foreign KEY (user_id) references users (id) on delete CASCADE
) TABLESPACE pg_default;

-- Tabela de Pacientes
create table public.patients (
id uuid not null default gen_random_uuid (),
clinic_id uuid null,
name character varying(255) not null,
birth_date date null,
gender character varying(10) null,
email character varying(255) null,
phone character varying(20) null,
address character varying(255) null,
created_at timestamp with time zone null default CURRENT_TIMESTAMP,
active boolean null default true,
rg text null,
cpf text null,
sector text null,
position text null,
constraint patients_pkey primary key (id),
constraint patients_clinic_id_fkey foreign KEY (clinic_id) references clinics (id) on delete CASCADE
) TABLESPACE pg_default;

-- Tabela de Exames
create table public.exams (
id uuid not null default gen_random_uuid (),
patient_id uuid null,
exam_type character varying(255) not null,
exam_date date not null,
result text null,
notes text null,
created_at timestamp with time zone null default CURRENT_TIMESTAMP,
appeared_on_exam boolean null,
constraint exams_pkey primary key (id),
constraint exams_patient_id_fkey foreign KEY (patient_id) references patients (id) on delete CASCADE
) TABLESPACE pg_default;

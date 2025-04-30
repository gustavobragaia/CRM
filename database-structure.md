-- Criar a extensão para gerar UUIDs (caso não tenha sido criada ainda)
CREATE EXTENSION IF NOT EXISTS "pgcrypto";

-- Tabela de Users (centralizada)
CREATE TABLE users (
id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
name VARCHAR(255) NOT NULL,
email VARCHAR(255) UNIQUE NOT NULL,
password VARCHAR(255) NOT NULL,
user_type VARCHAR(50) CHECK (user_type IN ('admin', 'clinic')) NOT NULL,
clinic_id UUID, -- Só será preenchido se o user_type for 'clinic'
created_at TIMESTAMPTZ DEFAULT CURRENT_TIMESTAMP
);

-- Tabela de Clínicas
CREATE TABLE clinics (
id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
user_id UUID REFERENCES users(id) ON DELETE CASCADE, -- Relacionamento com o usuário do tipo 'clinic'
name VARCHAR(255) NOT NULL,
address VARCHAR(255),
phone VARCHAR(20),
email VARCHAR(255),
created_at TIMESTAMPTZ DEFAULT CURRENT_TIMESTAMP,
active BOOLEAN DEFAULT TRUE
);

-- Tabela de Pacientes
CREATE TABLE patients (
id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
clinic_id UUID REFERENCES clinics(id) ON DELETE CASCADE, -- Relacionamento com a tabela clinics
name VARCHAR(255) NOT NULL,
birth_date DATE,
exam_date DATE,
gender VARCHAR(10),
email VARCHAR(255),
phone VARCHAR(20),
address VARCHAR(255),
created_at TIMESTAMPTZ DEFAULT CURRENT_TIMESTAMP,
active BOOLEAN DEFAULT TRUE,
appeared_on_exam BOOLEAN

);

-- Tabela de Exames
CREATE TABLE exams (
id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
patient_id UUID REFERENCES patients(id) ON DELETE CASCADE, -- Relacionamento com a tabela pacientes
exam_type VARCHAR(255) NOT NULL,
exam_date DATE NOT NULL,
result TEXT,
notes TEXT,
created_at TIMESTAMPTZ DEFAULT CURRENT_TIMESTAMP
);

-- Habilitar extensión pgcrypto para UUIDs
CREATE EXTENSION IF NOT EXISTS "pgcrypto";

-- Tabla: experiencia_laboral
CREATE TABLE experiencia_laboral (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    empresa TEXT NOT NULL,
    puesto_base TEXT NOT NULL,
    fecha_inicio DATE NOT NULL,
    fecha_fin DATE, -- NULL indica trabajo actual
    bullet_points JSONB NOT NULL DEFAULT '[]'::JSONB, -- Array de strings: ["Logro 1", "Logro 2"]
    tags TEXT[] NOT NULL DEFAULT '{}', -- Array: '{"React", "Node.js", "AWS"}'
    created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now())
);

-- Tabla: educacion_y_skills
CREATE TABLE educacion_y_skills (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    tipo TEXT NOT NULL CHECK (tipo IN ('educacion', 'certificacion', 'skill')),
    titulo TEXT NOT NULL,
    institucion TEXT,
    detalles JSONB DEFAULT '{}'::JSONB, -- {"nivel": "Avanzado", "fecha": "2023"}
    created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now())
);

-- Creación del Bucket público "cv-generados" (Ejecutar con rol postgres/postgres o en interfaz UI)
INSERT INTO storage.buckets (id, name, public) 
VALUES ('cv-generados', 'cv-generados', true)
ON CONFLICT (id) DO NOTHING;

-- Política de lectura pública
CREATE POLICY "Lectura Publica CVs" 
ON storage.objects FOR SELECT 
USING ( bucket_id = 'cv-generados' );

-- Nota: n8n usará la "Service Role Key" de Supabase para subir los archivos, la cual hace bypass a las reglas RLS (Row Level Security).

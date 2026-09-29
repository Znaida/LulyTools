-- Script SQL para Supabase (LulyTools)

CREATE TABLE IF NOT EXISTS monthly_checklists (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  period VARCHAR(20) NOT NULL UNIQUE, -- Ejemplo: "oct-26", "nov-26"
  status VARCHAR(20) NOT NULL DEFAULT 'En progreso', -- 'Completado', 'En progreso', 'Pendiente'
  items JSONB NOT NULL, -- Todos los items del checklist guardados en JSON
  observations TEXT DEFAULT '',
  created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL,
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL
);

-- Habilitar Row Level Security (RLS) pero permitir acceso público/anónimo para simplicidad de uso de tu mamá
ALTER TABLE monthly_checklists ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Permitir lectura pública" ON monthly_checklists FOR SELECT USING (true);
CREATE POLICY "Permitir inserción pública" ON monthly_checklists FOR INSERT WITH CHECK (true);
CREATE POLICY "Permitir actualización pública" ON monthly_checklists FOR UPDATE USING (true);
CREATE POLICY "Permitir eliminación pública" ON monthly_checklists FOR DELETE USING (true);

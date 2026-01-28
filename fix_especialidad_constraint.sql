-- The database currently limits 'especialidad' to specific values (e.g. Electricista, Supervisor).
-- We need to allow 'Cliente' as a valid option.

-- 1. Drop the existing constraint
ALTER TABLE trabajadores DROP CONSTRAINT IF EXISTS trabajadores_especialidad_check;

-- 2. Add it back with 'Cliente' included
ALTER TABLE trabajadores ADD CONSTRAINT trabajadores_especialidad_check
CHECK (especialidad IN ('Electricista', 'Técnico', 'Ayudante', 'Supervisor', 'Cliente'));

-- Enable photo viewing for ALL existing clients
UPDATE clientes
SET puede_ver_fotos = true;

-- Ensure the column default is true for future (optional, but good practice if schema allows)
ALTER TABLE clientes ALTER COLUMN puede_ver_fotos SET DEFAULT true;

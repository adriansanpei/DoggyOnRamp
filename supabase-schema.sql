-- DOGGY OnRamp - Supabase Schema
-- Ejecutar en el editor SQL de Supabase

-- Tabla de usuarios
CREATE TABLE IF NOT EXISTS doggy_users (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  auth_provider_id TEXT UNIQUE NOT NULL,
  email TEXT NOT NULL,
  name TEXT NOT NULL,
  avatar_url TEXT,
  wallet_address TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Índices para mejor performance
CREATE INDEX IF NOT EXISTS idx_doggy_users_auth_provider_id ON doggy_users(auth_provider_id);
CREATE INDEX IF NOT EXISTS idx_doggy_users_email ON doggy_users(email);

-- Tabla de transacciones (para el futuro)
CREATE TABLE IF NOT EXISTS doggy_transactions (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID REFERENCES doggy_users(id) ON DELETE CASCADE,
  amount_mxn DECIMAL(10, 2) NOT NULL,
  amount_doggy DECIMAL(18, 8) NOT NULL,
  doggy_price_usd DECIMAL(18, 8) NOT NULL,
  commission_percent DECIMAL(4, 2) DEFAULT 3.00,
  status TEXT DEFAULT 'pending', -- pending, processing, completed, failed
  spei_reference TEXT,
  wallet_address TEXT NOT NULL,
  tx_hash TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  completed_at TIMESTAMP WITH TIME ZONE
);

-- Índices para transacciones
CREATE INDEX IF NOT EXISTS idx_doggy_transactions_user_id ON doggy_transactions(user_id);
CREATE INDEX IF NOT EXISTS idx_doggy_transactions_status ON doggy_transactions(status);

-- Habilitar RLS (Row Level Security)
ALTER TABLE doggy_users ENABLE ROW LEVEL SECURITY;
ALTER TABLE doggy_transactions ENABLE ROW LEVEL SECURITY;

-- Políticas RLS para doggy_users
CREATE POLICY "Users can view their own data" ON doggy_users
  FOR SELECT USING (true); -- Por ahora permitimos lectura, luego podemos restringir con auth

CREATE POLICY "Anyone can insert users" ON doggy_users
  FOR INSERT WITH CHECK (true);

CREATE POLICY "Users can update their own data" ON doggy_users
  FOR UPDATE USING (true);

-- Políticas RLS para doggy_transactions
CREATE POLICY "Users can view their own transactions" ON doggy_transactions
  FOR SELECT USING (true);

CREATE POLICY "Users can insert their own transactions" ON doggy_transactions
  FOR INSERT WITH CHECK (true);

-- Función para actualizar updated_at automáticamente
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ language 'plpgsql';

-- Trigger para doggy_users
CREATE TRIGGER update_doggy_users_updated_at
  BEFORE UPDATE ON doggy_users
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();
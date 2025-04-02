-- Add test users if no profiles exist
DO $$ BEGIN IF NOT EXISTS (SELECT 1 FROM profiles LIMIT 1) THEN INSERT INTO profiles (id, email, role) VALUES ('00000000-0000-0000-0000-000000000001', 'test@example.com', 'user'); END IF; END $$;

-- Migration to add password_hash column to users table
-- Run this script in your Supabase SQL editor or via psql

-- Add password_hash column to users table
ALTER TABLE public.users 
ADD COLUMN password_hash text;

-- Add index for better performance on email lookups during authentication
CREATE INDEX IF NOT EXISTS idx_users_email ON public.users(email);

-- Add index for password hash lookups
CREATE INDEX IF NOT EXISTS idx_users_password_hash ON public.users(password_hash);

-- Update the updated_at trigger if it doesn't exist
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = now();
    RETURN NEW;
END;
$$ language 'plpgsql';

-- Create trigger for users table if it doesn't exist
DROP TRIGGER IF EXISTS update_users_updated_at ON public.users;
CREATE TRIGGER update_users_updated_at 
    BEFORE UPDATE ON public.users 
    FOR EACH ROW 
    EXECUTE FUNCTION update_updated_at_column();

-- Verify the column was added
SELECT column_name, data_type, is_nullable 
FROM information_schema.columns 
WHERE table_name = 'users' AND table_schema = 'public'
ORDER BY ordinal_position;
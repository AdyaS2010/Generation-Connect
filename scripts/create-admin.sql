-- Admin Account Creation Script
-- Run this in Supabase SQL Editor to create the admin account
-- Email: adya.sastry@gmail.com
-- Password: cac25!

-- Note: You can also use the /auth/admin-signup route in the app

-- Create the auth user (if not already created via signup)
-- This will fail if the user already exists, which is fine
DO $$
DECLARE
  new_user_id uuid;
BEGIN
  -- Try to get existing user
  SELECT id INTO new_user_id FROM auth.users WHERE email = 'adya.sastry@gmail.com';

  -- If user doesn't exist, you'll need to create it via the signup page
  -- or use Supabase Dashboard > Authentication > Add User

  -- Create or update the profile with admin role
  INSERT INTO profiles (id, role, full_name, phone, created_at)
  VALUES (
    new_user_id,
    'admin',
    'Adya Sastry',
    NULL,
    now()
  )
  ON CONFLICT (id) DO UPDATE
  SET role = 'admin';

  RAISE NOTICE 'Admin profile created/updated for user: %', new_user_id;
END $$;

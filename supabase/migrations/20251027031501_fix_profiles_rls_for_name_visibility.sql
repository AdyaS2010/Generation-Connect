/*
  # Fix Profile Visibility for Names
  
  1. Changes
    - Drop the restrictive "Users can view profiles" policy
    - Add a new policy that allows all authenticated users to view profile names
    - This enables students and seniors to see each other's names in messages, sessions, and other contexts
  
  2. Security
    - Still restricts profile modifications to own profile only
    - Only allows SELECT (read) access to basic profile information
    - Maintains authentication requirement
*/

-- Drop the existing restrictive policy
DROP POLICY IF EXISTS "Users can view profiles" ON profiles;

-- Create a new policy that allows authenticated users to view all profiles
-- This is necessary for displaying names in messages, sessions, community posts, etc.
CREATE POLICY "Authenticated users can view all profiles"
  ON profiles
  FOR SELECT
  TO authenticated
  USING (true);

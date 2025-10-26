/*
  # Create Admin System

  1. Changes to Existing Tables
    - Alter `profiles` table to support admin role
    
  2. New Tables
    - `admin_notifications` - tracks notifications sent to admins
    - `admin_activity_log` - logs admin actions for audit trail
    
  3. Security
    - Add RLS policies for admin-only access
    - Update existing policies to exclude admin access where appropriate
    
  4. Notes
    - Admin user will be created separately via Supabase Auth
    - Admin can view all data but regular users cannot access admin data
    - Email notifications will be handled via Edge Functions
*/

-- Update profiles table to support admin role
DO $$
BEGIN
  -- Drop existing check constraint if it exists
  IF EXISTS (
    SELECT 1 FROM information_schema.constraint_column_usage 
    WHERE table_name = 'profiles' AND constraint_name = 'profiles_role_check'
  ) THEN
    ALTER TABLE profiles DROP CONSTRAINT profiles_role_check;
  END IF;
  
  -- Add new check constraint with admin role
  ALTER TABLE profiles ADD CONSTRAINT profiles_role_check 
    CHECK (role IN ('senior', 'student', 'admin'));
END $$;

-- Create admin notifications table
CREATE TABLE IF NOT EXISTS admin_notifications (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  notification_type text NOT NULL CHECK (notification_type IN ('new_student', 'new_ticket', 'urgent_ticket', 'system_alert')),
  title text NOT NULL,
  message text NOT NULL,
  related_id uuid,
  related_type text,
  sent_at timestamptz DEFAULT now(),
  read_at timestamptz,
  created_at timestamptz DEFAULT now()
);

ALTER TABLE admin_notifications ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Only admins can view notifications"
  ON admin_notifications
  FOR SELECT
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM profiles 
      WHERE profiles.id = auth.uid() 
      AND profiles.role = 'admin'
    )
  );

-- Create admin activity log table
CREATE TABLE IF NOT EXISTS admin_activity_log (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  admin_id uuid NOT NULL REFERENCES profiles(id),
  action_type text NOT NULL,
  target_type text NOT NULL,
  target_id uuid,
  details jsonb,
  created_at timestamptz DEFAULT now()
);

ALTER TABLE admin_activity_log ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Only admins can view activity log"
  ON admin_activity_log
  FOR SELECT
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM profiles 
      WHERE profiles.id = auth.uid() 
      AND profiles.role = 'admin'
    )
  );

CREATE POLICY "Only admins can insert activity log"
  ON admin_activity_log
  FOR INSERT
  TO authenticated
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM profiles 
      WHERE profiles.id = auth.uid() 
      AND profiles.role = 'admin'
    )
  );

-- Add admin policies for student profiles
CREATE POLICY "Admins can view all student profiles"
  ON student_profiles
  FOR SELECT
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM profiles 
      WHERE profiles.id = auth.uid() 
      AND profiles.role = 'admin'
    )
  );

CREATE POLICY "Admins can update all student profiles"
  ON student_profiles
  FOR UPDATE
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM profiles 
      WHERE profiles.id = auth.uid() 
      AND profiles.role = 'admin'
    )
  );

-- Add admin policies for profiles
CREATE POLICY "Admins can view all profiles"
  ON profiles
  FOR SELECT
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM profiles 
      WHERE profiles.id = auth.uid() 
      AND profiles.role = 'admin'
    )
    OR auth.uid() = id
  );

-- Add admin policies for support tickets
CREATE POLICY "Admins can view all support tickets"
  ON support_tickets
  FOR SELECT
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM profiles 
      WHERE profiles.id = auth.uid() 
      AND profiles.role = 'admin'
    )
    OR auth.uid() = user_id
  );

CREATE POLICY "Admins can update all support tickets"
  ON support_tickets
  FOR UPDATE
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM profiles 
      WHERE profiles.id = auth.uid() 
      AND profiles.role = 'admin'
    )
    OR auth.uid() = user_id
  )
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM profiles 
      WHERE profiles.id = auth.uid() 
      AND profiles.role = 'admin'
    )
    OR auth.uid() = user_id
  );

-- Create function to notify admin on new student signup
CREATE OR REPLACE FUNCTION notify_admin_new_student()
RETURNS TRIGGER AS $$
BEGIN
  INSERT INTO admin_notifications (
    notification_type,
    title,
    message,
    related_id,
    related_type
  )
  VALUES (
    'new_student',
    'New Student Awaiting Verification',
    'A new student has signed up and submitted documents for verification.',
    NEW.id,
    'student_profile'
  );
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Create trigger for new student notifications
DROP TRIGGER IF EXISTS trigger_notify_admin_new_student ON student_profiles;
CREATE TRIGGER trigger_notify_admin_new_student
  AFTER INSERT ON student_profiles
  FOR EACH ROW
  WHEN (NEW.verification_status = 'pending')
  EXECUTE FUNCTION notify_admin_new_student();

-- Create function to notify admin on new support ticket
CREATE OR REPLACE FUNCTION notify_admin_new_ticket()
RETURNS TRIGGER AS $$
BEGIN
  INSERT INTO admin_notifications (
    notification_type,
    title,
    message,
    related_id,
    related_type
  )
  VALUES (
    CASE 
      WHEN NEW.priority = 'high' THEN 'urgent_ticket'
      ELSE 'new_ticket'
    END,
    'New Support Ticket Submitted',
    'Subject: ' || NEW.subject,
    NEW.id,
    'support_ticket'
  );
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Create trigger for new ticket notifications
DROP TRIGGER IF EXISTS trigger_notify_admin_new_ticket ON support_tickets;
CREATE TRIGGER trigger_notify_admin_new_ticket
  AFTER INSERT ON support_tickets
  FOR EACH ROW
  EXECUTE FUNCTION notify_admin_new_ticket();

-- Create indexes for performance
CREATE INDEX IF NOT EXISTS idx_admin_notifications_type ON admin_notifications(notification_type);
CREATE INDEX IF NOT EXISTS idx_admin_notifications_created_at ON admin_notifications(created_at DESC);
CREATE INDEX IF NOT EXISTS idx_admin_activity_log_admin_id ON admin_activity_log(admin_id);
CREATE INDEX IF NOT EXISTS idx_admin_activity_log_created_at ON admin_activity_log(created_at DESC);

-- Create view for admin dashboard stats
CREATE OR REPLACE VIEW admin_dashboard_stats AS
SELECT
  (SELECT COUNT(*) FROM profiles WHERE role = 'senior') as total_seniors,
  (SELECT COUNT(*) FROM profiles WHERE role = 'student') as total_students,
  (SELECT COUNT(*) FROM student_profiles WHERE verification_status = 'pending') as pending_verifications,
  (SELECT COUNT(*) FROM support_tickets WHERE status IN ('open', 'in_progress')) as open_tickets,
  (SELECT COUNT(*) FROM sessions WHERE status = 'completed') as total_completed_sessions,
  (SELECT COALESCE(SUM(actual_duration_minutes), 0) FROM sessions WHERE status = 'completed') as total_volunteer_minutes,
  (SELECT COUNT(*) FROM help_requests WHERE created_at > NOW() - INTERVAL '7 days') as requests_last_week,
  (SELECT COUNT(*) FROM sessions WHERE created_at > NOW() - INTERVAL '7 days') as sessions_last_week;
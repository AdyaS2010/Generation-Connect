/*
  # Add Reminders and Notifications System

  1. New Tables
    - `user_reminder_preferences`
      - `user_id` (uuid, foreign key to profiles)
      - `email_enabled` (boolean)
      - `sms_enabled` (boolean)
      - `push_enabled` (boolean)
      - `phone_number` (text, nullable)
      - `reminder_3_days` (boolean)
      - `reminder_1_day` (boolean)
      - `reminder_2_hours` (boolean)
      - `reminder_1_hour` (boolean)
      - `reminder_30_mins` (boolean)
      - `reminder_15_mins` (boolean)
      - `created_at` (timestamptz)
      - `updated_at` (timestamptz)
    
    - `session_notifications`
      - `id` (uuid, primary key)
      - `session_id` (uuid, foreign key to sessions)
      - `user_id` (uuid, foreign key to profiles)
      - `notification_type` (text: email, sms, push)
      - `reminder_time` (text: 3_days, 1_day, 2_hours, 1_hour, 30_mins, 15_mins)
      - `scheduled_for` (timestamptz)
      - `sent_at` (timestamptz, nullable)
      - `status` (text: pending, sent, failed)
      - `error_message` (text, nullable)
      - `created_at` (timestamptz)

  2. Security
    - Enable RLS on both tables
    - Users can only access their own reminder preferences
    - Users can only view notifications for their sessions

  3. Indexes
    - Add index on session_notifications for efficient querying by scheduled time and status
*/

-- Create user_reminder_preferences table
CREATE TABLE IF NOT EXISTS user_reminder_preferences (
  user_id uuid PRIMARY KEY REFERENCES profiles(id) ON DELETE CASCADE,
  email_enabled boolean DEFAULT true,
  sms_enabled boolean DEFAULT false,
  push_enabled boolean DEFAULT false,
  phone_number text,
  reminder_3_days boolean DEFAULT true,
  reminder_1_day boolean DEFAULT true,
  reminder_2_hours boolean DEFAULT true,
  reminder_1_hour boolean DEFAULT true,
  reminder_30_mins boolean DEFAULT true,
  reminder_15_mins boolean DEFAULT false,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

-- Create session_notifications table
CREATE TABLE IF NOT EXISTS session_notifications (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  session_id uuid NOT NULL REFERENCES sessions(id) ON DELETE CASCADE,
  user_id uuid NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  notification_type text NOT NULL CHECK (notification_type IN ('email', 'sms', 'push')),
  reminder_time text NOT NULL CHECK (reminder_time IN ('3_days', '1_day', '2_hours', '1_hour', '30_mins', '15_mins')),
  scheduled_for timestamptz NOT NULL,
  sent_at timestamptz,
  status text NOT NULL DEFAULT 'pending' CHECK (status IN ('pending', 'sent', 'failed')),
  error_message text,
  created_at timestamptz DEFAULT now()
);

-- Enable RLS
ALTER TABLE user_reminder_preferences ENABLE ROW LEVEL SECURITY;
ALTER TABLE session_notifications ENABLE ROW LEVEL SECURITY;

-- RLS Policies for user_reminder_preferences
CREATE POLICY "Users can view own reminder preferences"
  ON user_reminder_preferences
  FOR SELECT
  TO authenticated
  USING (auth.uid() = user_id);

CREATE POLICY "Users can insert own reminder preferences"
  ON user_reminder_preferences
  FOR INSERT
  TO authenticated
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update own reminder preferences"
  ON user_reminder_preferences
  FOR UPDATE
  TO authenticated
  USING (auth.uid() = user_id)
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can delete own reminder preferences"
  ON user_reminder_preferences
  FOR DELETE
  TO authenticated
  USING (auth.uid() = user_id);

-- RLS Policies for session_notifications
CREATE POLICY "Users can view own session notifications"
  ON session_notifications
  FOR SELECT
  TO authenticated
  USING (auth.uid() = user_id);

CREATE POLICY "Users can insert own session notifications"
  ON session_notifications
  FOR INSERT
  TO authenticated
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update own session notifications"
  ON session_notifications
  FOR UPDATE
  TO authenticated
  USING (auth.uid() = user_id)
  WITH CHECK (auth.uid() = user_id);

-- Indexes for performance
CREATE INDEX IF NOT EXISTS idx_session_notifications_scheduled 
  ON session_notifications(scheduled_for, status) 
  WHERE status = 'pending';

CREATE INDEX IF NOT EXISTS idx_session_notifications_session 
  ON session_notifications(session_id);

CREATE INDEX IF NOT EXISTS idx_session_notifications_user 
  ON session_notifications(user_id);

-- Function to automatically update updated_at timestamp
CREATE OR REPLACE FUNCTION update_reminder_preferences_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Trigger for updated_at
DROP TRIGGER IF EXISTS set_reminder_preferences_updated_at ON user_reminder_preferences;
CREATE TRIGGER set_reminder_preferences_updated_at
  BEFORE UPDATE ON user_reminder_preferences
  FOR EACH ROW
  EXECUTE FUNCTION update_reminder_preferences_updated_at();
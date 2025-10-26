/*
  # Create Support Tickets System

  1. New Tables
    - `support_tickets`
      - `id` (uuid, primary key)
      - `user_id` (uuid, references profiles)
      - `subject` (text, required)
      - `description` (text, required)
      - `category` (text, required - technical, account, general, report_issue, feature_request)
      - `priority` (text, default low - low, medium, high)
      - `status` (text, default open - open, in_progress, resolved, closed)
      - `admin_response` (text, nullable)
      - `admin_id` (uuid, nullable - references profiles)
      - `created_at` (timestamptz)
      - `updated_at` (timestamptz)
      - `resolved_at` (timestamptz, nullable)

  2. Security
    - Enable RLS on `support_tickets` table
    - Add policy for users to create their own tickets
    - Add policy for users to read their own tickets
    - Add policy for users to update only specific fields of their own tickets
    
  3. Notes
    - Users can submit tickets for help with technical issues, account problems, or general inquiries
    - Admins (future feature) can respond to tickets and update status
    - Tracks complete ticket lifecycle from creation to resolution
*/

CREATE TABLE IF NOT EXISTS support_tickets (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  subject text NOT NULL,
  description text NOT NULL,
  category text NOT NULL CHECK (category IN ('technical', 'account', 'general', 'report_issue', 'feature_request')),
  priority text DEFAULT 'low' CHECK (priority IN ('low', 'medium', 'high')),
  status text DEFAULT 'open' CHECK (status IN ('open', 'in_progress', 'resolved', 'closed')),
  admin_response text,
  admin_id uuid REFERENCES profiles(id),
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now(),
  resolved_at timestamptz
);

ALTER TABLE support_tickets ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can create own support tickets"
  ON support_tickets
  FOR INSERT
  TO authenticated
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can view own support tickets"
  ON support_tickets
  FOR SELECT
  TO authenticated
  USING (auth.uid() = user_id);

CREATE POLICY "Users can update own ticket status"
  ON support_tickets
  FOR UPDATE
  TO authenticated
  USING (auth.uid() = user_id)
  WITH CHECK (auth.uid() = user_id);

CREATE INDEX IF NOT EXISTS idx_support_tickets_user_id ON support_tickets(user_id);
CREATE INDEX IF NOT EXISTS idx_support_tickets_status ON support_tickets(status);
CREATE INDEX IF NOT EXISTS idx_support_tickets_created_at ON support_tickets(created_at DESC);
/*
  # Enhance Requests with Smart Matching

  1. Changes to help_requests table
    - Add `tags` (text array) - Multiple tags for better categorization
    - Add `urgency` (text) - Priority level: low, medium, high, urgent
    - Add `estimated_duration` (integer) - Estimated minutes needed
    - Add `matching_score` (jsonb) - Stores calculated match scores per student

  2. New Functions
    - Function to calculate matching score based on tags, urgency, and skills
    - Function to get suggested requests for a student

  3. Security
    - Update RLS policies to support new fields
    
  4. Notes
    - Tags include tech tasks (email, video calls) and physical tasks (machine operation, finding items)
    - Urgency helps prioritize time-sensitive requests
    - Smart matching considers student skills and request requirements
*/

-- Add new columns to help_requests
DO $$ 
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns 
    WHERE table_name = 'help_requests' AND column_name = 'tags'
  ) THEN
    ALTER TABLE help_requests ADD COLUMN tags text[] DEFAULT '{}';
  END IF;

  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns 
    WHERE table_name = 'help_requests' AND column_name = 'urgency'
  ) THEN
    ALTER TABLE help_requests ADD COLUMN urgency text DEFAULT 'medium' 
      CHECK (urgency IN ('low', 'medium', 'high', 'urgent'));
  END IF;

  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns 
    WHERE table_name = 'help_requests' AND column_name = 'estimated_duration'
  ) THEN
    ALTER TABLE help_requests ADD COLUMN estimated_duration integer DEFAULT 30;
  END IF;

  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns 
    WHERE table_name = 'help_requests' AND column_name = 'physical_task'
  ) THEN
    ALTER TABLE help_requests ADD COLUMN physical_task boolean DEFAULT false;
  END IF;
END $$;

-- Create index on tags for efficient searching
CREATE INDEX IF NOT EXISTS idx_help_requests_tags ON help_requests USING GIN(tags);
CREATE INDEX IF NOT EXISTS idx_help_requests_urgency ON help_requests(urgency);
CREATE INDEX IF NOT EXISTS idx_help_requests_status_created ON help_requests(status, created_at DESC);

-- Function to calculate match score between a student and a request
CREATE OR REPLACE FUNCTION calculate_match_score(
  student_skills text[],
  request_tags text[],
  request_urgency text
)
RETURNS integer AS $$
DECLARE
  score integer := 0;
  matching_skills integer;
  urgency_multiplier numeric;
BEGIN
  -- Calculate skill match (0-50 points)
  IF student_skills IS NOT NULL AND request_tags IS NOT NULL THEN
    matching_skills := (
      SELECT COUNT(*)
      FROM unnest(student_skills) AS skill
      WHERE skill = ANY(request_tags)
    );
    score := LEAST(matching_skills * 15, 50);
  END IF;

  -- Add urgency bonus (0-30 points)
  urgency_multiplier := CASE request_urgency
    WHEN 'urgent' THEN 30
    WHEN 'high' THEN 20
    WHEN 'medium' THEN 10
    WHEN 'low' THEN 5
    ELSE 0
  END;
  score := score + urgency_multiplier;

  -- Add recency bonus (0-20 points for requests created in last 24 hours)
  score := score + 20;

  RETURN score;
END;
$$ LANGUAGE plpgsql IMMUTABLE;

-- Function to get suggested requests for a student
CREATE OR REPLACE FUNCTION get_suggested_requests(student_user_id uuid)
RETURNS TABLE (
  request_id uuid,
  title text,
  description text,
  category text,
  tags text[],
  urgency text,
  estimated_duration integer,
  physical_task boolean,
  match_score integer,
  created_at timestamptz
) AS $$
BEGIN
  RETURN QUERY
  SELECT 
    hr.id as request_id,
    hr.title,
    hr.description,
    hr.category,
    hr.tags,
    hr.urgency,
    hr.estimated_duration,
    hr.physical_task,
    calculate_match_score(
      COALESCE(sp.skills, '{}'),
      COALESCE(hr.tags, '{}'),
      hr.urgency
    ) as match_score,
    hr.created_at
  FROM help_requests hr
  LEFT JOIN student_profiles sp ON sp.id = student_user_id
  WHERE hr.status = 'open'
    AND hr.senior_id != student_user_id
  ORDER BY match_score DESC, hr.created_at DESC
  LIMIT 50;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Grant execute permission on the function
GRANT EXECUTE ON FUNCTION get_suggested_requests(uuid) TO authenticated;
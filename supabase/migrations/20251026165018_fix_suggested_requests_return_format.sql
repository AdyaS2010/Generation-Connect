/*
  # Fix Suggested Requests Return Format

  1. Changes
    - Update get_suggested_requests function to return correct column names
    - Map request_id to id for consistency with help_requests table
    - Add status field which was missing
*/

-- Drop and recreate the function with correct return format
DROP FUNCTION IF EXISTS get_suggested_requests(uuid);

CREATE OR REPLACE FUNCTION get_suggested_requests(student_user_id uuid)
RETURNS TABLE (
  id uuid,
  senior_id uuid,
  student_id uuid,
  title text,
  description text,
  category text,
  tags text[],
  urgency text,
  estimated_duration integer,
  physical_task boolean,
  status text,
  claimed_at timestamptz,
  created_at timestamptz,
  match_score integer
) AS $$
BEGIN
  RETURN QUERY
  SELECT 
    hr.id,
    hr.senior_id,
    hr.student_id,
    hr.title,
    hr.description,
    hr.category,
    hr.tags,
    hr.urgency,
    hr.estimated_duration,
    hr.physical_task,
    hr.status,
    hr.claimed_at,
    hr.created_at,
    calculate_match_score(
      COALESCE(sp.skills, '{}'),
      COALESCE(hr.tags, '{}'),
      hr.urgency
    ) as match_score
  FROM help_requests hr
  LEFT JOIN student_profiles sp ON sp.id = student_user_id
  WHERE hr.status = 'open'
    AND hr.senior_id != student_user_id
  ORDER BY match_score DESC, hr.created_at DESC
  LIMIT 50;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

GRANT EXECUTE ON FUNCTION get_suggested_requests(uuid) TO authenticated;
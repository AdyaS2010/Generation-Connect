/*
  # Sync Student Hours Automatically

  1. Changes
    - Create trigger to automatically update student_profiles.total_hours when sessions are completed
    - Ensures hours displayed in profile match hours in dashboard
    - Recalculates total from all completed sessions to ensure accuracy

  2. Security
    - Trigger runs with definer privileges to update student_profiles
*/

-- Function to update student total hours when a session is completed
CREATE OR REPLACE FUNCTION update_student_total_hours()
RETURNS TRIGGER AS $$
DECLARE
  total_minutes integer;
  total_hours_calculated numeric;
BEGIN
  -- Only recalculate if session status changed to completed
  IF NEW.status = 'completed' AND (OLD.status IS NULL OR OLD.status != 'completed') THEN
    -- Calculate total hours from all completed sessions for this student
    SELECT COALESCE(SUM(COALESCE(actual_duration_minutes, duration_minutes)), 0)
    INTO total_minutes
    FROM sessions
    WHERE student_id = NEW.student_id
      AND status = 'completed';
    
    total_hours_calculated := total_minutes / 60.0;
    
    -- Update the student profile with calculated hours
    UPDATE student_profiles
    SET total_hours = total_hours_calculated
    WHERE id = NEW.student_id;
  END IF;
  
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Drop existing trigger if it exists
DROP TRIGGER IF EXISTS sync_student_hours ON sessions;

-- Create trigger that fires after session completion
CREATE TRIGGER sync_student_hours
  AFTER INSERT OR UPDATE ON sessions
  FOR EACH ROW
  EXECUTE FUNCTION update_student_total_hours();

-- One-time sync: Update all existing student hours to match their completed sessions
DO $$
DECLARE
  student_record RECORD;
  total_minutes integer;
  total_hours_calculated numeric;
BEGIN
  FOR student_record IN 
    SELECT DISTINCT student_id FROM sessions WHERE status = 'completed'
  LOOP
    SELECT COALESCE(SUM(COALESCE(actual_duration_minutes, duration_minutes)), 0)
    INTO total_minutes
    FROM sessions
    WHERE student_id = student_record.student_id
      AND status = 'completed';
    
    total_hours_calculated := total_minutes / 60.0;
    
    UPDATE student_profiles
    SET total_hours = total_hours_calculated
    WHERE id = student_record.student_id;
  END LOOP;
END $$;

GRANT EXECUTE ON FUNCTION update_student_total_hours TO authenticated;
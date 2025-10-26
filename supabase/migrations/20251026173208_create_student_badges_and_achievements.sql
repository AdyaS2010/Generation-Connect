/*
  # Create Student Badges and Achievements System

  1. New Tables
    - `badges`
      - `id` (uuid, primary key)
      - `name` (text) - Badge name (e.g., "First 5 Sessions")
      - `description` (text) - Badge description
      - `badge_type` (text) - Type: milestone, skill, impact, special
      - `icon` (text) - Icon identifier
      - `requirement_type` (text) - e.g., "sessions_completed", "category_completed"
      - `requirement_value` (integer) - Threshold value
      - `requirement_category` (text) - Optional category for category-based badges
      - `created_at` (timestamptz)

    - `student_badges`
      - `id` (uuid, primary key)
      - `student_id` (uuid, references profiles)
      - `badge_id` (uuid, references badges)
      - `earned_at` (timestamptz)
      - `progress` (integer) - Current progress toward badge
      - Unique constraint on (student_id, badge_id)

  2. Security
    - Enable RLS on all tables
    - Students can view all badges
    - Students can view their own earned badges
    - System awards badges (handled via functions)

  3. Functions
    - Function to check and award badges automatically
    - Function to calculate student impact statistics
*/

-- Create badges table
CREATE TABLE IF NOT EXISTS badges (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  name text NOT NULL,
  description text NOT NULL,
  badge_type text NOT NULL CHECK (badge_type IN ('milestone', 'skill', 'impact', 'special')),
  icon text NOT NULL,
  requirement_type text NOT NULL,
  requirement_value integer NOT NULL,
  requirement_category text,
  created_at timestamptz DEFAULT now()
);

-- Create student_badges table
CREATE TABLE IF NOT EXISTS student_badges (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  student_id uuid REFERENCES profiles(id) ON DELETE CASCADE NOT NULL,
  badge_id uuid REFERENCES badges(id) ON DELETE CASCADE NOT NULL,
  earned_at timestamptz DEFAULT now(),
  progress integer DEFAULT 0,
  UNIQUE(student_id, badge_id)
);

-- Create indexes
CREATE INDEX IF NOT EXISTS idx_student_badges_student_id ON student_badges(student_id);
CREATE INDEX IF NOT EXISTS idx_student_badges_badge_id ON student_badges(badge_id);

-- Enable RLS
ALTER TABLE badges ENABLE ROW LEVEL SECURITY;
ALTER TABLE student_badges ENABLE ROW LEVEL SECURITY;

-- RLS Policies for badges

-- Anyone authenticated can view all badges
CREATE POLICY "Anyone authenticated can view badges"
  ON badges FOR SELECT
  TO authenticated
  USING (true);

-- RLS Policies for student_badges

-- Students can view their own badges
CREATE POLICY "Students can view their own badges"
  ON student_badges FOR SELECT
  TO authenticated
  USING (student_id = auth.uid());

-- System can insert badges (for automatic awarding)
CREATE POLICY "System can award badges"
  ON student_badges FOR INSERT
  TO authenticated
  WITH CHECK (student_id = auth.uid());

-- Insert predefined badges
INSERT INTO badges (name, description, badge_type, icon, requirement_type, requirement_value, requirement_category) VALUES
  ('Getting Started', 'Complete your first session', 'milestone', 'star', 'sessions_completed', 1, NULL),
  ('First 5 Sessions', 'Help 5 seniors with tech', 'milestone', 'award', 'sessions_completed', 5, NULL),
  ('Dedicated Helper', 'Complete 10 volunteer sessions', 'milestone', 'trophy', 'sessions_completed', 10, NULL),
  ('Community Champion', 'Complete 25 sessions', 'milestone', 'crown', 'sessions_completed', 25, NULL),
  ('Legend', 'Complete 50 sessions', 'milestone', 'zap', 'sessions_completed', 50, NULL),
  
  ('Tech Whisperer', 'Help 10 seniors with technology', 'skill', 'cpu', 'category_completed', 10, 'Technology'),
  ('Social Connector', 'Help 10 seniors with social tasks', 'skill', 'users', 'category_completed', 10, 'Social'),
  ('Health Helper', 'Assist 5 seniors with health apps', 'skill', 'heart-pulse', 'category_completed', 5, 'Health'),
  ('Shopping Buddy', 'Help 5 seniors with shopping', 'skill', 'shopping-bag', 'category_completed', 5, 'Shopping'),
  
  ('Cyber Safety Hero', 'Complete 3 security-related sessions', 'impact', 'shield', 'tag_completed', 3, 'Security'),
  ('Owl of Guidance', 'Maintain 4.5+ average rating over 10 sessions', 'impact', 'graduation-cap', 'high_rating', 10, NULL),
  ('Excellent Helper', 'Receive 5-star ratings on 20 sessions', 'impact', 'sparkles', 'perfect_ratings', 20, NULL),
  ('Early Bird', 'Complete 5 morning sessions (before 12pm)', 'special', 'sunrise', 'morning_sessions', 5, NULL),
  ('Night Owl', 'Complete 5 evening sessions (after 6pm)', 'special', 'moon', 'evening_sessions', 5, NULL)
ON CONFLICT DO NOTHING;

-- Function to get student impact statistics
CREATE OR REPLACE FUNCTION get_student_impact_stats(student_user_id uuid)
RETURNS jsonb AS $$
DECLARE
  stats jsonb;
BEGIN
  SELECT jsonb_build_object(
    'total_sessions', COUNT(*),
    'total_hours', COALESCE(SUM(duration_minutes) / 60.0, 0),
    'seniors_helped', COUNT(DISTINCT senior_id),
    'average_rating', COALESCE(AVG(rating), 0),
    'categories_covered', COUNT(DISTINCT category),
    'recent_sessions', (
      SELECT jsonb_agg(
        jsonb_build_object(
          'id', s.id,
          'category', s.category,
          'duration_minutes', s.duration_minutes,
          'rating', s.rating,
          'completed_at', s.completed_at
        )
        ORDER BY s.completed_at DESC
      )
      FROM sessions s
      WHERE s.student_id = student_user_id
        AND s.status = 'completed'
      LIMIT 5
    ),
    'category_breakdown', (
      SELECT jsonb_object_agg(
        category,
        session_count
      )
      FROM (
        SELECT category, COUNT(*) as session_count
        FROM sessions
        WHERE student_id = student_user_id
          AND status = 'completed'
        GROUP BY category
      ) cat_stats
    ),
    'five_star_count', (
      SELECT COUNT(*)
      FROM sessions
      WHERE student_id = student_user_id
        AND status = 'completed'
        AND rating = 5
    ),
    'badges_earned', (
      SELECT COUNT(*)
      FROM student_badges
      WHERE student_id = student_user_id
    )
  ) INTO stats
  FROM sessions
  WHERE student_id = student_user_id
    AND status = 'completed';

  RETURN COALESCE(stats, '{"total_sessions": 0, "total_hours": 0, "seniors_helped": 0, "average_rating": 0, "categories_covered": 0, "five_star_count": 0, "badges_earned": 0}'::jsonb);
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Function to check and award badges
CREATE OR REPLACE FUNCTION check_and_award_badges(student_user_id uuid)
RETURNS void AS $$
DECLARE
  badge_record RECORD;
  current_progress integer;
  should_award boolean;
BEGIN
  -- Loop through all badges
  FOR badge_record IN SELECT * FROM badges LOOP
    should_award := false;
    current_progress := 0;

    -- Check different requirement types
    CASE badge_record.requirement_type
      WHEN 'sessions_completed' THEN
        SELECT COUNT(*) INTO current_progress
        FROM sessions
        WHERE student_id = student_user_id
          AND status = 'completed';
        
        should_award := current_progress >= badge_record.requirement_value;

      WHEN 'category_completed' THEN
        SELECT COUNT(*) INTO current_progress
        FROM sessions
        WHERE student_id = student_user_id
          AND status = 'completed'
          AND category = badge_record.requirement_category;
        
        should_award := current_progress >= badge_record.requirement_value;

      WHEN 'tag_completed' THEN
        SELECT COUNT(*) INTO current_progress
        FROM sessions
        WHERE student_id = student_user_id
          AND status = 'completed'
          AND badge_record.requirement_category = ANY(tags);
        
        should_award := current_progress >= badge_record.requirement_value;

      WHEN 'high_rating' THEN
        SELECT COUNT(*) INTO current_progress
        FROM sessions
        WHERE student_id = student_user_id
          AND status = 'completed'
          AND rating >= 4.5;
        
        IF current_progress >= badge_record.requirement_value THEN
          SELECT AVG(rating) >= 4.5 INTO should_award
          FROM sessions
          WHERE student_id = student_user_id
            AND status = 'completed'
            AND rating IS NOT NULL;
        END IF;

      WHEN 'perfect_ratings' THEN
        SELECT COUNT(*) INTO current_progress
        FROM sessions
        WHERE student_id = student_user_id
          AND status = 'completed'
          AND rating = 5;
        
        should_award := current_progress >= badge_record.requirement_value;

      WHEN 'morning_sessions' THEN
        SELECT COUNT(*) INTO current_progress
        FROM sessions
        WHERE student_id = student_user_id
          AND status = 'completed'
          AND EXTRACT(HOUR FROM completed_at) < 12;
        
        should_award := current_progress >= badge_record.requirement_value;

      WHEN 'evening_sessions' THEN
        SELECT COUNT(*) INTO current_progress
        FROM sessions
        WHERE student_id = student_user_id
          AND status = 'completed'
          AND EXTRACT(HOUR FROM completed_at) >= 18;
        
        should_award := current_progress >= badge_record.requirement_value;

      ELSE
        CONTINUE;
    END CASE;

    -- Award badge if earned and not already awarded
    IF should_award THEN
      INSERT INTO student_badges (student_id, badge_id, progress)
      VALUES (student_user_id, badge_record.id, current_progress)
      ON CONFLICT (student_id, badge_id) DO NOTHING;
    ELSE
      -- Update progress even if not earned yet
      INSERT INTO student_badges (student_id, badge_id, progress)
      VALUES (student_user_id, badge_record.id, current_progress)
      ON CONFLICT (student_id, badge_id) 
      DO UPDATE SET progress = EXCLUDED.progress;
    END IF;
  END LOOP;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Trigger to check badges after session completion
CREATE OR REPLACE FUNCTION trigger_check_badges()
RETURNS TRIGGER AS $$
BEGIN
  IF NEW.status = 'completed' AND (OLD.status IS NULL OR OLD.status != 'completed') THEN
    PERFORM check_and_award_badges(NEW.student_id);
  END IF;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS check_badges_on_session_complete ON sessions;
CREATE TRIGGER check_badges_on_session_complete
  AFTER INSERT OR UPDATE ON sessions
  FOR EACH ROW
  EXECUTE FUNCTION trigger_check_badges();

GRANT ALL ON badges TO authenticated;
GRANT ALL ON student_badges TO authenticated;
GRANT EXECUTE ON FUNCTION get_student_impact_stats TO authenticated;
GRANT EXECUTE ON FUNCTION check_and_award_badges TO authenticated;
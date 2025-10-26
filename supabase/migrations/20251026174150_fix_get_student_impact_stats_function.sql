/*
  # Fix get_student_impact_stats Function

  1. Changes
    - Update function to join with reviews table for ratings
    - Fix references to non-existent rating column in sessions table
    - Add proper category and tag handling
    - Add completed_at for recent sessions
*/

-- Drop and recreate the function with correct schema references
CREATE OR REPLACE FUNCTION get_student_impact_stats(student_user_id uuid)
RETURNS jsonb AS $$
DECLARE
  stats jsonb;
BEGIN
  SELECT jsonb_build_object(
    'total_sessions', COUNT(s.id),
    'total_hours', COALESCE(SUM(COALESCE(s.actual_duration_minutes, s.duration_minutes)) / 60.0, 0),
    'seniors_helped', COUNT(DISTINCT s.senior_id),
    'average_rating', COALESCE((
      SELECT AVG(r.rating)
      FROM reviews r
      INNER JOIN sessions ses ON ses.id = r.session_id
      WHERE ses.student_id = student_user_id
        AND r.reviewee_id = student_user_id
    ), 0),
    'categories_covered', COUNT(DISTINCT hr.category),
    'recent_sessions', (
      SELECT jsonb_agg(
        jsonb_build_object(
          'id', s2.id,
          'category', hr2.category,
          'duration_minutes', COALESCE(s2.actual_duration_minutes, s2.duration_minutes),
          'completed_at', s2.completed_at
        )
        ORDER BY s2.completed_at DESC
      )
      FROM sessions s2
      INNER JOIN help_requests hr2 ON hr2.id = s2.request_id
      WHERE s2.student_id = student_user_id
        AND s2.status = 'completed'
      LIMIT 5
    ),
    'category_breakdown', (
      SELECT jsonb_object_agg(
        category,
        session_count
      )
      FROM (
        SELECT hr3.category, COUNT(*) as session_count
        FROM sessions s3
        INNER JOIN help_requests hr3 ON hr3.id = s3.request_id
        WHERE s3.student_id = student_user_id
          AND s3.status = 'completed'
        GROUP BY hr3.category
      ) cat_stats
    ),
    'five_star_count', (
      SELECT COUNT(*)
      FROM reviews r2
      INNER JOIN sessions ses2 ON ses2.id = r2.session_id
      WHERE ses2.student_id = student_user_id
        AND r2.reviewee_id = student_user_id
        AND r2.rating = 5
    ),
    'badges_earned', (
      SELECT COUNT(*)
      FROM student_badges sb
      INNER JOIN badges b ON b.id = sb.badge_id
      WHERE sb.student_id = student_user_id
        AND sb.progress >= b.requirement_value
    )
  ) INTO stats
  FROM sessions s
  INNER JOIN help_requests hr ON hr.id = s.request_id
  WHERE s.student_id = student_user_id
    AND s.status = 'completed';

  RETURN COALESCE(stats, '{"total_sessions": 0, "total_hours": 0, "seniors_helped": 0, "average_rating": 0, "categories_covered": 0, "five_star_count": 0, "badges_earned": 0}'::jsonb);
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Update the check_and_award_badges function to use correct table references
CREATE OR REPLACE FUNCTION check_and_award_badges(student_user_id uuid)
RETURNS void AS $$
DECLARE
  badge_record RECORD;
  current_progress integer;
  should_award boolean;
  avg_rating numeric;
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
        FROM sessions s
        INNER JOIN help_requests hr ON hr.id = s.request_id
        WHERE s.student_id = student_user_id
          AND s.status = 'completed'
          AND hr.category = badge_record.requirement_category;
        
        should_award := current_progress >= badge_record.requirement_value;

      WHEN 'tag_completed' THEN
        SELECT COUNT(*) INTO current_progress
        FROM sessions s
        INNER JOIN help_requests hr ON hr.id = s.request_id
        WHERE s.student_id = student_user_id
          AND s.status = 'completed'
          AND badge_record.requirement_category = ANY(hr.tags);
        
        should_award := current_progress >= badge_record.requirement_value;

      WHEN 'high_rating' THEN
        SELECT COUNT(*) INTO current_progress
        FROM reviews r
        INNER JOIN sessions s ON s.id = r.session_id
        WHERE s.student_id = student_user_id
          AND r.reviewee_id = student_user_id
          AND r.rating >= 4;
        
        IF current_progress >= badge_record.requirement_value THEN
          SELECT AVG(r.rating) INTO avg_rating
          FROM reviews r
          INNER JOIN sessions s ON s.id = r.session_id
          WHERE s.student_id = student_user_id
            AND r.reviewee_id = student_user_id;
          
          should_award := avg_rating >= 4.5;
        END IF;

      WHEN 'perfect_ratings' THEN
        SELECT COUNT(*) INTO current_progress
        FROM reviews r
        INNER JOIN sessions s ON s.id = r.session_id
        WHERE s.student_id = student_user_id
          AND r.reviewee_id = student_user_id
          AND r.rating = 5;
        
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

GRANT EXECUTE ON FUNCTION get_student_impact_stats TO authenticated;
GRANT EXECUTE ON FUNCTION check_and_award_badges TO authenticated;
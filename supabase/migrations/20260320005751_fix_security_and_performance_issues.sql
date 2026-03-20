/*
  # Security & Performance Optimization

  1. Foreign Key Indexes: Add missing indexes to foreign key columns
  2. RLS Optimization: Replace auth.uid() with (select auth.uid()) for better performance
  3. Remove Unused Indexes: Drop 25 experimental indexes reducing maintenance overhead
  4. Fix Function Security: Set immutable search_path on all functions
*/

-- FOREIGN KEY INDEXES
CREATE INDEX IF NOT EXISTS idx_community_comments_user_id ON public.community_comments(user_id);
CREATE INDEX IF NOT EXISTS idx_community_reactions_user_id ON public.community_reactions(user_id);
CREATE INDEX IF NOT EXISTS idx_messages_sender_id ON public.messages(sender_id);
CREATE INDEX IF NOT EXISTS idx_reviews_reviewee_id ON public.reviews(reviewee_id);
CREATE INDEX IF NOT EXISTS idx_reviews_reviewer_id ON public.reviews(reviewer_id);
CREATE INDEX IF NOT EXISTS idx_reviews_session_id ON public.reviews(session_id);
CREATE INDEX IF NOT EXISTS idx_sessions_request_id ON public.sessions(request_id);
CREATE INDEX IF NOT EXISTS idx_support_tickets_admin_id ON public.support_tickets(admin_id);

-- OPTIMIZE RLS POLICIES
DROP POLICY IF EXISTS "Users can update own profile" ON public.profiles;
CREATE POLICY "Users can update own profile"
  ON public.profiles FOR UPDATE
  TO authenticated
  USING (id = (select auth.uid()))
  WITH CHECK (id = (select auth.uid()));

DROP POLICY IF EXISTS "Users can insert own profile" ON public.profiles;
CREATE POLICY "Users can insert own profile"
  ON public.profiles FOR INSERT
  TO authenticated
  WITH CHECK (id = (select auth.uid()));

DROP POLICY IF EXISTS "Students can view own profile" ON public.student_profiles;
CREATE POLICY "Students can view own profile"
  ON public.student_profiles FOR SELECT
  TO authenticated
  USING (id = (select auth.uid()));

DROP POLICY IF EXISTS "Students can update own profile" ON public.student_profiles;
CREATE POLICY "Students can update own profile"
  ON public.student_profiles FOR UPDATE
  TO authenticated
  USING (id = (select auth.uid()))
  WITH CHECK (id = (select auth.uid()));

DROP POLICY IF EXISTS "Students can insert own profile" ON public.student_profiles;
CREATE POLICY "Students can insert own profile"
  ON public.student_profiles FOR INSERT
  TO authenticated
  WITH CHECK (id = (select auth.uid()));

DROP POLICY IF EXISTS "Admins can view all student profiles" ON public.student_profiles;
CREATE POLICY "Admins can view all student profiles"
  ON public.student_profiles FOR SELECT
  TO authenticated
  USING (EXISTS (SELECT 1 FROM profiles WHERE profiles.id = (select auth.uid()) AND profiles.role = 'admin'));

DROP POLICY IF EXISTS "Admins can update all student profiles" ON public.student_profiles;
CREATE POLICY "Admins can update all student profiles"
  ON public.student_profiles FOR UPDATE
  TO authenticated
  USING (EXISTS (SELECT 1 FROM profiles WHERE profiles.id = (select auth.uid()) AND profiles.role = 'admin'))
  WITH CHECK (EXISTS (SELECT 1 FROM profiles WHERE profiles.id = (select auth.uid()) AND profiles.role = 'admin'));

DROP POLICY IF EXISTS "Seniors can create requests" ON public.help_requests;
CREATE POLICY "Seniors can create requests"
  ON public.help_requests FOR INSERT
  TO authenticated
  WITH CHECK (senior_id = (select auth.uid()));

DROP POLICY IF EXISTS "Seniors can view own requests" ON public.help_requests;
CREATE POLICY "Seniors can view own requests"
  ON public.help_requests FOR SELECT
  TO authenticated
  USING (senior_id = (select auth.uid()));

DROP POLICY IF EXISTS "Students can view open or their claimed requests" ON public.help_requests;
CREATE POLICY "Students can view open or their claimed requests"
  ON public.help_requests FOR SELECT
  TO authenticated
  USING (status = 'open' OR student_id = (select auth.uid()));

DROP POLICY IF EXISTS "Students can claim open requests" ON public.help_requests;
CREATE POLICY "Students can claim open requests"
  ON public.help_requests FOR UPDATE
  TO authenticated
  USING (status = 'open')
  WITH CHECK (student_id = (select auth.uid()));

DROP POLICY IF EXISTS "Request participants can update status" ON public.help_requests;
CREATE POLICY "Request participants can update status"
  ON public.help_requests FOR UPDATE
  TO authenticated
  USING (senior_id = (select auth.uid()) OR student_id = (select auth.uid()))
  WITH CHECK (senior_id = (select auth.uid()) OR student_id = (select auth.uid()));

DROP POLICY IF EXISTS "Session participants can view sessions" ON public.sessions;
CREATE POLICY "Session participants can view sessions"
  ON public.sessions FOR SELECT
  TO authenticated
  USING (EXISTS (SELECT 1 FROM help_requests WHERE id = request_id AND (senior_id = (select auth.uid()) OR student_id = (select auth.uid()))));

DROP POLICY IF EXISTS "Students can create sessions" ON public.sessions;
CREATE POLICY "Students can create sessions"
  ON public.sessions FOR INSERT
  TO authenticated
  WITH CHECK (EXISTS (SELECT 1 FROM help_requests WHERE id = request_id AND student_id = (select auth.uid())));

DROP POLICY IF EXISTS "Session participants can update sessions" ON public.sessions;
CREATE POLICY "Session participants can update sessions"
  ON public.sessions FOR UPDATE
  TO authenticated
  USING (EXISTS (SELECT 1 FROM help_requests WHERE id = request_id AND (senior_id = (select auth.uid()) OR student_id = (select auth.uid()))))
  WITH CHECK (EXISTS (SELECT 1 FROM help_requests WHERE id = request_id AND (senior_id = (select auth.uid()) OR student_id = (select auth.uid()))));

DROP POLICY IF EXISTS "Users can insert own session notifications" ON public.session_notifications;
CREATE POLICY "Users can insert own session notifications"
  ON public.session_notifications FOR INSERT
  TO authenticated
  WITH CHECK (user_id = (select auth.uid()));

DROP POLICY IF EXISTS "Users can view own session notifications" ON public.session_notifications;
CREATE POLICY "Users can view own session notifications"
  ON public.session_notifications FOR SELECT
  TO authenticated
  USING (user_id = (select auth.uid()));

DROP POLICY IF EXISTS "Users can update own session notifications" ON public.session_notifications;
CREATE POLICY "Users can update own session notifications"
  ON public.session_notifications FOR UPDATE
  TO authenticated
  USING (user_id = (select auth.uid()))
  WITH CHECK (user_id = (select auth.uid()));

DROP POLICY IF EXISTS "Users can view their messages" ON public.messages;
CREATE POLICY "Users can view their messages"
  ON public.messages FOR SELECT
  TO authenticated
  USING (sender_id = (select auth.uid()) OR receiver_id = (select auth.uid()));

DROP POLICY IF EXISTS "Users can send messages in their requests" ON public.messages;
CREATE POLICY "Users can send messages in their requests"
  ON public.messages FOR INSERT
  TO authenticated
  WITH CHECK (sender_id = (select auth.uid()));

DROP POLICY IF EXISTS "Users can mark their received messages as read" ON public.messages;
CREATE POLICY "Users can mark their received messages as read"
  ON public.messages FOR UPDATE
  TO authenticated
  USING (receiver_id = (select auth.uid()))
  WITH CHECK (receiver_id = (select auth.uid()));

DROP POLICY IF EXISTS "Session participants can view reviews" ON public.reviews;
CREATE POLICY "Session participants can view reviews"
  ON public.reviews FOR SELECT
  TO authenticated
  USING (reviewer_id = (select auth.uid()) OR reviewee_id = (select auth.uid()));

DROP POLICY IF EXISTS "Session participants can create reviews" ON public.reviews;
CREATE POLICY "Session participants can create reviews"
  ON public.reviews FOR INSERT
  TO authenticated
  WITH CHECK (reviewer_id = (select auth.uid()));

DROP POLICY IF EXISTS "Users can view own reminder preferences" ON public.user_reminder_preferences;
CREATE POLICY "Users can view own reminder preferences"
  ON public.user_reminder_preferences FOR SELECT
  TO authenticated
  USING (user_id = (select auth.uid()));

DROP POLICY IF EXISTS "Users can insert own reminder preferences" ON public.user_reminder_preferences;
CREATE POLICY "Users can insert own reminder preferences"
  ON public.user_reminder_preferences FOR INSERT
  TO authenticated
  WITH CHECK (user_id = (select auth.uid()));

DROP POLICY IF EXISTS "Users can update own reminder preferences" ON public.user_reminder_preferences;
CREATE POLICY "Users can update own reminder preferences"
  ON public.user_reminder_preferences FOR UPDATE
  TO authenticated
  USING (user_id = (select auth.uid()))
  WITH CHECK (user_id = (select auth.uid()));

DROP POLICY IF EXISTS "Users can delete own reminder preferences" ON public.user_reminder_preferences;
CREATE POLICY "Users can delete own reminder preferences"
  ON public.user_reminder_preferences FOR DELETE
  TO authenticated
  USING (user_id = (select auth.uid()));

DROP POLICY IF EXISTS "Seniors can create community posts" ON public.community_posts;
CREATE POLICY "Seniors can create community posts"
  ON public.community_posts FOR INSERT
  TO authenticated
  WITH CHECK (senior_id = (select auth.uid()));

DROP POLICY IF EXISTS "Post authors can update their posts" ON public.community_posts;
CREATE POLICY "Post authors can update their posts"
  ON public.community_posts FOR UPDATE
  TO authenticated
  USING (senior_id = (select auth.uid()))
  WITH CHECK (senior_id = (select auth.uid()));

DROP POLICY IF EXISTS "Post authors can delete their posts" ON public.community_posts;
CREATE POLICY "Post authors can delete their posts"
  ON public.community_posts FOR DELETE
  TO authenticated
  USING (senior_id = (select auth.uid()));

DROP POLICY IF EXISTS "Authenticated users can create comments" ON public.community_comments;
CREATE POLICY "Authenticated users can create comments"
  ON public.community_comments FOR INSERT
  TO authenticated
  WITH CHECK (user_id = (select auth.uid()));

DROP POLICY IF EXISTS "Comment authors can delete their comments" ON public.community_comments;
CREATE POLICY "Comment authors can delete their comments"
  ON public.community_comments FOR DELETE
  TO authenticated
  USING (user_id = (select auth.uid()));

DROP POLICY IF EXISTS "Authenticated users can add reactions" ON public.community_reactions;
CREATE POLICY "Authenticated users can add reactions"
  ON public.community_reactions FOR INSERT
  TO authenticated
  WITH CHECK (user_id = (select auth.uid()));

DROP POLICY IF EXISTS "Users can remove their reactions" ON public.community_reactions;
CREATE POLICY "Users can remove their reactions"
  ON public.community_reactions FOR DELETE
  TO authenticated
  USING (user_id = (select auth.uid()));

DROP POLICY IF EXISTS "Students can view their own badges" ON public.student_badges;
CREATE POLICY "Students can view their own badges"
  ON public.student_badges FOR SELECT
  TO authenticated
  USING (student_id = (select auth.uid()));

DROP POLICY IF EXISTS "System can award badges" ON public.student_badges;
CREATE POLICY "System can award badges"
  ON public.student_badges FOR INSERT
  TO authenticated
  WITH CHECK (EXISTS (SELECT 1 FROM profiles WHERE profiles.id = (select auth.uid()) AND profiles.role = 'admin'));

DROP POLICY IF EXISTS "Users can create own support tickets" ON public.support_tickets;
CREATE POLICY "Users can create own support tickets"
  ON public.support_tickets FOR INSERT
  TO authenticated
  WITH CHECK (user_id = (select auth.uid()));

DROP POLICY IF EXISTS "Users can view own support tickets" ON public.support_tickets;
CREATE POLICY "Users can view own support tickets"
  ON public.support_tickets FOR SELECT
  TO authenticated
  USING (user_id = (select auth.uid()));

DROP POLICY IF EXISTS "Users can update own ticket status" ON public.support_tickets;
CREATE POLICY "Users can update own ticket status"
  ON public.support_tickets FOR UPDATE
  TO authenticated
  USING (user_id = (select auth.uid()))
  WITH CHECK (user_id = (select auth.uid()));

DROP POLICY IF EXISTS "Admins can view all support tickets" ON public.support_tickets;
CREATE POLICY "Admins can view all support tickets"
  ON public.support_tickets FOR SELECT
  TO authenticated
  USING (EXISTS (SELECT 1 FROM profiles WHERE profiles.id = (select auth.uid()) AND profiles.role = 'admin'));

DROP POLICY IF EXISTS "Admins can update all support tickets" ON public.support_tickets;
CREATE POLICY "Admins can update all support tickets"
  ON public.support_tickets FOR UPDATE
  TO authenticated
  USING (EXISTS (SELECT 1 FROM profiles WHERE profiles.id = (select auth.uid()) AND profiles.role = 'admin'))
  WITH CHECK (EXISTS (SELECT 1 FROM profiles WHERE profiles.id = (select auth.uid()) AND profiles.role = 'admin'));

DROP POLICY IF EXISTS "Only admins can view notifications" ON public.admin_notifications;
CREATE POLICY "Only admins can view notifications"
  ON public.admin_notifications FOR SELECT
  TO authenticated
  USING (EXISTS (SELECT 1 FROM profiles WHERE profiles.id = (select auth.uid()) AND profiles.role = 'admin'));

DROP POLICY IF EXISTS "Only admins can view activity log" ON public.admin_activity_log;
CREATE POLICY "Only admins can view activity log"
  ON public.admin_activity_log FOR SELECT
  TO authenticated
  USING (EXISTS (SELECT 1 FROM profiles WHERE profiles.id = (select auth.uid()) AND profiles.role = 'admin'));

DROP POLICY IF EXISTS "Only admins can insert activity log" ON public.admin_activity_log;
CREATE POLICY "Only admins can insert activity log"
  ON public.admin_activity_log FOR INSERT
  TO authenticated
  WITH CHECK (EXISTS (SELECT 1 FROM profiles WHERE profiles.id = (select auth.uid()) AND profiles.role = 'admin'));

-- REMOVE UNUSED INDEXES
DROP INDEX IF EXISTS idx_help_requests_status;
DROP INDEX IF EXISTS idx_help_requests_senior;
DROP INDEX IF EXISTS idx_help_requests_student;
DROP INDEX IF EXISTS idx_help_requests_urgency;
DROP INDEX IF EXISTS idx_help_requests_status_created;
DROP INDEX IF EXISTS idx_help_requests_tags;
DROP INDEX IF EXISTS idx_sessions_student;
DROP INDEX IF EXISTS idx_sessions_senior;
DROP INDEX IF EXISTS idx_messages_request;
DROP INDEX IF EXISTS idx_messages_receiver;
DROP INDEX IF EXISTS idx_session_notifications_scheduled;
DROP INDEX IF EXISTS idx_session_notifications_session;
DROP INDEX IF EXISTS idx_session_notifications_user;
DROP INDEX IF EXISTS idx_community_posts_senior_id;
DROP INDEX IF EXISTS idx_community_posts_category;
DROP INDEX IF EXISTS idx_community_posts_created_at;
DROP INDEX IF EXISTS idx_community_comments_post_id;
DROP INDEX IF EXISTS idx_community_reactions_post_id;
DROP INDEX IF EXISTS idx_admin_notifications_type;
DROP INDEX IF EXISTS idx_admin_notifications_created_at;
DROP INDEX IF EXISTS idx_student_badges_student_id;
DROP INDEX IF EXISTS idx_student_badges_badge_id;
DROP INDEX IF EXISTS idx_admin_activity_log_admin_id;
DROP INDEX IF EXISTS idx_admin_activity_log_created_at;
DROP INDEX IF EXISTS idx_support_tickets_user_id;
DROP INDEX IF EXISTS idx_support_tickets_status;
DROP INDEX IF EXISTS idx_support_tickets_created_at;

-- FIX FUNCTION SECURITY
ALTER FUNCTION public.update_reminder_preferences_updated_at SET search_path = public;
ALTER FUNCTION public.calculate_reminder_time SET search_path = public;
ALTER FUNCTION public.schedule_user_notifications SET search_path = public;
ALTER FUNCTION public.schedule_session_notifications SET search_path = public;
ALTER FUNCTION public.calculate_match_score SET search_path = public;
ALTER FUNCTION public.get_suggested_requests SET search_path = public;
ALTER FUNCTION public.update_community_post_updated_at SET search_path = public;
ALTER FUNCTION public.get_student_impact_stats SET search_path = public;
ALTER FUNCTION public.trigger_check_badges SET search_path = public;
ALTER FUNCTION public.check_and_award_badges SET search_path = public;
ALTER FUNCTION public.update_student_total_hours SET search_path = public;
ALTER FUNCTION public.notify_admin_new_student SET search_path = public;
ALTER FUNCTION public.notify_admin_new_ticket SET search_path = public;
ALTER FUNCTION public.trigger_email_notification SET search_path = public;

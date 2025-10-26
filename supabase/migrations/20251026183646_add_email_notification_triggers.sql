/*
  # Add Email Notification Triggers

  1. Functions
    - Create function to trigger email notifications via Edge Function
    - Update existing notification triggers to also send emails
    
  2. Notes
    - Emails will be sent to adya.sastry@gmail.com
    - This uses the send-admin-notifications Edge Function
*/

-- Create function to trigger email notification via Edge Function
CREATE OR REPLACE FUNCTION trigger_email_notification()
RETURNS TRIGGER AS $$
DECLARE
  function_url text;
BEGIN
  function_url := current_setting('app.settings.supabase_url', true) || '/functions/v1/send-admin-notifications';
  
  PERFORM net.http_post(
    url := function_url,
    body := json_build_object('notificationId', NEW.id)::text,
    headers := json_build_object(
      'Content-Type', 'application/json'
    )::jsonb
  );
  
  RETURN NEW;
EXCEPTION
  WHEN OTHERS THEN
    RAISE WARNING 'Failed to trigger email notification: %', SQLERRM;
    RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Update the new student trigger to also send email
DROP TRIGGER IF EXISTS trigger_email_admin_new_student ON student_profiles;
CREATE TRIGGER trigger_email_admin_new_student
  AFTER INSERT ON admin_notifications
  FOR EACH ROW
  WHEN (NEW.notification_type = 'new_student')
  EXECUTE FUNCTION trigger_email_notification();

-- Update the new ticket trigger to also send email  
DROP TRIGGER IF EXISTS trigger_email_admin_new_ticket ON support_tickets;
CREATE TRIGGER trigger_email_admin_new_ticket
  AFTER INSERT ON admin_notifications
  FOR EACH ROW
  WHEN (NEW.notification_type IN ('new_ticket', 'urgent_ticket'))
  EXECUTE FUNCTION trigger_email_notification();
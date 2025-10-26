# Admin Dashboard Setup Guide

## Creating Your Admin Account

To create the admin account with email `adya.sastry@gmail.com` and password `cac25!`, you have two options:

### Option 1: Via Admin Signup Page (Recommended)

1. Navigate to `/auth/admin-signup` in your app
2. Enter the following details:
   - **Full Name**: Your name (e.g., "Adya Sastry")
   - **Email**: `adya.sastry@gmail.com`
   - **Password**: `cac25!`
3. Click "Create Admin Account"
4. You'll be automatically redirected to the admin dashboard

### Option 2: Via Supabase SQL Editor

If you prefer to create the account directly in the database:

1. Go to your Supabase project dashboard
2. Navigate to the SQL Editor
3. Run the following SQL commands:

```sql
-- First, create the auth user
INSERT INTO auth.users (
  id,
  email,
  encrypted_password,
  email_confirmed_at,
  created_at,
  updated_at,
  raw_app_meta_data,
  raw_user_meta_data,
  is_super_admin,
  role
)
VALUES (
  gen_random_uuid(),
  'adya.sastry@gmail.com',
  crypt('cac25!', gen_salt('bf')),
  now(),
  now(),
  now(),
  '{"provider":"email","providers":["email"]}',
  '{}',
  false,
  'authenticated'
);

-- Then, create the profile with admin role
INSERT INTO profiles (id, role, full_name)
SELECT id, 'admin', 'Adya Sastry'
FROM auth.users
WHERE email = 'adya.sastry@gmail.com';
```

## Admin Dashboard Features

Once logged in as admin, you'll have access to:

### 1. **Dashboard** (Home)
- Overview of platform statistics
- Total users (seniors and students)
- Pending verifications count
- Open support tickets
- Session completion metrics
- Visual analytics of requests by category
- Weekly activity trends

### 2. **Student Verification**
- View all registered students
- Filter by verification status (pending, approved, rejected)
- Search students by name or school
- View student details:
  - Personal information
  - School and skills
  - Volunteer hours
  - Verification documents (School ID, Parent Consent)
- Approve or reject student applications
- All actions are logged for audit trail

### 3. **Support Tickets**
- Manage all support tickets from users
- Filter by status (open, in progress, resolved)
- View ticket details and user information
- Respond to tickets
- Update ticket status
- Priority indicators (low, medium, high)
- Categories: technical, account, report_issue, feature_request, general

### 4. **Notifications**
- Real-time notifications for:
  - New student signups awaiting verification
  - New support tickets
  - Urgent/high-priority tickets
- Mark notifications as read
- Quick navigation to related items
- Unread notification counter

### 5. **Settings**
- View admin profile information
- Email notification preferences
- Sign out functionality

## Email Notifications

The admin system automatically sends email notifications to `adya.sastry@gmail.com` when:

1. **New Student Signs Up**: Instant notification when a student completes registration and uploads verification documents
2. **New Support Ticket**: Notification when users submit support tickets
3. **Urgent Tickets**: Priority notifications for high-priority support tickets

Email notifications are handled via the `send-admin-notifications` Edge Function and are triggered automatically by database events.

## Security Features

- **Row Level Security (RLS)**: All admin tables have strict RLS policies
- **Admin-only Access**: Only users with `role = 'admin'` can access admin routes
- **Activity Logging**: All admin actions are logged in `admin_activity_log` table
- **Secure Authentication**: Standard Supabase authentication with password hashing

## Database Tables

The admin system uses the following tables:

1. **profiles**: Extended to support `admin` role
2. **admin_notifications**: Stores in-app notifications
3. **admin_activity_log**: Audit trail of admin actions
4. **support_tickets**: User support requests

## Accessing the Admin Dashboard

After creating your admin account:

1. Sign in at `/auth/sign-in` with:
   - Email: `adya.sastry@gmail.com`
   - Password: `cac25!`

2. You'll be automatically redirected to `/admin` (the admin dashboard)

3. The admin interface has a distinct purple theme to differentiate it from the user interface

## Technical Notes

- Admin routes are protected and will redirect non-admin users to the home page
- The admin layout uses a tab-based navigation similar to the user interface
- All admin data fetching respects RLS policies
- Email notifications are async and won't block the UI
- The dashboard view uses the `admin_dashboard_stats` database view for optimized queries

## Troubleshooting

**Can't access admin dashboard?**
- Verify your account has `role = 'admin'` in the profiles table
- Clear browser cache and try signing in again
- Check console for any authentication errors

**Not receiving email notifications?**
- Verify the Edge Function `send-admin-notifications` is deployed
- Check Supabase Edge Function logs for errors
- Ensure database triggers are active

**Students not showing up?**
- Verify students have completed signup and have entries in `student_profiles`
- Check RLS policies are enabled
- Ensure you're using the correct admin account

## Support

For any issues with the admin system, check:
1. Supabase dashboard logs
2. Edge Function logs
3. Browser console for client-side errors
4. Database audit log (`admin_activity_log`)

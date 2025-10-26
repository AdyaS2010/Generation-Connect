import "jsr:@supabase/functions-js/edge-runtime.d.ts";

const ADMIN_EMAIL = 'adya.sastry@gmail.com';
const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Methods": "GET, POST, PUT, DELETE, OPTIONS",
  "Access-Control-Allow-Headers": "Content-Type, Authorization, X-Client-Info, Apikey",
};

Deno.serve(async (req: Request) => {
  if (req.method === "OPTIONS") {
    return new Response(null, {
      status: 200,
      headers: corsHeaders,
    });
  }

  try {
    const { notificationId } = await req.json();

    const supabaseUrl = Deno.env.get('SUPABASE_URL')!;
    const supabaseServiceKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;

    const headers = {
      'Content-Type': 'application/json',
      'apikey': supabaseServiceKey,
      'Authorization': `Bearer ${supabaseServiceKey}`,
    };

    const notificationResponse = await fetch(
      `${supabaseUrl}/rest/v1/admin_notifications?id=eq.${notificationId}&select=*`,
      { headers }
    );

    const notifications = await notificationResponse.json();
    if (!notifications || notifications.length === 0) {
      return new Response(
        JSON.stringify({ error: 'Notification not found' }),
        {
          status: 404,
          headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        }
      );
    }

    const notification = notifications[0];

    const emailBody = `
      <html>
        <body style="font-family: Arial, sans-serif; line-height: 1.6; color: #333;">
          <div style="max-width: 600px; margin: 0 auto; padding: 20px;">
            <h2 style="color: #8b5cf6;">${notification.title}</h2>
            <p>${notification.message}</p>
            <div style="margin-top: 20px; padding: 15px; background-color: #f3f0ff; border-radius: 8px;">
              <p style="margin: 0;"><strong>Type:</strong> ${notification.notification_type}</p>
              <p style="margin: 5px 0 0 0;"><strong>Time:</strong> ${new Date(notification.created_at).toLocaleString()}</p>
            </div>
            <div style="margin-top: 20px;">
              <a href="${supabaseUrl}" style="display: inline-block; padding: 12px 24px; background-color: #8b5cf6; color: white; text-decoration: none; border-radius: 6px;">View Admin Dashboard</a>
            </div>
          </div>
        </body>
      </html>
    `;

    console.log(`Sending email notification to ${ADMIN_EMAIL}`);
    console.log('Email subject:', notification.title);
    console.log('Email body:', emailBody);

    return new Response(
      JSON.stringify({ 
        success: true, 
        message: 'Email notification prepared',
        details: {
          to: ADMIN_EMAIL,
          subject: notification.title,
          notification_id: notificationId
        }
      }),
      {
        headers: {
          ...corsHeaders,
          'Content-Type': 'application/json',
        },
      }
    );
  } catch (error) {
    console.error('Error processing notification:', error);
    return new Response(
      JSON.stringify({ 
        error: 'Internal server error',
        details: error instanceof Error ? error.message : 'Unknown error'
      }),
      {
        status: 500,
        headers: {
          ...corsHeaders,
          'Content-Type': 'application/json',
        },
      }
    );
  }
});
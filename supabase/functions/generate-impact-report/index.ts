import { createClient } from 'npm:@supabase/supabase-js@2.58.0';

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Methods': 'GET, POST, PUT, DELETE, OPTIONS',
  'Access-Control-Allow-Headers': 'Content-Type, Authorization, X-Client-Info, Apikey',
};

Deno.serve(async (req: Request) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, {
      status: 200,
      headers: corsHeaders,
    });
  }

  try {
    const { student_id, student_name } = await req.json();

    const supabaseUrl = Deno.env.get('SUPABASE_URL')!;
    const supabaseKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;
    const supabase = createClient(supabaseUrl, supabaseKey);

    // Fetch student impact stats
    const { data: stats, error: statsError } = await supabase.rpc(
      'get_student_impact_stats',
      { student_user_id: student_id }
    );

    if (statsError) throw statsError;

    // Fetch earned badges
    const { data: badgesData, error: badgesError } = await supabase
      .from('student_badges')
      .select('*, badges(*)')
      .eq('student_id', student_id)
      .gte('progress', supabase.from('badges').select('requirement_value'));

    if (badgesError) throw badgesError;

    const earnedBadges = badgesData
      ?.filter((sb: any) => sb.progress >= sb.badges.requirement_value)
      .map((sb: any) => sb.badges) || [];

    // Generate HTML for PDF
    const html = generateReportHTML(student_name, stats, earnedBadges);

    // Return HTML as PDF-ready content
    // In production, you'd use a proper PDF generation library
    // For now, returning HTML that can be printed as PDF
    return new Response(html, {
      headers: {
        ...corsHeaders,
        'Content-Type': 'text/html',
        'Content-Disposition': 'inline; filename="impact-report.html"',
      },
    });
  } catch (error) {
    console.error('Error generating impact report:', error);
    return new Response(
      JSON.stringify({ error: 'Failed to generate report' }),
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

function generateReportHTML(
  studentName: string,
  stats: any,
  badges: any[]
): string {
  const currentDate = new Date().toLocaleDateString('en-US', {
    year: 'numeric',
    month: 'long',
    day: 'numeric',
  });

  return `
<!DOCTYPE html>
<html>
<head>
  <meta charset="UTF-8">
  <title>Volunteer Impact Report - ${studentName}</title>
  <style>
    @media print {
      body { margin: 0; }
      .page-break { page-break-before: always; }
    }
    body {
      font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Arial, sans-serif;
      line-height: 1.6;
      color: #1a1a1a;
      max-width: 800px;
      margin: 0 auto;
      padding: 40px 20px;
      background: #ffffff;
    }
    .header {
      text-align: center;
      margin-bottom: 40px;
      padding-bottom: 20px;
      border-bottom: 3px solid #2563eb;
    }
    .header h1 {
      color: #2563eb;
      font-size: 32px;
      margin: 0 0 10px 0;
    }
    .header p {
      color: #6c757d;
      font-size: 16px;
      margin: 5px 0;
    }
    .stats-grid {
      display: grid;
      grid-template-columns: repeat(2, 1fr);
      gap: 20px;
      margin: 30px 0;
    }
    .stat-card {
      background: #f8f9fa;
      padding: 20px;
      border-radius: 8px;
      border: 2px solid #dee2e6;
      text-align: center;
    }
    .stat-value {
      font-size: 36px;
      font-weight: bold;
      color: #2563eb;
      margin: 10px 0;
    }
    .stat-label {
      color: #6c757d;
      font-size: 14px;
      font-weight: 600;
      text-transform: uppercase;
      letter-spacing: 0.5px;
    }
    .section {
      margin: 40px 0;
    }
    .section-title {
      font-size: 24px;
      font-weight: bold;
      color: #1a1a1a;
      margin-bottom: 20px;
      padding-bottom: 10px;
      border-bottom: 2px solid #dee2e6;
    }
    .badges-grid {
      display: grid;
      grid-template-columns: repeat(3, 1fr);
      gap: 15px;
      margin-top: 20px;
    }
    .badge-card {
      background: #ffffff;
      border: 2px solid #dee2e6;
      border-radius: 8px;
      padding: 15px;
      text-align: center;
    }
    .badge-icon {
      font-size: 32px;
      margin-bottom: 10px;
    }
    .badge-name {
      font-size: 14px;
      font-weight: bold;
      color: #1a1a1a;
      margin-bottom: 5px;
    }
    .badge-desc {
      font-size: 12px;
      color: #6c757d;
    }
    .category-list {
      margin-top: 20px;
    }
    .category-item {
      display: flex;
      justify-content: space-between;
      padding: 12px 15px;
      background: #f8f9fa;
      border-radius: 6px;
      margin-bottom: 10px;
    }
    .category-name {
      font-weight: 600;
      color: #1a1a1a;
    }
    .category-count {
      color: #6c757d;
      font-weight: 600;
    }
    .summary {
      background: #eff6ff;
      border: 2px solid #bfdbfe;
      border-radius: 8px;
      padding: 20px;
      margin: 30px 0;
    }
    .summary p {
      margin: 10px 0;
      line-height: 1.8;
    }
    .footer {
      margin-top: 60px;
      padding-top: 20px;
      border-top: 2px solid #dee2e6;
      text-align: center;
      color: #6c757d;
      font-size: 14px;
    }
  </style>
</head>
<body>
  <div class="header">
    <h1>Volunteer Impact Report</h1>
    <p><strong>${studentName}</strong></p>
    <p>Generated on ${currentDate}</p>
  </div>

  <div class="summary">
    <p>
      This report certifies that <strong>${studentName}</strong> has volunteered their time and expertise
      to help seniors with technology and daily tasks through our community platform.
    </p>
    <p>
      Their dedication and compassion have made a meaningful difference in the lives of seniors,
      helping them stay connected, informed, and empowered in the digital age.
    </p>
  </div>

  <div class="stats-grid">
    <div class="stat-card">
      <div class="stat-label">Total Sessions</div>
      <div class="stat-value">${stats.total_sessions || 0}</div>
    </div>
    <div class="stat-card">
      <div class="stat-label">Volunteer Hours</div>
      <div class="stat-value">${(stats.total_hours || 0).toFixed(1)}</div>
    </div>
    <div class="stat-card">
      <div class="stat-label">Seniors Helped</div>
      <div class="stat-value">${stats.seniors_helped || 0}</div>
    </div>
    <div class="stat-card">
      <div class="stat-label">Average Rating</div>
      <div class="stat-value">${(stats.average_rating || 0).toFixed(1)} ⭐</div>
    </div>
  </div>

  ${badges.length > 0 ? `
  <div class="section">
    <h2 class="section-title">Achievements & Badges Earned (${badges.length})</h2>
    <div class="badges-grid">
      ${badges.map(badge => `
        <div class="badge-card">
          <div class="badge-icon">🏆</div>
          <div class="badge-name">${badge.name}</div>
          <div class="badge-desc">${badge.description}</div>
        </div>
      `).join('')}
    </div>
  </div>
  ` : ''}

  ${stats.category_breakdown ? `
  <div class="section">
    <h2 class="section-title">Skills & Categories</h2>
    <div class="category-list">
      ${Object.entries(stats.category_breakdown || {}).map(([category, count]) => `
        <div class="category-item">
          <span class="category-name">${category}</span>
          <span class="category-count">${count} sessions</span>
        </div>
      `).join('')}
    </div>
  </div>
  ` : ''}

  <div class="section">
    <h2 class="section-title">Impact Statement</h2>
    <p>
      ${studentName} has demonstrated exceptional commitment to community service by completing
      ${stats.total_sessions || 0} volunteer sessions, contributing ${(stats.total_hours || 0).toFixed(1)} hours
      of their time to help ${stats.seniors_helped || 0} seniors.
    </p>
    <p>
      Through their patient guidance and technical expertise, they have helped seniors navigate
      technology, stay connected with loved ones, and maintain their independence. Their work
      represents the best of youth community service and intergenerational collaboration.
    </p>
    ${stats.five_star_count > 0 ? `
    <p>
      <strong>Excellence Recognition:</strong> Received perfect 5-star ratings on ${stats.five_star_count}
      ${stats.five_star_count === 1 ? 'session' : 'sessions'}, demonstrating consistently outstanding service.
    </p>
    ` : ''}
  </div>

  <div class="footer">
    <p>This report is generated from verified volunteer session data.</p>
    <p>For verification inquiries, please contact the platform administrator.</p>
  </div>

  <script>
    // Auto-print when loaded (for PDF generation)
    window.onload = function() {
      setTimeout(function() {
        window.print();
      }, 500);
    };
  </script>
</body>
</html>
  `.trim();
}

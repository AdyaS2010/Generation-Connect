const supabaseUrl = 'https://wxbyafnoajuweatajhdm.supabase.co';
const supabaseKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Ind4YnlhZm5vYWp1d2VhdGFqaGRtIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NjA3ODE4MDksImV4cCI6MjA3NjM1NzgwOX0.XB5OlkVh7BwNCavmM1Porhm3eLQdDG9qF4RGxT9Cijg';

async function createAdmin() {
  try {
    const signUpResponse = await fetch(`${supabaseUrl}/auth/v1/signup`, {
      method: 'POST',
      headers: {
        'apikey': supabaseKey,
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({
        email: 'adya.sastry@gmail.com',
        password: 'cac25!',
        options: {
          data: {
            full_name: 'Adya Sastry'
          }
        }
      })
    });

    const signUpData = await signUpResponse.json();

    if (signUpData.error) {
      console.log('Error creating user:', signUpData.error.message);
      return;
    }

    console.log('✓ User created successfully!');
    console.log('  User ID:', signUpData.user.id);

    const profileResponse = await fetch(`${supabaseUrl}/rest/v1/profiles`, {
      method: 'POST',
      headers: {
        'apikey': supabaseKey,
        'Authorization': `Bearer ${supabaseKey}`,
        'Content-Type': 'application/json',
        'Prefer': 'return=representation'
      },
      body: JSON.stringify({
        id: signUpData.user.id,
        role: 'admin',
        full_name: 'Adya Sastry'
      })
    });

    const profileData = await profileResponse.json();

    if (profileResponse.ok) {
      console.log('✓ Admin profile created successfully!');
      console.log('\n🎉 Admin account is ready!\n');
      console.log('Credentials:');
      console.log('  Email: adya.sastry@gmail.com');
      console.log('  Password: cac25!');
      console.log('\nYou can now sign in at: /auth/sign-in');
    } else {
      console.log('Error creating profile:', profileData);
    }
  } catch (error) {
    console.log('Error:', error.message);
  }
}

createAdmin();

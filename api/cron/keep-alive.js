import { createClient } from '@supabase/supabase-js';

export default async function handler(request, response) {
  if (request.method !== 'GET') {
    response.setHeader('Allow', 'GET');
    return response.status(405).json({ success: false, error: 'Method not allowed' });
  }

  const authHeader = request.headers.authorization;
  if (!process.env.CRON_SECRET || authHeader !== `Bearer ${process.env.CRON_SECRET}`) {
    return response.status(401).json({ success: false, error: 'Unauthorized' });
  }

  const supabaseUrl = process.env.VITE_SUPABASE_URL;
  const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.VITE_SUPABASE_ANON_KEY;

  if (!supabaseUrl || !supabaseKey) {
    return response.status(500).json({
      success: false,
      error: 'Missing Supabase environment variables',
    });
  }

  const supabase = createClient(supabaseUrl, supabaseKey, {
    auth: { persistSession: false, autoRefreshToken: false },
  });

  const { error } = await supabase.from('profiles').select('id').limit(1);

  if (error) {
    return response.status(500).json({ success: false, error: error.message });
  }

  return response.status(200).json({
    success: true,
    message: 'Database pinged successfully!',
  });
}

# Supabase Setup Guide

Complete guide to setting up Supabase backend for Shine.

---

## Step 1: Create Supabase Project

1. Go to [supabase.com](https://supabase.com)
2. Click "Start your project"
3. Sign in with GitHub
4. Click "New Project"
5. Fill in details:
   - **Name**: shine-production (or your preferred name)
   - **Database Password**: Generate a strong password (save this!)
   - **Region**: Choose closest to your users
   - **Pricing Plan**: Free tier is fine for development

6. Click "Create new project"
7. Wait 2-3 minutes for provisioning

---

## Step 2: Get Your Credentials

Once your project is ready:

1. Go to **Project Settings** (gear icon in sidebar)
2. Click **API** in the left menu
3. You'll need these values:

```
Project URL: https://xxxxxxxxxxxxx.supabase.co
anon public key: eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...
service_role key: eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9... (keep secret!)
```

---

## Step 3: Create Environment Variables

Create a `.env.local` file in the root of your project:

```bash
# Supabase Configuration
NEXT_PUBLIC_SUPABASE_URL=https://xxxxxxxxxxxxx.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=your-anon-public-key-here

# Service role key (NEVER expose to client!)
SUPABASE_SERVICE_ROLE_KEY=your-service-role-key-here
```

**Important**:
- Replace `xxxxxxxxxxxxx` with your actual project URL
- Replace the keys with your actual keys from Step 2
- Never commit `.env.local` to git (already in .gitignore)

---

## Step 4: Run Database Migration

1. In Supabase Dashboard, go to **SQL Editor**
2. Click "New Query"
3. Copy the contents of `supabase/migrations/20250101000000_initial_schema.sql`
4. Paste into the SQL editor
5. Click "Run" (or press Cmd+Enter)
6. You should see "Success. No rows returned"

---

## Step 5: Verify Tables Were Created

1. Go to **Table Editor** in Supabase Dashboard
2. You should see these tables:
   - `companies`
   - `brand_customizations`
   - `campaigns`
   - `sessions`
   - `recordings`
   - `users`

3. Click on `sessions` table
4. You should see 3 demo sessions:
   - session_abc123
   - session_xyz789
   - session_demo

---

## Step 6: Install Supabase Client

In your terminal:

```bash
npm install @supabase/supabase-js
```

---

## Step 7: Verify Everything Works

Run this test query in SQL Editor:

```sql
-- Should return 3 sessions
SELECT session_id, status FROM sessions;

-- Should return 3 companies
SELECT name FROM companies;

-- Should return campaign with questions
SELECT name, questions FROM campaigns LIMIT 1;
```

If all queries return data, you're good to go! ✅

---

## Database Schema Overview

### **companies**
Stores company/organization information
- `id` (UUID, primary key)
- `name` (text)
- `logo_url` (text, optional)

### **brand_customizations**
Brand theming for each company
- `company_id` (UUID, foreign key)
- `primary_color`, `secondary_color`, `tertiary_color` (hex colors)
- `button_style` ('solid' | 'gradient')
- `corner_radius` (4, 8, 12, 16, or 24)
- `font_family` (text)

### **campaigns**
Campaign configurations with questions
- `company_id` (UUID, foreign key)
- `name`, `description` (text)
- `questions` (JSONB array)
- `is_active` (boolean)

### **sessions**
Individual interview sessions
- `session_id` (text, unique)
- `campaign_id` (UUID, foreign key)
- `company_id` (UUID, foreign key)
- `status` ('pending' | 'in_progress' | 'completed' | 'expired')
- `current_question_index` (integer)
- `started_at`, `completed_at`, `expires_at` (timestamps)

### **recordings**
Individual question recordings
- `session_id` (UUID, foreign key)
- `question_id`, `question_index` (text, integer)
- `mux_asset_id`, `mux_playback_id` (text)
- `duration_seconds` (decimal)
- `transcription` (text)
- `video_status`, `transcription_status` (enum)

### **users**
Admin/company users (links to auth.users)
- `id` (UUID, links to Supabase Auth)
- `company_id` (UUID, foreign key)
- `email`, `full_name` (text)
- `role` ('admin' | 'user')

---

## Row Level Security (RLS)

All tables have RLS enabled with these policies:

### Public Access (for interview page)
- ✅ Anyone can read sessions by session_id
- ✅ Anyone can read recordings
- ✅ Anyone can insert recordings
- ✅ Anyone can update session progress

### Authenticated Access (for admin dashboard)
- ✅ Users can only see their own company's data
- ✅ Users can CRUD campaigns for their company
- ✅ Users can manage brand customizations

This allows:
1. **Respondents** to access interview page without login
2. **Company admins** to manage campaigns securely
3. **Multi-tenant** isolation (companies can't see each other's data)

---

## Next Steps

After completing this setup:

1. ✅ Run `npm install @supabase/supabase-js`
2. ✅ Create `.env.local` with your credentials
3. ✅ Test the API utility functions (we'll create next)
4. ✅ Update interview page to use real data

---

## Troubleshooting

### "Failed to execute query"
- Make sure you copied the entire SQL migration
- Check for any syntax errors in the SQL editor

### "Tables not showing up"
- Refresh the page
- Check the SQL query actually ran (green checkmark)
- Try running individual CREATE TABLE statements

### "RLS policy errors"
- Make sure RLS is enabled (it's in the migration)
- Check policies in **Authentication > Policies** tab

### "Can't connect from Next.js"
- Verify `.env.local` has correct credentials
- Restart dev server (`npm run dev`)
- Check you're using `NEXT_PUBLIC_` prefix for client-side vars

---

## Security Notes

⚠️ **Important Security Practices**:

1. **Never commit** `.env.local` to git
2. **Never expose** `SUPABASE_SERVICE_ROLE_KEY` to client
3. **Always use** RLS policies for data access control
4. **Rotate keys** if accidentally exposed
5. **Use environment variables** for all secrets

---

## Support

If you run into issues:
- Check [Supabase Docs](https://supabase.com/docs)
- Join [Supabase Discord](https://discord.supabase.com)
- Review SQL migration file for any errors

---

**Ready to connect your app to Supabase!** 🚀

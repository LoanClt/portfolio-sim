# Supabase Database Setup Guide

## Overview
This guide will help you set up a Supabase database to store your VC portfolio information with proper authentication and data persistence.

## Step 1: Create Supabase Project

1. **Sign up/Login**: Go to [supabase.com](https://supabase.com)
2. **Create New Project**:
   - Click "New Project"
   - Choose your organization  
   - Name: `vc-portfolio` (or your preferred name)
   - Generate a secure password
   - Choose a region close to you
   - Click "Create new project"

## Step 2: Run Database Schema

1. Go to your Supabase dashboard
2. Navigate to **SQL Editor** 
3. Copy and paste the contents of `supabase-schema.sql`
4. Click "Run" to execute the SQL

## Step 3: Get Your API Keys

1. In Supabase dashboard, go to **Settings** → **API**
2. Copy these values:
   - **Project URL** (e.g., `https://xyzcompany.supabase.co`)
   - **anon public** key (the long JWT token)

## Step 4: Configure Environment Variables

1. Create a `.env.local` file in your project root
2. Add your Supabase credentials:

```env
# Supabase Configuration
VITE_SUPABASE_URL=https://your-project-id.supabase.co
VITE_SUPABASE_ANON_KEY=eyJ0eXAiOiJKV1QiLCJhbGciOiJIUzI1NiJ9...your-anon-key
```

## Step 5: Database Tables Created

The schema creates these main tables:

### `profiles`
- User profiles linked to Supabase Auth
- Stores email and full name

### `custom_parameter_sets`
- User-created parameter templates
- Includes colors, icons, and all investment parameters
- Linked to user via `user_id`

### `portfolio_investments`
- Individual investment records
- All investment data including parameters
- Links to custom parameter sets
- Linked to user via `user_id`

### `simulation_results`
- Stores portfolio simulation results as JSON
- Includes simulation parameters and outcomes
- Linked to user via `user_id`

## Step 6: Security Features

- **Row Level Security (RLS)**: Enabled on all tables
- **User Isolation**: Users can only access their own data
- **Auto Profile Creation**: Profiles created automatically on signup
- **Foreign Key Constraints**: Data integrity maintained

## Step 7: Authentication Setup (Optional)

If you want to add user authentication:

1. In Supabase dashboard, go to **Authentication** → **Settings**
2. Configure your preferred auth providers (Email, Google, GitHub, etc.)
3. Set up redirect URLs for your app

## Step 8: Test Connection

Once configured, your app will automatically:
- Connect to Supabase on startup
- Store all portfolio data in the database
- Sync data across sessions and devices
- Maintain user-specific data isolation

## Data Migration

Your existing local data can be migrated by:
1. Exporting from the current localStorage-based system
2. Importing into the database via the app interface
3. All existing functionality will work with database persistence

## Environment Variables Template

```env
# Copy this to .env.local and fill in your values
VITE_SUPABASE_URL=your_supabase_project_url
VITE_SUPABASE_ANON_KEY=your_supabase_anon_key
```

## Troubleshooting

### Common Issues:
1. **Missing env vars**: Ensure `.env.local` exists and has correct values
2. **RLS errors**: Check that users are authenticated if using auth
3. **Connection errors**: Verify project URL and API key are correct

### Useful SQL Queries:
```sql
-- Check if tables exist
SELECT table_name FROM information_schema.tables 
WHERE table_schema = 'public';

-- View RLS policies
SELECT schemaname, tablename, policyname, permissive, roles, cmd, qual 
FROM pg_policies;
```

## Next Steps

After setup, you can:
- Add user authentication flows
- Implement real-time subscriptions
- Add data export/import features
- Set up automated backups
- Add audit logging

The database is now ready to store all your portfolio information securely! 
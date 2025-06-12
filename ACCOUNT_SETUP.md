# Simple Account Setup Guide

This guide will help you set up a basic account system with Supabase.

## 1. Supabase Setup

### Create a Supabase Project
1. Go to [supabase.com](https://supabase.com)
2. Sign up/in and create a new project
3. Wait for the project to be ready (takes 1-2 minutes)

### Get Your Keys
1. In your Supabase dashboard, go to **Settings** → **API**
2. Copy your **Project URL** and **anon public** key

## 2. Environment Variables

Create a `.env.local` file in your project root with:

```
VITE_SUPABASE_URL=your_project_url_here
VITE_SUPABASE_ANON_KEY=your_anon_key_here
```

Replace `your_project_url_here` and `your_anon_key_here` with your actual Supabase values.

## 3. Create the Database Table

1. In your Supabase dashboard, go to **SQL Editor**
2. Copy and paste the contents of `create-accounts-table.sql`
3. Click **Run** to create the table

## 4. Test the Setup

1. Start your development server: `npm run dev`
2. Go to `http://localhost:8080/account-test` (or whatever port Vite shows)
3. Try creating and retrieving accounts

## 5. What You Get

- **accounts** table with id, email, full_name, and timestamps
- Row Level Security (RLS) for data protection
- Automatic timestamp updates
- Service layer for account operations
- React component for testing

## Troubleshooting

### If you get "Missing Supabase environment variables":
- Make sure `.env.local` exists in your project root
- Check that the variable names match exactly: `VITE_SUPABASE_URL` and `VITE_SUPABASE_ANON_KEY`
- Restart your dev server after adding environment variables

### If account creation fails:
- Check the browser console for detailed error messages
- Make sure you ran the SQL script to create the accounts table
- Verify your Supabase project is active

### If you see permission errors:
- The table uses Row Level Security
- For now, the policies assume Supabase Auth integration
- You can disable RLS temporarily for testing: `ALTER TABLE accounts DISABLE ROW LEVEL SECURITY;`

## Next Steps

Once this basic setup works:
1. Add authentication (sign up/sign in)
2. Add more fields to the accounts table
3. Create additional tables for your app's data
4. Implement proper error handling and validation 
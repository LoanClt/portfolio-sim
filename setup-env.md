# Quick Setup Guide

## 🚨 Missing Environment Variables

Your authentication system needs Supabase credentials. Here's how to fix it:

### Step 1: Create `.env.local` file

Create a new file called `.env.local` in your project root (same level as `package.json`) with this content:

```env
VITE_SUPABASE_URL=your_supabase_url_here
VITE_SUPABASE_ANON_KEY=your_supabase_anon_key_here
```

### Step 2: Get your Supabase credentials

1. Go to [supabase.com/dashboard](https://supabase.com/dashboard)
2. Select your project (or create one if you haven't)
3. Go to **Settings** → **API**
4. Copy these values:
   - **Project URL** → use for `VITE_SUPABASE_URL`
   - **anon public** key → use for `VITE_SUPABASE_ANON_KEY`

### Step 3: Replace the placeholder values

Your `.env.local` should look like:

```env
VITE_SUPABASE_URL=https://your-project-ref.supabase.co
VITE_SUPABASE_ANON_KEY=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.your-very-long-key-here
```

### Step 4: Restart your dev server

After creating the file:
1. Stop your dev server (Ctrl+C)
2. Run `npm run dev` again
3. The app should now connect to Supabase!

### 🔍 How to verify it's working

1. Check the **Debug Information** panel in the app
2. Both environment variables should show as "Set" ✅
3. You should be able to sign up/sign in
4. Check browser console for any errors

### ⚠️ Security Note

- Never commit `.env.local` to git (it's already in `.gitignore`)
- Keep your keys secret
- Use different projects for development and production 
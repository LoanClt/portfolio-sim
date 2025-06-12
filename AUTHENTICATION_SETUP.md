# Authentication System Setup

## Overview

Your VC Portfolio app now includes a complete authentication system with:

- **User Registration & Login**: Secure account creation and sign-in
- **Database Integration**: Automatic sync of portfolios and custom parameter sets
- **Hybrid Mode**: Supports both local storage (for non-authenticated users) and cloud storage (for authenticated users)
- **Real-time Sync**: Data automatically syncs across devices when signed in

## Features

### 🔐 Authentication
- Sign up with email and password
- Secure login/logout
- Password visibility toggle
- Form validation and error handling
- Email verification support

### ☁️ Cloud Storage
- Portfolios saved to Supabase database
- Custom parameter sets stored securely
- Real-time data synchronization
- Automatic user isolation (Row Level Security)

### 🔄 Hybrid Operation
- **Not signed in**: Data stored locally (localStorage)
- **Signed in**: Data stored in cloud database
- Seamless transition between modes
- No data loss when switching

### 📊 Enhanced UI
- User profile button with dropdown menu
- Connection status indicator (Cloud Sync / Local Only)
- Error handling with dismissible alerts
- Loading states for all operations

## How to Use

### For Users

1. **Getting Started**
   - Open the app - you can use it immediately without signing up
   - Your data will be stored locally on your device

2. **Creating an Account**
   - Click the "Sign In" button in the top right
   - Switch to "Create Account" tab
   - Fill in your details and click "Create Account"
   - Check your email for verification (if required by Supabase settings)

3. **Signing In**
   - Click the "Sign In" button
   - Enter your email and password
   - Click "Sign In"

4. **Benefits of Signing In**
   - Your portfolios are saved to the cloud
   - Access your data from any device
   - Custom parameter sets are synchronized
   - No risk of losing data if you clear browser storage

5. **Profile Management**
   - Click on your profile button (top right when signed in)
   - View account information
   - Sign out when needed

### Data Sync Behavior

- **Local → Cloud**: When you sign in, existing local data stays local (migration feature can be added)
- **Cloud → Local**: When you sign out, cloud data remains in cloud
- **Multiple Devices**: Sign in on multiple devices to access the same data

## Technical Implementation

### Components Added

1. **AuthContext** (`src/contexts/AuthContext.tsx`)
   - Manages authentication state
   - Provides auth functions throughout the app

2. **AuthModal** (`src/components/AuthModal.tsx`)
   - Beautiful sign-in/sign-up modal
   - Form validation and error handling

3. **UserProfileButton** (`src/components/UserProfileButton.tsx`)
   - Profile dropdown with user info
   - Sign out functionality

4. **usePortfolioData Hook** (`src/hooks/usePortfolioData.ts`)
   - Manages data operations (CRUD)
   - Automatically chooses local vs. cloud storage

### Database Schema

The app uses these Supabase tables:
- `profiles`: User profile information
- `portfolio_investments`: Investment data
- `custom_parameter_sets`: Custom parameter templates
- `simulation_results`: Simulation history (future feature)

### Security Features

- Row Level Security (RLS) ensures users only see their data
- Secure authentication via Supabase Auth
- No sensitive data stored in localStorage
- Proper error handling for network issues

## Environment Setup

Make sure your `.env.local` file has:

```env
VITE_SUPABASE_URL=your_supabase_project_url
VITE_SUPABASE_ANON_KEY=your_supabase_anon_key
```

## Development Notes

### Backward Compatibility
- Existing users won't lose their localStorage data
- The app gracefully handles both authenticated and non-authenticated states
- No breaking changes to existing functionality

### Error Handling
- Network errors are displayed with dismissible alerts
- Loading states prevent user confusion
- Graceful fallbacks for offline usage

### Performance
- Parallel data loading for optimal speed
- Minimal re-renders with proper state management
- Efficient database queries with proper indexing

## Next Steps

Potential enhancements:
1. **Data Migration**: Help users migrate from localStorage to cloud
2. **Offline Support**: Queue operations when offline
3. **Team Sharing**: Share portfolios with team members
4. **Advanced Profiles**: User preferences and settings
5. **Export/Import**: Better data portability options

## Support

If you encounter any authentication issues:
1. Check your Supabase configuration
2. Verify your environment variables
3. Check the browser console for detailed error messages
4. Test with different browsers to isolate issues 
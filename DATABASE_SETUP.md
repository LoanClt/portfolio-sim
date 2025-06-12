# Database Setup Guide

This guide will help you set up the complete database schema for the VC Portfolio Simulator.

## Prerequisites

1. **Supabase Project**: Make sure you have a Supabase project created
2. **Environment Variables**: Ensure your `.env.local` file has the correct Supabase credentials:
   ```
   VITE_SUPABASE_URL=your_supabase_url
   VITE_SUPABASE_ANON_KEY=your_supabase_anon_key
   ```

## Database Setup Steps

### Step 1: Run the Complete Database Setup Script

Execute the `complete-database-setup.sql` file in your Supabase SQL Editor:

1. Open your Supabase project dashboard
2. Go to the **SQL Editor**
3. Copy and paste the contents of `complete-database-setup.sql`
4. Click **Run**

This will create all the necessary tables and setup:

### Tables Created

#### 1. **accounts** table
- Stores user account information
- Automatically linked to Supabase Auth users
- Includes email, full name, and timestamps

#### 2. **portfolio_investments** table
- Stores individual portfolio investments
- Includes all investment parameters and custom settings
- Supports both preset and custom parameter configurations

#### 3. **custom_parameter_sets** table
- Stores user-defined parameter sets
- Allows users to create reusable investment parameter templates
- Includes visual customization (color, icon)

#### 4. **simulation_results** table (Optional)
- Stores simulation results for future reference
- Includes portfolio data, parameters, and computed results
- Useful for comparing different scenarios

### Features Included

#### Row Level Security (RLS)
- All tables have RLS enabled
- Users can only access their own data
- Secure by default

#### Automatic Triggers
- **Account Creation**: Automatically creates account profile when user signs up
- **Timestamp Updates**: Automatically updates `updated_at` when records are modified

#### Indexes
- Optimized queries with strategic indexes
- Fast lookups by user, field, date, etc.

## Verification

After running the script, you should see these tables in your Supabase database:

1. `accounts`
2. `portfolio_investments` 
3. `custom_parameter_sets`
4. `simulation_results`

## Usage in Application

### Portfolio Management
```typescript
import { portfolioService } from '@/services/portfolioService'

// Save investment
const investment = await portfolioService.createInvestment({
  companyName: "Example Corp",
  field: "AI/ML",
  region: "North America",
  // ... other properties
})

// Get all investments
const investments = await portfolioService.getInvestments()
```

### Custom Parameter Sets
```typescript
// Create custom parameter set
const customSet = await portfolioService.createCustomParameterSet({
  name: "Conservative Tech",
  description: "Lower risk parameters for tech investments",
  color: "blue",
  icon: "shield",
  // ... parameter values
})

// Get all custom sets
const customSets = await portfolioService.getCustomParameterSets()
```

### Simulation Results
```typescript
import { simulationResultsService } from '@/services/simulationResultsService'

// Save simulation result
const result = await simulationResultsService.saveSimulation({
  portfolioName: "Q4 2024 Portfolio",
  simulationParams: { /* simulation parameters */ },
  portfolioData: investments,
  resultsData: { /* simulation results */ },
  expectedReturn: 250000,
  irr: 25.5,
  multiple: 3.2
})

// Get all saved simulations
const simulations = await simulationResultsService.getSimulations()
```

## Data Flow

1. **User Signs Up** → Automatic account profile creation in `accounts` table
2. **User Adds Investments** → Stored in `portfolio_investments` table
3. **User Creates Custom Sets** → Stored in `custom_parameter_sets` table
4. **User Runs Simulation** → Optionally saved in `simulation_results` table
5. **User Views Data** → Retrieved with RLS ensuring data privacy

## Authentication Integration

The system is fully integrated with Supabase Auth:

- **Sign Up**: Automatically creates account profile
- **Sign In**: Provides access to user's data only
- **Sign Out**: Clears local session
- **Data Access**: All queries filtered by authenticated user ID

## Migration from Local Storage

If you have existing data in localStorage, you can migrate it by:

1. **Signing up/in** to create account
2. **Using the import feature** in the application
3. **Manual data entry** for custom parameter sets

## Troubleshooting

### Common Issues

**1. "relation 'accounts' already exists"**
- The script includes `DROP TABLE IF EXISTS` statements
- Safe to re-run the complete setup script

**2. "User must be authenticated"**
- Ensure user is signed in before making database calls
- Check environment variables are correct

**3. "RLS policy violation"**
- User trying to access data that doesn't belong to them
- Ensure all queries include user filtering

### Debugging Tips

1. **Check Supabase Logs**: View real-time logs in Supabase dashboard
2. **Verify RLS Policies**: Ensure policies are enabled and correct
3. **Test with SQL Editor**: Try queries directly in Supabase SQL editor
4. **Check User Session**: Verify user is authenticated in browser dev tools

## Schema Changes

If you need to modify the schema later:

1. **Backup Data**: Export existing data first
2. **Update Schema**: Make changes carefully
3. **Update Services**: Ensure TypeScript services match new schema
4. **Test Thoroughly**: Verify data integrity after changes

## Performance Considerations

- **Indexes**: The setup includes optimized indexes for common queries
- **RLS**: Policies are designed for performance while maintaining security
- **Data Types**: Chosen for optimal storage and query performance
- **JSON Columns**: Used for flexible data storage in simulation results

## Security Features

- **Row Level Security**: Enabled on all tables
- **User Isolation**: Users can only access their own data
- **SQL Injection Protection**: Parameterized queries in all services
- **Authentication Required**: All operations require valid user session 
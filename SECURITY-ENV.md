# Security Enhancement - Environment Variables

## New Environment Variables

Add the following to your `.env.local` file:

```env
# Admin Configuration
# Specify the admin email address (defaults to master@essentia.com if not set)
ADMIN_EMAIL=master@essentia.com
```

## Existing Required Variables

Make sure you have these already configured:

```env
# Supabase Configuration
NEXT_PUBLIC_SUPABASE_URL=your-supabase-url
NEXT_PUBLIC_SUPABASE_ANON_KEY=your-anon-key
SUPABASE_SERVICE_ROLE_KEY=your-service-role-key

# Resend Email Service
RESEND_API_KEY=your-resend-api-key
```

## Security Notes

- Never commit `.env.local` to version control
- The `.env.local` file is already in `.gitignore`
- Use different API keys for development and production
- Rotate service role keys periodically

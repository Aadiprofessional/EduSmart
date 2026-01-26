# Google OAuth Setup with Supabase - Complete Guide

## The Problem
You're getting `Error 400: redirect_uri_mismatch` because there's a mismatch between what your app sends to Google and what Google OAuth console is configured to accept.

## Step 1: Configure OAuth Consent Screen (IMPORTANT - Do This First!)

This step ensures users see "MatrixEdu" instead of the Supabase domain name.

1. **Go to Google Cloud Console**
   - Visit: https://console.cloud.google.com/
   - Navigate to APIs & Services → OAuth consent screen

2. **Configure the Consent Screen**
   - **User Type**: Choose "External" (unless you have a Google Workspace)
   - Click "Create"

3. **App Information**
   - **App name**: `MatrixEdu`
   - **User support email**: Your email address
   - **App logo**: Upload your MatrixEdu logo (optional but recommended)
   - **App domain**: Leave blank or use your actual domain
   - **Developer contact information**: Your email address

4. **Authorized Domains** (CRITICAL)
   - Add: `supabase.co` (this allows the Supabase callback)
   - Add your production domain if you have one: `your-domain.com`

5. **Scopes**
   - Add these scopes:
     - `../auth/userinfo.email`
     - `../auth/userinfo.profile`
     - `openid`

6. **Test Users** (For development)
   - Add your email and any test user emails
   - This allows testing before publishing

7. **Save and Continue** through all steps

## Step 2: Supabase Configuration

1. **Go to your Supabase Dashboard**
   - Navigate to Authentication → Providers
   - Find the Google provider section

2. **Configure Google Provider in Supabase**
   - **Client ID**: `YOUR_GOOGLE_CLIENT_ID`
   - **Client Secret**: `YOUR_GOOGLE_CLIENT_SECRET`
   - **Enable the provider**

3. **Important: Note the Callback URL**
   - Supabase shows you the callback URL in the provider settings
   - It should be: `https://cdqrmxmqsoxncnkxiqwu.supabase.co/auth/v1/callback`
   - **This is the EXACT URL you need to configure in Google OAuth console**

## Step 3: Google Cloud Console Credentials Configuration

1. **Navigate to APIs & Services → Credentials**

2. **Find your OAuth 2.0 Client ID**
   - Look for client ID: `YOUR_GOOGLE_CLIENT_ID`

3. **Configure Authorized JavaScript Origins**
   Add these origins (without any paths):
   ```
   http://localhost:3000
   http://localhost:5173
   https://your-production-domain.com
   https://www.your-production-domain.com
   ```

4. **Configure Authorized Redirect URIs** 
   Add these EXACT redirect URIs:
   ```
   https://cdqrmxmqsoxncnkxiqwu.supabase.co/auth/v1/callback
   http://localhost:3000/auth/callback
   http://localhost:5173/auth/callback
   https://your-production-domain.com/auth/callback
   https://www.your-production-domain.com/auth/callback
   ```

   **CRITICAL**: The Supabase callback URL must be EXACTLY:
   `https://cdqrmxmqsoxncnkxiqwu.supabase.co/auth/v1/callback`

## Step 4: Supabase URL Configuration

1. **Go to Supabase Dashboard**
   - Navigate to Authentication → URL Configuration

2. **Set Site URL**
   - Set this to your main production URL: `https://your-production-domain.com`
   - For development, you can use: `http://localhost:3000`

3. **Add Redirect URLs**
   Add these patterns:
   ```
   http://localhost:3000/**
   http://localhost:5173/**
   https://your-production-domain.com/**
   https://www.your-production-domain.com/**
   ```

## Step 5: Update Your Application

Make sure your `supabaseClient.js` (or similar) is initialized correctly with the URL and Anon Key.

```javascript
import { createClient } from '@supabase/supabase-js'

const supabaseUrl = 'https://cdqrmxmqsoxncnkxiqwu.supabase.co'
const supabaseKey = process.env.REACT_APP_SUPABASE_ANON_KEY
export const supabase = createClient(supabaseUrl, supabaseKey)
```

## Step 6: Testing

1. Clear your browser cache or open an Incognito window
2. Try to sign in with Google
3. If it fails, check the URL bar for the error message
4. Common errors:
   - `redirect_uri_mismatch`: Check Step 3 and Step 4
   - `invalid_client`: Check Client ID in Step 2
   - `access_denied`: User cancelled or not in test users list

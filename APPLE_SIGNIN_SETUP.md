# Apple Sign In Setup with Supabase - Complete Guide

## What You Have So Far
- ✅ Apple Developer Key: `SupabaseAppleKey`
- ✅ Key ID: `DLFS9MA4YC`
- ✅ Private Key (.p8 file content)
- ✅ Sign in with Apple enabled

## Step 1: Complete Apple Developer Console Setup

### 1.1 Create a Service ID (Required for Web)
1. **Go to Apple Developer Console**: https://developer.apple.com/account/
2. **Navigate to**: Certificates, Identifiers & Profiles → Identifiers
3. **Click the + button** to create new identifier
4. **Select**: Services IDs → Continue
5. **Configure Service ID**:
   - **Description**: `MatrixEdu Web Sign In`
   - **Identifier**: `com.matrixedu.web.signin` (or your preferred reverse domain)
   - **Enable**: Sign in with Apple
6. **Configure Sign in with Apple**:
   - **Primary App ID**: Select your main app ID (or create one if needed)
   - **Web Domain**: Add your domain (e.g., `matrixedu.com` or `localhost` for testing)
   - **Return URLs**: Add these URLs:
     ```
     https://cdqrmxmqsoxncnkxiqwu.supabase.co/auth/v1/callback
     http://localhost:3000/auth/callback
     ```
   - **Save**

### 1.2 Note Your Team ID
1. **In Apple Developer Console**, note your **Team ID** (found in the top right corner)
2. **Example**: If your team ID is `ABC123DEF4`, remember this

## Step 2: Generate Secret Key for Supabase

You need to create a JWT secret key using your Apple private key. Here's what to put in Supabase:

### Secret Key Format:
```
{
  "iss": "YOUR_TEAM_ID",
  "iat": CURRENT_TIMESTAMP,
  "exp": EXPIRATION_TIMESTAMP,
  "aud": "https://appleid.apple.com",
  "sub": "YOUR_SERVICE_ID",
  "kid": "DLFS9MA4YC"
}
```

**For Supabase, you need to provide**:
- **Team ID**: Your Apple Developer Team ID
- **Key ID**: `DLFS9MA4YC`
- **Private Key**: The .p8 content you have
- **Service ID**: The service ID you created (e.g., `com.matrixedu.web.signin`)

## Step 3: Configure Supabase

1. **Go to Supabase Dashboard** → Authentication → Providers
2. **Find Apple Provider** and configure:
   - **Client IDs**: `com.matrixedu.web.signin` (your Service ID)
   - **Secret Key**: Paste your .p8 private key content:
     ```
     -----BEGIN PRIVATE KEY-----
     MIGTAgEAMBMGByqGSM49AgEGCCqGSM49AwEHBHkwdwIBAQQg1pC1D/PX9yxifTUf
     jlq3Cs7io3tRL0gofmA+K4/gINigCgYIKoZIzj0DAQehRANCAAQ+7JXFzdciiB8O
     lA2rYufTBdmWgoWYjH5PPcUti5D8rK7oX6e6JV7uwPTTeF+Mj4qdex1lrS3lsf7V
     CmAb2m03
     -----END PRIVATE KEY-----
     ```
3. **Enable the Apple provider**

## Step 4: What You Need to Provide

To complete this setup, I need:
1. **Your Apple Team ID** (found in Apple Developer Console)
2. **Your Service ID** (the one you create for web sign-in)
3. **Your production domain** (if you have one)

## Step 5: Update Application Code

Once you provide the above information, I'll:
1. Update `AuthContext.tsx` to replace Facebook with Apple
2. Update Login and Signup pages to show Apple button instead of Facebook
3. Create proper Apple sign-in integration
4. Test the complete flow

## Common Apple Sign In Requirements

- **Domain Verification**: Apple requires domain verification for production
- **Privacy Policy**: Must have accessible privacy policy
- **Terms of Service**: Must have accessible terms of service
- **Email Handling**: Apple users can choose to hide their email

## Next Steps

Please provide:
1. Your Apple Team ID
2. The Service ID you want to use (suggestion: `com.matrixedu.web.signin`)
3. Your production domain (if any)

Then I'll complete the Supabase configuration and update your application code! 
# Apple Developer Console Configuration Checklist

## ✅ Your Information
- **Team ID**: `75NR4WL287`
- **Entity**: MatrixBIM Company Limited  
- **Key ID**: `DLFS9MA4YC`
- **Service ID**: `com.matrixedu.supabaseauth`

## 🔧 Apple Developer Console Steps

### Step 1: Verify/Create Service ID
1. **Go to**: https://developer.apple.com/account/resources/identifiers/list/serviceId
2. **Look for**: `com.matrixedu.supabaseauth`
3. **If it doesn't exist, create it**:
   - Click the **+** button
   - Select **Service IDs**
   - **Description**: `MatrixEdu Supabase Auth`
   - **Identifier**: `com.matrixedu.supabaseauth`
   - **Enable**: Sign in with Apple ✅

### Step 2: Configure Sign in with Apple for Service ID
1. **Click on your Service ID**: `com.matrixedu.supabaseauth`
2. **Check**: Sign in with Apple ✅
3. **Click**: Configure
4. **Configure these settings**:
   
   **Primary App ID**: 
   - Create a new App ID if you don't have one
   - **Description**: `MatrixEdu App`
   - **Bundle ID**: `com.matrixedu.app` (or use existing)
   
   **Website URLs**:
   - **Domains**: `supabase.co`
   - **Return URLs**: `https://cdqrmxmqsoxncnkxiqwu.supabase.co/auth/v1/callback`

5. **Save** and **Continue**

### Step 3: Verify Key Configuration
1. **Go to**: https://developer.apple.com/account/resources/authkeys/list
2. **Find**: `SupabaseAppleKey` with Key ID `DLFS9MA4YC`
3. **Verify**: Sign in with Apple is enabled ✅

## 🎯 Supabase Configuration

### Copy this JWT to Supabase:
```
eyJhbGciOiJFUzI1NiIsImtpZCI6IkRMRlM5TUE0WUMifQ.eyJpc3MiOiI3NU5SNFdMMjg3IiwiaWF0IjoxNzUxNDc1MzEzLCJleHAiOjE3NjcwMjczMTMsImF1ZCI6Imh0dHBzOi8vYXBwbGVpZC5hcHBsZS5jb20iLCJzdWIiOiJjb20ubWF0cml4ZWR1LnN1cGFiYXNlYXV0aCJ9.MEUCIAbZ9_biajwtXrTJOUGZyMNDZ3NGjK4r54HwX_NQUDdlAiEAvRAN904Od21pE2pZAHWd9R3yvLXqaoPygMHeJDu1n9w
```

### Supabase Settings:
1. **Go to**: Supabase Dashboard → Authentication → Providers → Apple
2. **Enable**: Apple provider ✅
3. **Client IDs**: `com.matrixedu.supabaseauth`
4. **Secret Key**: [Paste the JWT above]
5. **Save**

## ✅ Final Checklist

- [ ] Service ID `com.matrixedu.supabaseauth` created in Apple Developer Console
- [ ] Sign in with Apple enabled for the Service ID
- [ ] Domain `supabase.co` added to Website URLs
- [ ] Return URL `https://cdqrmxmqsoxncnkxiqwu.supabase.co/auth/v1/callback` added
- [ ] JWT pasted into Supabase Apple provider settings
- [ ] Apple provider enabled in Supabase
- [ ] Client IDs set to `com.matrixedu.supabaseauth` in Supabase

## 🚀 Testing

Once everything is configured:
1. Start your app: `npm start`
2. Go to: `http://localhost:3000/login`
3. Click **Sign in with Apple**
4. Should redirect to Apple Sign In with your app name
5. After signing in, should redirect back to your app

## 📅 Important Notes

- **JWT Expires**: January 2025 (6 months from now)
- **Renewal**: Run the script again in 6 months to generate a new JWT
- **Security**: Keep your .p8 private key secure and never share it 
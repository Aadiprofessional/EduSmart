# Apple Sign In - Complete Setup Checklist ✅

## ✅ Already Done
- ✅ Apple Developer Key: `SupabaseAppleKey` created
- ✅ Key ID: `DLFS9MA4YC` obtained
- ✅ Private Key (.p8 file) generated
- ✅ Frontend code updated (Facebook → Apple)
- ✅ AuthContext updated with Apple provider
- ✅ Login and Signup pages updated

## 🔧 Steps You Need to Complete

### Step 1: Create Apple Service ID
1. **Go to Apple Developer Console**: https://developer.apple.com/account/
2. **Navigate to**: Certificates, Identifiers & Profiles → Identifiers
3. **Click +** to create new identifier
4. **Select**: Service IDs
5. **Configure**:
   - **Description**: `MatrixEdu Web Sign In`
   - **Identifier**: `com.matrixedu.web.signin` (use exactly this)
   - **Enable**: Sign in with Apple ✅
6. **Configure Sign in with Apple**:
   - **Primary App ID**: Create or select your main app ID
   - **Web Domain**: `supabase.co`
   - **Return URLs**: `https://cdqrmxmqsoxncnkxiqwu.supabase.co/auth/v1/callback`
   - **Save**

### Step 2: Get Your Team ID
1. **In Apple Developer Console**, look at the top right corner
2. **Note down your Team ID** (looks like: ABC123DEF4)

### Step 3: Configure Supabase
1. **Go to Supabase Dashboard**: https://supabase.com/dashboard
2. **Navigate to**: Authentication → Providers → Apple
3. **Enable Apple Provider**
4. **Fill in**:
   - **Client IDs**: `com.matrixedu.web.signin`
   - **Secret Key**: Paste your entire .p8 private key:
     ```
     -----BEGIN PRIVATE KEY-----
     MIGTAgEAMBMGByqGSM49AgEGCCqGSM49AwEHBHkwdwIBAQQg1pC1D/PX9yxifTUf
     jlq3Cs7io3tRL0gofmA+K4/gINigCgYIKoZIzj0DAQehRANCAAQ+7JXFzdciiB8O
     lA2rYufTBdmWgoWYjH5PPcUti5D8rK7oX6e6JV7uwPTTeF+Mj4qdex1lrS3lsf7V
     CmAb2m03
     -----END PRIVATE KEY-----
     ```

### Step 4: Additional Supabase Settings
**In Supabase, you may also need to configure additional Apple-specific settings:**

1. **Team ID**: [YOUR_TEAM_ID_HERE]
2. **Key ID**: `DLFS9MA4YC`
3. **Bundle ID/Service ID**: `com.matrixedu.web.signin`

### Step 5: Test the Setup
1. **Start your development server**: `npm start`
2. **Go to login page**: `http://localhost:3000/login`
3. **Click "Sign in with Apple"**
4. **Expected flow**:
   - Redirects to Apple ID sign-in
   - Shows "MatrixEdu" or your app name
   - After authentication, redirects back to your app
   - User should be logged in

## 🚨 Common Issues & Solutions

### Issue: "The client_id provided is invalid"
**Solution**: Make sure the Service ID in Supabase matches exactly: `com.matrixedu.web.signin`

### Issue: "redirect_uri_mismatch"
**Solution**: Ensure return URL in Apple Developer Console is exactly: `https://cdqrmxmqsoxncnkxiqwu.supabase.co/auth/v1/callback`

### Issue: "Invalid client authentication"
**Solution**: Check that:
- The .p8 private key is pasted completely (including BEGIN/END lines)
- Team ID is correct
- Key ID is `DLFS9MA4YC`

### Issue: Apple shows wrong app name
**Solution**: 
- Update the App Name in Apple Developer Console under the App ID
- Or update the Service ID description

## 📋 Information You Need to Provide

Please provide these details so I can help you complete the setup:

1. **Your Apple Team ID**: _____________
2. **Confirm Service ID**: `com.matrixedu.web.signin` (or tell me if you want different)
3. **Your production domain** (if any): _____________

## 🎯 Next Steps

Once you complete the Apple setup:
1. Test Apple Sign In locally
2. Deploy to production and test there
3. Remove Facebook references completely (if any remain)
4. Update any documentation

## 🔐 Security Notes

- Apple Sign In is more secure than other providers
- Users can choose to hide their email (Apple provides a relay email)
- Apple requires annual review for apps in production
- Keys expire every 6 months and need renewal

---

**Status**: Waiting for Apple Team ID and Service ID confirmation to complete Supabase configuration. 
-- 🧪 TEST SIGNUP FLOW
-- This script tests if the signup flow will work properly

-- Step 1: Check if we can insert a test profile (simulate what happens during signup)
-- Note: Replace 'test-user-id' with an actual UUID if you want to test with a real user

-- First, let's see what the current table structure looks like
SELECT column_name, data_type, is_nullable, column_default
FROM information_schema.columns 
WHERE table_name = 'profiles' 
ORDER BY ordinal_position;

-- Step 2: Test if we can insert a minimal profile (what the signup process does)
-- This is just a test query - don't actually run the INSERT unless you want to create test data
/*
INSERT INTO profiles (user_id, full_name, email) 
VALUES (
    'b1ea521c-3168-472e-8b76-33aac54402fb', -- Replace with actual user ID
    'Test User',
    'test@example.com'
);
*/

-- Step 3: Check current RLS policies
SELECT 
    policyname, 
    cmd, 
    qual,
    with_check
FROM pg_policies 
WHERE tablename = 'profiles'
ORDER BY cmd;

-- Step 4: Check table permissions
SELECT 
    grantee,
    privilege_type
FROM information_schema.role_table_grants 
WHERE table_name = 'profiles'
AND grantee IN ('authenticated', 'service_role', 'anon');

-- Step 5: Verify RLS is enabled
SELECT 
    tablename,
    rowsecurity as rls_enabled
FROM pg_tables 
WHERE tablename = 'profiles';

-- Step 6: Check for any remaining constraint conflicts
SELECT 
    conname as constraint_name,
    contype as constraint_type,
    pg_get_constraintdef(oid) as constraint_definition
FROM pg_constraint 
WHERE conrelid = 'profiles'::regclass
ORDER BY contype;

-- Step 7: Test query that the app will use to fetch profiles
-- This simulates what happens when the app tries to fetch a user's profile
/*
SELECT * FROM profiles 
WHERE user_id = 'b1ea521c-3168-472e-8b76-33aac54402fb';
*/ 
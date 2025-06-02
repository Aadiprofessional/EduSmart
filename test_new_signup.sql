-- 🧪 TEST NEW SIGNUP PROCESS
-- Run this after recreating the profiles table to verify it works

-- Step 1: Check the new table structure
SELECT 
    column_name, 
    data_type, 
    is_nullable, 
    column_default
FROM information_schema.columns 
WHERE table_name = 'profiles' 
ORDER BY ordinal_position;

-- Step 2: Test inserting a minimal profile (what signup does)
-- This simulates the exact insert that happens during signup
-- Replace the UUID with a test value or actual user ID

/*
-- Test insert (uncomment to test)
INSERT INTO profiles (user_id, full_name, email) 
VALUES (
    gen_random_uuid(), -- This would be the actual user ID from auth.users
    'Test User',
    'test@example.com'
);
*/

-- Step 3: Check RLS policies are working
SELECT 
    policyname, 
    cmd, 
    qual
FROM pg_policies 
WHERE tablename = 'profiles'
ORDER BY cmd;

-- Step 4: Verify permissions
SELECT 
    grantee,
    privilege_type
FROM information_schema.role_table_grants 
WHERE table_name = 'profiles'
AND grantee IN ('authenticated', 'service_role');

-- Step 5: Check constraints
SELECT 
    conname as constraint_name,
    contype as constraint_type
FROM pg_constraint 
WHERE conrelid = 'profiles'::regclass;

-- Step 6: Test that we can query the table
SELECT COUNT(*) as profile_count FROM profiles;

-- Step 7: Verify the table is ready for production
SELECT 
    'Table exists' as status,
    COUNT(*) as column_count
FROM information_schema.columns 
WHERE table_name = 'profiles'
UNION ALL
SELECT 
    'RLS enabled' as status,
    CASE WHEN rowsecurity THEN 1 ELSE 0 END as enabled
FROM pg_tables 
WHERE tablename = 'profiles'
UNION ALL
SELECT 
    'Policies count' as status,
    COUNT(*) as policy_count
FROM pg_policies 
WHERE tablename = 'profiles'; 
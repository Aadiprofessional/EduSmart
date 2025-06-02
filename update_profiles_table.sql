-- 🔄 UPDATE PROFILES TABLE WITH ALL REQUIRED COLUMNS
-- This adds all the missing columns that Profile.tsx expects

-- Add all missing columns to the existing profiles table
ALTER TABLE profiles ADD COLUMN IF NOT EXISTS date_of_birth DATE;
ALTER TABLE profiles ADD COLUMN IF NOT EXISTS nationality VARCHAR(100);
ALTER TABLE profiles ADD COLUMN IF NOT EXISTS current_location VARCHAR(200);
ALTER TABLE profiles ADD COLUMN IF NOT EXISTS preferred_study_location VARCHAR(200);

-- Academic Information
ALTER TABLE profiles ADD COLUMN IF NOT EXISTS current_education_level VARCHAR(100);
ALTER TABLE profiles ADD COLUMN IF NOT EXISTS current_institution VARCHAR(200);
ALTER TABLE profiles ADD COLUMN IF NOT EXISTS current_gpa DECIMAL(4,2);
ALTER TABLE profiles ADD COLUMN IF NOT EXISTS gpa_scale VARCHAR(10) DEFAULT '4.0';
ALTER TABLE profiles ADD COLUMN IF NOT EXISTS graduation_year VARCHAR(10);
ALTER TABLE profiles ADD COLUMN IF NOT EXISTS field_of_study VARCHAR(200);
ALTER TABLE profiles ADD COLUMN IF NOT EXISTS preferred_field VARCHAR(200);

-- Test Scores
ALTER TABLE profiles ADD COLUMN IF NOT EXISTS sat_score INTEGER;
ALTER TABLE profiles ADD COLUMN IF NOT EXISTS act_score INTEGER;
ALTER TABLE profiles ADD COLUMN IF NOT EXISTS gre_score INTEGER;
ALTER TABLE profiles ADD COLUMN IF NOT EXISTS gmat_score INTEGER;
ALTER TABLE profiles ADD COLUMN IF NOT EXISTS toefl_score INTEGER;
ALTER TABLE profiles ADD COLUMN IF NOT EXISTS ielts_score DECIMAL(2,1);
ALTER TABLE profiles ADD COLUMN IF NOT EXISTS duolingo_score INTEGER;

-- Preferences
ALTER TABLE profiles ADD COLUMN IF NOT EXISTS preferred_degree_level VARCHAR(100);
ALTER TABLE profiles ADD COLUMN IF NOT EXISTS budget_range VARCHAR(100);
ALTER TABLE profiles ADD COLUMN IF NOT EXISTS preferred_university_size VARCHAR(50);
ALTER TABLE profiles ADD COLUMN IF NOT EXISTS preferred_campus_type VARCHAR(50);
ALTER TABLE profiles ADD COLUMN IF NOT EXISTS preferred_program_type VARCHAR(100);

-- Experience and Activities (using TEXT for arrays stored as JSON strings)
ALTER TABLE profiles ADD COLUMN IF NOT EXISTS extracurricular_activities TEXT;
ALTER TABLE profiles ADD COLUMN IF NOT EXISTS career_goals TEXT;
ALTER TABLE profiles ADD COLUMN IF NOT EXISTS work_experience TEXT;
ALTER TABLE profiles ADD COLUMN IF NOT EXISTS research_experience TEXT;
ALTER TABLE profiles ADD COLUMN IF NOT EXISTS publications TEXT;
ALTER TABLE profiles ADD COLUMN IF NOT EXISTS awards TEXT;
ALTER TABLE profiles ADD COLUMN IF NOT EXISTS languages TEXT;

-- Additional Information
ALTER TABLE profiles ADD COLUMN IF NOT EXISTS financial_aid_needed BOOLEAN DEFAULT false;
ALTER TABLE profiles ADD COLUMN IF NOT EXISTS scholarship_interests TEXT;

-- Profile Management
ALTER TABLE profiles ADD COLUMN IF NOT EXISTS profile_completion_percentage INTEGER DEFAULT 0;

-- Verify the updated structure
SELECT 
    column_name,
    data_type,
    is_nullable,
    column_default
FROM information_schema.columns 
WHERE table_name = 'profiles' 
ORDER BY ordinal_position;

-- Test that we can insert a complete profile
/*
INSERT INTO profiles (
    user_id, 
    full_name, 
    email, 
    profile_completion_percentage
) VALUES (
    gen_random_uuid(),
    'Test User',
    'test@example.com',
    25
);
*/

SELECT 'Profiles table updated successfully' as status; 
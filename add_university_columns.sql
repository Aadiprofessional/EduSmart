-- Add new columns to universities table for enhanced admission requirements and information

-- Admission requirements columns
ALTER TABLE universities ADD COLUMN IF NOT EXISTS min_gpa_required DECIMAL(3,2);
ALTER TABLE universities ADD COLUMN IF NOT EXISTS sat_score_required VARCHAR(50);
ALTER TABLE universities ADD COLUMN IF NOT EXISTS act_score_required VARCHAR(50);
ALTER TABLE universities ADD COLUMN IF NOT EXISTS ielts_score_required VARCHAR(50);
ALTER TABLE universities ADD COLUMN IF NOT EXISTS toefl_score_required VARCHAR(50);
ALTER TABLE universities ADD COLUMN IF NOT EXISTS gre_score_required VARCHAR(50);
ALTER TABLE universities ADD COLUMN IF NOT EXISTS gmat_score_required VARCHAR(50);

-- Application deadlines
ALTER TABLE universities ADD COLUMN IF NOT EXISTS application_deadline_fall VARCHAR(100);
ALTER TABLE universities ADD COLUMN IF NOT EXISTS application_deadline_spring VARCHAR(100);
ALTER TABLE universities ADD COLUMN IF NOT EXISTS application_deadline_summer VARCHAR(100);

-- Financial information
ALTER TABLE universities ADD COLUMN IF NOT EXISTS tuition_fee_graduate INTEGER;
ALTER TABLE universities ADD COLUMN IF NOT EXISTS scholarship_available BOOLEAN DEFAULT false;
ALTER TABLE universities ADD COLUMN IF NOT EXISTS financial_aid_available BOOLEAN DEFAULT false;

-- Additional admission requirements
ALTER TABLE universities ADD COLUMN IF NOT EXISTS application_requirements TEXT[];
ALTER TABLE universities ADD COLUMN IF NOT EXISTS admission_essay_required BOOLEAN DEFAULT false;
ALTER TABLE universities ADD COLUMN IF NOT EXISTS letters_of_recommendation_required INTEGER DEFAULT 0;
ALTER TABLE universities ADD COLUMN IF NOT EXISTS interview_required BOOLEAN DEFAULT false;
ALTER TABLE universities ADD COLUMN IF NOT EXISTS work_experience_required BOOLEAN DEFAULT false;
ALTER TABLE universities ADD COLUMN IF NOT EXISTS portfolio_required BOOLEAN DEFAULT false;

-- Add comments for documentation
COMMENT ON COLUMN universities.min_gpa_required IS 'Minimum GPA required for admission (e.g., 3.5)';
COMMENT ON COLUMN universities.sat_score_required IS 'Required SAT score (e.g., "1200+" or "1200-1400")';
COMMENT ON COLUMN universities.act_score_required IS 'Required ACT score (e.g., "26+" or "26-30")';
COMMENT ON COLUMN universities.ielts_score_required IS 'Required IELTS score (e.g., "6.5" or "6.5+")';
COMMENT ON COLUMN universities.toefl_score_required IS 'Required TOEFL score (e.g., "80" or "80+")';
COMMENT ON COLUMN universities.gre_score_required IS 'Required GRE score (e.g., "310+" or "310-320")';
COMMENT ON COLUMN universities.gmat_score_required IS 'Required GMAT score (e.g., "650+" or "650-700")';
COMMENT ON COLUMN universities.application_deadline_fall IS 'Fall semester application deadline (e.g., "September 1, 2024")';
COMMENT ON COLUMN universities.application_deadline_spring IS 'Spring semester application deadline (e.g., "January 15, 2024")';
COMMENT ON COLUMN universities.application_deadline_summer IS 'Summer semester application deadline (e.g., "May 1, 2024")';
COMMENT ON COLUMN universities.tuition_fee_graduate IS 'Graduate program tuition fee in USD';
COMMENT ON COLUMN universities.scholarship_available IS 'Whether scholarships are available';
COMMENT ON COLUMN universities.financial_aid_available IS 'Whether financial aid is available';
COMMENT ON COLUMN universities.application_requirements IS 'Array of application requirements (e.g., ["Transcripts", "Personal Statement"])';
COMMENT ON COLUMN universities.admission_essay_required IS 'Whether admission essay is required';
COMMENT ON COLUMN universities.letters_of_recommendation_required IS 'Number of recommendation letters required';
COMMENT ON COLUMN universities.interview_required IS 'Whether interview is required';
COMMENT ON COLUMN universities.work_experience_required IS 'Whether work experience is required';
COMMENT ON COLUMN universities.portfolio_required IS 'Whether portfolio is required';

-- Update existing records with some default values (optional)
UPDATE universities SET 
  min_gpa_required = 3.0,
  application_deadline_fall = 'September 1',
  application_deadline_spring = 'January 15',
  scholarship_available = true,
  financial_aid_available = true,
  admission_essay_required = true,
  letters_of_recommendation_required = 2
WHERE min_gpa_required IS NULL;

-- Create indexes for better query performance
CREATE INDEX IF NOT EXISTS idx_universities_min_gpa ON universities(min_gpa_required);
CREATE INDEX IF NOT EXISTS idx_universities_scholarship ON universities(scholarship_available);
CREATE INDEX IF NOT EXISTS idx_universities_financial_aid ON universities(financial_aid_available); 
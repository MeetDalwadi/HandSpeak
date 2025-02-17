-- Add new columns to courses table
ALTER TABLE courses
ADD COLUMN level text NOT NULL DEFAULT 'beginner',
ADD COLUMN category text NOT NULL DEFAULT 'numbers';

-- Add lessons count to modules table
ALTER TABLE modules
ADD COLUMN lessons integer NOT NULL DEFAULT 0;

-- Add new columns to lessons table
ALTER TABLE lessons
ADD COLUMN thumbnail_url text,
ADD COLUMN key_points jsonb NOT NULL DEFAULT '[]',
ADD COLUMN practice_exercises jsonb NOT NULL DEFAULT '[]',
ADD COLUMN resources jsonb NOT NULL DEFAULT '[]';

-- Add practice results to user_progress table
ALTER TABLE user_progress
ADD COLUMN practice_results jsonb DEFAULT '[]';

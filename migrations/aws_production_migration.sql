-- AWS Production Migration: Complete School Multi-Tenant Tables
-- Yeh queries AWS RDS pe Putty se chalao
-- Order matter karta hai — pehle parent tables, phir child tables

-- ============================================
-- STEP 1: Create "schools" table
-- ============================================
CREATE TABLE IF NOT EXISTS schools (
  id SERIAL PRIMARY KEY,
  name TEXT NOT NULL,
  slug TEXT NOT NULL UNIQUE,
  logo TEXT,
  tagline TEXT,
  address TEXT,
  contact_email TEXT,
  contact_phone TEXT,
  principal_name TEXT,
  board_affiliation TEXT,
  academic_year TEXT,
  theme TEXT DEFAULT 'blue_academic',
  is_active BOOLEAN DEFAULT true,
  created_at TIMESTAMP DEFAULT NOW(),
  updated_at TIMESTAMP DEFAULT NOW()
);

-- ============================================
-- STEP 2: Create "school_classes" table
-- ============================================
CREATE TABLE IF NOT EXISTS school_classes (
  id SERIAL PRIMARY KEY,
  school_id INTEGER NOT NULL REFERENCES schools(id),
  name TEXT NOT NULL,
  grade_number INTEGER NOT NULL,
  section TEXT DEFAULT 'A',
  is_active BOOLEAN DEFAULT true,
  created_at TIMESTAMP DEFAULT NOW()
);

-- ============================================
-- STEP 3: Create "school_subjects" table
-- ============================================
CREATE TABLE IF NOT EXISTS school_subjects (
  id SERIAL PRIMARY KEY,
  school_id INTEGER NOT NULL REFERENCES schools(id),
  name TEXT NOT NULL,
  code TEXT,
  description TEXT,
  is_active BOOLEAN DEFAULT true,
  created_at TIMESTAMP DEFAULT NOW()
);

-- ============================================
-- STEP 4: Create "school_chapters" table
-- ============================================
CREATE TABLE IF NOT EXISTS school_chapters (
  id SERIAL PRIMARY KEY,
  subject_id INTEGER NOT NULL REFERENCES school_subjects(id),
  school_id INTEGER NOT NULL REFERENCES schools(id),
  name TEXT NOT NULL,
  chapter_number INTEGER NOT NULL,
  description TEXT,
  syllabus_text TEXT,
  syllabus_pdf_url TEXT,
  learning_objectives JSONB,
  concept_tags TEXT[],
  difficulty_level TEXT DEFAULT 'medium',
  bloom_taxonomy_tags TEXT[],
  extracted_concepts JSONB,
  extracted_formulas JSONB,
  pdf_processing_status TEXT DEFAULT 'none',
  is_active BOOLEAN DEFAULT true,
  created_at TIMESTAMP DEFAULT NOW()
);

-- ============================================
-- STEP 5: Create "school_teachers" table
-- ============================================
CREATE TABLE IF NOT EXISTS school_teachers (
  id SERIAL PRIMARY KEY,
  school_id INTEGER NOT NULL REFERENCES schools(id),
  first_name TEXT NOT NULL,
  last_name TEXT,
  email TEXT NOT NULL UNIQUE,
  phone TEXT,
  password TEXT NOT NULL,
  role TEXT NOT NULL DEFAULT 'subject_teacher',
  is_class_teacher BOOLEAN DEFAULT false,
  assigned_class_id INTEGER,
  assigned_subject_ids JSONB,
  is_active BOOLEAN DEFAULT true,
  session_token TEXT,
  last_login_at TIMESTAMP,
  created_at TIMESTAMP DEFAULT NOW()
);

-- ============================================
-- STEP 6: Create "school_student_links" table
-- ============================================
CREATE TABLE IF NOT EXISTS school_student_links (
  id SERIAL PRIMARY KEY,
  school_id INTEGER NOT NULL REFERENCES schools(id),
  student_id INTEGER NOT NULL REFERENCES student_registrations(id),
  class_id INTEGER REFERENCES school_classes(id),
  section TEXT DEFAULT 'A',
  roll_number TEXT,
  enrolled_at TIMESTAMP DEFAULT NOW()
);

-- ============================================
-- STEP 7: Create "school_exams" table
-- ============================================
CREATE TABLE IF NOT EXISTS school_exams (
  id SERIAL PRIMARY KEY,
  school_id INTEGER NOT NULL REFERENCES schools(id),
  title TEXT NOT NULL,
  exam_type TEXT NOT NULL DEFAULT 'chapter_test',
  subject_id INTEGER REFERENCES school_subjects(id),
  class_id INTEGER REFERENCES school_classes(id),
  chapter_id INTEGER REFERENCES school_chapters(id),
  duration_minutes INTEGER NOT NULL DEFAULT 30,
  total_marks INTEGER NOT NULL DEFAULT 100,
  enable_shuffle BOOLEAN DEFAULT true,
  enable_option_shuffle BOOLEAN DEFAULT true,
  enable_proctoring BOOLEAN DEFAULT true,
  blueprint JSONB,
  status TEXT DEFAULT 'draft',
  start_time TIMESTAMP,
  end_time TIMESTAMP,
  created_by INTEGER REFERENCES school_teachers(id),
  created_at TIMESTAMP DEFAULT NOW()
);

-- ============================================
-- STEP 8: Create "school_exam_questions" table
-- ============================================
CREATE TABLE IF NOT EXISTS school_exam_questions (
  id SERIAL PRIMARY KEY,
  school_exam_id INTEGER NOT NULL REFERENCES school_exams(id),
  question_text TEXT NOT NULL,
  question_type TEXT NOT NULL DEFAULT 'mcq',
  options JSONB,
  correct_answer TEXT NOT NULL,
  model_answer TEXT,
  marks INTEGER NOT NULL DEFAULT 1,
  difficulty TEXT DEFAULT 'medium',
  concept_tag TEXT,
  bloom_level TEXT,
  image_url TEXT,
  audio_url TEXT,
  ai_quality_score JSONB,
  created_at TIMESTAMP DEFAULT NOW()
);

-- ============================================
-- STEP 9: Create "school_exam_attempts" table
-- ============================================
CREATE TABLE IF NOT EXISTS school_exam_attempts (
  id SERIAL PRIMARY KEY,
  school_exam_id INTEGER NOT NULL REFERENCES school_exams(id),
  student_id INTEGER NOT NULL REFERENCES student_registrations(id),
  start_time TIMESTAMP DEFAULT NOW(),
  end_time TIMESTAMP,
  score INTEGER,
  total_marks INTEGER,
  percentage REAL,
  grade TEXT,
  status TEXT DEFAULT 'in_progress',
  ai_grading_status TEXT DEFAULT 'pending',
  ai_grading_result JSONB,
  time_per_question JSONB,
  created_at TIMESTAMP DEFAULT NOW()
);

-- ============================================
-- STEP 10: Create "school_exam_answers" table
-- ============================================
CREATE TABLE IF NOT EXISTS school_exam_answers (
  id SERIAL PRIMARY KEY,
  attempt_id INTEGER NOT NULL REFERENCES school_exam_attempts(id),
  question_id INTEGER NOT NULL REFERENCES school_exam_questions(id),
  selected_option TEXT,
  answer_text TEXT,
  answer_image_url TEXT,
  answer_audio_url TEXT,
  answer_mode TEXT DEFAULT 'typed',
  is_correct BOOLEAN,
  ai_score REAL,
  ai_max_score REAL,
  ai_evaluation JSONB,
  time_taken INTEGER,
  created_at TIMESTAMP DEFAULT NOW()
);

-- ============================================
-- STEP 11: Create "school_analytics" table
-- ============================================
CREATE TABLE IF NOT EXISTS school_analytics (
  id SERIAL PRIMARY KEY,
  school_id INTEGER NOT NULL REFERENCES schools(id),
  student_id INTEGER NOT NULL REFERENCES student_registrations(id),
  subject_id INTEGER REFERENCES school_subjects(id),
  concept_tag TEXT,
  accuracy REAL,
  total_attempts INTEGER DEFAULT 0,
  avg_time_per_question REAL,
  brain_score JSONB,
  weak_areas JSONB,
  risk_level TEXT DEFAULT 'safe',
  adaptive_weights JSONB,
  updated_at TIMESTAMP DEFAULT NOW()
);

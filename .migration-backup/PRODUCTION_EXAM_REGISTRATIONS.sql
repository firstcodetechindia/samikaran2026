-- PRODUCTION SQL: Register all students to Test Olympiad Exams
-- Exam IDs: 440 (Math), 441 (Science), 442 (English), 443 (Reasoning), 444 (GK)
-- Run this in pgAdmin on PRODUCTION database

-- Step 1: Update exam status to 'active' and set dates to NOW so students can take immediately
UPDATE exams 
SET status = 'active',
    start_time = NOW() - INTERVAL '1 hour',
    end_time = NOW() + INTERVAL '30 days'
WHERE id IN (440, 441, 442, 443, 444);

-- Step 2: Insert all student registrations
INSERT INTO exam_registrations (student_id, exam_id, status, payment_status, registered_by_type, registered_at)
SELECT sr.id, e.id, 'confirmed', 'paid', 'self', NOW()
FROM student_registrations sr
CROSS JOIN (SELECT id FROM exams WHERE id IN (440, 441, 442, 443, 444)) e
ON CONFLICT DO NOTHING;

-- Step 3: Update any existing registrations to confirmed status
UPDATE exam_registrations 
SET status = 'confirmed', payment_status = 'paid', registered_by_type = 'self'
WHERE exam_id IN (440, 441, 442, 443, 444);

-- Verify exam status and dates
SELECT id, title, status, start_time, end_time FROM exams WHERE id IN (440, 441, 442, 443, 444);

-- Verify the registrations
SELECT exam_id, status, COUNT(*) as students_count 
FROM exam_registrations 
WHERE exam_id IN (440, 441, 442, 443, 444) 
GROUP BY exam_id, status
ORDER BY exam_id;

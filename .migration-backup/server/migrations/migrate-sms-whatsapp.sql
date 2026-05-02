-- Migration: Add SMS/WhatsApp dual-channel columns to sms_templates
-- Run this on production database after deploying the new code

ALTER TABLE sms_templates ADD COLUMN IF NOT EXISTS channel text DEFAULT 'sms';
ALTER TABLE sms_templates ADD COLUMN IF NOT EXISTS msg91_sms_template_id text DEFAULT '';
ALTER TABLE sms_templates ADD COLUMN IF NOT EXISTS msg91_whatsapp_template_name text DEFAULT '';

UPDATE sms_templates SET channel = 'sms' WHERE channel IS NULL;

-- Re-seed templates if table is empty
INSERT INTO sms_templates (name, body, variables, channel, msg91_sms_template_id, msg91_whatsapp_template_name, is_active)
SELECT * FROM (VALUES
  ('OTP Verification', 'Your Samikaran Olympiad OTP is {{otp}}. Valid for {{validity_minutes}} min. Do not share with anyone.', 'otp,validity_minutes', 'sms', '', '', true),
  ('Login OTP', 'Your login OTP for Samikaran Olympiad is {{otp}}. Valid for {{validity_minutes}} min. If not requested by you, ignore this message.', 'otp,validity_minutes', 'sms', '', '', true),
  ('Registration Welcome', 'Welcome to Samikaran Olympiad, {{name}}! Your Student ID is {{student_id}}. Login at samikaranolympiad.com to start your journey.', 'name,student_id', 'sms', '', '', true),
  ('Payment Confirmation', 'Payment of Rs.{{amount}} received for {{olympiad_name}}. Txn ID: {{transaction_id}}. Thank you, {{name}}! - Samikaran Olympiad', 'name,amount,olympiad_name,transaction_id', 'sms', '', '', true),
  ('Exam Reminder', 'Reminder: {{olympiad_name}} exam on {{exam_date}} at {{exam_time}}. Duration: {{duration}} min. Ensure stable internet & webcam. - Samikaran Olympiad', 'olympiad_name,exam_date,exam_time,duration', 'sms', '', '', true),
  ('Result Published', 'Results out! {{name}}, you scored {{score}}/{{total_marks}} (Rank #{{rank}}) in {{olympiad_name}}. View details at samikaranolympiad.com - Samikaran Olympiad', 'name,olympiad_name,score,total_marks,rank', 'sms', '', '', true),
  ('Password Reset', 'Your password reset OTP for Samikaran Olympiad is {{otp}}. Valid for {{validity_minutes}} min. If not requested, ignore this.', 'otp,validity_minutes', 'sms', '', '', true),
  ('Forgot Password OTP', 'Hi {{name}}, use OTP {{otp}} to reset your Samikaran Olympiad password. Valid for {{validity_minutes}} min. Do not share.', 'name,otp,validity_minutes', 'sms', '', '', true)
) AS t(name, body, variables, channel, msg91_sms_template_id, msg91_whatsapp_template_name, is_active)
WHERE NOT EXISTS (SELECT 1 FROM sms_templates LIMIT 1);

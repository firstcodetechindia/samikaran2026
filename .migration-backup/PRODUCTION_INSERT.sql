-- =====================================================
-- PRODUCTION INSERT: 5 Test Olympiad Exams + Questions
-- Verified against production schema on 2026-02-01
-- Production max exam ID: 439, so using IDs 440-444
-- =====================================================

-- STEP 1: INSERT 5 EXAMS (IDs 440-444)
INSERT INTO exams (
  id, title, slug, description, subject, category_id, duration_minutes,
  start_time, end_time, registration_open_date, registration_close_date,
  total_marks, max_questions, negative_marking, negative_marking_deduction,
  proctoring, participation_fee, min_class, max_class, is_visible, status,
  difficulty_level, total_questions, mcq_count, true_false_count, image_based_count,
  enable_random_distribution, questions_per_student, shuffle_question_order, shuffle_option_order,
  created_by, created_at
) VALUES 
(440, 'Mathematics Practice Olympiad 2026', 'math-practice-olympiad-2026', 
 'Test olympiad for Mathematics with MCQ, True/False, and Image-based questions.',
 'Mathematics', 1, 60,
 '2026-02-05 10:00:00', '2026-02-05 18:00:00', '2026-02-01 00:00:00', '2026-02-04 23:59:00',
 50, 25, true, 0, true, 0, 1, 12, true, 'scheduled',
 'medium', 25, 15, 5, 5, true, 25, true, true,
 'c6e3a891-e554-4192-a26e-03f6c654c5db', NOW()),

(441, 'Science Practice Olympiad 2026', 'science-practice-olympiad-2026',
 'Test olympiad for Science with MCQ, True/False, and Image-based questions.',
 'Science', 2, 60,
 '2026-02-06 10:00:00', '2026-02-06 18:00:00', '2026-02-01 00:00:00', '2026-02-05 23:59:00',
 50, 25, true, 0, true, 0, 1, 12, true, 'scheduled',
 'medium', 25, 15, 5, 5, true, 25, true, true,
 'c6e3a891-e554-4192-a26e-03f6c654c5db', NOW()),

(442, 'English Practice Olympiad 2026', 'english-practice-olympiad-2026',
 'Test olympiad for English with MCQ, True/False, and Image-based questions.',
 'English', 3, 45,
 '2026-02-07 10:00:00', '2026-02-07 18:00:00', '2026-02-01 00:00:00', '2026-02-06 23:59:00',
 40, 20, true, 0, true, 0, 1, 12, true, 'scheduled',
 'easy', 20, 12, 4, 4, true, 20, true, true,
 'c6e3a891-e554-4192-a26e-03f6c654c5db', NOW()),

(443, 'Reasoning Practice Olympiad 2026', 'reasoning-practice-olympiad-2026',
 'Test olympiad for Reasoning with MCQ, True/False, and Image-based questions.',
 'Reasoning', 5, 45,
 '2026-02-08 10:00:00', '2026-02-08 18:00:00', '2026-02-01 00:00:00', '2026-02-07 23:59:00',
 40, 20, true, 0, true, 0, 1, 12, true, 'scheduled',
 'medium', 20, 12, 4, 4, true, 20, true, true,
 'c6e3a891-e554-4192-a26e-03f6c654c5db', NOW()),

(444, 'GK Practice Olympiad 2026', 'gk-practice-olympiad-2026',
 'Test olympiad for General Knowledge with MCQ, True/False, and Image-based questions.',
 'General Knowledge', 6, 30,
 '2026-02-09 10:00:00', '2026-02-09 18:00:00', '2026-02-01 00:00:00', '2026-02-08 23:59:00',
 30, 15, false, 0, true, 0, 1, 12, true, 'scheduled',
 'easy', 15, 10, 3, 2, true, 15, true, true,
 'c6e3a891-e554-4192-a26e-03f6c654c5db', NOW())
ON CONFLICT (id) DO NOTHING;

-- STEP 2: RESET SEQUENCE (after manual ID insert)
SELECT setval('exams_id_seq', (SELECT MAX(id) FROM exams));

-- STEP 3: INSERT QUESTIONS FOR EXAM 440 (Mathematics - 25 questions)
INSERT INTO questions (exam_id, type, content, marks, difficulty, display_order, is_active, created_at) VALUES
(440, 'mcq', '{"question": "What is the value of 15 × 12?", "options": [{"id": "opt_0", "text": "180"}, {"id": "opt_1", "text": "170"}, {"id": "opt_2", "text": "175"}, {"id": "opt_3", "text": "185"}], "correct": "180"}', 2, 'easy', 1, true, NOW()),
(440, 'mcq', '{"question": "Find the square root of 144.", "options": [{"id": "opt_0", "text": "12"}, {"id": "opt_1", "text": "11"}, {"id": "opt_2", "text": "13"}, {"id": "opt_3", "text": "14"}], "correct": "12"}', 2, 'easy', 2, true, NOW()),
(440, 'mcq', '{"question": "What is 25% of 400?", "options": [{"id": "opt_0", "text": "100"}, {"id": "opt_1", "text": "80"}, {"id": "opt_2", "text": "120"}, {"id": "opt_3", "text": "90"}], "correct": "100"}', 2, 'easy', 3, true, NOW()),
(440, 'mcq', '{"question": "If a = 5 and b = 3, what is a² + b²?", "options": [{"id": "opt_0", "text": "34"}, {"id": "opt_1", "text": "28"}, {"id": "opt_2", "text": "30"}, {"id": "opt_3", "text": "32"}], "correct": "34"}', 2, 'medium', 4, true, NOW()),
(440, 'mcq', '{"question": "What is the perimeter of a rectangle with length 12 cm and width 8 cm?", "options": [{"id": "opt_0", "text": "40 cm"}, {"id": "opt_1", "text": "38 cm"}, {"id": "opt_2", "text": "42 cm"}, {"id": "opt_3", "text": "36 cm"}], "correct": "40 cm"}', 2, 'easy', 5, true, NOW()),
(440, 'mcq', '{"question": "Simplify: 3/4 + 1/2", "options": [{"id": "opt_0", "text": "5/4"}, {"id": "opt_1", "text": "4/6"}, {"id": "opt_2", "text": "1"}, {"id": "opt_3", "text": "3/2"}], "correct": "5/4"}', 2, 'medium', 6, true, NOW()),
(440, 'mcq', '{"question": "What is the LCM of 6 and 8?", "options": [{"id": "opt_0", "text": "24"}, {"id": "opt_1", "text": "48"}, {"id": "opt_2", "text": "12"}, {"id": "opt_3", "text": "16"}], "correct": "24"}', 2, 'medium', 7, true, NOW()),
(440, 'mcq', '{"question": "How many edges does a cube have?", "options": [{"id": "opt_0", "text": "12"}, {"id": "opt_1", "text": "6"}, {"id": "opt_2", "text": "8"}, {"id": "opt_3", "text": "10"}], "correct": "12"}', 2, 'easy', 8, true, NOW()),
(440, 'mcq', '{"question": "What is 7³?", "options": [{"id": "opt_0", "text": "343"}, {"id": "opt_1", "text": "336"}, {"id": "opt_2", "text": "349"}, {"id": "opt_3", "text": "353"}], "correct": "343"}', 2, 'medium', 9, true, NOW()),
(440, 'mcq', '{"question": "If x + 5 = 12, what is x?", "options": [{"id": "opt_0", "text": "7"}, {"id": "opt_1", "text": "8"}, {"id": "opt_2", "text": "6"}, {"id": "opt_3", "text": "5"}], "correct": "7"}', 2, 'easy', 10, true, NOW()),
(440, 'mcq', '{"question": "What is the value of π approximately?", "options": [{"id": "opt_0", "text": "3.14"}, {"id": "opt_1", "text": "3.41"}, {"id": "opt_2", "text": "3.24"}, {"id": "opt_3", "text": "3.04"}], "correct": "3.14"}', 2, 'easy', 11, true, NOW()),
(440, 'mcq', '{"question": "Solve: 2(x + 3) = 14", "options": [{"id": "opt_0", "text": "4"}, {"id": "opt_1", "text": "5"}, {"id": "opt_2", "text": "3"}, {"id": "opt_3", "text": "6"}], "correct": "4"}', 2, 'medium', 12, true, NOW()),
(440, 'mcq', '{"question": "What is 0.5 as a fraction?", "options": [{"id": "opt_0", "text": "1/2"}, {"id": "opt_1", "text": "1/4"}, {"id": "opt_2", "text": "1/3"}, {"id": "opt_3", "text": "2/3"}], "correct": "1/2"}', 2, 'easy', 13, true, NOW()),
(440, 'mcq', '{"question": "Find the mean of 10, 20, 30, 40, 50.", "options": [{"id": "opt_0", "text": "30"}, {"id": "opt_1", "text": "25"}, {"id": "opt_2", "text": "35"}, {"id": "opt_3", "text": "40"}], "correct": "30"}', 2, 'easy', 14, true, NOW()),
(440, 'mcq', '{"question": "What is the volume of a cube with side 5 cm?", "options": [{"id": "opt_0", "text": "125 cm³"}, {"id": "opt_1", "text": "150 cm³"}, {"id": "opt_2", "text": "100 cm³"}, {"id": "opt_3", "text": "75 cm³"}], "correct": "125 cm³"}', 2, 'medium', 15, true, NOW()),
(440, 'true_false', '{"question": "Zero is a natural number.", "options": [{"id": "opt_0", "text": "True"}, {"id": "opt_1", "text": "False"}], "correct": "False"}', 2, 'easy', 16, true, NOW()),
(440, 'true_false', '{"question": "The sum of angles in a triangle is 180°.", "options": [{"id": "opt_0", "text": "True"}, {"id": "opt_1", "text": "False"}], "correct": "True"}', 2, 'easy', 17, true, NOW()),
(440, 'true_false', '{"question": "Every prime number is odd.", "options": [{"id": "opt_0", "text": "True"}, {"id": "opt_1", "text": "False"}], "correct": "False"}', 2, 'medium', 18, true, NOW()),
(440, 'true_false', '{"question": "A square has 4 lines of symmetry.", "options": [{"id": "opt_0", "text": "True"}, {"id": "opt_1", "text": "False"}], "correct": "True"}', 2, 'easy', 19, true, NOW()),
(440, 'true_false', '{"question": "The product of two negative numbers is negative.", "options": [{"id": "opt_0", "text": "True"}, {"id": "opt_1", "text": "False"}], "correct": "False"}', 2, 'medium', 20, true, NOW()),
(440, 'image_based', '{"question": "Looking at the bar graph, which month had the highest sales?", "options": [{"id": "opt_0", "text": "March"}, {"id": "opt_1", "text": "January"}, {"id": "opt_2", "text": "April"}, {"id": "opt_3", "text": "February"}], "correct": "March"}', 2, 'medium', 21, true, NOW()),
(440, 'image_based', '{"question": "What is the name of this geometric shape?", "options": [{"id": "opt_0", "text": "Hexagon"}, {"id": "opt_1", "text": "Pentagon"}, {"id": "opt_2", "text": "Octagon"}, {"id": "opt_3", "text": "Heptagon"}], "correct": "Hexagon"}', 2, 'easy', 22, true, NOW()),
(440, 'image_based', '{"question": "Based on the pie chart, what percentage does Category A represent?", "options": [{"id": "opt_0", "text": "25%"}, {"id": "opt_1", "text": "30%"}, {"id": "opt_2", "text": "20%"}, {"id": "opt_3", "text": "35%"}], "correct": "25%"}', 2, 'medium', 23, true, NOW()),
(440, 'image_based', '{"question": "Count the number of triangles in the figure.", "options": [{"id": "opt_0", "text": "8"}, {"id": "opt_1", "text": "6"}, {"id": "opt_2", "text": "10"}, {"id": "opt_3", "text": "12"}], "correct": "8"}', 2, 'hard', 24, true, NOW()),
(440, 'image_based', '{"question": "What is the area of the shaded region?", "options": [{"id": "opt_0", "text": "24 sq cm"}, {"id": "opt_1", "text": "20 sq cm"}, {"id": "opt_2", "text": "28 sq cm"}, {"id": "opt_3", "text": "32 sq cm"}], "correct": "24 sq cm"}', 2, 'hard', 25, true, NOW());

-- STEP 4: INSERT QUESTIONS FOR EXAM 441 (Science - 25 questions)
INSERT INTO questions (exam_id, type, content, marks, difficulty, display_order, is_active, created_at) VALUES
(441, 'mcq', '{"question": "What is the chemical symbol for water?", "options": [{"id": "opt_0", "text": "H₂O"}, {"id": "opt_1", "text": "CO₂"}, {"id": "opt_2", "text": "O₂"}, {"id": "opt_3", "text": "NaCl"}], "correct": "H₂O"}', 2, 'easy', 1, true, NOW()),
(441, 'mcq', '{"question": "Which planet is known as the Red Planet?", "options": [{"id": "opt_0", "text": "Mars"}, {"id": "opt_1", "text": "Venus"}, {"id": "opt_2", "text": "Jupiter"}, {"id": "opt_3", "text": "Saturn"}], "correct": "Mars"}', 2, 'easy', 2, true, NOW()),
(441, 'mcq', '{"question": "What is the largest organ in the human body?", "options": [{"id": "opt_0", "text": "Skin"}, {"id": "opt_1", "text": "Liver"}, {"id": "opt_2", "text": "Heart"}, {"id": "opt_3", "text": "Brain"}], "correct": "Skin"}', 2, 'easy', 3, true, NOW()),
(441, 'mcq', '{"question": "What is the speed of light?", "options": [{"id": "opt_0", "text": "3×10⁸ m/s"}, {"id": "opt_1", "text": "3×10⁶ m/s"}, {"id": "opt_2", "text": "3×10⁴ m/s"}, {"id": "opt_3", "text": "3×10¹⁰ m/s"}], "correct": "3×10⁸ m/s"}', 2, 'medium', 4, true, NOW()),
(441, 'mcq', '{"question": "Which gas do plants absorb during photosynthesis?", "options": [{"id": "opt_0", "text": "Carbon dioxide"}, {"id": "opt_1", "text": "Oxygen"}, {"id": "opt_2", "text": "Nitrogen"}, {"id": "opt_3", "text": "Hydrogen"}], "correct": "Carbon dioxide"}', 2, 'easy', 5, true, NOW()),
(441, 'mcq', '{"question": "What is the atomic number of Carbon?", "options": [{"id": "opt_0", "text": "6"}, {"id": "opt_1", "text": "8"}, {"id": "opt_2", "text": "12"}, {"id": "opt_3", "text": "4"}], "correct": "6"}', 2, 'medium', 6, true, NOW()),
(441, 'mcq', '{"question": "Which force keeps planets in orbit around the Sun?", "options": [{"id": "opt_0", "text": "Gravity"}, {"id": "opt_1", "text": "Friction"}, {"id": "opt_2", "text": "Magnetism"}, {"id": "opt_3", "text": "Nuclear force"}], "correct": "Gravity"}', 2, 'easy', 7, true, NOW()),
(441, 'mcq', '{"question": "What is the powerhouse of the cell?", "options": [{"id": "opt_0", "text": "Mitochondria"}, {"id": "opt_1", "text": "Nucleus"}, {"id": "opt_2", "text": "Ribosome"}, {"id": "opt_3", "text": "Chloroplast"}], "correct": "Mitochondria"}', 2, 'easy', 8, true, NOW()),
(441, 'mcq', '{"question": "What is the boiling point of water at sea level?", "options": [{"id": "opt_0", "text": "100°C"}, {"id": "opt_1", "text": "90°C"}, {"id": "opt_2", "text": "110°C"}, {"id": "opt_3", "text": "80°C"}], "correct": "100°C"}', 2, 'easy', 9, true, NOW()),
(441, 'mcq', '{"question": "Which vitamin is produced when skin is exposed to sunlight?", "options": [{"id": "opt_0", "text": "Vitamin D"}, {"id": "opt_1", "text": "Vitamin A"}, {"id": "opt_2", "text": "Vitamin C"}, {"id": "opt_3", "text": "Vitamin E"}], "correct": "Vitamin D"}', 2, 'medium', 10, true, NOW()),
(441, 'mcq', '{"question": "What is the pH of a neutral solution?", "options": [{"id": "opt_0", "text": "7"}, {"id": "opt_1", "text": "0"}, {"id": "opt_2", "text": "14"}, {"id": "opt_3", "text": "1"}], "correct": "7"}', 2, 'easy', 11, true, NOW()),
(441, 'mcq', '{"question": "Which metal is liquid at room temperature?", "options": [{"id": "opt_0", "text": "Mercury"}, {"id": "opt_1", "text": "Iron"}, {"id": "opt_2", "text": "Copper"}, {"id": "opt_3", "text": "Aluminum"}], "correct": "Mercury"}', 2, 'medium', 12, true, NOW()),
(441, 'mcq', '{"question": "How many bones are in the adult human body?", "options": [{"id": "opt_0", "text": "206"}, {"id": "opt_1", "text": "186"}, {"id": "opt_2", "text": "226"}, {"id": "opt_3", "text": "256"}], "correct": "206"}', 2, 'medium', 13, true, NOW()),
(441, 'mcq', '{"question": "What is the main component of the Sun?", "options": [{"id": "opt_0", "text": "Hydrogen"}, {"id": "opt_1", "text": "Helium"}, {"id": "opt_2", "text": "Oxygen"}, {"id": "opt_3", "text": "Carbon"}], "correct": "Hydrogen"}', 2, 'medium', 14, true, NOW()),
(441, 'mcq', '{"question": "Which organ purifies blood in the human body?", "options": [{"id": "opt_0", "text": "Kidney"}, {"id": "opt_1", "text": "Heart"}, {"id": "opt_2", "text": "Liver"}, {"id": "opt_3", "text": "Lungs"}], "correct": "Kidney"}', 2, 'easy', 15, true, NOW()),
(441, 'true_false', '{"question": "Sound travels faster in water than in air.", "options": [{"id": "opt_0", "text": "True"}, {"id": "opt_1", "text": "False"}], "correct": "True"}', 2, 'medium', 16, true, NOW()),
(441, 'true_false', '{"question": "The Earth is the only planet with liquid water.", "options": [{"id": "opt_0", "text": "True"}, {"id": "opt_1", "text": "False"}], "correct": "False"}', 2, 'medium', 17, true, NOW()),
(441, 'true_false', '{"question": "Atoms are the smallest particles that exist.", "options": [{"id": "opt_0", "text": "True"}, {"id": "opt_1", "text": "False"}], "correct": "False"}', 2, 'medium', 18, true, NOW()),
(441, 'true_false', '{"question": "All metals are solid at room temperature.", "options": [{"id": "opt_0", "text": "True"}, {"id": "opt_1", "text": "False"}], "correct": "False"}', 2, 'easy', 19, true, NOW()),
(441, 'true_false', '{"question": "Light is an electromagnetic wave.", "options": [{"id": "opt_0", "text": "True"}, {"id": "opt_1", "text": "False"}], "correct": "True"}', 2, 'medium', 20, true, NOW()),
(441, 'image_based', '{"question": "Identify the type of circuit shown.", "options": [{"id": "opt_0", "text": "Series circuit"}, {"id": "opt_1", "text": "Parallel circuit"}, {"id": "opt_2", "text": "Complex circuit"}, {"id": "opt_3", "text": "Short circuit"}], "correct": "Series circuit"}', 2, 'medium', 21, true, NOW()),
(441, 'image_based', '{"question": "Which part of the plant cell is labeled A?", "options": [{"id": "opt_0", "text": "Chloroplast"}, {"id": "opt_1", "text": "Nucleus"}, {"id": "opt_2", "text": "Vacuole"}, {"id": "opt_3", "text": "Cell wall"}], "correct": "Chloroplast"}', 2, 'easy', 22, true, NOW()),
(441, 'image_based', '{"question": "What type of rock is shown in the image?", "options": [{"id": "opt_0", "text": "Igneous"}, {"id": "opt_1", "text": "Sedimentary"}, {"id": "opt_2", "text": "Metamorphic"}, {"id": "opt_3", "text": "Volcanic"}], "correct": "Igneous"}', 2, 'medium', 23, true, NOW()),
(441, 'image_based', '{"question": "Name the constellation shown.", "options": [{"id": "opt_0", "text": "Orion"}, {"id": "opt_1", "text": "Ursa Major"}, {"id": "opt_2", "text": "Scorpius"}, {"id": "opt_3", "text": "Cassiopeia"}], "correct": "Orion"}', 2, 'hard', 24, true, NOW()),
(441, 'image_based', '{"question": "Which layer of the atmosphere is shown?", "options": [{"id": "opt_0", "text": "Troposphere"}, {"id": "opt_1", "text": "Stratosphere"}, {"id": "opt_2", "text": "Mesosphere"}, {"id": "opt_3", "text": "Thermosphere"}], "correct": "Troposphere"}', 2, 'medium', 25, true, NOW());

-- STEP 5: INSERT QUESTIONS FOR EXAM 442 (English - 20 questions)
INSERT INTO questions (exam_id, type, content, marks, difficulty, display_order, is_active, created_at) VALUES
(442, 'mcq', '{"question": "What is the plural of child?", "options": [{"id": "opt_0", "text": "Children"}, {"id": "opt_1", "text": "Childs"}, {"id": "opt_2", "text": "Childrens"}, {"id": "opt_3", "text": "Childes"}], "correct": "Children"}', 2, 'easy', 1, true, NOW()),
(442, 'mcq', '{"question": "Choose the correct spelling:", "options": [{"id": "opt_0", "text": "Necessary"}, {"id": "opt_1", "text": "Neccessary"}, {"id": "opt_2", "text": "Necesary"}, {"id": "opt_3", "text": "Neccesary"}], "correct": "Necessary"}', 2, 'medium', 2, true, NOW()),
(442, 'mcq', '{"question": "What is the antonym of ancient?", "options": [{"id": "opt_0", "text": "Modern"}, {"id": "opt_1", "text": "Old"}, {"id": "opt_2", "text": "Historic"}, {"id": "opt_3", "text": "Classic"}], "correct": "Modern"}', 2, 'easy', 3, true, NOW()),
(442, 'mcq', '{"question": "Identify the noun: The cat sat on the mat.", "options": [{"id": "opt_0", "text": "Cat, mat"}, {"id": "opt_1", "text": "Sat"}, {"id": "opt_2", "text": "On"}, {"id": "opt_3", "text": "The"}], "correct": "Cat, mat"}', 2, 'easy', 4, true, NOW()),
(442, 'mcq', '{"question": "What is a synonym of happy?", "options": [{"id": "opt_0", "text": "Joyful"}, {"id": "opt_1", "text": "Sad"}, {"id": "opt_2", "text": "Angry"}, {"id": "opt_3", "text": "Tired"}], "correct": "Joyful"}', 2, 'easy', 5, true, NOW()),
(442, 'mcq', '{"question": "Which sentence is grammatically correct?", "options": [{"id": "opt_0", "text": "She goes to school."}, {"id": "opt_1", "text": "She go to school."}, {"id": "opt_2", "text": "She going to school."}, {"id": "opt_3", "text": "She gone to school."}], "correct": "She goes to school."}', 2, 'easy', 6, true, NOW()),
(442, 'mcq', '{"question": "What is the past tense of run?", "options": [{"id": "opt_0", "text": "Ran"}, {"id": "opt_1", "text": "Runned"}, {"id": "opt_2", "text": "Running"}, {"id": "opt_3", "text": "Runs"}], "correct": "Ran"}', 2, 'easy', 7, true, NOW()),
(442, 'mcq', '{"question": "Identify the adjective: The beautiful garden bloomed.", "options": [{"id": "opt_0", "text": "Beautiful"}, {"id": "opt_1", "text": "Garden"}, {"id": "opt_2", "text": "Bloomed"}, {"id": "opt_3", "text": "The"}], "correct": "Beautiful"}', 2, 'easy', 8, true, NOW()),
(442, 'mcq', '{"question": "What type of sentence is: Close the door!", "options": [{"id": "opt_0", "text": "Imperative"}, {"id": "opt_1", "text": "Interrogative"}, {"id": "opt_2", "text": "Declarative"}, {"id": "opt_3", "text": "Exclamatory"}], "correct": "Imperative"}', 2, 'medium', 9, true, NOW()),
(442, 'mcq', '{"question": "What is the comparative form of good?", "options": [{"id": "opt_0", "text": "Better"}, {"id": "opt_1", "text": "Gooder"}, {"id": "opt_2", "text": "Best"}, {"id": "opt_3", "text": "More good"}], "correct": "Better"}', 2, 'easy', 10, true, NOW()),
(442, 'mcq', '{"question": "Choose the correct article: ___ apple a day keeps the doctor away.", "options": [{"id": "opt_0", "text": "An"}, {"id": "opt_1", "text": "A"}, {"id": "opt_2", "text": "The"}, {"id": "opt_3", "text": "No article"}], "correct": "An"}', 2, 'easy', 11, true, NOW()),
(442, 'mcq', '{"question": "What is the collective noun for lions?", "options": [{"id": "opt_0", "text": "Pride"}, {"id": "opt_1", "text": "Flock"}, {"id": "opt_2", "text": "Herd"}, {"id": "opt_3", "text": "Pack"}], "correct": "Pride"}', 2, 'medium', 12, true, NOW()),
(442, 'true_false', '{"question": "A verb is an action word.", "options": [{"id": "opt_0", "text": "True"}, {"id": "opt_1", "text": "False"}], "correct": "True"}', 2, 'easy', 13, true, NOW()),
(442, 'true_false', '{"question": "Their and there have the same meaning.", "options": [{"id": "opt_0", "text": "True"}, {"id": "opt_1", "text": "False"}], "correct": "False"}', 2, 'easy', 14, true, NOW()),
(442, 'true_false', '{"question": "An adjective describes a noun.", "options": [{"id": "opt_0", "text": "True"}, {"id": "opt_1", "text": "False"}], "correct": "True"}', 2, 'easy', 15, true, NOW()),
(442, 'true_false', '{"question": "Would of is grammatically correct.", "options": [{"id": "opt_0", "text": "True"}, {"id": "opt_1", "text": "False"}], "correct": "False"}', 2, 'medium', 16, true, NOW()),
(442, 'image_based', '{"question": "What type of punctuation mark is shown?", "options": [{"id": "opt_0", "text": "Semicolon"}, {"id": "opt_1", "text": "Colon"}, {"id": "opt_2", "text": "Comma"}, {"id": "opt_3", "text": "Period"}], "correct": "Semicolon"}', 2, 'easy', 17, true, NOW()),
(442, 'image_based', '{"question": "Which word in the image is spelled incorrectly?", "options": [{"id": "opt_0", "text": "Recieve"}, {"id": "opt_1", "text": "Believe"}, {"id": "opt_2", "text": "Achieve"}, {"id": "opt_3", "text": "Perceive"}], "correct": "Recieve"}', 2, 'medium', 18, true, NOW()),
(442, 'image_based', '{"question": "Read the poem and identify the rhyme scheme.", "options": [{"id": "opt_0", "text": "ABAB"}, {"id": "opt_1", "text": "AABB"}, {"id": "opt_2", "text": "ABBA"}, {"id": "opt_3", "text": "ABCD"}], "correct": "ABAB"}', 2, 'medium', 19, true, NOW()),
(442, 'image_based', '{"question": "Identify the figure of speech in the highlighted text.", "options": [{"id": "opt_0", "text": "Simile"}, {"id": "opt_1", "text": "Metaphor"}, {"id": "opt_2", "text": "Personification"}, {"id": "opt_3", "text": "Hyperbole"}], "correct": "Simile"}', 2, 'medium', 20, true, NOW());

-- STEP 6: INSERT QUESTIONS FOR EXAM 443 (Reasoning - 20 questions)
INSERT INTO questions (exam_id, type, content, marks, difficulty, display_order, is_active, created_at) VALUES
(443, 'mcq', '{"question": "Complete the series: 2, 6, 12, 20, ?", "options": [{"id": "opt_0", "text": "30"}, {"id": "opt_1", "text": "28"}, {"id": "opt_2", "text": "32"}, {"id": "opt_3", "text": "26"}], "correct": "30"}', 2, 'medium', 1, true, NOW()),
(443, 'mcq', '{"question": "If APPLE = 50, then BANANA = ?", "options": [{"id": "opt_0", "text": "42"}, {"id": "opt_1", "text": "38"}, {"id": "opt_2", "text": "45"}, {"id": "opt_3", "text": "40"}], "correct": "42"}', 2, 'medium', 2, true, NOW()),
(443, 'mcq', '{"question": "Find the odd one out: Rose, Lily, Mango, Sunflower", "options": [{"id": "opt_0", "text": "Mango"}, {"id": "opt_1", "text": "Rose"}, {"id": "opt_2", "text": "Lily"}, {"id": "opt_3", "text": "Sunflower"}], "correct": "Mango"}', 2, 'easy', 3, true, NOW()),
(443, 'mcq', '{"question": "If CAT is coded as 24, DOG is coded as ?", "options": [{"id": "opt_0", "text": "26"}, {"id": "opt_1", "text": "24"}, {"id": "opt_2", "text": "28"}, {"id": "opt_3", "text": "22"}], "correct": "26"}', 2, 'medium', 4, true, NOW()),
(443, 'mcq', '{"question": "A is B brother. C is B mother. D is C father. What is D to A?", "options": [{"id": "opt_0", "text": "Grandfather"}, {"id": "opt_1", "text": "Father"}, {"id": "opt_2", "text": "Uncle"}, {"id": "opt_3", "text": "Brother"}], "correct": "Grandfather"}', 2, 'medium', 5, true, NOW()),
(443, 'mcq', '{"question": "Complete: 1, 4, 9, 16, 25, ?", "options": [{"id": "opt_0", "text": "36"}, {"id": "opt_1", "text": "35"}, {"id": "opt_2", "text": "30"}, {"id": "opt_3", "text": "49"}], "correct": "36"}', 2, 'easy', 6, true, NOW()),
(443, 'mcq', '{"question": "If SISTER = RHRSDQ, then BROTHER = ?", "options": [{"id": "opt_0", "text": "AQNSGDQ"}, {"id": "opt_1", "text": "CSOUIFS"}, {"id": "opt_2", "text": "BQPUIFS"}, {"id": "opt_3", "text": "AQNUIFS"}], "correct": "AQNSGDQ"}', 2, 'hard', 7, true, NOW()),
(443, 'mcq', '{"question": "Pointing to a photograph, Ram said He is my mother only son son. Who is in the photograph?", "options": [{"id": "opt_0", "text": "His son"}, {"id": "opt_1", "text": "His nephew"}, {"id": "opt_2", "text": "His father"}, {"id": "opt_3", "text": "Himself"}], "correct": "His son"}', 2, 'medium', 8, true, NOW()),
(443, 'mcq', '{"question": "Which number replaces the question mark? 3, 7, 15, 31, ?", "options": [{"id": "opt_0", "text": "63"}, {"id": "opt_1", "text": "47"}, {"id": "opt_2", "text": "55"}, {"id": "opt_3", "text": "59"}], "correct": "63"}', 2, 'medium', 9, true, NOW()),
(443, 'mcq', '{"question": "Find the missing letter: A, C, F, J, ?", "options": [{"id": "opt_0", "text": "O"}, {"id": "opt_1", "text": "M"}, {"id": "opt_2", "text": "N"}, {"id": "opt_3", "text": "P"}], "correct": "O"}', 2, 'medium', 10, true, NOW()),
(443, 'mcq', '{"question": "Clock shows 3:00. What is the angle between hands?", "options": [{"id": "opt_0", "text": "90°"}, {"id": "opt_1", "text": "60°"}, {"id": "opt_2", "text": "120°"}, {"id": "opt_3", "text": "180°"}], "correct": "90°"}', 2, 'easy', 11, true, NOW()),
(443, 'mcq', '{"question": "If + means ×, × means ÷, ÷ means -, - means +. Then 8 + 6 ÷ 2 - 3 × 6 = ?", "options": [{"id": "opt_0", "text": "46.5"}, {"id": "opt_1", "text": "52"}, {"id": "opt_2", "text": "48"}, {"id": "opt_3", "text": "44"}], "correct": "46.5"}', 2, 'hard', 12, true, NOW()),
(443, 'true_false', '{"question": "All squares are rectangles.", "options": [{"id": "opt_0", "text": "True"}, {"id": "opt_1", "text": "False"}], "correct": "True"}', 2, 'easy', 13, true, NOW()),
(443, 'true_false', '{"question": "If all A are B, and all B are C, then all A are C.", "options": [{"id": "opt_0", "text": "True"}, {"id": "opt_1", "text": "False"}], "correct": "True"}', 2, 'medium', 14, true, NOW()),
(443, 'true_false', '{"question": "In a leap year, February has 28 days.", "options": [{"id": "opt_0", "text": "True"}, {"id": "opt_1", "text": "False"}], "correct": "False"}', 2, 'easy', 15, true, NOW()),
(443, 'true_false', '{"question": "A cube has 8 faces.", "options": [{"id": "opt_0", "text": "True"}, {"id": "opt_1", "text": "False"}], "correct": "False"}', 2, 'easy', 16, true, NOW()),
(443, 'image_based', '{"question": "Which figure completes the pattern?", "options": [{"id": "opt_0", "text": "Option A"}, {"id": "opt_1", "text": "Option B"}, {"id": "opt_2", "text": "Option C"}, {"id": "opt_3", "text": "Option D"}], "correct": "Option A"}', 2, 'medium', 17, true, NOW()),
(443, 'image_based', '{"question": "Count the number of squares in the figure.", "options": [{"id": "opt_0", "text": "14"}, {"id": "opt_1", "text": "12"}, {"id": "opt_2", "text": "16"}, {"id": "opt_3", "text": "10"}], "correct": "14"}', 2, 'hard', 18, true, NOW()),
(443, 'image_based', '{"question": "Which is the mirror image of the given figure?", "options": [{"id": "opt_0", "text": "Option B"}, {"id": "opt_1", "text": "Option A"}, {"id": "opt_2", "text": "Option C"}, {"id": "opt_3", "text": "Option D"}], "correct": "Option B"}', 2, 'medium', 19, true, NOW()),
(443, 'image_based', '{"question": "Find the next figure in the sequence.", "options": [{"id": "opt_0", "text": "Option C"}, {"id": "opt_1", "text": "Option A"}, {"id": "opt_2", "text": "Option B"}, {"id": "opt_3", "text": "Option D"}], "correct": "Option C"}', 2, 'medium', 20, true, NOW());

-- STEP 7: INSERT QUESTIONS FOR EXAM 444 (GK - 15 questions)
INSERT INTO questions (exam_id, type, content, marks, difficulty, display_order, is_active, created_at) VALUES
(444, 'mcq', '{"question": "What is the capital of India?", "options": [{"id": "opt_0", "text": "New Delhi"}, {"id": "opt_1", "text": "Mumbai"}, {"id": "opt_2", "text": "Kolkata"}, {"id": "opt_3", "text": "Chennai"}], "correct": "New Delhi"}', 2, 'easy', 1, true, NOW()),
(444, 'mcq', '{"question": "Who wrote the Indian national anthem?", "options": [{"id": "opt_0", "text": "Rabindranath Tagore"}, {"id": "opt_1", "text": "Bankim Chandra Chatterjee"}, {"id": "opt_2", "text": "Mahatma Gandhi"}, {"id": "opt_3", "text": "Jawaharlal Nehru"}], "correct": "Rabindranath Tagore"}', 2, 'easy', 2, true, NOW()),
(444, 'mcq', '{"question": "Which is the longest river in the world?", "options": [{"id": "opt_0", "text": "Nile"}, {"id": "opt_1", "text": "Amazon"}, {"id": "opt_2", "text": "Ganga"}, {"id": "opt_3", "text": "Yangtze"}], "correct": "Nile"}', 2, 'easy', 3, true, NOW()),
(444, 'mcq', '{"question": "How many states are there in India?", "options": [{"id": "opt_0", "text": "28"}, {"id": "opt_1", "text": "29"}, {"id": "opt_2", "text": "30"}, {"id": "opt_3", "text": "27"}], "correct": "28"}', 2, 'easy', 4, true, NOW()),
(444, 'mcq', '{"question": "Who is known as the Father of the Nation in India?", "options": [{"id": "opt_0", "text": "Mahatma Gandhi"}, {"id": "opt_1", "text": "Jawaharlal Nehru"}, {"id": "opt_2", "text": "Sardar Patel"}, {"id": "opt_3", "text": "B.R. Ambedkar"}], "correct": "Mahatma Gandhi"}', 2, 'easy', 5, true, NOW()),
(444, 'mcq', '{"question": "Which is the smallest continent?", "options": [{"id": "opt_0", "text": "Australia"}, {"id": "opt_1", "text": "Europe"}, {"id": "opt_2", "text": "Antarctica"}, {"id": "opt_3", "text": "Africa"}], "correct": "Australia"}', 2, 'easy', 6, true, NOW()),
(444, 'mcq', '{"question": "What is the currency of Japan?", "options": [{"id": "opt_0", "text": "Yen"}, {"id": "opt_1", "text": "Won"}, {"id": "opt_2", "text": "Yuan"}, {"id": "opt_3", "text": "Dollar"}], "correct": "Yen"}', 2, 'medium', 7, true, NOW()),
(444, 'mcq', '{"question": "Which planet is called the Morning Star?", "options": [{"id": "opt_0", "text": "Venus"}, {"id": "opt_1", "text": "Mercury"}, {"id": "opt_2", "text": "Mars"}, {"id": "opt_3", "text": "Jupiter"}], "correct": "Venus"}', 2, 'easy', 8, true, NOW()),
(444, 'mcq', '{"question": "In which year did India gain independence?", "options": [{"id": "opt_0", "text": "1947"}, {"id": "opt_1", "text": "1950"}, {"id": "opt_2", "text": "1942"}, {"id": "opt_3", "text": "1945"}], "correct": "1947"}', 2, 'easy', 9, true, NOW()),
(444, 'mcq', '{"question": "Which is the national bird of India?", "options": [{"id": "opt_0", "text": "Peacock"}, {"id": "opt_1", "text": "Sparrow"}, {"id": "opt_2", "text": "Parrot"}, {"id": "opt_3", "text": "Eagle"}], "correct": "Peacock"}', 2, 'easy', 10, true, NOW()),
(444, 'true_false', '{"question": "Mount Everest is in India.", "options": [{"id": "opt_0", "text": "True"}, {"id": "opt_1", "text": "False"}], "correct": "False"}', 2, 'easy', 11, true, NOW()),
(444, 'true_false', '{"question": "The Great Wall of China is visible from space.", "options": [{"id": "opt_0", "text": "True"}, {"id": "opt_1", "text": "False"}], "correct": "False"}', 2, 'medium', 12, true, NOW()),
(444, 'true_false', '{"question": "The Sahara is the largest desert in the world.", "options": [{"id": "opt_0", "text": "True"}, {"id": "opt_1", "text": "False"}], "correct": "True"}', 2, 'easy', 13, true, NOW()),
(444, 'image_based', '{"question": "Identify the national flag shown.", "options": [{"id": "opt_0", "text": "India"}, {"id": "opt_1", "text": "Bangladesh"}, {"id": "opt_2", "text": "Sri Lanka"}, {"id": "opt_3", "text": "Nepal"}], "correct": "India"}', 2, 'easy', 14, true, NOW()),
(444, 'image_based', '{"question": "Name the monument shown in the picture.", "options": [{"id": "opt_0", "text": "Taj Mahal"}, {"id": "opt_1", "text": "Qutub Minar"}, {"id": "opt_2", "text": "India Gate"}, {"id": "opt_3", "text": "Gateway of India"}], "correct": "Taj Mahal"}', 2, 'easy', 15, true, NOW());

-- DONE: 5 Exams (IDs 440-444) + 105 Questions
-- Summary: Math(25) + Science(25) + English(20) + Reasoning(20) + GK(15) = 105 questions

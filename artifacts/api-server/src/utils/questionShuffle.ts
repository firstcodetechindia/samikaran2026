/**
 * Random Question Distribution System
 * 
 * Implements Fisher-Yates shuffle algorithm for fair, unbiased random question selection.
 * Server-side only - no client manipulation possible.
 */

import crypto from 'crypto';

/**
 * Fisher-Yates (Knuth) shuffle algorithm
 * Time complexity: O(n)
 * Space complexity: O(1) - in-place shuffle
 * 
 * This is a cryptographically secure implementation using crypto.randomInt
 */
export function fisherYatesShuffle<T>(array: T[]): T[] {
  const result = [...array]; // Create copy to avoid mutating original
  
  for (let i = result.length - 1; i > 0; i--) {
    // Use cryptographically secure random number
    const j = crypto.randomInt(0, i + 1);
    // Swap elements
    [result[i], result[j]] = [result[j], result[i]];
  }
  
  return result;
}

/**
 * Select N random items from an array using Fisher-Yates shuffle
 * 
 * @param pool - The full pool of items
 * @param count - Number of items to select
 * @returns Array of selected items in random order
 */
export function selectRandomItems<T>(pool: T[], count: number): T[] {
  if (count >= pool.length) {
    // If requesting more than or equal to pool size, shuffle and return all
    return fisherYatesShuffle(pool);
  }
  
  // Shuffle the pool and take first N items
  const shuffled = fisherYatesShuffle(pool);
  return shuffled.slice(0, count);
}

/**
 * Generate a unique shuffle seed for audit purposes
 * Contains timestamp and random component
 */
export function generateShuffleSeed(): string {
  const timestamp = Date.now();
  const random = crypto.randomBytes(8).toString('hex');
  return `${timestamp}-${random}`;
}

/**
 * Shuffle MCQ options for a question
 * Returns array of option IDs in shuffled order
 */
export function shuffleOptions(optionIds: string[]): string[] {
  return fisherYatesShuffle(optionIds);
}

/**
 * Assigns random questions to a student for an exam attempt
 * 
 * @param allQuestionIds - All available question IDs in the exam pool
 * @param questionsPerStudent - Number of questions to assign (null = all)
 * @param shuffleOrder - Whether to shuffle the question order
 * @returns Object with assigned question IDs and shuffle metadata
 */
export function assignQuestionsToStudent(
  allQuestionIds: number[],
  questionsPerStudent: number | null,
  shuffleOrder: boolean = true
): {
  assignedQuestionIds: number[];
  shuffleSeed: string;
  timestamp: Date;
} {
  const shuffleSeed = generateShuffleSeed();
  const timestamp = new Date();
  
  let assignedQuestionIds: number[];
  
  if (questionsPerStudent && questionsPerStudent < allQuestionIds.length) {
    // Select N random questions from pool
    assignedQuestionIds = selectRandomItems(allQuestionIds, questionsPerStudent);
  } else if (shuffleOrder) {
    // Use all questions but shuffle order
    assignedQuestionIds = fisherYatesShuffle(allQuestionIds);
  } else {
    // Use all questions in original order
    assignedQuestionIds = [...allQuestionIds];
  }
  
  return {
    assignedQuestionIds,
    shuffleSeed,
    timestamp,
  };
}

/**
 * Prepare questions for exam delivery with shuffled options
 * 
 * @param questions - Array of question objects
 * @param shuffleOptions - Whether to shuffle MCQ options
 * @returns Array of questions with option order shuffled
 */
export function prepareQuestionsForDelivery(
  questions: Array<{
    id: number;
    type: string;
    content: any;
    [key: string]: any;
  }>,
  shuffleOptionsEnabled: boolean = true
): Array<{
  question: typeof questions[0];
  optionOrder: string[] | null;
}> {
  return questions.map(question => {
    let optionOrder: string[] | null = null;
    
    // Only shuffle options for MCQ type questions
    if (shuffleOptionsEnabled && 
        (question.type === 'mcq' || question.type === 'mcq_single' || question.type === 'mcq_multiple')) {
      const content = question.content as { options?: Array<{ id: string }> };
      if (content?.options && Array.isArray(content.options)) {
        const optionIds = content.options.map(opt => opt.id);
        optionOrder = shuffleOptions(optionIds);
      }
    }
    
    return {
      question,
      optionOrder,
    };
  });
}

/**
 * Validate that a student's answer corresponds to their assigned questions
 * 
 * @param attemptQuestionIds - Question IDs assigned to this attempt
 * @param questionId - The question ID being answered
 * @returns boolean indicating if the question is valid for this attempt
 */
export function isValidQuestionForAttempt(
  attemptQuestionIds: number[],
  questionId: number
): boolean {
  return attemptQuestionIds.includes(questionId);
}

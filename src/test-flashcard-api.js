// Simple test script to verify flashcard API integration
import { flashcardService } from './services/flashcardService.js';

const testUserId = 'b846c59e-7422-4be3-a4f6-dd20145e8400';

async function testFlashcardAPI() {
  try {
    console.log('🧪 Testing Flashcard API...\n');

    // Test 1: Get existing flashcard sets
    console.log('1. Getting existing flashcard sets...');
    const existingSets = await flashcardService.getUserFlashcardSets(testUserId);
    console.log(`   Found ${existingSets.length} existing sets`);
    
    // Test 2: Create a new flashcard set
    console.log('\n2. Creating a new flashcard set...');
    const newSet = await flashcardService.createFlashcardSet(
      testUserId,
      'Frontend Test Set',
      'Created from frontend test script',
      'manual',
      undefined,
      [
        {
          question: 'What is JavaScript?',
          answer: 'A high-level, interpreted programming language',
          mastered: false
        },
        {
          question: 'What is Node.js?',
          answer: 'A JavaScript runtime built on Chrome\'s V8 JavaScript engine',
          mastered: false
        }
      ]
    );
    console.log(`   Created set: ${newSet.name} with ${newSet.flashcards.length} cards`);

    // Test 3: Add a flashcard to the set
    console.log('\n3. Adding a flashcard to the set...');
    const newCard = await flashcardService.addFlashcard(
      testUserId,
      newSet.id,
      'What is API?',
      'Application Programming Interface - a set of protocols and tools for building software applications',
      false
    );
    console.log(`   Added card: ${newCard.question}`);

    // Test 4: Update the flashcard to mark as mastered
    console.log('\n4. Marking flashcard as mastered...');
    const updatedCard = await flashcardService.updateFlashcard(
      testUserId,
      newCard.id,
      undefined,
      undefined,
      true
    );
    console.log(`   Card mastered status: ${updatedCard.mastered}`);

    // Test 5: Get the updated set
    console.log('\n5. Getting updated flashcard set...');
    const updatedSet = await flashcardService.getFlashcardSetById(testUserId, newSet.id);
    console.log(`   Set now has ${updatedSet.flashcards.length} cards`);

    console.log('\n✅ All tests passed! Frontend API integration is working correctly.');

  } catch (error) {
    console.error('❌ Test failed:', error.message);
  }
}

// Run the test
testFlashcardAPI(); 
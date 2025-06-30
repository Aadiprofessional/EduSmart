// Test script for flashcard delete functionality
import { flashcardService } from './services/flashcardService.js';

const userId = 'b846c59e-7422-4be3-a4f6-dd20145e8400';

async function testDeleteFlashcard() {
  try {
    console.log('🧪 Testing Flashcard Delete Functionality');
    console.log('==========================================');

    // 1. Get current flashcard sets
    console.log('\n1️⃣ Fetching current flashcard sets...');
    const sets = await flashcardService.getUserFlashcardSets(userId);
    console.log(`Found ${sets.length} flashcard sets`);

    if (sets.length === 0) {
      console.log('❌ No flashcard sets found. Please create some sets first.');
      return;
    }

    // 2. Find a set with flashcards to test deletion
    const setWithCards = sets.find(set => set.flashcards.length > 0);
    if (!setWithCards) {
      console.log('❌ No sets with flashcards found. Please add some flashcards first.');
      return;
    }

    console.log(`\n2️⃣ Testing deletion on set: "${setWithCards.name}"`);
    console.log(`Set has ${setWithCards.flashcards.length} flashcards`);

    // 3. Get the first flashcard to delete
    const cardToDelete = setWithCards.flashcards[0];
    console.log(`\n3️⃣ Attempting to delete flashcard:`);
    console.log(`Question: "${cardToDelete.question}"`);
    console.log(`Answer: "${cardToDelete.answer}"`);

    // 4. Delete the flashcard
    console.log('\n4️⃣ Deleting flashcard...');
    await flashcardService.deleteFlashcard(userId, cardToDelete.id);
    console.log('✅ Flashcard deleted successfully!');

    // 5. Verify deletion
    console.log('\n5️⃣ Verifying deletion...');
    const updatedSet = await flashcardService.getFlashcardSetById(userId, setWithCards.id);
    const remainingCards = updatedSet.flashcards.length;
    const expectedCards = setWithCards.flashcards.length - 1;

    if (remainingCards === expectedCards) {
      console.log(`✅ Verification successful! Set now has ${remainingCards} flashcards (was ${setWithCards.flashcards.length})`);
    } else {
      console.log(`❌ Verification failed! Expected ${expectedCards} cards, but found ${remainingCards}`);
    }

    console.log('\n🎉 Delete functionality test completed!');

  } catch (error) {
    console.error('❌ Test failed:', error.message);
  }
}

// Run the test
testDeleteFlashcard(); 
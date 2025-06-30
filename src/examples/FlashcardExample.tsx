import React from 'react';
import FlashcardComponent from '../components/ui/FlashcardComponent';

const FlashcardExample: React.FC = () => {
  // Example user ID - in a real app, this would come from authentication
  const userId = 'b846c59e-7422-4be3-a4f6-dd20145e8400';

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-900 via-slate-800 to-slate-900 p-4">
      <div className="max-w-7xl mx-auto">
        <h1 className="text-3xl font-bold text-white mb-8 text-center">
          EduSmart Flashcards
        </h1>
        
        <FlashcardComponent 
          userId={userId}
          className="w-full"
        />
      </div>
    </div>
  );
};

export default FlashcardExample; 
import { Flashcard, FlashcardSet } from '../components/ui/FlashcardComponent';

const API_BASE_URL = process.env.NODE_ENV === 'production' 
  ? 'https://edusmart-server.pages.dev' 
  : 'http://localhost:8000';

export interface APIFlashcardSet {
  id: string;
  name: string;
  description: string;
  createdAt: Date;
  source: 'manual' | 'ai-generated' | 'file-upload';
  sourceFile?: string;
  flashcards: Flashcard[];
}

export interface APIResponse<T> {
  success: boolean;
  message?: string;
  flashcardSets?: T[];
  flashcardSet?: T;
  flashcard?: Flashcard;
  pagination?: {
    page: number;
    limit: number;
    total: number;
  };
}

class FlashcardService {
  private baseUrl = `${API_BASE_URL}/api/flashcards`;

  async getUserFlashcardSets(userId: string, page = 1, limit = 10, search = ''): Promise<APIFlashcardSet[]> {
    const params = new URLSearchParams({
      user_id: userId,
      page: page.toString(),
      limit: limit.toString(),
      search
    });

    const response = await fetch(`${this.baseUrl}/sets?${params}`);
    if (!response.ok) {
      throw new Error(`Failed to fetch flashcard sets: ${response.statusText}`);
    }

    const data: APIResponse<APIFlashcardSet> = await response.json();
    return data.flashcardSets || [];
  }

  async getFlashcardSetById(userId: string, setId: string): Promise<APIFlashcardSet> {
    const params = new URLSearchParams({ user_id: userId });
    const response = await fetch(`${this.baseUrl}/sets/${setId}?${params}`);
    
    if (!response.ok) {
      throw new Error(`Failed to fetch flashcard set: ${response.statusText}`);
    }

    const data: APIResponse<APIFlashcardSet> = await response.json();
    if (!data.flashcardSet) {
      throw new Error('Flashcard set not found');
    }
    
    return data.flashcardSet;
  }

  async createFlashcardSet(
    userId: string, 
    name: string, 
    description: string, 
    source: 'manual' | 'ai-generated' | 'file-upload' = 'manual',
    sourceFile?: string,
    flashcards: Omit<Flashcard, 'id'>[] = []
  ): Promise<APIFlashcardSet> {
    const response = await fetch(`${this.baseUrl}/sets`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        user_id: userId,
        name,
        description,
        source,
        sourceFile,
        flashcards
      })
    });

    if (!response.ok) {
      throw new Error(`Failed to create flashcard set: ${response.statusText}`);
    }

    const data: APIResponse<APIFlashcardSet> = await response.json();
    if (!data.flashcardSet) {
      throw new Error('Failed to create flashcard set');
    }

    return data.flashcardSet;
  }

  async updateFlashcardSet(
    userId: string, 
    setId: string, 
    name?: string, 
    description?: string
  ): Promise<APIFlashcardSet> {
    const response = await fetch(`${this.baseUrl}/sets/${setId}`, {
      method: 'PUT',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        user_id: userId,
        name,
        description
      })
    });

    if (!response.ok) {
      throw new Error(`Failed to update flashcard set: ${response.statusText}`);
    }

    const data: APIResponse<APIFlashcardSet> = await response.json();
    if (!data.flashcardSet) {
      throw new Error('Failed to update flashcard set');
    }

    return data.flashcardSet;
  }

  async deleteFlashcardSet(userId: string, setId: string): Promise<void> {
    const response = await fetch(`${this.baseUrl}/sets/${setId}`, {
      method: 'DELETE',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        user_id: userId
      })
    });

    if (!response.ok) {
      throw new Error(`Failed to delete flashcard set: ${response.statusText}`);
    }
  }

  async addFlashcard(
    userId: string, 
    setId: string, 
    question: string, 
    answer: string, 
    mastered = false
  ): Promise<Flashcard> {
    const response = await fetch(`${this.baseUrl}/sets/${setId}/cards`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        user_id: userId,
        question,
        answer,
        mastered
      })
    });

    if (!response.ok) {
      throw new Error(`Failed to add flashcard: ${response.statusText}`);
    }

    const data: APIResponse<Flashcard> = await response.json();
    if (!data.flashcard) {
      throw new Error('Failed to add flashcard');
    }

    return data.flashcard;
  }

  async updateFlashcard(
    userId: string, 
    flashcardId: string, 
    question?: string, 
    answer?: string, 
    mastered?: boolean
  ): Promise<Flashcard> {
    const response = await fetch(`${this.baseUrl}/cards/${flashcardId}`, {
      method: 'PUT',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        user_id: userId,
        question,
        answer,
        mastered
      })
    });

    if (!response.ok) {
      throw new Error(`Failed to update flashcard: ${response.statusText}`);
    }

    const data: APIResponse<Flashcard> = await response.json();
    if (!data.flashcard) {
      throw new Error('Failed to update flashcard');
    }

    return data.flashcard;
  }

  async deleteFlashcard(userId: string, flashcardId: string): Promise<void> {
    const params = new URLSearchParams({ user_id: userId });
    const response = await fetch(`${this.baseUrl}/cards/${flashcardId}?${params}`, {
      method: 'DELETE',
      headers: {
        'Content-Type': 'application/json',
      }
    });

    if (!response.ok) {
      throw new Error(`Failed to delete flashcard: ${response.statusText}`);
    }
  }
}

export const flashcardService = new FlashcardService(); 
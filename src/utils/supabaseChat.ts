
import { supabase } from './supabase';

export interface ChatFile {
  id: string;
  fileName: string;
  fileType: string;
  fileSize: number;
  storagePath: string;
  url?: string;
  base64?: string;
  extractedText?: string;
  pdfPages?: string[];
  fileContent?: string;
  mimeType?: string;
}

export interface ChatMessage {
  id: string;
  role: 'user' | 'assistant' | 'system';
  content: string;
  timestamp: string;
  files?: ChatFile[];
}

export interface ChatSession {
  id: string;
  title: string;
  updated_at: string;
  created_at: string;
  chat_data: ChatMessage[];
  user_id: string;
}

export const chatService = {
  // Get all chat sessions for the current user
  async getChatSessions(): Promise<ChatSession[]> {
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) throw new Error('User not authenticated');

    const { data, error } = await supabase
      .from('chat_sessions')
      .select('*')
      .eq('user_id', user.id)
      .eq('is_deleted', false) // Assuming soft delete, or just ignore if physical delete is used
      .order('updated_at', { ascending: false });

    if (error) throw error;
    return data || [];
  },

  // Get a specific chat session
  async getChatSession(sessionId: string): Promise<ChatSession | null> {
    const { data, error } = await supabase
      .from('chat_sessions')
      .select('*')
      .eq('id', sessionId)
      .single();

    if (error) {
      console.error('Error fetching chat session:', error);
      return null;
    }
    return data;
  },

  // Create a new chat session
  async createChatSession(title: string): Promise<ChatSession> {
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) throw new Error('User not authenticated');

    const { data, error } = await supabase
      .from('chat_sessions')
      .insert({
        user_id: user.id,
        title,
        chat_data: [],
        updated_at: new Date().toISOString()
      })
      .select()
      .single();

    if (error) throw error;
    return data;
  },

  // Update a chat session's metadata (e.g., title)
  async updateChatSession(sessionId: string, updates: Partial<ChatSession>): Promise<void> {
    const { error } = await supabase
      .from('chat_sessions')
      .update(updates)
      .eq('id', sessionId);

    if (error) throw error;
  },

  // Delete a chat session
  async deleteChatSession(sessionId: string): Promise<void> {
    const { error } = await supabase
      .from('chat_sessions')
      .delete()
      .eq('id', sessionId);

    if (error) throw error;
  },

  // Update the chat data (messages) for a session
  async updateChatData(sessionId: string, chatData: ChatMessage[]): Promise<void> {
    const { error } = await supabase
      .from('chat_sessions')
      .update({
        chat_data: chatData,
        updated_at: new Date().toISOString()
      })
      .eq('id', sessionId);

    if (error) throw error;
  },

  // Add a message to a session
  async addMessage(sessionId: string, message: ChatMessage): Promise<void> {
    const session = await this.getChatSession(sessionId);
    if (!session) throw new Error('Session not found');

    const updatedChatData = [...session.chat_data, message];
    await this.updateChatData(sessionId, updatedChatData);
  },

  // Generate a unique ID for messages
  generateMessageId(): string {
    return Date.now().toString(36) + Math.random().toString(36).substr(2);
  },

  // Upload a file and link it to a chat message
  async uploadFile(
    file: File, 
    sessionId: string, 
    messageIndex: number, 
    base64?: string, 
    extractedText?: string, 
    pages?: string[]
  ): Promise<ChatFile> {
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) throw new Error('User not authenticated');

    // Upload to Storage
    const fileExt = file.name.split('.').pop();
    const fileName = `${Math.random().toString(36).substring(2)}.${fileExt}`;
    const filePath = `${user.id}/${sessionId}/${fileName}`;

    const { error: uploadError } = await supabase.storage
      .from('chat-files')
      .upload(filePath, file);

    if (uploadError) throw uploadError;

    // Save metadata to Database
    const fileData = {
      session_id: sessionId,
      file_name: file.name,
      file_type: file.type,
      file_size: file.size,
      storage_path: filePath,
      mime_type: file.type,
      message_index: messageIndex
    };

    const { data, error: dbError } = await supabase
      .from('chat_files')
      .insert(fileData)
      .select()
      .single();

    if (dbError) throw dbError;

    // Return the ChatFile object
    return {
      id: data.id,
      fileName: data.file_name,
      fileType: data.file_type,
      fileSize: data.file_size,
      storagePath: data.storage_path,
      mimeType: data.mime_type,
      // Add extra fields needed by the UI but not stored directly in this table structure (or stored differently)
      // Note: The UI seems to expect these to be returned or available
      base64: base64, 
      extractedText: extractedText,
      pdfPages: pages
    };
  },

  // Get files associated with a specific message in a session
  async getMessageFiles(sessionId: string, messageIndex: number): Promise<ChatFile[]> {
    const { data, error } = await supabase
      .from('chat_files')
      .select('*')
      .eq('session_id', sessionId)
      .eq('message_index', messageIndex);

    if (error) throw error;

    return data.map(file => ({
      id: file.id,
      fileName: file.file_name,
      fileType: file.file_type,
      fileSize: file.file_size,
      storagePath: file.storage_path,
      mimeType: file.mime_type
      // Note: base64, extractedText, pdfPages are not stored in chat_files table in the provided schema
      // They might be needed to be fetched from storage or stored in a separate column/table if persistence is required
      // For now, we return what we have. The UI handles missing extracted text by showing a placeholder.
    }));
  }
};

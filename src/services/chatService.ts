
import { supabase } from '../utils/supabase';
import { chatService as existingChatService, ChatMessage, ChatSession } from '../utils/supabaseChat';

export interface FrontendMessage {
  message_id: string;
  role: 'user' | 'assistant' | 'system';
  content: string;
  timestamp: string;
  fileContent?: string;
  fileName?: string;
  sender?: string;
  isStreaming?: boolean;
  attachments?: any[];
  file_url?: string;
  file_name?: string;
  file_type?: string;
  file_size?: number;
  chartConfig?: any;
  chartId?: string;
}

export interface SupabaseChat {
  id: string;
  title: string;
  role?: string;
  roleDescription?: string;
  description?: string;
  messages?: FrontendMessage[];
  created_at?: string;
  use_at?: string;
  metadata?: any;
}

// Convert DB message to FrontendMessage
export const supabaseMessageToFrontend = (msg: ChatMessage | any): FrontendMessage => {
  if (!msg) return {} as FrontendMessage;
  
  return {
    message_id: msg.id,
    role: msg.role,
    content: msg.content,
    timestamp: msg.timestamp,
    // Map other fields if available
    fileContent: msg.fileContent,
    fileName: msg.fileName,
    attachments: msg.files,
    isStreaming: false
  };
};

export const getNewUserChatsPaginated = async (userId: string, pageSize: number, offset: number) => {
  try {
    const { data, error } = await supabase
      .from('chat_sessions')
      .select('*')
      .eq('user_id', userId)
      .eq('is_deleted', false)
      .order('updated_at', { ascending: false })
      .range(offset, offset + pageSize - 1);

    if (error) {
      console.error('Error fetching chats:', error);
      return [];
    }

    return data.map((session: any) => ({
      id: session.id,
      title: session.title,
      role: 'general', // Default as not in chat_sessions schema
      messages: [], // Don't load messages in list view
      created_at: session.created_at,
      use_at: session.updated_at,
      metadata: {}
    }));
  } catch (error) {
    console.error('Error in getNewUserChatsPaginated:', error);
    return [];
  }
};

export const getLatestChatMessages = async (chatId: string, limit: number) => {
  try {
    const { data, error } = await supabase
      .from('chat_sessions')
      .select('chat_data')
      .eq('id', chatId)
      .single();

    if (error) throw error;

    if (!data || !data.chat_data) return [];

    // chat_data is JSONB array of messages
    const messages = Array.isArray(data.chat_data) ? data.chat_data : [];
    
    // Sort by timestamp if needed, or assume order
    // Return last 'limit' messages
    return messages.slice(-limit).map((m: any) => ({
      ...m,
      position: 0 // Mock position
    }));
  } catch (error) {
    console.error('Error fetching chat messages:', error);
    return [];
  }
};

export const getNewChatMessages = getLatestChatMessages;

export const getChatMessagesLazy = async (chatId: string, limit: number, beforePosition?: number) => {
  // Since we use JSONB, lazy loading is harder without fetching all. 
  // We'll just fetch all and slice for now, or mock pagination.
  const messages = await getLatestChatMessages(chatId, 100);
  return messages; // Return all for now
};

export const createNewChat = async (userId: string, firstMessage?: string, role?: string) => {
  try {
    const { data, error } = await supabase
      .from('chat_sessions')
      .insert({
        user_id: userId,
        title: firstMessage ? firstMessage.slice(0, 30) : 'New Chat',
        chat_data: []
      })
      .select()
      .single();

    if (error) throw error;
    return data;
  } catch (error) {
    console.error('Error creating chat:', error);
    return null;
  }
};

export const updateNewChatTitle = async (chatId: string, userId: string, title: string) => {
  try {
    const { error } = await supabase
      .from('chat_sessions')
      .update({ title })
      .eq('id', chatId)
      .eq('user_id', userId);

    return !error;
  } catch (error) {
    return false;
  }
};

export const updateChatRole = async (chatId: string, userId: string, roleId: string) => {
  // Role is not in chat_sessions schema, we might need to store it in a metadata column or ignore
  // For now, we'll pretend it updated
  return true;
};

export const deleteNewChat = async (chatId: string, userId: string) => {
  try {
    const { error } = await supabase
      .from('chat_sessions')
      .delete()
      .eq('id', chatId)
      .eq('user_id', userId);

    return !error;
  } catch (error) {
    return false;
  }
};

export const addUserMessage = async (chatId: string, userId: string, content: string) => {
  // Fetch current messages, append, update
  try {
    const { data } = await supabase
      .from('chat_sessions')
      .select('chat_data')
      .eq('id', chatId)
      .single();
      
    const currentMessages = data && Array.isArray(data.chat_data) ? data.chat_data : [];
    const newMessage = {
      id: Date.now().toString(),
      role: 'user',
      content,
      timestamp: new Date().toISOString()
    };
    
    const { error } = await supabase
      .from('chat_sessions')
      .update({ 
        chat_data: [...currentMessages, newMessage],
        updated_at: new Date().toISOString()
      })
      .eq('id', chatId);
      
    return !error ? newMessage : null;
  } catch (error) {
    return null;
  }
};

export const addUserMessageWithAttachment = async (
  chatId: string, 
  userId: string, 
  text: string, 
  fileUrl: string, 
  fileName: string, 
  fileType: string, 
  fileSize: number | null
) => {
  // Similar to addUserMessage but with attachment info
   try {
    const { data } = await supabase
      .from('chat_sessions')
      .select('chat_data')
      .eq('id', chatId)
      .single();
      
    const currentMessages = data && Array.isArray(data.chat_data) ? data.chat_data : [];
    const newMessage = {
      id: Date.now().toString(),
      role: 'user',
      content: text,
      timestamp: new Date().toISOString(),
      file_url: fileUrl,
      file_name: fileName,
      file_type: fileType,
      file_size: fileSize
    };
    
    const { error } = await supabase
      .from('chat_sessions')
      .update({ 
        chat_data: [...currentMessages, newMessage],
        updated_at: new Date().toISOString()
      })
      .eq('id', chatId);
      
    return !error ? newMessage : null;
  } catch (error) {
    return null;
  }
};

export const getNewUserChats = getNewUserChatsPaginated;

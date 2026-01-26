# AI Tutor Chat with Image Upload - Setup Instructions

## Database Setup

1. **Go to your Supabase Dashboard**
   - Navigate to the SQL Editor
   - Copy and paste the contents of `database/setup-new-chat-structure.sql`
   - Run the script to create the new database structure

2. **Verify Tables Created**
   - Check that `chat_sessions` and `chat_files` tables exist
   - Verify the `chat-files` storage bucket is created

## Features Implemented

### ✅ **Image Upload & Display**
- Users can upload images that appear in their chat messages
- Images are displayed as thumbnails in the chat
- Files are properly saved to Supabase Storage
- Each file is associated with a specific message via `message_index`

### ✅ **Chat Memory & Context**
- AI now receives last 10 messages as context
- Responses are more coherent and contextual
- Chat history is maintained across sessions

### ✅ **File Management**
- Files are uploaded to `chat-files` storage bucket
- Organized by user ID and session ID
- Signed URLs generated for secure access
- Support for images, PDFs, and documents

### ✅ **Real-time Streaming**
- AI responses stream in real-time
- Both user and AI messages saved to database
- Local state updates during streaming

## How to Test

1. **Start the Development Server**
   ```bash
   npm start
   ```

2. **Test Image Upload**
   - Click the image upload button (📷 icon)
   - Select an image file
   - Type a message like "What's in this image?"
   - Send the message
   - Verify the image appears in your message bubble
   - Check that the AI can see and analyze the image

3. **Test Chat Persistence**
   - Upload an image and send a message
   - Refresh the page
   - Verify the image still appears in the chat history
   - Check that chat context is maintained

## Database Structure

### `chat_sessions` Table
```sql
- id: UUID (Primary Key)
- user_id: UUID (Foreign Key to auth.users)
- title: TEXT
- chat_data: JSONB (stores entire chat as JSON array)
- created_at: TIMESTAMP
- updated_at: TIMESTAMP
```

### `chat_files` Table
```sql
- id: UUID (Primary Key)
- session_id: UUID (Foreign Key to chat_sessions)
- file_name: TEXT
- file_type: TEXT
- file_size: BIGINT
- storage_path: TEXT
- mime_type: TEXT
- message_index: INTEGER (which message this file belongs to)
- created_at: TIMESTAMP
```

## Key Changes Made

1. **Simplified Database Structure**
   - Removed individual message tables
   - Store entire chats as JSONB for better performance
   - Files stored separately with message index reference

2. **Enhanced File Handling**
   - Direct image upload without text extraction
   - Proper file association with messages
   - Secure signed URL generation

3. **Improved AI Integration**
   - Images sent directly to AI vision model
   - Better context management
   - Streaming responses with proper state updates

4. **Better User Experience**
   - Real-time image previews
   - Persistent chat history
   - Smooth file upload flow

## Troubleshooting

- **Images not showing**: Check Supabase storage bucket permissions
- **Database errors**: Ensure all tables are created properly
- **File upload fails**: Verify RLS policies are applied correctly
- **Chat not loading**: Check user authentication status

## Next Steps

The image upload functionality is now fully implemented and ready for testing. Users can:
- Upload images and see them in their messages
- Have contextual conversations about uploaded images
- Access chat history with persistent image display
- Enjoy a seamless AI tutoring experience with visual content 
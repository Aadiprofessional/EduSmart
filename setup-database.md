# Database Setup Instructions

## 1. Run the SQL Script in Supabase

1. Go to your Supabase dashboard
2. Navigate to SQL Editor
3. Copy and paste the contents of `database/chat_tables.sql`
4. Execute the script

## 2. Verify Tables Created

Check that these tables were created:
- `chat_sessions`
- `chat_messages` 
- `chat_attachments`
- `message_reactions`

## 3. Verify Storage Bucket

Check that the `chat-attachments` storage bucket was created in Storage > Buckets.

## 4. Test the Component

The AI Tutor Chat component now:
- ✅ Saves all chat sessions to database
- ✅ Saves all messages with timestamps
- ✅ Supports image upload with text extraction
- ✅ Supports PDF and document upload
- ✅ Saves file attachments to Supabase Storage
- ✅ Maintains chat history across sessions
- ✅ Real-time updates (when enabled)
- ✅ Message editing and deletion
- ✅ Like/dislike reactions
- ✅ Works offline with local state management

## Features Included

### File Support
- **Images**: JPG, PNG, GIF, WebP (with AI text extraction)
- **PDFs**: PDF documents (with metadata extraction)
- **Documents**: DOC, DOCX, TXT, MD files
- **Size Limit**: 50MB per file
- **Multiple Files**: Can upload multiple files per message

### Chat Features
- **Persistent Storage**: All chats saved to Supabase
- **Real-time Streaming**: AI responses stream in real-time
- **Message Management**: Edit, delete, copy, regenerate messages
- **Session Management**: Create, switch, delete chat sessions
- **File Attachments**: Visual previews and metadata
- **Reactions**: Like/dislike messages
- **Export**: Download chat history as text file

### Security
- **Row Level Security**: Users only see their own data
- **File Security**: Private file storage with signed URLs
- **Authentication**: Requires user login

The component is now fully integrated with Supabase and ready for production use! 
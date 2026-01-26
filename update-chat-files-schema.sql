-- Update chat_files table to store file content and additional metadata
-- Run this in Supabase SQL Editor

-- Add new columns to chat_files table
ALTER TABLE chat_files 
ADD COLUMN IF NOT EXISTS file_content TEXT,
ADD COLUMN IF NOT EXISTS extracted_text TEXT,
ADD COLUMN IF NOT EXISTS pdf_pages JSONB,
ADD COLUMN IF NOT EXISTS content_type TEXT DEFAULT 'file';

-- Create index for better performance
CREATE INDEX IF NOT EXISTS idx_chat_files_content_type ON chat_files(content_type);

-- Update existing records to set default content_type
UPDATE chat_files SET content_type = 'file' WHERE content_type IS NULL;

-- Add comment for documentation
COMMENT ON COLUMN chat_files.file_content IS 'Base64 encoded file content for small files like images';
COMMENT ON COLUMN chat_files.extracted_text IS 'Extracted text content from PDFs and documents';
COMMENT ON COLUMN chat_files.pdf_pages IS 'Array of base64 encoded PDF page images';
COMMENT ON COLUMN chat_files.content_type IS 'Type of content: file, image, pdf, document'; 
# AI Components Documentation

## Overview
This document describes the AI-powered components in the EduSmart application, including the Check Mistakes component and AI Tutor Chat component.

## Components

### 1. CheckMistakesComponent (`src/components/ui/CheckMistakesComponent.tsx`)

**Purpose**: Analyzes uploaded documents (PDF/images) for grammar mistakes, spelling errors, and writing issues.

**Key Features**:
- **PDF Processing**: Converts multi-page PDF files to individual images using PDF.js
- **OCR Text Extraction**: Uses Doubao Vision API to extract text from images
- **Grammar Analysis**: Analyzes extracted text for mistakes using the same chat API
- **Page-by-page Processing**: Handles each page separately for better accuracy
- **Real-time Status Updates**: Shows processing progress for each step

**APIs Used**:
- **OCR API**: `https://ark.cn-beijing.volces.com/api/v3/chat/completions`
  - Model: `doubao-vision-pro-32k-241028`
  - Bearer Token: `95fad12c-0768-4de2-a4c2-83247337ea89`
  - Purpose: Extract text from images using vision capabilities

- **Grammar Check API**: Same as OCR API but with text-only input
  - Analyzes text for grammar, spelling, and punctuation errors
  - Returns structured XML format with mistake details

**File Processing Flow**:
1. **File Upload**: Accept PDF or image files
2. **PDF Conversion**: Convert PDF pages to high-quality JPEG images (scale: 2.0)
3. **Text Extraction**: Process each image through OCR API
4. **Mistake Analysis**: Analyze extracted text for errors
5. **Results Display**: Show mistakes with corrections and page numbers

**Supported File Types**:
- PDF files (multi-page support)
- Image files (JPG, JPEG, PNG)

### 2. AiTutorChatComponent (`src/components/ui/AiTutorChatComponent.tsx`)

**Purpose**: Provides real-time chat interface with AI tutor for educational assistance.

**Key Features**:
- Real-time chat interface
- Educational context awareness
- Message history
- Typing indicators
- Auto-scroll to latest messages

**API Used**:
- **Chat API**: `https://ark.cn-beijing.volces.com/api/v3/chat/completions`
  - Model: `doubao-vision-pro-32k-241028`
  - Bearer Token: `95fad12c-0768-4de2-a4c2-83247337ea89`

### 3. ContentWriterComponent (`src/components/ui/ContentWriterComponent.tsx`)

**Purpose**: AI-powered content generation for academic writing.

**Key Features**:
- **Unified API**: Now uses the same chat API as other components
- **Template-based Generation**: Pre-defined templates for different content types
- **AI Editing**: Intelligent content editing with specific instructions
- **Content Suggestions**: AI-powered suggestions for selected text
- **Export Options**: PDF, DOC, and TXT export capabilities

**API Integration**:
- **Content Generation**: Uses Doubao Vision API for generating essays, papers, etc.
- **AI Editing**: Same API for content editing and improvements
- **Text Suggestions**: Provides contextual suggestions for selected text

## Technical Implementation

### PDF Processing
```typescript
// PDF.js integration for converting PDF to images
import * as pdfjsLib from 'pdfjs-dist';

// Worker setup
pdfjsLib.GlobalWorkerOptions.workerSrc = `//cdnjs.cloudflare.com/ajax/libs/pdf.js/${pdfjsLib.version}/pdf.worker.min.js`;

// Convert PDF pages to images
const convertPdfToImages = async (file: File): Promise<string[]> => {
  const arrayBuffer = await file.arrayBuffer();
  const pdf = await pdfjsLib.getDocument({ data: arrayBuffer }).promise;
  
  for (let pageNum = 1; pageNum <= pdf.numPages; pageNum++) {
    const page = await pdf.getPage(pageNum);
    const viewport = page.getViewport({ scale: 2.0 });
    
    // Render to canvas and convert to image
    const canvas = document.createElement('canvas');
    const context = canvas.getContext('2d');
    canvas.height = viewport.height;
    canvas.width = viewport.width;
    
    await page.render({ canvasContext: context, viewport }).promise;
    const imageUrl = canvas.toDataURL('image/jpeg', 0.9);
    images.push(imageUrl);
  }
  
  return images;
};
```

### API Integration
```typescript
// Unified API call function
const makeAPICall = async (prompt: string, isVision = false) => {
  const response = await fetch('https://ark.cn-beijing.volces.com/api/v3/chat/completions', {
    method: 'POST',
    headers: {
      'Authorization': 'Bearer 95fad12c-0768-4de2-a4c2-83247337ea89',
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      model: "doubao-vision-pro-32k-241028",
      messages: [
        {
          role: "system",
          content: "System prompt based on use case"
        },
        {
          role: "user",
          content: isVision ? [
            { type: "text", text: prompt },
            { type: "image_url", image_url: { url: imageUrl } }
          ] : prompt
        }
      ],
      max_tokens: 4000,
      temperature: 0.7
    })
  });
  
  const data = await response.json();
  return data.choices?.[0]?.message?.content;
};
```

### Error Handling
- Comprehensive error handling for API failures
- Fallback pattern matching for grammar mistakes
- User-friendly error messages
- Retry logic with exponential backoff

### Performance Optimizations
- Rate limiting between API calls (1-second delay)
- High-quality image conversion (scale: 2.0)
- Efficient canvas-based PDF rendering
- Memory cleanup for processed images

## Dependencies
- `pdfjs-dist`: PDF processing and rendering
- `canvas`: Canvas API for image conversion
- `framer-motion`: Animations and transitions
- `react-icons`: Icon components

## Usage Examples

### Check Mistakes Component
```tsx
import CheckMistakesComponent from './components/ui/CheckMistakesComponent';

// In your component
<CheckMistakesComponent />
```

### AI Tutor Chat Component
```tsx
import AiTutorChatComponent from './components/ui/AiTutorChatComponent';

// In your component
<AiTutorChatComponent />
```

### Content Writer Component
```tsx
import { ContentWriterComponent } from './components/ui/ContentWriterComponent';

// In your component
<ContentWriterComponent />
```

## Configuration
All components use the same API configuration:
- **Base URL**: `https://ark.cn-beijing.volces.com/api/v3/chat/completions`
- **Model**: `doubao-vision-pro-32k-241028`
- **Authentication**: Bearer token authentication
- **Rate Limiting**: 1-second delay between requests

## Future Enhancements
- Batch processing for multiple files
- Advanced grammar rule customization
- Integration with more file formats
- Offline processing capabilities
- Enhanced error recovery mechanisms 
#!/bin/bash

# Test Document Summarizer API Endpoints
# Make sure your server is running on localhost:8000

BASE_URL="http://localhost:8000/api/document-summarizer"

# Prompt user for their authenticated user ID
echo "🧪 Testing Document Summarizer API Endpoints"
echo "============================================="
echo ""
echo "⚠️  IMPORTANT: This script requires a valid authenticated user ID"
echo "Please provide your authenticated user ID (from your login session):"
echo "You can find this in your browser's localStorage or from your authentication provider"
echo ""
read -p "Enter your User ID: " USER_ID

if [ -z "$USER_ID" ]; then
    echo "❌ Error: User ID is required to test the API endpoints"
    echo "Please authenticate first and provide your user ID"
    exit 1
fi

echo ""
echo "Using User ID: $USER_ID"

# Test 1: Save a text-based document summary
echo ""
echo "📝 Test 1: Save text-based document summary"
echo "--------------------------------------------"
curl -X POST "$BASE_URL/save" \
  -H "Content-Type: application/json" \
  -d '{
    "uid": "'$USER_ID'",
    "title": "Machine Learning Fundamentals Summary",
    "summary": "# Machine Learning Overview\n\nMachine learning is a subset of artificial intelligence that enables computers to learn without explicit programming.\n\n## Key Concepts:\n- **Supervised Learning**: Learning with labeled data\n- **Unsupervised Learning**: Finding patterns in unlabeled data\n- **Reinforcement Learning**: Learning through reward/punishment\n\n## Applications:\n- Image recognition\n- Natural language processing\n- Recommendation systems\n- Autonomous vehicles",
    "sourceType": "text",
    "textInput": "Machine learning is a method of data analysis that automates analytical model building. It is a branch of artificial intelligence based on the idea that systems can learn from data, identify patterns and make decisions with minimal human intervention. The main types include supervised learning, unsupervised learning, and reinforcement learning.",
    "mindmapData": {
      "name": "Machine Learning",
      "children": [
        {
          "name": "Types",
          "children": [
            {"name": "Supervised Learning"},
            {"name": "Unsupervised Learning"},
            {"name": "Reinforcement Learning"}
          ]
        },
        {
          "name": "Applications",
          "children": [
            {"name": "Image Recognition"},
            {"name": "NLP"},
            {"name": "Recommendations"}
          ]
        }
      ]
    },
    "metadata": {
      "aiModel": "doubao-seed-1-6-vision-250815",
      "processingTime": 15.2,
      "wordCount": 180
    }
  }' | jq '.'

# Store the document ID from the response for later tests
echo ""
echo "💾 Please copy the document ID from the response above for the next tests"
echo "Or use this command to get the first document ID:"
echo "DOCUMENT_ID=\$(curl -s \"$BASE_URL/history/$USER_ID\" | jq -r '.documentHistory[0].id')"

# Test 2: Save a file-based document summary (PDF)
echo ""
echo "📄 Test 2: Save file-based document summary (PDF)"
echo "--------------------------------------------------"
curl -X POST "$BASE_URL/save" \
  -H "Content-Type: application/json" \
  -d '{
    "uid": "'$USER_ID'",
    "title": "Research Paper: Deep Learning in Healthcare",
    "summary": "# Deep Learning in Healthcare Research\n\nThis research paper explores the applications of deep learning in medical diagnosis and treatment.\n\n## Key Findings:\n- **Accuracy**: 95% accuracy in image-based diagnostics\n- **Speed**: 10x faster than traditional methods\n- **Applications**: Radiology, pathology, drug discovery\n\n## Conclusions:\nDeep learning shows significant promise in revolutionizing healthcare delivery and patient outcomes.",
    "sourceType": "file",
    "fileName": "deep_learning_healthcare.pdf",
    "fileType": "application/pdf",
    "fileSize": 2048576,
    "documentPages": [
      "data:image/jpeg;base64,/9j/4AAQSkZJRgABAQAAAQABAAD//sample_page_1",
      "data:image/jpeg;base64,/9j/4AAQSkZJRgABAQAAAQABAAD//sample_page_2"
    ],
    "pageSummaries": [
      {
        "pageNumber": 1,
        "summary": "Introduction to deep learning applications in healthcare",
        "isLoading": false,
        "isComplete": true
      },
      {
        "pageNumber": 2,
        "summary": "Methodology and experimental setup",
        "isLoading": false,
        "isComplete": true
      }
    ],
    "mindmapData": {
      "name": "Deep Learning in Healthcare",
      "children": [
        {
          "name": "Applications",
          "children": [
            {"name": "Medical Imaging"},
            {"name": "Drug Discovery"},
            {"name": "Diagnostics"}
          ]
        },
        {
          "name": "Benefits",
          "children": [
            {"name": "High Accuracy"},
            {"name": "Fast Processing"},
            {"name": "Cost Effective"}
          ]
        }
      ]
    },
    "metadata": {
      "aiModel": "doubao-seed-1-6-vision-250815",
      "processingTime": 45.8,
      "pagesProcessed": 2,
      "totalWords": 1250
    }
  }' | jq '.'

# Test 3: Get document summary history
echo ""
echo "📚 Test 3: Get document summary history"
echo "---------------------------------------"
curl -X GET "$BASE_URL/history/$USER_ID?page=1&limit=10" | jq '.'

# Test 4: Get document summary history with filter
echo ""
echo "🔍 Test 4: Get filtered document summary history (text only)"
echo "------------------------------------------------------------"
curl -X GET "$BASE_URL/history/$USER_ID?page=1&limit=10&sourceType=text" | jq '.'

# Test 5: Get document summary statistics
echo ""
echo "📊 Test 5: Get document summary statistics"
echo "------------------------------------------"
curl -X GET "$BASE_URL/stats/$USER_ID" | jq '.'

# Test 6: Get specific document summary by ID (you need to replace DOCUMENT_ID)
echo ""
echo "📄 Test 6: Get specific document summary by ID"
echo "----------------------------------------------"
echo "⚠️  Replace 'DOCUMENT_ID' with an actual ID from the history response"
echo "Example command:"
echo "curl -X GET \"$BASE_URL/DOCUMENT_ID?uid=$USER_ID\" | jq '.'"

# Test 7: Update document summary (you need to replace DOCUMENT_ID)
echo ""
echo "✏️  Test 7: Update document summary"
echo "-----------------------------------"
echo "⚠️  Replace 'DOCUMENT_ID' with an actual ID from the history response"
echo "Example command:"
echo "curl -X PUT \"$BASE_URL/DOCUMENT_ID\" \\"
echo "  -H \"Content-Type: application/json\" \\"
echo "  -d '{"
echo "    \"uid\": \"$USER_ID\","
echo "    \"title\": \"Updated Title\","
echo "    \"summary\": \"Updated summary content\","
echo "    \"metadata\": {\"updated\": true}"
echo "  }' | jq '.'"

# Test 8: Delete document summary (you need to replace DOCUMENT_ID)
echo ""
echo "🗑️  Test 8: Delete document summary"
echo "-----------------------------------"
echo "⚠️  Replace 'DOCUMENT_ID' with an actual ID from the history response"
echo "Example command:"
echo "curl -X DELETE \"$BASE_URL/DOCUMENT_ID?uid=$USER_ID\" | jq '.'"

# Test 9: Test error cases
echo ""
echo "❌ Test 9: Test error cases"
echo "---------------------------"

echo "9a. Missing required fields:"
curl -X POST "$BASE_URL/save" \
  -H "Content-Type: application/json" \
  -d '{
    "uid": "'$USER_ID'",
    "title": "Incomplete Data"
  }' | jq '.'

echo ""
echo "9b. Invalid source type:"
curl -X POST "$BASE_URL/save" \
  -H "Content-Type: application/json" \
  -d '{
    "uid": "'$USER_ID'",
    "title": "Invalid Source",
    "summary": "Test summary",
    "sourceType": "invalid_type"
  }' | jq '.'

echo ""
echo "9c. Get non-existent document:"
curl -X GET "$BASE_URL/non-existent-id?uid=$USER_ID" | jq '.'

echo ""
echo "✅ API Testing Complete!"
echo ""
echo "📝 Quick commands to get document IDs for further testing:"
echo "# Get first document ID:"
echo "FIRST_DOC_ID=\$(curl -s \"$BASE_URL/history/$USER_ID\" | jq -r '.documentHistory[0].id')"
echo ""
echo "# Get specific document:"
echo "curl -X GET \"$BASE_URL/\$FIRST_DOC_ID?uid=$USER_ID\" | jq '.'"
echo ""
echo "# Update document:"
echo "curl -X PUT \"$BASE_URL/\$FIRST_DOC_ID\" -H \"Content-Type: application/json\" -d '{\"uid\":\"$USER_ID\",\"title\":\"Updated Title\"}' | jq '.'"
echo ""
echo "# Delete document:"
echo "curl -X DELETE \"$BASE_URL/\$FIRST_DOC_ID?uid=$USER_ID\" | jq '.'"
// Background service worker for ExplainIO extension

// Listen for messages from content scripts
chrome.runtime.onMessage.addListener((request, sender, sendResponse) => {
  if (request.action === 'getExplanation') {
    // Handle explanation request
    getExplanation(request.text)
      .then(explanation => {
        sendResponse({ explanation });
      })
      .catch(error => {
        console.error('Error getting explanation:', error);
        sendResponse({ error: error.message });
      });
    
    // Return true to indicate we will send a response asynchronously
    return true;
  }
  
  // Handle LLM query requests
  if (request.type === 'queryLLM') {
    queryOllama(request.word, request.context)
      .then(explanation => {
        sendResponse({ success: true, explanation });
      })
      .catch(error => {
        console.error('Error querying Ollama:', error);
        sendResponse({ success: false, error: error.message });
      });
    
    // Return true to indicate we will send a response asynchronously
    return true;
  }
  
  // Handle request to check available models
  if (request.type === 'checkModels') {
    checkAvailableModels()
      .then(models => {
        sendResponse({ success: true, models });
      })
      .catch(error => {
        console.error('Error checking models:', error);
        sendResponse({ success: false, error: error.message });
      });
    
    // Return true to indicate we will send a response asynchronously
    return true;
  }
});

// Function to get explanation for text
async function getExplanation(text) {
  // Placeholder for explanation logic
  // This can be replaced with actual API calls or processing logic
  return new Promise((resolve) => {
    // Simulate API call delay
    setTimeout(() => {
      // Placeholder explanation
      const explanation = `This is a placeholder explanation for: "${text}". ` +
        `In a real implementation, this would call an API or use a language model ` +
        `to generate contextual explanations for the selected text.`;
      resolve(explanation);
    }, 500);
  });
}

// Check available Ollama models
async function checkAvailableModels() {
  try {
    console.log('Checking available Ollama models...');
    
    const response = await fetch('http://localhost:11434/api/tags', {
      method: 'GET',
      headers: {
        'Content-Type': 'application/json'
      }
    });

    if (!response.ok) {
      throw new Error(`HTTP error! status: ${response.status}`);
    }

    const data = await response.json();
    console.log('Available models:', JSON.stringify(data, null, 2));
    
    const modelNames = data.models?.map(m => m.name) || [];
    console.log('Model names:', modelNames);
    
    return modelNames;
  } catch (error) {
    console.error('Error checking models:', error);
    throw error;
  }
}

// Query Ollama API for explanation (runs in background service worker to avoid CORS)
// FIX 1: Using /api/generate endpoint with prompt format
async function queryOllama(word, context) {
  const prompt = `You are tasked with explaining the precise meaning of a highlighted word based on its surrounding context.
Highlighted word: "${word}"
Broader context: "${context}"
Provide a concise yet descriptive explanation of what "${word}" means specifically in this context. Capture any nuances, idiomatic usage, technical/domain-specific interpretations, or connotations that arise from the surrounding text. Keep the response to 2-4 sentences only. Do not add external examples or general dictionary definitions unrelated to this exact context.`;

  // Try different model name variations
  const modelName = 'deepseek-r1:8b'; // FIX 3: Try "deepseek-r1" without :8b if this fails

  const requestBody = {
    model: modelName,
    prompt: prompt,
    stream: false
  };

  try {
    console.log('Fetching from Ollama using /api/generate...');
    console.log('Model:', modelName);
    console.log('Request body:', JSON.stringify(requestBody, null, 2));
    
    const response = await fetch('http://localhost:11434/api/generate', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json'
      },
      body: JSON.stringify(requestBody)
    });

    console.log('Response status:', response.status, response.statusText);
    console.log('Response headers:', Object.fromEntries(response.headers.entries()));

    if (!response.ok) {
      const errorText = await response.text();
      console.error('Error response body:', errorText);
      throw new Error(`HTTP error! status: ${response.status}`);
    }

    const data = await response.json();
    console.log('Full response data:', JSON.stringify(data, null, 2));
    
    // FIX 1: Use data.response instead of data.message.content
    const explanation = data.response || '';
    console.log('Extracted explanation:', explanation);
    
    return explanation;
  } catch (error) {
    console.error('Error querying Ollama:', error);
    console.error('Error details:', {
      name: error.name,
      message: error.message,
      stack: error.stack
    });
    throw error;
  }
}

// Handle extension installation
chrome.runtime.onInstalled.addListener((details) => {
  if (details.reason === 'install') {
    // Set default settings
    chrome.storage.sync.set({
      enabled: true,
      popupDelay: 300,
      popupPosition: 'below'
    });
    
    // Create context menu items
    createContextMenuItems();
  } else if (details.reason === 'update') {
    // Recreate context menu items on update (in case they were removed)
    createContextMenuItems();
  }
});

// Create context menu items
function createContextMenuItems() {
  // Remove ALL existing context menu items to start fresh
  chrome.contextMenus.removeAll(() => {
    // Create "Select Word/Phrase" context menu item at TOP LEVEL (no parentId)
    chrome.contextMenus.create({
      id: 'selectWord',
      title: 'Select Word/Phrase',
      contexts: ['selection']
      // NO parentId - ensures it appears at TOP LEVEL, not in submenu
    });
    
    // Create "Select Context" context menu item at TOP LEVEL (no parentId)
    chrome.contextMenus.create({
      id: 'selectContext',
      title: 'Select Context',
      contexts: ['selection']
      // NO parentId - ensures it appears at TOP LEVEL, not in submenu
    });
    
    console.log('Context menu items created at TOP LEVEL');
  });
}

// Create context menu items when service worker starts (Manifest V3)
createContextMenuItems();

// Listen for context menu clicks
chrome.contextMenus.onClicked.addListener((info, tab) => {
  if (info.menuItemId === 'selectWord') {
    // Send message to content script to trigger handleWordSelection()
    // Pass the selected text in case the selection is cleared
    chrome.tabs.sendMessage(tab.id, {
      action: 'handleWordSelection',
      selectionText: info.selectionText
    }).catch(error => {
      console.error('Error sending message to content script:', error);
    });
  } else if (info.menuItemId === 'selectContext') {
    // Send message to content script to trigger handleContextSelection()
    // Pass the selected text in case the selection is cleared
    chrome.tabs.sendMessage(tab.id, {
      action: 'handleContextSelection',
      selectionText: info.selectionText
    }).catch(error => {
      console.error('Error sending message to content script:', error);
    });
  }
});


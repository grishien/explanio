// Background service worker for Context Explainer extension

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

// Handle extension installation
chrome.runtime.onInstalled.addListener((details) => {
  if (details.reason === 'install') {
    // Set default settings
    chrome.storage.sync.set({
      enabled: true,
      popupDelay: 300,
      popupPosition: 'below'
    });
  }
});


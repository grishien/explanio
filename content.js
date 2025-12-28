// Content script for Context Explainer extension - Phase 2

// Variables for initial selection capture
let capturedSelection = null;
let capturedSelectionData = null;
let highlightOverlay = null;
let instructionOverlay = null;

// Global variable for initial text
let InitialText = null;

// Variable for context selection
let contextText = null;

// Variable for sidebar container
let sidebarContainer = null;

// Initialize sidebar when DOM is ready
if (document.readyState === 'loading') {
  document.addEventListener('DOMContentLoaded', initializeSidebar);
} else {
  initializeSidebar();
}

// Keyboard event listener for Ctrl+Alt+NumpadSubtract
document.addEventListener('keydown', handleKeyboardShortcut);

// Handle keyboard shortcuts
function handleKeyboardShortcut(event) {
  const isCtrlOrMeta = event.ctrlKey || event.metaKey;
  const isAlt = event.altKey;
  
  // Check for Ctrl+Alt+NumpadSubtract (initial selection)
  if (isCtrlOrMeta && isAlt && event.code === 'NumpadSubtract') {
    event.preventDefault();
    event.stopPropagation();
    
    const selection = window.getSelection();
    const text = selection.toString().trim();
    
    if (text && text.length > 3) {
      // Store initial text in global variable
      InitialText = text;
      
      // Capture the selected text and its position
      captureSelection(selection, text);
      
      // Log to console
      console.log('Initial selection:', text);
      
      // Add yellow/orange highlight overlay
      addHighlightOverlay(selection);
      
      // Show instruction overlay
      showInstructionOverlay();
    }
  }
  // Check for Ctrl+Alt+Numpad+ or Ctrl+Alt+= (context selection)
  else if (isCtrlOrMeta && isAlt && (event.code === 'NumpadAdd')) {
    event.preventDefault();
    event.stopPropagation();
    
    // Check if we have an initial selection
    if (!capturedSelectionData) {
      console.log('Error: No initial selection found. Please select a word/phrase first with Ctrl+Alt+Numpad-');
      return;
    }
    
    const selection = window.getSelection();
    const context = selection.toString().trim();
    
    if (!context || context.length === 0) {
      console.log('Error: No text selected for context');
      return;
    }
    
    // Validate that context includes the original selection
    const originalText = capturedSelectionData.text;
    if (!context.includes(originalText)) {
      console.log('Error: Context must include the original selection');
      return;
    }
    
    // Validation passed - store context and log
    contextText = context;
    console.log('Context text:', context);
    console.log('Original word/phrase:', originalText);
    
    // Remove instruction overlay
    if (instructionOverlay) {
      instructionOverlay.remove();
      instructionOverlay = null;
    }
    
    // Add placeholder card to sidebar
    addPlaceholderCard();
  }
}

// Capture and store the selected text and its position
function captureSelection(selection, text) {
  if (!selection.rangeCount) {
    return;
  }
  
  const range = selection.getRangeAt(0);
  const rect = range.getBoundingClientRect();
  const scrollTop = window.pageYOffset || document.documentElement.scrollTop;
  const scrollLeft = window.pageXOffset || document.documentElement.scrollLeft;
  
  // Store the selection range
  capturedSelection = range.cloneRange();
  
  // Store selection data including position
  capturedSelectionData = {
    text: text,
    startContainer: range.startContainer,
    startOffset: range.startOffset,
    endContainer: range.endContainer,
    endOffset: range.endOffset,
    boundingRect: {
      top: rect.top + scrollTop,
      left: rect.left + scrollLeft,
      bottom: rect.bottom + scrollTop,
      right: rect.right + scrollLeft,
      width: rect.width,
      height: rect.height
    },
    timestamp: Date.now()
  };
}

// Show instruction overlay at top-center of viewport
function showInstructionOverlay() {
  // Remove existing overlay if present
  if (instructionOverlay) {
    instructionOverlay.remove();
  }
  
  // Create instruction overlay element
  instructionOverlay = document.createElement('div');
  instructionOverlay.className = 'context-explainer-instruction';
  instructionOverlay.textContent = 'Now select a larger text area that includes the highlighted text';
  
  // Style: fixed position, top-center, subtle background, readable text, small padding
  instructionOverlay.style.cssText = `
    position: fixed;
    top: 20px;
    left: 50%;
    transform: translateX(-50%);
    z-index: 10001;
    background: rgba(255, 255, 255, 0.95);
    color: #333;
    padding: 10px 20px;
    border-radius: 6px;
    box-shadow: 0 2px 8px rgba(0, 0, 0, 0.15);
    font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Oxygen, Ubuntu, Cantarell, sans-serif;
    font-size: 14px;
    font-weight: 500;
    pointer-events: none;
    animation: fadeInSlideDown 0.3s ease-out;
  `;
  
  // Add to page
  document.body.appendChild(instructionOverlay);
}

// Add yellow/orange semi-transparent highlight overlay over selected text
function addHighlightOverlay(selection) {
  // Remove existing overlay if present
  if (highlightOverlay) {
    removeHighlightOverlay();
  }
  
  if (!selection.rangeCount) {
    return;
  }
  
  const range = selection.getRangeAt(0);
  const rect = range.getBoundingClientRect();
  const scrollTop = window.pageYOffset || document.documentElement.scrollTop;
  const scrollLeft = window.pageXOffset || document.documentElement.scrollLeft;
  
  // Create highlight overlay with yellow/orange color
  highlightOverlay = document.createElement('div');
  highlightOverlay.className = 'context-explainer-highlight';
  highlightOverlay.style.cssText = `
    position: absolute;
    top: ${rect.top + scrollTop}px;
    left: ${rect.left + scrollLeft}px;
    width: ${rect.width}px;
    height: ${rect.height}px;
    background-color: rgba(255, 193, 7, 0.3);
    outline: 2px solid rgba(255, 152, 0, 0.6);
    border-radius: 3px;
    z-index: 9999;
    pointer-events: none;
  `;
  
  // Add to page
  document.body.appendChild(highlightOverlay);
  
  // Update position on scroll and resize
  const updatePosition = () => {
    if (highlightOverlay && capturedSelectionData) {
      const newRange = document.createRange();
      try {
        newRange.setStart(capturedSelectionData.startContainer, capturedSelectionData.startOffset);
        newRange.setEnd(capturedSelectionData.endContainer, capturedSelectionData.endOffset);
        const newRect = newRange.getBoundingClientRect();
        const newScrollTop = window.pageYOffset || document.documentElement.scrollTop;
        const newScrollLeft = window.pageXOffset || document.documentElement.scrollLeft;
        
        highlightOverlay.style.top = `${newRect.top + newScrollTop}px`;
        highlightOverlay.style.left = `${newRect.left + newScrollLeft}px`;
        highlightOverlay.style.width = `${newRect.width}px`;
        highlightOverlay.style.height = `${newRect.height}px`;
      } catch (e) {
        // Range may be invalid, remove overlay
        removeHighlightOverlay();
      }
    }
  };
  
  // Update on scroll and resize
  window.addEventListener('scroll', updatePosition, true);
  window.addEventListener('resize', updatePosition);
  
  // Store cleanup function
  highlightOverlay._cleanup = () => {
    window.removeEventListener('scroll', updatePosition, true);
    window.removeEventListener('resize', updatePosition);
  };
}

// Function to remove highlight overlay
function removeHighlightOverlay() {
  if (highlightOverlay) {
    if (highlightOverlay._cleanup) {
      highlightOverlay._cleanup();
    }
    highlightOverlay.remove();
    highlightOverlay = null;
  }
}

// Initialize sidebar container
function initializeSidebar() {
  // Check if sidebar already exists
  if (document.getElementById('context-explainer-sidebar')) {
    sidebarContainer = document.getElementById('context-explainer-sidebar');
    return;
  }
  
  // Create sidebar container
  sidebarContainer = document.createElement('div');
  sidebarContainer.id = 'context-explainer-sidebar';
  sidebarContainer.className = 'context-explainer-sidebar';
  
  // Style the sidebar
  sidebarContainer.style.cssText = `
    position: fixed;
    top: 0;
    right: 20px;
    bottom: 0;
    width: 350px;
    background: rgba(255, 255, 255, 0.95);
    box-shadow: -2px 0 8px rgba(0, 0, 0, 0.1);
    z-index: 10000;
    overflow-y: auto;
    padding: 20px;
    font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Oxygen, Ubuntu, Cantarell, sans-serif;
  `;
  
  // Add to page
  document.body.appendChild(sidebarContainer);
}

// Query Ollama API via background service worker (to avoid CORS issues)
function queryOllama(word, context) {
  return new Promise((resolve, reject) => {
    chrome.runtime.sendMessage(
      {
        type: 'queryLLM',
        word: word,
        context: context
      },
      (response) => {
        // Check for errors in response
        if (chrome.runtime.lastError) {
          reject(new Error(chrome.runtime.lastError.message));
          return;
        }
        
        if (response && response.success) {
          resolve(response.explanation);
        } else {
          reject(new Error(response?.error || 'Unknown error'));
        }
      }
    );
  });
}

// Add placeholder card to sidebar
function addPlaceholderCard() {
  // Ensure sidebar exists
  if (!sidebarContainer) {
    initializeSidebar();
  }
  
  // Create card element
  const card = document.createElement('div');
  card.className = 'context-explainer-card';
  
  // Style the card (position: relative for absolute positioning of close button)
  card.style.cssText = `
    position: relative;
    background: white;
    border-radius: 8px;
    padding: 16px;
    margin-bottom: 16px;
    box-shadow: 0 2px 4px rgba(0, 0, 0, 0.1);
    transition: opacity 200ms ease-out;
  `;
  
  // Get current time in 24-hour format
  const currentTime = new Date().toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit', hour12: false });
  
  // Get the initial text (fallback to "Unknown" if not set)
  const headingText = InitialText ? `${InitialText} - ${currentTime}` : `Unknown - ${currentTime}`;
  
  // Create card content with close button and loading state
  card.innerHTML = `
    <button class="context-explainer-card-close" style="
      position: absolute;
      top: 8px;
      right: 8px;
      background: none;
      border: none;
      font-size: 20px;
      color: #999;
      cursor: pointer;
      padding: 4px 8px;
      line-height: 1;
      transition: color 150ms ease;
    ">×</button>
    <h3 style="margin: 0 0 8px 0; font-size: 18px; font-weight: 600; color: #333;">${headingText}</h3>
    <p class="context-explainer-card-body" style="margin: 0; font-size: 14px; color: #666; line-height: 1.5;">Loading explanation...</p>
  `;
  
  // Add hover effect for close button
  const closeButton = card.querySelector('.context-explainer-card-close');
  closeButton.addEventListener('mouseenter', () => {
    closeButton.style.color = '#333';
  });
  closeButton.addEventListener('mouseleave', () => {
    closeButton.style.color = '#999';
  });
  
  // Add click event listener to close button
  closeButton.addEventListener('click', () => {
    // Fade out animation
    card.style.opacity = '0';
    
    // Remove from DOM after animation completes
    setTimeout(() => {
      if (card.parentNode) {
        card.remove();
      }
    }, 200);
  });
  
  // Add card to sidebar
  sidebarContainer.appendChild(card);
  
  // Query Ollama API and update card
  const cardBody = card.querySelector('.context-explainer-card-body');
  queryOllama(InitialText || 'Unknown', contextText || '')
    .then(explanation => {
      cardBody.textContent = explanation;
      cardBody.style.color = '#333';
    })
    .catch(error => {
      cardBody.textContent = 'Failed to fetch explanation. Is Ollama running?';
      cardBody.style.color = '#d32f2f';
      console.error('Failed to fetch explanation:', error);
    });
}

// Add CSS animations via style tag if not already present
if (!document.getElementById('context-explainer-dynamic-styles')) {
  const style = document.createElement('style');
  style.id = 'context-explainer-dynamic-styles';
  style.textContent = `
    @keyframes fadeInSlideDown {
      from {
        opacity: 0;
        transform: translateX(-50%) translateY(-10px);
      }
      to {
        opacity: 1;
        transform: translateX(-50%) translateY(0);
      }
    }
  `;
  document.head.appendChild(style);
}

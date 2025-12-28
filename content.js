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
let sidebarContentArea = null; // Scrollable content area for cards

// Variable to track sidebar visibility state
let sidebarVisible = true;

// Variable to track current theme
let currentTheme = 'light';

// Initialize sidebar when DOM is ready
if (document.readyState === 'loading') {
  document.addEventListener('DOMContentLoaded', () => {
    initializeSidebar();
    loadSidebarVisibility();
    loadTheme();
  });
} else {
  initializeSidebar();
  loadSidebarVisibility();
  loadTheme();
}

// Load sidebar visibility state from storage
async function loadSidebarVisibility() {
  try {
    const result = await chrome.storage.sync.get({ sidebarVisible: true });
    sidebarVisible = result.sidebarVisible;
    applySidebarVisibility();
  } catch (error) {
    console.error('Error loading sidebar visibility:', error);
  }
}

// Apply sidebar visibility state
function applySidebarVisibility() {
  if (sidebarContainer) {
    sidebarContainer.style.display = sidebarVisible ? 'block' : 'none';
  }
}

// Toggle sidebar visibility
function toggleSidebarVisibility() {
  sidebarVisible = !sidebarVisible;
  applySidebarVisibility();
  
  // Save to storage
  chrome.storage.sync.set({ sidebarVisible: sidebarVisible }).catch(error => {
    console.error('Error saving sidebar visibility:', error);
  });
}

// Message listener for toggle action
chrome.runtime.onMessage.addListener((request, sender, sendResponse) => {
  if (request.action === 'toggleSidebar') {
    toggleSidebarVisibility();
    sendResponse({ success: true, visible: sidebarVisible });
  }
  return true; // Keep message channel open for async response
});

// Keyboard event listener for Ctrl+Alt+NumpadSubtract
document.addEventListener('keydown', handleKeyboardShortcut);

// Handle word selection (initial selection)
function handleWordSelection() {
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
  } else {
    console.log('Error: Please select at least 4 characters');
  }
}

// Handle context selection
function handleContextSelection() {
  // Check if we have an initial selection
  if (!capturedSelectionData) {
    console.log('Error: No initial selection found. Please select a word/phrase first');
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

// Handle keyboard shortcuts
function handleKeyboardShortcut(event) {
  const isCtrlOrMeta = event.ctrlKey || event.metaKey;
  const isAlt = event.altKey;
  
  // Check for Ctrl+Alt+NumpadSubtract (initial selection)
  if (isCtrlOrMeta && isAlt && event.code === 'NumpadSubtract') {
    event.preventDefault();
    event.stopPropagation();
    handleWordSelection();
  }
  // Check for Ctrl+Alt+Numpad+ or Ctrl+Alt+= (context selection)
  else if (isCtrlOrMeta && isAlt && (event.code === 'NumpadAdd')) {
    event.preventDefault();
    event.stopPropagation();
    handleContextSelection();
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

// Create action button (helper function)
function createActionButton(id, label, icon, onClickHandler) {
  const button = document.createElement('button');
  button.id = id;
  button.className = 'context-explainer-action-button';
  button.textContent = `${icon} ${label}`;
  button.style.cssText = `
    background: none;
    border: 1px solid rgba(0, 0, 0, 0.2);
    border-radius: 4px;
    padding: 4px 8px;
    font-size: 12px;
    cursor: pointer;
    transition: all 150ms ease;
    color: #333;
    margin-right: 6px;
  `;
  
  button.addEventListener('mouseenter', () => {
    const isDark = currentTheme === 'dark';
    button.style.backgroundColor = isDark ? 'rgba(255, 255, 255, 0.1)' : 'rgba(0, 0, 0, 0.05)';
  });
  button.addEventListener('mouseleave', () => {
    button.style.backgroundColor = 'transparent';
  });
  button.addEventListener('click', onClickHandler);
  
  return button;
}

// Initialize sidebar container
function initializeSidebar() {
  // Check if sidebar already exists
  if (document.getElementById('context-explainer-sidebar')) {
    sidebarContainer = document.getElementById('context-explainer-sidebar');
    sidebarContentArea = document.getElementById('context-explainer-sidebar-content');
    
    // Ensure button row exists, create if missing
    let buttonRow = document.getElementById('context-explainer-button-row');
    if (!buttonRow && sidebarContainer) {
      buttonRow = document.createElement('div');
      buttonRow.id = 'context-explainer-button-row';
      buttonRow.className = 'context-explainer-button-row';
      buttonRow.style.cssText = `
        background-color: rgba(248, 249, 250, 0.95);
        padding: 10px;
        border-bottom: 1px solid rgba(0, 0, 0, 0.1);
        display: flex;
        flex-direction: row;
        align-items: center;
        flex-shrink: 0;
      `;
      
      const themeToggleButton = document.createElement('button');
      themeToggleButton.id = 'context-explainer-theme-toggle';
      themeToggleButton.className = 'context-explainer-theme-toggle';
      themeToggleButton.textContent = '🌙';
      themeToggleButton.style.cssText = `
        background: none;
        border: 1px solid rgba(0, 0, 0, 0.2);
        border-radius: 4px;
        padding: 4px 8px;
        font-size: 14px;
        cursor: pointer;
        transition: all 150ms ease;
        color: #333;
      `;
      
      themeToggleButton.addEventListener('mouseenter', () => {
        const isDark = currentTheme === 'dark';
        themeToggleButton.style.backgroundColor = isDark ? 'rgba(255, 255, 255, 0.1)' : 'rgba(0, 0, 0, 0.05)';
      });
      themeToggleButton.addEventListener('mouseleave', () => {
        themeToggleButton.style.backgroundColor = 'transparent';
      });
      themeToggleButton.addEventListener('click', toggleTheme);
      
      // Create action buttons
      const wordButton = createActionButton('context-explainer-word-button', 'Word', '📝', handleWordSelection);
      const contextButton = createActionButton('context-explainer-context-button', 'Context', '📄', handleContextSelection);
      
      // Add buttons to row
      buttonRow.appendChild(wordButton);
      buttonRow.appendChild(contextButton);
      buttonRow.appendChild(themeToggleButton);
      
      sidebarContainer.insertBefore(buttonRow, sidebarContainer.firstChild);
    }
    
    // Ensure content area exists, create if missing
    if (!sidebarContentArea && sidebarContainer) {
      sidebarContentArea = document.createElement('div');
      sidebarContentArea.id = 'context-explainer-sidebar-content';
      sidebarContentArea.className = 'context-explainer-sidebar-content';
      sidebarContentArea.style.cssText = `
        flex: 1;
        overflow-y: auto;
        padding: 20px;
      `;
      sidebarContainer.appendChild(sidebarContentArea);
    }
    return;
  }
  
  // Create sidebar container
  sidebarContainer = document.createElement('div');
  sidebarContainer.id = 'context-explainer-sidebar';
  sidebarContainer.className = 'context-explainer-sidebar';
  
  // Style the sidebar (no overflow, will be handled by content area)
  sidebarContainer.style.cssText = `
    position: fixed;
    top: 0;
    right: 20px;
    bottom: 0;
    width: 350px;
    background: rgba(255, 255, 255, 0.95);
    box-shadow: -2px 0 8px rgba(0, 0, 0, 0.1);
    z-index: 10000;
    display: flex;
    flex-direction: column;
    font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Oxygen, Ubuntu, Cantarell, sans-serif;
  `;
  
  // Create button row at the top
  const buttonRow = document.createElement('div');
  buttonRow.id = 'context-explainer-button-row';
  buttonRow.className = 'context-explainer-button-row';
  buttonRow.style.cssText = `
    background-color: rgba(248, 249, 250, 0.95);
    padding: 10px;
    border-bottom: 1px solid rgba(0, 0, 0, 0.1);
    display: flex;
    flex-direction: row;
    align-items: center;
    flex-shrink: 0;
  `;
  
  // Create theme toggle button
  const themeToggleButton = document.createElement('button');
  themeToggleButton.id = 'context-explainer-theme-toggle';
  themeToggleButton.className = 'context-explainer-theme-toggle';
  themeToggleButton.textContent = '🌙';
  themeToggleButton.style.cssText = `
    background: none;
    border: 1px solid rgba(0, 0, 0, 0.2);
    border-radius: 4px;
    padding: 4px 8px;
    font-size: 14px;
    cursor: pointer;
    transition: all 150ms ease;
    color: #333;
  `;
  
  // Add hover effect (will be updated by applyTheme)
  themeToggleButton.addEventListener('mouseenter', () => {
    const isDark = currentTheme === 'dark';
    themeToggleButton.style.backgroundColor = isDark ? 'rgba(255, 255, 255, 0.1)' : 'rgba(0, 0, 0, 0.05)';
  });
  themeToggleButton.addEventListener('mouseleave', () => {
    themeToggleButton.style.backgroundColor = 'transparent';
  });
  
  // Add click handler
  themeToggleButton.addEventListener('click', toggleTheme);
  
  // Create action buttons
  const wordButton = createActionButton('context-explainer-word-button', 'Word', '📝', handleWordSelection);
  const contextButton = createActionButton('context-explainer-context-button', 'Context', '📄', handleContextSelection);
  
  // Add buttons to row
  buttonRow.appendChild(wordButton);
  buttonRow.appendChild(contextButton);
  buttonRow.appendChild(themeToggleButton);
  
  sidebarContainer.appendChild(buttonRow);
  
  // Create scrollable content area for cards
  sidebarContentArea = document.createElement('div');
  sidebarContentArea.id = 'context-explainer-sidebar-content';
  sidebarContentArea.className = 'context-explainer-sidebar-content';
  sidebarContentArea.style.cssText = `
    flex: 1;
    overflow-y: auto;
    padding: 20px;
  `;
  
  sidebarContainer.appendChild(sidebarContentArea);
  
  // Add to page
  document.body.appendChild(sidebarContainer);
}

// Load theme from storage
async function loadTheme() {
  try {
    const result = await chrome.storage.local.get(['theme']);
    const savedTheme = result.theme || 'light';
    currentTheme = savedTheme;
    applyTheme(savedTheme);
  } catch (error) {
    console.error('Error loading theme:', error);
    applyTheme('light');
  }
}

// Apply theme to sidebar and cards
function applyTheme(theme) {
  currentTheme = theme;
  
  if (!sidebarContainer) return;
  
  const buttonRow = document.getElementById('context-explainer-button-row');
  const themeToggleButton = document.getElementById('context-explainer-theme-toggle');
  const wordButton = document.getElementById('context-explainer-word-button');
  const contextButton = document.getElementById('context-explainer-context-button');
  const cards = sidebarContainer.querySelectorAll('.context-explainer-card');
  
  if (theme === 'dark') {
    // Dark mode styles
    sidebarContainer.style.background = 'rgba(45, 45, 45, 0.95)';
    sidebarContainer.style.color = '#e0e0e0';
    
    if (buttonRow) {
      buttonRow.style.backgroundColor = 'rgba(40, 40, 40, 0.95)';
      buttonRow.style.borderBottomColor = 'rgba(255, 255, 255, 0.2)';
    }
    
    if (themeToggleButton) {
      themeToggleButton.textContent = '☀️';
      themeToggleButton.style.color = '#e0e0e0';
      themeToggleButton.style.borderColor = 'rgba(255, 255, 255, 0.3)';
    }
    
    // Update action buttons
    if (wordButton) {
      wordButton.style.color = '#e0e0e0';
      wordButton.style.borderColor = 'rgba(255, 255, 255, 0.3)';
    }
    if (contextButton) {
      contextButton.style.color = '#e0e0e0';
      contextButton.style.borderColor = 'rgba(255, 255, 255, 0.3)';
    }
    
    // Update all cards
    cards.forEach(card => {
      card.style.background = '#3d3d3d';
      card.style.color = '#e0e0e0';
      
      const heading = card.querySelector('h3');
      if (heading) {
        heading.style.color = '#e0e0e0';
      }
      
      const body = card.querySelector('.context-explainer-card-body');
      if (body) {
        if (body.style.color !== '#d32f2f') {
          body.style.color = '#e0e0e0';
        }
      }
      
      const closeButton = card.querySelector('.context-explainer-card-close');
      if (closeButton) {
        closeButton.style.color = '#999';
      }
    });
  } else {
    // Light mode styles
    sidebarContainer.style.background = 'rgba(255, 255, 255, 0.95)';
    sidebarContainer.style.color = '#333';
    
    if (buttonRow) {
      buttonRow.style.backgroundColor = 'rgba(248, 249, 250, 0.95)';
      buttonRow.style.borderBottomColor = 'rgba(0, 0, 0, 0.1)';
    }
    
    if (themeToggleButton) {
      themeToggleButton.textContent = '🌙';
      themeToggleButton.style.color = '#333';
      themeToggleButton.style.borderColor = 'rgba(0, 0, 0, 0.2)';
    }
    
    // Update action buttons
    if (wordButton) {
      wordButton.style.color = '#333';
      wordButton.style.borderColor = 'rgba(0, 0, 0, 0.2)';
    }
    if (contextButton) {
      contextButton.style.color = '#333';
      contextButton.style.borderColor = 'rgba(0, 0, 0, 0.2)';
    }
    
    // Update all cards
    cards.forEach(card => {
      card.style.background = 'white';
      card.style.color = '#333';
      
      const heading = card.querySelector('h3');
      if (heading) {
        heading.style.color = '#333';
      }
      
      const body = card.querySelector('.context-explainer-card-body');
      if (body) {
        if (body.style.color !== '#d32f2f') {
          body.style.color = '#333';
        }
      }
      
      const closeButton = card.querySelector('.context-explainer-card-close');
      if (closeButton) {
        closeButton.style.color = '#999';
      }
    });
  }
}

// Toggle theme between light and dark
function toggleTheme() {
  const newTheme = currentTheme === 'light' ? 'dark' : 'light';
  applyTheme(newTheme);
  
  // Save to storage
  chrome.storage.local.set({ theme: newTheme }).catch(error => {
    console.error('Error saving theme:', error);
  });
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
  
  // Get current theme colors
  const isDark = currentTheme === 'dark';
  const cardBg = isDark ? '#3d3d3d' : 'white';
  const textColor = isDark ? '#e0e0e0' : '#333';
  const headingColor = isDark ? '#e0e0e0' : '#333';
  const bodyColor = isDark ? '#e0e0e0' : '#666';
  const closeColor = '#999';
  const hoverColor = isDark ? '#e0e0e0' : '#333';
  
  // Style the card (position: relative for absolute positioning of close button)
  card.style.cssText = `
    position: relative;
    background: ${cardBg};
    color: ${textColor};
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
      color: ${closeColor};
      cursor: pointer;
      padding: 4px 8px;
      line-height: 1;
      transition: color 150ms ease;
    ">×</button>
    <h3 style="margin: 0 0 8px 0; font-size: 18px; font-weight: 600; color: ${headingColor};">${headingText}</h3>
    <p class="context-explainer-card-body" style="margin: 0; font-size: 14px; color: ${bodyColor}; line-height: 1.5;">Loading explanation...</p>
  `;
  
  // Add hover effect for close button
  const closeButton = card.querySelector('.context-explainer-card-close');
  closeButton.addEventListener('mouseenter', () => {
    closeButton.style.color = hoverColor;
  });
  closeButton.addEventListener('mouseleave', () => {
    closeButton.style.color = closeColor;
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
  
  // Add card to scrollable content area
  if (sidebarContentArea) {
    sidebarContentArea.appendChild(card);
  } else {
    // Fallback to sidebarContainer if content area doesn't exist
    sidebarContainer.appendChild(card);
  }
  
  // Query Ollama API and update card
  const cardBody = card.querySelector('.context-explainer-card-body');
  queryOllama(InitialText || 'Unknown', contextText || '')
    .then(explanation => {
      cardBody.textContent = explanation;
      cardBody.style.color = isDark ? '#e0e0e0' : '#333';
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

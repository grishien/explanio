// Load saved settings
document.addEventListener('DOMContentLoaded', async () => {
  const result = await chrome.storage.sync.get({
    enabled: true,
    popupDelay: 300,
    popupPosition: 'below',
    sidebarTransparency: 95,
    llmProvider: 'ollama',
    ollamaModel: 'llama2',
    ollamaEndpoint: 'http://localhost:11434',
    openrouterApiKey: ''
  });

  document.getElementById('enabled').value = result.enabled.toString();
  document.getElementById('popupDelay').value = result.popupDelay;
  document.getElementById('popupPosition').value = result.popupPosition;
  document.getElementById('sidebarTransparency').value = result.sidebarTransparency;
  document.getElementById('llmProvider').value = result.llmProvider;
  document.getElementById('ollamaModel').value = result.ollamaModel;
  document.getElementById('ollamaEndpoint').value = result.ollamaEndpoint;
  document.getElementById('openrouterApiKey').value = result.openrouterApiKey;
  updateTransparencyDisplay(result.sidebarTransparency);
  updateProviderVisibility(result.llmProvider);
});

// Update transparency value display
document.getElementById('sidebarTransparency').addEventListener('input', (e) => {
  updateTransparencyDisplay(e.target.value);
});

// Update provider visibility when provider changes
document.getElementById('llmProvider').addEventListener('change', (e) => {
  updateProviderVisibility(e.target.value);
});

function updateTransparencyDisplay(value) {
  document.getElementById('transparencyValue').textContent = `${value}%`;
}

function updateProviderVisibility(provider) {
  const modelGroup = document.getElementById('ollamaModelGroup');
  const endpointGroup = document.getElementById('ollamaEndpointGroup');
  const apiKeyGroup = document.getElementById('openrouterApiKeyGroup');
  
  if (provider === 'ollama') {
    modelGroup.style.display = 'block';
    endpointGroup.style.display = 'block';
    apiKeyGroup.style.display = 'none';
  } else if (provider === 'openrouter') {
    modelGroup.style.display = 'none';
    endpointGroup.style.display = 'none';
    apiKeyGroup.style.display = 'block';
  }
}

// Save settings
document.getElementById('saveBtn').addEventListener('click', async () => {
  const enabled = document.getElementById('enabled').value === 'true';
  const popupDelay = parseInt(document.getElementById('popupDelay').value);
  const popupPosition = document.getElementById('popupPosition').value;
  const sidebarTransparency = parseInt(document.getElementById('sidebarTransparency').value);
  const llmProvider = document.getElementById('llmProvider').value;
  const ollamaModel = document.getElementById('ollamaModel').value;
  const ollamaEndpoint = document.getElementById('ollamaEndpoint').value;
  const openrouterApiKey = document.getElementById('openrouterApiKey').value;

  try {
    await chrome.storage.sync.set({
      enabled,
      popupDelay,
      popupPosition,
      sidebarTransparency,
      llmProvider,
      ollamaModel,
      ollamaEndpoint,
      openrouterApiKey
    });

    showStatus('Settings saved successfully!', 'success');

    // Notify content scripts of the change
    const tabs = await chrome.tabs.query({ active: true, currentWindow: true });
    if (tabs[0]) {
      chrome.tabs.sendMessage(tabs[0].id, {
        action: 'settingsUpdated',
        settings: { enabled, popupDelay, popupPosition, sidebarTransparency, llmProvider, ollamaModel, ollamaEndpoint, openrouterApiKey }
      });
    }
  } catch (error) {
    showStatus('Error saving settings: ' + error.message, 'error');
  }
});

function showStatus(message, type) {
  const statusEl = document.getElementById('status');
  statusEl.textContent = message;
  statusEl.className = `status ${type}`;
  statusEl.style.display = 'block';

  setTimeout(() => {
    statusEl.style.display = 'none';
  }, 3000);
}

// Toggle sidebar visibility
document.getElementById('toggleSidebarBtn').addEventListener('click', async () => {
  try {
    const tabs = await chrome.tabs.query({ active: true, currentWindow: true });
    if (tabs[0]) {
      chrome.tabs.sendMessage(tabs[0].id, {
        action: 'toggleSidebar'
      });
      showStatus('Sidebar visibility toggled', 'success');
    } else {
      showStatus('No active tab found', 'error');
    }
  } catch (error) {
    showStatus('Error toggling sidebar: ' + error.message, 'error');
  }
});


// Load saved settings
document.addEventListener('DOMContentLoaded', async () => {
  const result = await chrome.storage.sync.get({
    enabled: true,
    popupDelay: 300,
    popupPosition: 'below',
    sidebarTransparency: 95
  });

  document.getElementById('enabled').value = result.enabled.toString();
  document.getElementById('popupDelay').value = result.popupDelay;
  document.getElementById('popupPosition').value = result.popupPosition;
  document.getElementById('sidebarTransparency').value = result.sidebarTransparency;
  updateTransparencyDisplay(result.sidebarTransparency);
});

// Update transparency value display
document.getElementById('sidebarTransparency').addEventListener('input', (e) => {
  updateTransparencyDisplay(e.target.value);
});

function updateTransparencyDisplay(value) {
  document.getElementById('transparencyValue').textContent = `${value}%`;
}

// Save settings
document.getElementById('saveBtn').addEventListener('click', async () => {
  const enabled = document.getElementById('enabled').value === 'true';
  const popupDelay = parseInt(document.getElementById('popupDelay').value);
  const popupPosition = document.getElementById('popupPosition').value;
  const sidebarTransparency = parseInt(document.getElementById('sidebarTransparency').value);

  try {
    await chrome.storage.sync.set({
      enabled,
      popupDelay,
      popupPosition,
      sidebarTransparency
    });

    showStatus('Settings saved successfully!', 'success');

    // Notify content scripts of the change
    const tabs = await chrome.tabs.query({ active: true, currentWindow: true });
    if (tabs[0]) {
      chrome.tabs.sendMessage(tabs[0].id, {
        action: 'settingsUpdated',
        settings: { enabled, popupDelay, popupPosition, sidebarTransparency }
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


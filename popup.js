// Load saved settings
document.addEventListener('DOMContentLoaded', async () => {
  const result = await chrome.storage.sync.get({
    enabled: true,
    popupDelay: 300,
    popupPosition: 'below'
  });

  document.getElementById('enabled').value = result.enabled.toString();
  document.getElementById('popupDelay').value = result.popupDelay;
  document.getElementById('popupPosition').value = result.popupPosition;
});

// Save settings
document.getElementById('saveBtn').addEventListener('click', async () => {
  const enabled = document.getElementById('enabled').value === 'true';
  const popupDelay = parseInt(document.getElementById('popupDelay').value);
  const popupPosition = document.getElementById('popupPosition').value;

  try {
    await chrome.storage.sync.set({
      enabled,
      popupDelay,
      popupPosition
    });

    showStatus('Settings saved successfully!', 'success');

    // Notify content scripts of the change
    const tabs = await chrome.tabs.query({ active: true, currentWindow: true });
    if (tabs[0]) {
      chrome.tabs.sendMessage(tabs[0].id, {
        action: 'settingsUpdated',
        settings: { enabled, popupDelay, popupPosition }
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


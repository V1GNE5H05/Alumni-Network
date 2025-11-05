/**
 * Toast Notification System
 * Usage: showToast('Your message here', 'success|error|warning|info')
 */

// Create toast container if it doesn't exist
function initToastContainer() {
  if (!document.querySelector('.toast-container')) {
    const container = document.createElement('div');
    container.className = 'toast-container';
    document.body.appendChild(container);
  }
}

/**
 * Show a toast notification
 * @param {string} message - The message to display
 * @param {string} type - Type: 'success', 'error', 'warning', 'info'
 * @param {number} duration - Auto-dismiss duration in ms (0 = no auto-dismiss)
 */
function showToast(message, type = 'success', duration = 3000) {
  initToastContainer();
  
  const container = document.querySelector('.toast-container');
  
  // Create toast element
  const toast = document.createElement('div');
  toast.className = `toast toast-${type}`;
  
  // Icon based on type
  const icons = {
    success: '✅',
    error: '❌',
    warning: '⚠️',
    info: 'ℹ️'
  };
  
  toast.innerHTML = `
    <div class="toast-icon">${icons[type] || icons.info}</div>
    <div class="toast-message">${message}</div>
    <div class="toast-close">×</div>
    ${duration > 0 ? '<div class="toast-progress"></div>' : ''}
  `;
  
  container.appendChild(toast);
  
  // Trigger animation
  setTimeout(() => {
    toast.classList.add('show');
  }, 10);
  
  // Close button handler
  const closeBtn = toast.querySelector('.toast-close');
  closeBtn.addEventListener('click', () => {
    removeToast(toast);
  });
  
  // Auto-dismiss
  if (duration > 0) {
    setTimeout(() => {
      removeToast(toast);
    }, duration);
  }
  
  return toast;
}

/**
 * Remove a toast notification
 * @param {HTMLElement} toast - The toast element to remove
 */
function removeToast(toast) {
  toast.classList.add('hide');
  toast.classList.remove('show');
  
  setTimeout(() => {
    toast.remove();
  }, 300);
}

/**
 * Show success toast
 * @param {string} message - The message to display
 */
function showSuccessToast(message) {
  return showToast(message, 'success');
}

/**
 * Show error toast
 * @param {string} message - The message to display
 */
function showErrorToast(message) {
  return showToast(message, 'error', 4000); // Errors stay longer
}

/**
 * Show warning toast
 * @param {string} message - The message to display
 */
function showWarningToast(message) {
  return showToast(message, 'warning', 3500);
}

/**
 * Show info toast
 * @param {string} message - The message to display
 */
function showInfoToast(message) {
  return showToast(message, 'info');
}

/**
 * Show loading toast (doesn't auto-dismiss)
 * @param {string} message - The message to display
 * @returns {HTMLElement} - The toast element (call removeToast on it when done)
 */
function showLoadingToast(message = 'Loading...') {
  initToastContainer();
  
  const container = document.querySelector('.toast-container');
  
  const toast = document.createElement('div');
  toast.className = 'toast toast-info';
  
  toast.innerHTML = `
    <div class="toast-icon">
      <div class="spinner" style="width: 20px; height: 20px; border: 2px solid rgba(255,255,255,0.3); border-top: 2px solid white; border-radius: 50%; animation: spin 1s linear infinite;"></div>
    </div>
    <div class="toast-message">${message}</div>
  `;
  
  container.appendChild(toast);
  
  setTimeout(() => {
    toast.classList.add('show');
  }, 10);
  
  return toast;
}

// Add spinner animation
const style = document.createElement('style');
style.textContent = `
  @keyframes spin {
    0% { transform: rotate(0deg); }
    100% { transform: rotate(360deg); }
  }
`;
document.head.appendChild(style);

// Initialize on page load
if (document.readyState === 'loading') {
  document.addEventListener('DOMContentLoaded', initToastContainer);
} else {
  initToastContainer();
}

// Make functions globally available
window.showToast = showToast;
window.showSuccessToast = showSuccessToast;
window.showErrorToast = showErrorToast;
window.showWarningToast = showWarningToast;
window.showInfoToast = showInfoToast;
window.showLoadingToast = showLoadingToast;
window.removeToast = removeToast;

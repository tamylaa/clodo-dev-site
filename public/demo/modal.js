/**
 * Modal Module
 * 
 * Simple modal dialog for displaying setup instructions.
 * Customize the content for your product.
 */

// Configuration - update these for your project
const CONFIG = {
    projectName: 'my-project',
    setupCommand: 'npm create my-project',
    gitRepo: 'https://github.com/your-username/your-repo',
    docsUrl: '/docs'
};

/**
 * Show the setup modal
 */
function showSetupModal() {
    const modal = document.getElementById('setup-modal');
    if (modal) {
        modal.style.display = 'flex';
        document.body.style.overflow = 'hidden';
    }
}

/**
 * Hide the setup modal
 */
function hideSetupModal() {
    const modal = document.getElementById('setup-modal');
    if (modal) {
        modal.style.display = 'none';
        document.body.style.overflow = '';
    }
}

/**
 * Copy setup command to clipboard
 */
function copySetupCommand(command) {
    navigator.clipboard.writeText(command || CONFIG.setupCommand).then(() => {
        showCopyFeedback('Command copied!');
    }).catch(err => {
        console.error('Failed to copy:', err);
    });
}

/**
 * Show copy feedback
 */
function showCopyFeedback(message) {
    const feedback = document.createElement('div');
    feedback.className = 'copy-feedback';
    feedback.textContent = message;
    document.body.appendChild(feedback);
    
    setTimeout(() => {
        feedback.remove();
    }, 2000);
}

/**
 * Open documentation
 */
function openDocs() {
    window.open(CONFIG.docsUrl, '_blank');
}

// Export functions for use in HTML
window.showSetupModal = showSetupModal;
window.hideSetupModal = hideSetupModal;
window.copySetupCommand = copySetupCommand;
window.openDocs = openDocs;

// Close modal on escape key
document.addEventListener('keydown', (e) => {
    if (e.key === 'Escape') {
        hideSetupModal();
    }
});

// Close modal when clicking outside
document.addEventListener('click', (e) => {
    const modal = document.getElementById('setup-modal');
    if (e.target === modal) {
        hideSetupModal();
    }
});

// Modal functionality
function showTryModal() {
    // Create modal HTML with embedded styles
    const modalHTML = `
        <style>
            .modal-overlay {
                position: fixed;
                top: 0;
                left: 0;
                right: 0;
                bottom: 0;
                background: rgba(0, 0, 0, 0.85);
                backdrop-filter: blur(4px);
                display: flex;
                align-items: center;
                justify-content: center;
                z-index: 10000;
                animation: modalFadeIn 0.3s ease-out;
            }

            .modal-content {
                background: #fff;
                border: 1px solid #e5e7eb;
                border-radius: 12px;
                max-width: 500px;
                width: 90%;
                max-height: 90vh;
                overflow-y: auto;
                box-shadow: 0 25px 80px rgba(0, 0, 0, 0.4);
                animation: modalSlideIn 0.3s ease-out;
                position: relative;
            }

            .modal-close {
                position: absolute;
                top: 16px;
                right: 16px;
                background: none;
                border: none;
                color: #6b7280;
                cursor: pointer;
                padding: 8px;
                border-radius: 6px;
                transition: all 0.2s;
            }

            .modal-close:hover {
                background: #f3f4f6;
                color: #111827;
            }

            .modal-header {
                padding: 24px 24px 16px;
                border-bottom: 1px solid #e5e7eb;
            }

            .modal-header h2 {
                margin: 0 0 8px 0;
                font-size: 1.5rem;
                font-weight: 600;
            }

            .modal-header p {
                margin: 0;
                color: #6b7280;
                font-size: 0.95rem;
            }

            .modal-body {
                padding: 24px;
            }

            .setup-options {
                display: flex;
                flex-direction: column;
                gap: 12px;
            }

            .setup-option {
                display: flex;
                align-items: center;
                padding: 16px;
                border: 2px solid #e5e7eb;
                border-radius: 8px;
                cursor: pointer;
                transition: all 0.2s;
                background: #fff;
            }

            .setup-option:hover {
                border-color: #667eea;
                background: #f9fafb;
                transform: translateY(-1px);
            }

            .option-icon {
                font-size: 1.5rem;
                margin-right: 16px;
                width: 40px;
                text-align: center;
            }

            .option-content {
                flex: 1;
            }

            .option-content h3 {
                margin: 0 0 4px 0;
                font-size: 1rem;
                font-weight: 600;
            }

            .option-content p {
                margin: 0 0 4px 0;
                color: #6b7280;
                font-size: 0.9rem;
            }

            .option-content code {
                background: #f3f4f6;
                padding: 2px 6px;
                border-radius: 4px;
                font-size: 0.8rem;
                color: #667eea;
            }

            .option-arrow {
                font-size: 1.2rem;
                color: #667eea;
                margin-left: 16px;
            }

            .modal-footer {
                margin-top: 20px;
                padding-top: 16px;
                border-top: 1px solid #e5e7eb;
            }

            .modal-note {
                margin: 0;
                font-size: 0.9rem;
                color: #6b7280;
                text-align: center;
            }

            @keyframes modalFadeIn {
                from { opacity: 0; }
                to { opacity: 1; }
            }

            @keyframes modalSlideIn {
                from {
                    opacity: 0;
                    transform: scale(0.9) translateY(-20px);
                }
                to {
                    opacity: 1;
                    transform: scale(1) translateY(0);
                }
            }

            @media (max-width: 640px) {
                .modal-content {
                    margin: 20px;
                    width: calc(100% - 40px);
                }

                .setup-option {
                    flex-direction: column;
                    text-align: center;
                    gap: 8px;
                }

                .option-icon {
                    margin-right: 0;
                    margin-bottom: 8px;
                }

                .option-arrow {
                    margin-left: 0;
                    margin-top: 8px;
                }
            }
        </style>

        <div id="try-modal" class="modal-overlay" role="dialog" aria-labelledby="try-modal-title" aria-describedby="try-modal-desc">
            <div class="modal-content">
                <button class="modal-close" aria-label="Close modal">
                    <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                        <line x1="18" y1="6" x2="6" y2="18"></line>
                        <line x1="6" y1="6" x2="18" y2="18"></line>
                    </svg>
                </button>

                <div class="modal-header">
                    <h2 id="try-modal-title">🚀 Ready to Build with Clodo?</h2>
                    <p id="try-modal-desc">Great! You've experienced the power of Clodo. Now choose how you'd like to get started:</p>
                </div>

                <div class="modal-body">
                    <div class="setup-options">
                        <div class="setup-option" data-action="powershell">
                            <div class="option-icon">🪟</div>
                            <div class="option-content">
                                <h3>Windows (PowerShell)</h3>
                                <p>Automated setup for Windows users</p>
                                <code>./setup-clodo.ps1 my-app</code>
                            </div>
                            <div class="option-arrow">→</div>
                        </div>

                        <div class="setup-option" data-action="javascript">
                            <div class="option-icon">🌐</div>
                            <div class="option-content">
                                <h3>Cross-platform (Node.js)</h3>
                                <p>Works on Windows, macOS, Linux</p>
                                <code>node setup-clodo.js my-app</code>
                            </div>
                            <div class="option-arrow">→</div>
                        </div>

                        <div class="setup-option" data-action="gitpod">
                            <div class="option-icon">⚙️</div>
                            <div class="option-content">
                                <h3>Full Development Environment</h3>
                                <p>Set up your own Clodo project with Gitpod</p>
                                <code>Requires GitHub login</code>
                            </div>
                            <div class="option-arrow">→</div>
                        </div>
                    </div>

                    <div class="modal-footer">
                        <p class="modal-note">
                            💡 <strong>Pro tip:</strong> All options create a complete working app with API endpoints, database integration, and deployment ready.
                        </p>
                    </div>
                </div>
            </div>
        </div>
    `;

    // Add modal to page
    document.body.insertAdjacentHTML('beforeend', modalHTML);

    // Add event listeners to setup options
    document.querySelectorAll('.setup-option').forEach(option => {
        option.addEventListener('click', function() {
            const action = this.getAttribute('data-action');
            switch(action) {
                case 'powershell':
                    runPowerShellSetup();
                    break;
                case 'javascript':
                    runJSSetup();
                    break;
                case 'gitpod':
                    openGitpod(); // eslint-disable-line no-undef
                    break;
            }
        });
    });

    // Add event listener to close button
    document.querySelector('.modal-close').addEventListener('click', closeTryModal);

    // Focus management
    const modal = document.getElementById('try-modal');
    modal.focus();

    // Close on escape key
    document.addEventListener('keydown', handleModalKeydown);

    // Prevent body scroll
    document.body.style.overflow = 'hidden';
}

function closeTryModal() {
    const modal = document.getElementById('try-modal');
    if (modal) {
        modal.remove();
        document.body.style.overflow = '';
        document.removeEventListener('keydown', handleModalKeydown);
    }
}

function handleModalKeydown(e) {
    if (e.key === 'Escape') {
        closeTryModal();
    }
}

function runPowerShellSetup() {
    // Copy PowerShell command to clipboard
    navigator.clipboard.writeText('./setup-clodo.ps1 my-app').then(() => {
        alert('PowerShell command copied! Run it in your terminal.');
    });
    closeTryModal();
}

function runJSSetup() {
    // Copy Node.js command to clipboard
    navigator.clipboard.writeText('node setup-clodo.js my-app').then(() => {
        alert('Node.js command copied! Run it in your terminal.');
    });
    closeTryModal();
}

// Make showTryModal globally available for demo.js
window.showTryModal = showTryModal;
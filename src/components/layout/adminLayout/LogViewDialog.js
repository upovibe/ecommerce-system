import '@/components/ui/Dialog.js';
import '@/components/ui/Toast.js';

/**
 * Log View Dialog Component
 * 
 * A dialog component for viewing detailed log information
 * 
 * Attributes:
 * - open: boolean - controls dialog visibility
 * 
 * Events:
 * - dialog-closed: Fired when dialog is closed
 */
class LogViewDialog extends HTMLElement {
    constructor() {
        super();
        this.logData = null;
    }

    static get observedAttributes() {
        return ['open'];
    }

    connectedCallback() {
        this.render();
        this.setupEventListeners();
    }

    setupEventListeners() {
        // Listen for close button click
        this.addEventListener('close', () => {
            this.close();
        });
    }

    // Set log data for viewing
    setLogData(logData) {
        this.logData = logData;
        // Re-render the dialog with the new data
        this.render();
    }

    open() {
        this.setAttribute('open', '');
        
        // Call the underlying dialog's open method
        const dialog = this.querySelector('ui-dialog');
        if (dialog) {
            dialog.open();
        }
    }

    close() {
        this.removeAttribute('open');
        
        // Call the underlying dialog's close method
        const dialog = this.querySelector('ui-dialog');
        if (dialog) {
            dialog.close();
        }
    }

    render() {
        if (!this.logData) {
            this.innerHTML = '';
            return;
        }

        const formatDate = (dateString) => {
            return new Date(dateString).toLocaleString();
        };

        const truncateText = (text, maxLength = 100) => {
            if (!text) return 'N/A';
            return text.length > maxLength ? text.substring(0, maxLength) + '...' : text;
        };

        const formatMetadata = (metadata) => {
            if (!metadata) return null;
            try {
                if (typeof metadata === 'string') {
                    return JSON.parse(metadata);
                }
                return metadata;
            } catch (e) {
                return metadata;
            }
        };

        const getActionIcon = (action) => {
            const actionIcons = {
                'user_login': 'fas fa-sign-in-alt',
                'user_logout': 'fas fa-sign-out-alt',
                'user_created': 'fas fa-user-plus',
                'user_updated': 'fas fa-user-edit',
                'user_deleted': 'fas fa-user-times',
                'page_created': 'fas fa-file-plus',
                'page_updated': 'fas fa-file-edit',
                'page_deleted': 'fas fa-file-times',
                'setting_updated': 'fas fa-cog',
                'system_backup': 'fas fa-database',
                'system_restore': 'fas fa-undo',
                'default': 'fas fa-info-circle'
            };
            return actionIcons[action] || actionIcons.default;
        };

        const getActionColor = (action) => {
            const actionColors = {
                'user_login': 'success',
                'user_logout': 'secondary',
                'user_created': 'success',
                'user_updated': 'warning',
                'user_deleted': 'error',
                'page_created': 'success',
                'page_updated': 'warning',
                'page_deleted': 'error',
                'setting_updated': 'info',
                'system_backup': 'success',
                'system_restore': 'warning',
                'default': 'secondary'
            };
            return actionColors[action] || actionColors.default;
        };

        const additionalData = formatMetadata(this.logData.metadata || this.logData.additional_data);

        const dialogHTML = `
            <ui-dialog 
                ${this.hasAttribute('open') ? 'open' : ''} 
                size="lg"
                title="Log Details">
                <div slot="content" class="space-y-6">
                    <!-- Header with Action Badge -->
                    <div class="flex items-center gap-3 border-b pb-4">
                        <div class="flex items-center gap-2">
                            <i class="${getActionIcon(this.logData.action)} text-2xl text-blue-500"></i>
                            <h3 class="text-xl font-semibold text-gray-900">${this.logData.action || 'N/A'}</h3>
                        </div>
                        <ui-badge color="${getActionColor(this.logData.action)}">
                            <i class="fas fa-clock mr-1"></i>${formatDate(this.logData.created_at)}
                        </ui-badge>
                    </div>

                    <!-- Basic Information -->
                    <div class="border-b pb-4">
                        <div class="flex items-center gap-2 mb-3">
                            <i class="fas fa-info-circle text-blue-500"></i>
                            <h4 class="text-md font-semibold text-gray-800">Basic Information</h4>
                        </div>
                        <div class="grid grid-cols-1 md:grid-cols-2 gap-4">
                            <div class="bg-gray-50 p-3 rounded-lg">
                                <label class="block text-sm font-medium text-gray-700 mb-1">
                                    <i class="fas fa-hashtag mr-1"></i>Log ID
                                </label>
                                <span class="text-gray-900 text-sm font-mono">${this.logData.id}</span>
                            </div>
                            
                            <div class="bg-gray-50 p-3 rounded-lg">
                                <label class="block text-sm font-medium text-gray-700 mb-1">
                                    <i class="fas fa-user mr-1"></i>User
                                </label>
                                <span class="text-gray-900 text-sm">${this.logData.user_name || 'System'}</span>
                            </div>
                            
                            <div class="bg-gray-50 p-3 rounded-lg">
                                <label class="block text-sm font-medium text-gray-700 mb-1">
                                    <i class="fas fa-map-marker-alt mr-1"></i>IP Address
                                </label>
                                <span class="text-gray-900 text-sm font-mono">${this.logData.ip_address || 'N/A'}</span>
                            </div>
                            
                            <div class="bg-gray-50 p-3 rounded-lg">
                                <label class="block text-sm font-medium text-gray-700 mb-1">
                                    <i class="fas fa-user-id mr-1"></i>User ID
                                </label>
                                <span class="text-gray-900 text-sm">${this.logData.user_id || 'N/A'}</span>
                            </div>
                        </div>
                    </div>
                    
                    <!-- Description -->
                    <div class="border-b pb-4">
                        <div class="flex items-center gap-2 mb-3">
                            <i class="fas fa-align-left text-green-500"></i>
                            <h4 class="text-md font-semibold text-gray-800">Description</h4>
                        </div>
                        <div class="bg-gray-50 p-4 rounded-lg">
                            <p class="text-gray-900 text-sm leading-relaxed">
                                ${this.logData.description || 'No description available'}
                            </p>
                        </div>
                    </div>
                    
                    <!-- User Agent -->
                    <div class="border-b pb-4">
                        <div class="flex items-center gap-2 mb-3">
                            <i class="fas fa-globe text-purple-500"></i>
                            <h4 class="text-md font-semibold text-gray-800">User Agent</h4>
                        </div>
                        <div class="bg-gray-50 p-3 rounded-lg">
                            <p class="text-gray-900 font-mono text-xs leading-relaxed">
                                ${truncateText(this.logData.user_agent, 300)}
                            </p>
                            ${this.logData.user_agent && this.logData.user_agent.length > 300 ? `
                                <button onclick="this.previousElementSibling.textContent = '${this.logData.user_agent.replace(/'/g, "\\'")}'; this.style.display='none';" 
                                        class="text-blue-500 hover:text-blue-700 text-xs mt-2 px-2 py-1 rounded border border-blue-200 hover:bg-blue-50">
                                    <i class="fas fa-expand mr-1"></i>Show full user agent
                                </button>
                            ` : ''}
                        </div>
                    </div>
                    
                    <!-- Additional Data -->
                    ${additionalData ? `
                        <div>
                            <div class="flex items-center gap-2 mb-3">
                                <i class="fas fa-code text-indigo-500"></i>
                                <h4 class="text-md font-semibold text-gray-800">Additional Data</h4>
                            </div>
                            <div class="bg-gray-50 p-3 rounded-lg">
                                <pre class="whitespace-pre-wrap text-xs text-gray-900 font-mono bg-white p-3 rounded border overflow-x-auto">${JSON.stringify(additionalData, null, 2)}</pre>
                            </div>
                        </div>
                    ` : ''}
                </div>
                <div slot="footer" class="flex justify-end">
                    <ui-button variant="outline" color="secondary" dialog-action="cancel">Close</ui-button>
                </div>
            </ui-dialog>
        `;
        
        this.innerHTML = dialogHTML;
    }
}

customElements.define('log-view-dialog', LogViewDialog);
export default LogViewDialog; 
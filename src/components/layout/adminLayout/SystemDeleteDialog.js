import '@/components/ui/Dialog.js';
import '@/components/ui/Toast.js';
import api from '@/services/api.js';

/**
 * System Delete Dialog Component
 * 
 * A dialog component for confirming system setting deletions in the admin panel
 * 
 * Attributes:
 * - open: boolean - controls dialog visibility
 * 
 * Events:
 * - setting-deleted: Fired when a setting is successfully deleted
 * - dialog-closed: Fired when dialog is closed
 */
class SystemDeleteDialog extends HTMLElement {
    constructor() {
        super();
        this.settingData = null;
    }

    static get observedAttributes() {
        return ['open'];
    }

    connectedCallback() {
        this.render();
        this.setupEventListeners();
    }

    setupEventListeners() {
        // Listen for dialog confirm/cancel events
        this.addEventListener('confirm', () => {
            this.confirmDelete();
        });

        this.addEventListener('cancel', () => {
            this.close();
        });
    }

    open() {
        this.setAttribute('open', '');
    }

    close() {
        this.removeAttribute('open');
        this.settingData = null;
    }

    // Set setting data for deletion
    setSettingData(settingData) {
        this.settingData = settingData;
        // Update the dialog content immediately
        this.updateDialogContent();
    }

    // Update dialog content without full re-render
    updateDialogContent() {
        const contentSlot = this.querySelector('[slot="content"]');
        if (contentSlot && this.settingData) {
            const settingKey = this.settingData.setting_key || 'Unknown';
            const settingValue = this.settingData.setting_value || '';
            const truncatedValue = settingValue.length > 50 ? settingValue.substring(0, 50) + '...' : settingValue;
            
            contentSlot.innerHTML = `
                <p class="text-gray-700 mb-4">
                    Are you sure you want to delete the setting "<strong>${settingKey}</strong>"?
                </p>
                <p class="text-sm text-gray-500 mb-2">
                    <strong>Current Value:</strong> ${truncatedValue}
                </p>
                <p class="text-sm text-gray-500">
                    This action cannot be undone. The setting will be permanently removed.
                </p>
            `;
        }
    }

    // Handle delete confirmation
    async confirmDelete() {
        if (!this.settingData) {
            console.error('❌ No setting data available for deletion');
            Toast.show({
                title: 'Error',
                message: 'No setting data available for deletion',
                variant: 'error',
                duration: 3000
            });
            return;
        }

        try {
            // Get the auth token
            const token = localStorage.getItem('token');
            if (!token) {
                console.error('❌ No authentication token found');
                Toast.show({
                    title: 'Authentication Error',
                    message: 'Please log in to delete settings',
                    variant: 'error',
                    duration: 3000
                });
                return;
            }

            // Store setting ID before deletion
            const settingId = this.settingData.id;

            // Delete the setting
            await api.withToken(token).delete(`/settings/${settingId}`);
            
            Toast.show({
                title: 'Success',
                message: 'Setting deleted successfully',
                variant: 'success',
                duration: 3000
            });

            // Close dialog and dispatch event
            this.close();
            this.dispatchEvent(new CustomEvent('setting-deleted', {
                detail: { settingId: settingId },
                bubbles: true,
                composed: true
            }));

        } catch (error) {
            console.error('❌ Error deleting setting:', error);
            Toast.show({
                title: 'Error',
                message: error.response?.data?.message || 'Failed to delete setting',
                variant: 'error',
                duration: 3000
            });
        }
    }

    render() {
        const settingKey = this.settingData?.setting_key || 'Unknown';
        const settingValue = this.settingData?.setting_value || '';
        const truncatedValue = settingValue.length > 50 ? settingValue.substring(0, 50) + '...' : settingValue;
        
        this.innerHTML = `
            <ui-dialog 
                ${this.hasAttribute('open') ? 'open' : ''} 
                title="Confirm Delete" 
                position="center"
                variant="danger">
                <div slot="content">
                    <p class="text-gray-700 mb-4">
                        Are you sure you want to delete the setting "<strong>${settingKey}</strong>"?
                    </p>
                    <p class="text-sm text-gray-500 mb-2">
                        <strong>Current Value:</strong> ${truncatedValue}
                    </p>
                    <p class="text-sm text-gray-500">
                        This action cannot be undone. The setting will be permanently removed.
                    </p>
                </div>
            </ui-dialog>
        `;
    }
}

customElements.define('system-delete-dialog', SystemDeleteDialog);
export default SystemDeleteDialog;

import '@/components/ui/Dialog.js';
import '@/components/ui/Toast.js';
import api from '@/services/api.js';

/**
 * Life Group Delete Dialog Component
 * 
 * A dialog component for confirming life group deletion in the admin panel
 * 
 * Attributes:
 * - open: boolean - controls dialog visibility
 * 
 * Events:
 * - life-group-deleted: Fired when a life group is successfully deleted
 * - modal-closed: Fired when dialog is closed
 */
class LifeGroupDeleteDialog extends HTMLElement {
    constructor() {
        super();
        this.lifeGroupData = null;
    }

    static get observedAttributes() {
        return ['open'];
    }

    connectedCallback() {
        this.render();
        this.setupEventListeners();
    }

    setupEventListeners() {
        // Listen for confirm button click (Delete Life Group)
        this.addEventListener('confirm', () => {
            this.deleteLifeGroup();
        });

        // Listen for cancel button click
        this.addEventListener('cancel', () => {
            this.close();
        });
    }

    open() {
        this.setAttribute('open', '');
    }

    close() {
        this.removeAttribute('open');
    }

    // Set life group data for deletion
    setLifeGroupData(lifeGroupData) {
        this.lifeGroupData = { ...lifeGroupData };
        this.render();
    }

    // Delete the life group
    async deleteLifeGroup() {
        try {
            if (!this.lifeGroupData || !this.lifeGroupData.id) {
                Toast.show({
                    title: 'Error',
                    message: 'No life group data available for deletion',
                    variant: 'error',
                    duration: 3000
                });
                return;
            }

            // Get the auth token
            const token = localStorage.getItem('token');
            if (!token) {
                Toast.show({
                    title: 'Authentication Error',
                    message: 'Please log in to delete life groups',
                    variant: 'error',
                    duration: 3000
                });
                return;
            }

            // Delete the life group
            const response = await api.withToken(token).delete(`/life-groups/${this.lifeGroupData.id}`);

            if (response.data.success) {
                Toast.show({
                    title: 'Success',
                    message: 'Life group deleted successfully',
                    variant: 'success',
                    duration: 3000
                });

                // Dispatch event with the deleted life group ID
                this.dispatchEvent(new CustomEvent('life-group-deleted', {
                    detail: { lifeGroupId: this.lifeGroupData.id },
                    bubbles: true
                }));

                // Close the dialog
                this.close();
            } else {
                Toast.show({
                    title: 'Error',
                    message: response.data.message || 'Failed to delete life group',
                    variant: 'error',
                    duration: 3000
                });
            }

        } catch (error) {
            console.error('❌ Error deleting life group:', error);
            
            Toast.show({
                title: 'Error',
                message: error.response?.data?.message || 'Failed to delete life group',
                variant: 'error',
                duration: 3000
            });
        }
    }

    render() {
        const lifeGroupTitle = this.lifeGroupData?.title || 'Unknown';
        
        this.innerHTML = `
            <ui-dialog 
                ${this.hasAttribute('open') ? 'open' : ''} 
                title="Delete Life Group" 
                position="center"
                variant="danger">
                <div slot="content">
                    <p class="text-gray-700 mb-4">
                        Are you sure you want to delete the life group "<strong>${lifeGroupTitle}</strong>"?
                    </p>
                    <p class="text-sm text-gray-500">
                        This action cannot be undone. The life group will be permanently deleted from the system.
                    </p>
                </div>
            </ui-dialog>
        `;
    }
}

customElements.define('life-group-delete-dialog', LifeGroupDeleteDialog);
export default LifeGroupDeleteDialog; 
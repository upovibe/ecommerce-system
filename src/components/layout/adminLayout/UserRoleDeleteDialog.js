import '@/components/ui/Dialog.js';
import '@/components/ui/Toast.js';
import api from '@/services/api.js';

/**
 * User Role Delete Dialog Component
 * 
 * A dialog component for confirming user role deletion in the admin panel
 * 
 * Attributes:
 * - open: boolean - controls dialog visibility
 * 
 * Events:
 * - user-role-deleted: Fired when a user role is successfully deleted
 * - modal-closed: Fired when dialog is closed
 */
class UserRoleDeleteDialog extends HTMLElement {
    constructor() {
        super();
        this.roleData = null;
    }

    static get observedAttributes() {
        return ['open'];
    }

    connectedCallback() {
        this.render();
        this.setupEventListeners();
    }

    setupEventListeners() {
        // Listen for confirm button click (Delete)
        this.addEventListener('confirm', () => {
            this.deleteRole();
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
        this.resetForm();
    }

    // Reset form to initial state
    resetForm() {
        this.roleData = null;
        this.render();
    }

    // Set user role data for deletion
    setUserRoleData(roleData) {
        this.roleData = { ...roleData };
        this.render();
    }

    async deleteRole() {
        try {
            if (!this.roleData || !this.roleData.id) {
                Toast.show({
                    title: 'Error',
                    message: 'No role data available for deletion',
                    variant: 'error',
                    duration: 3000
                });
                return;
            }

            // Get auth token
            const token = localStorage.getItem('token');
            if (!token) {
                Toast.show({
                    title: 'Authentication Error',
                    message: 'Please log in to delete user roles',
                    variant: 'error',
                    duration: 3000
                });
                return;
            }

            // Delete role
            const response = await api.withToken(token).delete(`/roles/${this.roleData.id}`);
            
            if (response.data.success) {
                Toast.show({
                    title: 'Success',
                    message: 'User role deleted successfully',
                    variant: 'success',
                    duration: 3000
                });

                // Dispatch event with the deleted role ID
                this.dispatchEvent(new CustomEvent('user-role-deleted', {
                    detail: { userRoleId: this.roleData.id },
                    bubbles: true,
                    composed: true
                }));

                this.close();
            } else {
                throw new Error(response.data.message || 'Failed to delete user role');
            }

        } catch (error) {
            console.error('❌ Error deleting user role:', error);
            Toast.show({
                title: 'Error',
                message: error.response?.data?.message || error.message || 'Failed to delete user role',
                variant: 'error',
                duration: 3000
            });
        }
    }

    render() {
        const roleName = this.roleData?.name || 'Unknown';
        
        this.innerHTML = `
            <ui-dialog 
                ${this.hasAttribute('open') ? 'open' : ''} 
                title="Confirm Delete" 
                position="center"
                variant="danger">
                <div slot="content">
                    <p class="text-gray-700 mb-4">
                        Are you sure you want to delete the user role "<strong>${roleName}</strong>"?
                    </p>
                    <p class="text-sm text-gray-500">
                        This action cannot be undone. The role will be permanently deleted from the system.
                    </p>
                </div>
            </ui-dialog>
        `;
    }
}

customElements.define('user-role-delete-dialog', UserRoleDeleteDialog);
export default UserRoleDeleteDialog; 
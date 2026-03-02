import '@/components/ui/Dialog.js';
import '@/components/ui/Toast.js';
import api from '@/services/api.js';

/**
 * User Delete Dialog Component
 * 
 * A dialog component for confirming user deletion in the admin panel
 * 
 * Attributes:
 * - open: boolean - controls dialog visibility
 * 
 * Events:
 * - user-deleted: Fired when a user is successfully deleted
 * - modal-closed: Fired when dialog is closed
 */
class UserDeleteDialog extends HTMLElement {
    constructor() {
        super();
        this.userData = null;
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
            this.deleteUser();
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
        this.userData = null;
        this.render();
    }

    // Set user data for deletion
    setUserData(userData) {
        this.userData = { ...userData };
        this.render();
    }

    async deleteUser() {
        try {
            if (!this.userData || !this.userData.id) {
                Toast.show({
                    title: 'Error',
                    message: 'No user data available for deletion',
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
                    message: 'Please log in to delete users',
                    variant: 'error',
                    duration: 3000
                });
                return;
            }

            // Delete user
            const response = await api.withToken(token).delete(`/users/${this.userData.id}`);
            
            if (response.data.message) {
                Toast.show({
                    title: 'Success',
                    message: 'User deleted successfully',
                    variant: 'success',
                    duration: 3000
                });

                // Dispatch event with the deleted user ID
                this.dispatchEvent(new CustomEvent('user-deleted', {
                    detail: { userId: this.userData.id },
                    bubbles: true,
                    composed: true
                }));

                this.close();
            } else {
                throw new Error(response.data.message || 'Failed to delete user');
            }

        } catch (error) {
            console.error('❌ Error deleting user:', error);
            Toast.show({
                title: 'Error',
                message: error.response?.data?.message || error.message || 'Failed to delete user',
                variant: 'error',
                duration: 3000
            });
        }
    }

    render() {
        const userName = this.userData?.name || 'Unknown';
        
        this.innerHTML = `
            <ui-dialog 
                ${this.hasAttribute('open') ? 'open' : ''} 
                title="Confirm Delete" 
                position="center"
                variant="danger">
                <div slot="content">
                    <p class="text-gray-700 mb-4">
                        Are you sure you want to delete the user "<strong>${userName}</strong>"?
                    </p>
                    <p class="text-sm text-gray-500">
                        This action cannot be undone. The user and all their data will be permanently removed.
                    </p>
                </div>
            </ui-dialog>
        `;
    }
}

customElements.define('user-delete-dialog', UserDeleteDialog);
export default UserDeleteDialog; 
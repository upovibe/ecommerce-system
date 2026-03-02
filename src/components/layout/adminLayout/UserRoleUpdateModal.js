import '@/components/ui/Modal.js';
import '@/components/ui/Toast.js';
import '@/components/ui/Input.js';
import '@/components/ui/Textarea.js';
import '@/components/ui/Switch.js';
import api from '@/services/api.js';

/**
 * User Role Update Modal Component
 * 
 * A modal component for editing existing user roles in the admin panel
 * 
 * Attributes:
 * - open: boolean - controls modal visibility
 * 
 * Events:
 * - user-role-updated: Fired when a user role is successfully updated
 * - modal-closed: Fired when modal is closed
 */
class UserRoleUpdateModal extends HTMLElement {
    constructor() {
        super();
        this.roleData = null;
        this.originalData = null;
    }

    static get observedAttributes() {
        return ['open'];
    }

    connectedCallback() {
        this.render();
        this.setupEventListeners();
    }

    setupEventListeners() {
        // Listen for confirm button click (Update)
        this.addEventListener('confirm', () => {
            this.updateRole();
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
        this.originalData = null;
        this.render();
    }

    // Set user role data for editing
    setUserRoleData(roleData) {
        this.originalData = { ...roleData };
        this.roleData = {
            id: roleData.id,
            name: roleData.name || '',
            description: roleData.description || ''
        };
        this.render();
    }

    async updateRole() {
        try {
            // Wait a bit for custom elements to be fully initialized
            await new Promise(resolve => setTimeout(resolve, 100));
            
            // Get values from custom UI components directly
            const nameInput = this.querySelector('ui-input');
            const descriptionTextarea = this.querySelector('ui-textarea[name="description"]');
            
            const roleData = {
                name: nameInput ? nameInput.value : '',
                description: descriptionTextarea ? descriptionTextarea.value : ''
            };

            // Validate required fields
            if (!roleData.name.trim()) {
                Toast.show({
                    title: 'Validation Error',
                    message: 'Role name is required',
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
                    message: 'Please log in to update user roles',
                    variant: 'error',
                    duration: 3000
                });
                return;
            }

            // Update role
            const response = await api.withToken(token).put(`/roles/${this.roleData.id}`, roleData);
            
            if (response.data.success) {
                Toast.show({
                    title: 'Success',
                    message: 'User role updated successfully',
                    variant: 'success',
                    duration: 3000
                });

                // Dispatch event with the updated role data
                this.dispatchEvent(new CustomEvent('user-role-updated', {
                    detail: { userRole: response.data.data },
                    bubbles: true,
                    composed: true
                }));

                this.close();
            } else {
                throw new Error(response.data.message || 'Failed to update user role');
            }

        } catch (error) {
            console.error('❌ Error updating user role:', error);
            Toast.show({
                title: 'Error',
                message: error.response?.data?.message || error.message || 'Failed to update user role',
                variant: 'error',
                duration: 3000
            });
        }
    }

    render() {
        if (!this.roleData) {
            this.innerHTML = `
                <ui-modal 
                    title="Edit User Role"
                    size="md"
                    ${this.hasAttribute('open') ? 'open' : ''}>
                    
                    <div class="text-center py-8 text-gray-500">
                        <p>No role data available</p>
                    </div>
                </ui-modal>
            `;
            return;
        }

        this.innerHTML = `
            <ui-modal 
                title="Edit User Role"
                size="md"
                ${this.hasAttribute('open') ? 'open' : ''}>
                
                <form class="space-y-6">
                    <!-- Role Name -->
                    <div>
                        <label for="name" class="block text-sm font-medium text-gray-700 mb-2">
                            Role Name *
                        </label>
                        <ui-input 
                            id="name"
                            name="name"
                            type="text" 
                            placeholder="Enter role name"
                            value="${this.roleData.name}"
                            required
                            class="w-full">
                        </ui-input>
                    </div>

                    <!-- Description -->
                    <div>
                        <label for="description" class="block text-sm font-medium text-gray-700 mb-2">
                            Description
                        </label>
                        <ui-textarea 
                            id="description"
                            name="description"
                            placeholder="Enter role description"
                            rows="3"
                            value="${this.roleData.description}"
                            class="w-full">
                        </ui-textarea>
                    </div>
                </form>
            </ui-modal>
        `;
    }
}

customElements.define('user-role-update-modal', UserRoleUpdateModal);
export default UserRoleUpdateModal; 
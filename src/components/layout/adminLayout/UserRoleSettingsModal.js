import '@/components/ui/Modal.js';
import '@/components/ui/Toast.js';
import '@/components/ui/Input.js';
import '@/components/ui/Textarea.js';
import '@/components/ui/Switch.js';
import api from '@/services/api.js';

/**
 * User Role Settings Modal Component
 * 
 * A modal component for adding new user roles in the admin panel
 * 
 * Attributes:
 * - open: boolean - controls modal visibility
 * 
 * Events:
 * - user-role-saved: Fired when a user role is successfully created
 * - modal-closed: Fired when modal is closed
 */
class UserRoleSettingsModal extends HTMLElement {
    constructor() {
        super();
        this.roleData = {
            name: '',
            description: ''
        };
    }

    static get observedAttributes() {
        return ['open'];
    }

    connectedCallback() {
        this.render();
        this.setupEventListeners();
    }

    setupEventListeners() {
        // Listen for confirm button click (Save)
        this.addEventListener('confirm', () => {
            this.saveRole();
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
        this.roleData = {
            name: '',
            description: ''
        };
        this.render();
    }

    async saveRole() {
        try {
            // Get form data using the UI components - query by order since some components might not be fully initialized
            const allInputs = this.querySelectorAll('ui-input');
            const nameInput = allInputs[0]; // First input
            
            const descriptionTextarea = this.querySelector('ui-textarea[data-field="description"]');

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
                    message: 'Please log in to create user roles',
                    variant: 'error',
                    duration: 3000
                });
                return;
            }

            // Save role
            const response = await api.withToken(token).post('/roles', roleData);
            
            if (response.data.success) {
                Toast.show({
                    title: 'Success',
                    message: 'User role created successfully',
                    variant: 'success',
                    duration: 3000
                });

                // Construct the new role data from response
                const newRole = {
                    id: response.data.data?.id || response.data.id,
                    name: roleData.name,
                    description: roleData.description,
                    created_at: new Date().toISOString().slice(0, 19).replace('T', ' '),
                    updated_at: new Date().toISOString().slice(0, 19).replace('T', ' ')
                };

                // Close modal and dispatch event
                this.close();
                this.dispatchEvent(new CustomEvent('user-role-saved', {
                    detail: { userRole: newRole },
                    bubbles: true,
                    composed: true
                }));
            } else {
                throw new Error(response.data.message || 'Failed to create user role');
            }

        } catch (error) {
            console.error('❌ Error saving user role:', error);
            Toast.show({
                title: 'Error',
                message: error.response?.data?.message || error.message || 'Failed to create user role',
                variant: 'error',
                duration: 3000
            });
        }
    }

    render() {
        this.innerHTML = `
            <ui-modal 
                ${this.hasAttribute('open') ? 'open' : ''} 
                position="right" 
                close-button="true">
                <div slot="title">Add New User Role</div>
                <form id="role-form" class="space-y-4">
                    <div>
                        <label class="block text-sm font-medium text-gray-700 mb-1">Role Name</label>
                        <ui-input 
                            data-field="name"
                            type="text" 
                            placeholder="Enter role name"
                            class="w-full">
                        </ui-input>
                    </div>
                    
                    <div>
                        <label class="block text-sm font-medium text-gray-700 mb-1">Description</label>
                        <ui-textarea 
                            data-field="description"
                            placeholder="Enter role description"
                            rows="3"
                            class="w-full">
                        </ui-textarea>
                    </div>
                </form>
            </ui-modal>
        `;
    }
}

customElements.define('user-role-settings-modal', UserRoleSettingsModal);
export default UserRoleSettingsModal; 
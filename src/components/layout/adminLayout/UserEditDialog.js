import '@/components/ui/Dialog.js';
import '@/components/ui/Toast.js';
import '@/components/ui/Input.js';
import '@/components/ui/Dropdown.js';
import api from '@/services/api.js';

/**
 * User Edit Dialog Component
 * 
 * A dialog component for editing existing users in the admin panel
 * 
 * Attributes:
 * - open: boolean - controls dialog visibility
 * 
 * Events:
 * - user-updated: Fired when a user is successfully updated
 * - dialog-closed: Fired when dialog is closed
 */
class UserEditDialog extends HTMLElement {
    constructor() {
        super();
        this.userData = null;
        this.originalData = null;
        this.roles = [];
    }

    static get observedAttributes() {
        return ['open'];
    }

    connectedCallback() {
        this.render();
        this.setupEventListeners();
    }

    attributeChangedCallback(name, oldValue, newValue) {
        if (name === 'open' && newValue !== null && oldValue === null) {
            // Dialog is being opened
            this.loadRoles();
        }
    }

    setupEventListeners() {
        // Listen for dialog events
        this.addEventListener('confirm', () => {
            this.updateUser();
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
        this.resetForm();
    }

    // Reset form to initial state
    resetForm() {
        this.userData = null;
        this.originalData = null;
        this.render();
    }

    // Set user data for editing
    setUserData(userData) {
        this.originalData = { ...userData };
        this.userData = {
            id: userData.id,
            name: userData.name || '',
            email: userData.email || '',
            role_id: userData.role_id || '',
            status: userData.status || 'active'
        };
        this.render();
    }

    async loadRoles() {
        try {
            const token = localStorage.getItem('token');
            if (!token) return;

            const response = await api.withToken(token).get('/roles');
            // Handle both response formats (direct array or wrapped in data)
            this.roles = response.data.data || response.data || [];
            this.render();
        } catch (error) {
            console.error('❌ Error loading roles:', error);
            Toast.show({
                title: 'Error',
                message: 'Failed to load roles',
                variant: 'error',
                duration: 3000
            });
        }
    }

    async updateUser() {
        try {
            // Get form data using the UI components with unique IDs
            const nameInput = this.querySelector('#user-edit-name-input');
            const emailInput = this.querySelector('#user-edit-email-input');
            const roleDropdown = this.querySelector('#user-edit-role-dropdown');
            const statusDropdown = this.querySelector('#user-edit-status-dropdown');
            const passwordInput = this.querySelector('#user-edit-password-input');
            
            const userData = {
                name: nameInput ? nameInput.value : '',
                email: emailInput ? emailInput.value : '',
                role_id: roleDropdown ? roleDropdown.value : '',
                status: statusDropdown ? statusDropdown.value : 'active'
            };

            // Add password only if provided
            if (passwordInput && passwordInput.value.trim()) {
                userData.password = passwordInput.value.trim();
            }

            // Validate required fields
            if (!userData.name?.trim()) {
                Toast.show({
                    title: 'Validation Error',
                    message: 'Name is required',
                    variant: 'error',
                    duration: 3000
                });
                return;
            }

            if (!userData.email?.trim()) {
                Toast.show({
                    title: 'Validation Error',
                    message: 'Email is required',
                    variant: 'error',
                    duration: 3000
                });
                return;
            }

            if (!userData.role_id) {
                Toast.show({
                    title: 'Validation Error',
                    message: 'Role is required',
                    variant: 'error',
                    duration: 3000
                });
                return;
            }

            // Validate password if provided
            if (userData.password && userData.password.length < 8) {
                Toast.show({
                    title: 'Validation Error',
                    message: 'Password must be at least 8 characters long',
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
                    message: 'Please log in to update users',
                    variant: 'error',
                    duration: 3000
                });
                return;
            }

            // Show loading toast
            Toast.show({
                title: 'Updating User',
                message: 'Please wait...',
                variant: 'info',
                duration: 3000
            });

            // Update user
            const response = await api.withToken(token).put(`/users/${this.userData.id}`, userData);
            
            if (response.data.message) {
                Toast.show({
                    title: 'Success',
                    message: 'User updated successfully',
                    variant: 'success',
                    duration: 3000
                });

                // Construct the updated user data
                const updatedUser = {
                    id: this.userData.id,
                    name: userData.name,
                    email: userData.email,
                    role_id: userData.role_id,
                    role: this.roles.find(r => r.id == userData.role_id)?.name || 'N/A',
                    status: userData.status,
                    created_at: this.originalData.created_at,
                    updated_at: new Date().toISOString().slice(0, 19).replace('T', ' ')
                };

                // Close dialog and dispatch event
                this.close();
                this.dispatchEvent(new CustomEvent('user-updated', {
                    detail: { user: updatedUser },
                    bubbles: true,
                    composed: true
                }));
            } else {
                throw new Error(response.data.message || 'Failed to update user');
            }

        } catch (error) {
            console.error('❌ Error updating user:', error);
            Toast.show({
                title: 'Error',
                message: error.response?.data?.message || error.message || 'Failed to update user',
                variant: 'error',
                duration: 3000
            });
        }
    }

    render() {
        if (!this.userData) {
            this.innerHTML = `
                <ui-dialog 
                    ${this.hasAttribute('open') ? 'open' : ''} 
                    title="Edit User"
                    position="center">
                    <div slot="content">
                        <div class="text-center py-8 text-gray-500">
                            <p>No user data available</p>
                        </div>
                    </div>
                </ui-dialog>
            `;
            return;
        }

        this.innerHTML = `
            <ui-dialog 
                ${this.hasAttribute('open') ? 'open' : ''} 
                title="Edit User"
                position="center">
                <div slot="content">
                    <form id="user-edit-form" class="space-y-4">
                        <div>
                            <label class="block text-sm font-medium text-gray-700 mb-2">Role *</label>
                            <ui-dropdown 
                                id="user-edit-role-dropdown"
                                name="role_id"
                                placeholder="Select role"
                                value="${this.userData.role_id}"
                                required>
                                ${(this.roles || []).map(role => `
                                    <ui-option value="${role.id}">${role.name}</ui-option>
                                `).join('')}
                            </ui-dropdown>
                        </div>
                        
                        <div>
                            <label class="block text-sm font-medium text-gray-700 mb-2">Name *</label>
                            <ui-input 
                                id="user-edit-name-input"
                                type="text" 
                                name="name"
                                placeholder="Enter user name"
                                value="${this.userData.name}"
                                required>
                            </ui-input>
                        </div>
                        
                        <div>
                            <label class="block text-sm font-medium text-gray-700 mb-2">Email *</label>
                            <ui-input 
                                id="user-edit-email-input"
                                type="email" 
                                name="email"
                                placeholder="Enter user email"
                                value="${this.userData.email}"
                                required>
                            </ui-input>
                        </div>
                        
                        <div>
                            <label class="block text-sm font-medium text-gray-700 mb-2">New Password (Optional)</label>
                            <ui-input 
                                id="user-edit-password-input"
                                type="password" 
                                name="password"
                                placeholder="Enter new password (leave empty to keep current)"
                                minlength="8">
                            </ui-input>
                            <p class="text-xs text-gray-500 mt-1">
                                Leave empty to keep current password, or enter a new password (min 8 characters)
                            </p>
                        </div>

                        <div>
                            <label class="block text-sm font-medium text-gray-700 mb-2">Account Status *</label>
                            <ui-dropdown 
                                id="user-edit-status-dropdown"
                                name="status"
                                placeholder="Select status"
                                value="${this.userData.status}"
                                required>
                                <ui-option value="active">Active</ui-option>
                                <ui-option value="inactive">Inactive</ui-option>
                            </ui-dropdown>
                        </div>
                    </form>
                    
                    <!-- Information Notice -->
                    <div class="mt-6 p-4 bg-green-50 border border-green-200 rounded-lg">
                        <div class="flex items-start">
                            <div class="flex-shrink-0">
                                <i class="fas fa-info-circle text-green-400 text-lg"></i>
                            </div>
                            <div class="ml-3">
                                <h4 class="text-sm font-medium text-green-800 mb-2">Update Information</h4>
                                <ul class="text-sm text-green-700 space-y-1">
                                    <li class="flex items-start">
                                        <i class="fas fa-check text-green-500 text-xs mt-1 mr-2"></i>
                                        User's login credentials will remain unchanged
                                    </li>
                                    <li class="flex items-start">
                                        <i class="fas fa-check text-green-500 text-xs mt-1 mr-2"></i>
                                        Name, email, role, and account status will be updated
                                    </li>
                                    <li class="flex items-start">
                                        <i class="fas fa-key text-green-500 text-xs mt-1 mr-2"></i>
                                        <strong>Password: Leave empty to keep current, or enter new password (min 8 chars)</strong>
                                    </li>
                                    <li class="flex items-start">
                                        <i class="fas fa-user-check text-green-500 text-xs mt-1 mr-2"></i>
                                        <strong>Active users can log in, inactive users cannot</strong>
                                    </li>
                                    <li class="flex items-start">
                                        <i class="fas fa-envelope text-green-500 text-xs mt-1 mr-2"></i>
                                        Email notification will be sent to the user about any changes made
                                    </li>
                                    <li class="flex items-start">
                                        <i class="fas fa-shield-alt text-green-500 text-xs mt-1 mr-2"></i>
                                        User will be notified of specific changes for security awareness
                                    </li>
                                </ul>
                            </div>
                        </div>
                    </div>
                </div>
            </ui-dialog>
        `;
    }
}

customElements.define('user-edit-dialog', UserEditDialog);
export default UserEditDialog; 
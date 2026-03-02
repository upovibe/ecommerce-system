import '@/components/ui/Dialog.js';
import '@/components/ui/Button.js';
import '@/components/ui/Input.js';
import '@/components/ui/Toast.js';
/**
 * Password Change Dialog Component
 * 
 * A dialog component that shows when a user needs to change their password.
 * This component is used in the dashboard layout when requiresPasswordChange is true.
 */

class PasswordChangeDialog extends HTMLElement {
    constructor() {
        super();
        this.formData = {
            currentPassword: '',
            newPassword: '',
            confirmPassword: ''
        };
        this.isSubmitting = false;
    }

    connectedCallback() {
        this.render();
        // Add a small delay to ensure Input components are properly initialized
        setTimeout(() => {
            this.ensureInputInitialization();
        }, 100);
    }

    ensureInputInitialization() {
        // Force re-initialization of Input components if needed
        const inputs = this.querySelectorAll('ui-input');
        inputs.forEach(input => {
            if (input.type === 'password' && !input.querySelector('.toggle-password')) {
                // Re-initialize the input component
                input.connectedCallback();
            }
        });
    }

    handleInputChange(field, value) {
        this.formData[field] = value;
    }

    async handleSubmit() {
        if (this.isSubmitting) return;

        // Validate form
        if (!this.formData.currentPassword || !this.formData.newPassword || !this.formData.confirmPassword) {
            Toast.show({
                title: 'Validation Error',
                message: 'All fields are required',
                variant: 'error',
                duration: 3000
            });
            return;
        }

        if (this.formData.newPassword !== this.formData.confirmPassword) {
            Toast.show({
                title: 'Validation Error',
                message: 'New password and confirm password do not match',
                variant: 'error',
                duration: 3000
            });
            return;
        }

        if (this.formData.newPassword.length < 8) {
            Toast.show({
                title: 'Validation Error',
                message: 'New password must be at least 8 characters long',
                variant: 'error',
                duration: 3000
            });
            return;
        }

        this.isSubmitting = true;
        this.updateSubmitButton();

        try {
            const userData = JSON.parse(localStorage.getItem('userData') || '{}');
            const token = localStorage.getItem('token');

            const response = await fetch(`/api/users/${userData.id}/change-password`, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    'Authorization': `Bearer ${token}`
                },
                body: JSON.stringify({
                    current_password: this.formData.currentPassword,
                    new_password: this.formData.newPassword,
                    confirm_password: this.formData.confirmPassword
                })
            });

            const result = await response.json();

            if (response.ok) {
                Toast.show({
                    title: 'Success',
                    message: 'Password changed successfully. You will be logged out to login with your new password.',
                    variant: 'success',
                    duration: 3000
                });

                // Clear the password change requirement flag
                localStorage.removeItem('requiresPasswordChange');

                // Wait a moment then logout
                setTimeout(() => {
                    this.handleLogout();
                }, 2000);
            } else {
                Toast.show({
                    title: 'Error',
                    message: result.error || 'Failed to change password',
                    variant: 'error',
                    duration: 3000
                });
            }
        } catch (error) {
            console.error('Password change error:', error);
            Toast.show({
                title: 'Error',
                message: 'Network error occurred. Please try again.',
                variant: 'error',
                duration: 3000
            });
        } finally {
            this.isSubmitting = false;
            this.updateSubmitButton();
        }
    }

    async handleLogout() {
        try {
            const token = localStorage.getItem('token');
            if (token) {
                await fetch('/api/auth/logout', {
                    method: 'POST',
                    headers: {
                        'Authorization': `Bearer ${token}`,
                        'Content-Type': 'application/json'
                    }
                });
            }
        } catch (error) {
            console.warn('Error calling logout API:', error);
        }
        
        // Clear all auth data
        localStorage.removeItem('userData');
        localStorage.removeItem('token');
        localStorage.removeItem('requiresPasswordChange');
        
        // Redirect to login
        window.location.href = '/auth/login';
    }

    updateSubmitButton() {
        const submitButton = this.querySelector('[data-submit-button]');
        if (submitButton) {
            submitButton.disabled = this.isSubmitting;
            submitButton.innerHTML = this.isSubmitting ? 
                '<i class="fas fa-spinner fa-spin mr-2"></i>Changing...' : 
                'Change';
            
            // Update button styling based on state
            if (this.isSubmitting) {
                submitButton.classList.add('opacity-50', 'cursor-not-allowed');
                submitButton.classList.remove('hover:bg-blue-700');
            } else {
                submitButton.classList.remove('opacity-50', 'cursor-not-allowed');
                submitButton.classList.add('hover:bg-blue-700');
            }
        }
    }

    render() {
        this.innerHTML = `
            <ui-dialog open title="Password Change Required" no-footer>
                <div slot="content">
                    <div class="text-center mb-6">
                        <div class="mx-auto flex items-center justify-center h-12 w-12 rounded-full bg-yellow-100 mb-4">
                            <i class="fas fa-exclamation-triangle text-yellow-600 text-xl"></i>
                        </div>
                        <p class="text-sm text-gray-500 mb-2">You haven't changed your password yet</p>
                        <p class="text-xs text-gray-400">Please change your password to continue using the system</p>
                    </div>

                    <form class="space-y-4" onsubmit="event.preventDefault(); this.closest('auth-password-change-dialog').handleSubmit();">
                        <div>
                            <label for="currentPassword" class="block text-sm font-medium text-gray-700 mb-1">
                                Current Password
                            </label>
                            <ui-input
                                type="password"
                                id="currentPassword"
                                placeholder="Enter your current password"
                                required
                                class="w-full"
                                oninput="this.closest('auth-password-change-dialog').handleInputChange('currentPassword', this.value)"
                            ></ui-input>
                        </div>

                        <div>
                            <label for="newPassword" class="block text-sm font-medium text-gray-700 mb-1">
                                New Password
                            </label>
                            <ui-input
                                type="password"
                                id="newPassword"
                                placeholder="Enter your new password"
                                required
                                minlength="8"
                                class="w-full"
                                oninput="this.closest('auth-password-change-dialog').handleInputChange('newPassword', this.value)"
                            ></ui-input>
                            <p class="text-xs text-gray-500 mt-1">Password must be at least 8 characters long</p>
                        </div>

                        <div>
                            <label for="confirmPassword" class="block text-sm font-medium text-gray-700 mb-1">
                                Confirm New Password
                            </label>
                            <ui-input
                                type="password"
                                id="confirmPassword"
                                placeholder="Confirm your new password"
                                required
                                class="w-full"
                                oninput="this.closest('auth-password-change-dialog').handleInputChange('confirmPassword', this.value)"
                            ></ui-input>
                        </div>
                    </form>
                </div>
                
                <div slot="footer">
                    <div class="flex justify-end space-x-3">
                        <button
                            type="button"
                            onclick="this.closest('auth-password-change-dialog').handleLogout()"
                            class="px-4 py-1 bg-red-600 text-white  rounded-md hover:bg-red-700 transition-colors"
                        >
                            Logout
                        </button>
                        <button
                            type="submit"
                            data-submit-button
                            onclick="this.closest('auth-password-change-dialog').handleSubmit()"
                            class="px-4 py-1 bg-blue-600 text-white rounded-md hover:bg-blue-700 transition-colors"
                        >
                            Change
                        </button>
                    </div>
                </div>
            </ui-dialog>
        `;
    }
}

customElements.define('auth-password-change-dialog', PasswordChangeDialog);
export default PasswordChangeDialog; 
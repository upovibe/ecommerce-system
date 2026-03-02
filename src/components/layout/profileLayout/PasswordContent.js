import App from '@/core/App.js';
import api from '@/services/api.js';
import '@/components/ui/Toast.js';
import '@/components/ui/Button.js';
import '@/components/ui/Input.js';
import '@/components/ui/Dialog.js';
import '@/components/layout/authLayout/PasswordChangeDialog.js';

/**
 * Password Content Component
 * 
 * This component contains the password change functionality.
 * It's designed to be used within a tab panel in the profile page.
 */
class PasswordContent extends App {
    constructor() {
        super();
        this.userData = null;
        this.isLoading = true;
    }

    connectedCallback() {
        super.connectedCallback();
        this.loadUserProfile();
        this.setupEventListeners();
    }

    async loadUserProfile() {
        try {
            this.set('isLoading', true);
            
            // Get current user ID from localStorage
            const userData = JSON.parse(localStorage.getItem('userData') || '{}');
            const userId = userData.id;
            
            if (!userId) {
                throw new Error('User ID not found');
            }

            const token = localStorage.getItem('token');
            const response = await api.withToken(token).get(`/users/${userId}/profile`);
            
            this.userData = response.data;
            this.set('userData', this.userData);
            this.set('isLoading', false);
        } catch (error) {
            console.error('Error loading profile:', error);
            Toast.show({
                title: 'Error',
                message: 'Failed to load profile data',
                variant: 'error',
                duration: 5000
            });
            this.set('isLoading', false);
        }
    }

    setupEventListeners() {
        this.addEventListener('click', (e) => {
            const changePasswordButton = e.target.closest('[data-action="change-password"]');
            if (changePasswordButton) {
                e.preventDefault();
                this.showChangePasswordDialog();
            }
        });
    }

    showChangePasswordDialog() {
        // Create and show password change dialog
        const dialog = document.createElement('auth-password-change-dialog');
        document.body.appendChild(dialog);
    }

    render() {
        if (this.get('isLoading')) {
            return `
                <div class="flex items-center justify-center min-h-96">
                    <div class="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
                </div>
            `;
        }

        const user = this.get('userData');

        if (!user) {
            return `
                <div class="flex items-center justify-center min-h-96">
                    <div class="text-center">
                        <div class="text-gray-500 text-lg mb-2">Profile not found</div>
                        <button onclick="window.location.reload()" class="text-blue-600 hover:text-blue-800">
                            Try again
                        </button>
                    </div>
                </div>
            `;
        }

        return `
            <div class="space-y-6">
                <!-- Password Security Section -->
                <div class="bg-white shadow rounded-lg p-6">
                    <div class="flex items-center justify-between mb-6">
                        <h2 class="text-xl font-semibold text-gray-900">Password Security</h2>
                        <ui-button 
                            data-action="change-password"
                            variant="outline"
                            size="sm"
                            class="hover:bg-gray-50 hover:border-gray-300 transition-all duration-200"
                        >
                            <i class="fas fa-key mr-2"></i>
                            Change Password
                        </ui-button>
                    </div>

                    <div class="space-y-6">
                        <!-- Current Password Status -->
                        <div class="flex items-center space-x-3 p-4 bg-gradient-to-r from-green-50 to-emerald-50 border border-green-200 rounded-lg">
                            <div class="flex-shrink-0 w-10 h-10 bg-green-100 rounded-lg flex items-center justify-center">
                                <i class="fas fa-shield-alt text-green-600 text-lg"></i>
                            </div>
                            <div class="flex-1">
                                <div class="text-gray-900 font-semibold">Password Protected</div>
                                <div class="text-sm text-gray-600">Your account is secured with a password</div>
                            </div>
                            <div class="flex-shrink-0">
                                <div class="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-green-100 text-green-800">
                                    Active
                                </div>
                            </div>
                        </div>

                        <!-- Password Requirements -->
                        <div class="bg-gray-50 rounded-lg p-4">
                            <h3 class="text-sm font-medium text-gray-900 mb-3">Password Requirements</h3>
                            <div class="grid grid-cols-1 md:grid-cols-2 gap-3 text-sm text-gray-600">
                                <div class="flex items-center space-x-2">
                                    <i class="fas fa-check text-green-500"></i>
                                    <span>At least 8 characters long</span>
                                </div>
                                <div class="flex items-center space-x-2">
                                    <i class="fas fa-check text-green-500"></i>
                                    <span>Contains uppercase and lowercase letters</span>
                                </div>
                                <div class="flex items-center space-x-2">
                                    <i class="fas fa-check text-green-500"></i>
                                    <span>Includes numbers and special characters</span>
                                </div>
                                <div class="flex items-center space-x-2">
                                    <i class="fas fa-check text-green-500"></i>
                                    <span>Not easily guessable</span>
                                </div>
                            </div>
                        </div>

                        <!-- Security Tips -->
                        <div class="bg-blue-50 rounded-lg p-4">
                            <h3 class="text-sm font-medium text-blue-900 mb-2">Security Tips</h3>
                            <ul class="text-sm text-blue-800 space-y-1">
                                <li>• Change your password regularly</li>
                                <li>• Never share your password with anyone</li>
                                <li>• Use a unique password for this account</li>
                                <li>• Enable two-factor authentication if available</li>
                            </ul>
                        </div>
                    </div>
                </div>

                <!-- Account Security Info -->
                <div class="bg-white shadow rounded-lg p-6">
                    <h2 class="text-lg font-semibold text-gray-900 mb-4">Account Security</h2>
                    <div class="space-y-4">
                        <!-- Last Password Change -->
                        <div class="flex items-center space-x-3 p-3 bg-gradient-to-r from-indigo-50 to-purple-50 border border-indigo-200 rounded-lg">
                            <div class="flex-shrink-0 w-8 h-8 bg-indigo-100 rounded-lg flex items-center justify-center">
                                <i class="fas fa-clock text-indigo-600 text-sm"></i>
                            </div>
                            <div>
                                <div class="text-gray-900 font-semibold">Last Password Change</div>
                                <div class="text-xs text-gray-500">
                                    ${user.password_changed_at ? 
                                        new Date(user.password_changed_at).toLocaleDateString('en-US', { 
                                            year: 'numeric', 
                                            month: 'long', 
                                            day: 'numeric' 
                                        }) : 'Not available'}
                                </div>
                            </div>
                        </div>

                        <!-- Account Status -->
                        <div class="flex items-center space-x-3 p-3 bg-gradient-to-r from-${user.status === 'active' ? 'green' : 'red'}-50 to-${user.status === 'active' ? 'emerald' : 'pink'}-50 border border-${user.status === 'active' ? 'green' : 'red'}-200 rounded-lg">
                            <div class="flex-shrink-0 w-8 h-8 bg-${user.status === 'active' ? 'green' : 'red'}-100 rounded-lg flex items-center justify-center">
                                <i class="fas fa-${user.status === 'active' ? 'check-circle' : 'times-circle'} text-${user.status === 'active' ? 'green' : 'red'}-600 text-sm"></i>
                            </div>
                            <div>
                                <div class="text-gray-900 font-semibold">Account Status</div>
                                <div class="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${
                                    user.status === 'active' ? 'bg-green-100 text-green-800' : 
                                    user.status === 'inactive' ? 'bg-red-100 text-red-800' : 
                                    'bg-gray-100 text-gray-800'
                                }">
                                    ${user.status || 'Unknown'}
                                </div>
                            </div>
                        </div>
                    </div>
                </div>
            </div>
        `;
    }
}

customElements.define('password-content', PasswordContent);
export default PasswordContent; 
import App from '@/core/App.js';
import api from '@/services/api.js';
import '@/components/ui/Toast.js';
import '@/components/ui/Button.js';
import '@/components/ui/Input.js';
import '@/components/ui/Avatar.js';
import '@/components/ui/Dialog.js';
import '@/components/ui/ProfileImageUploader.js';
import '@/components/layout/skeletonLoaders/ProfileContentSkeleton.js';
import '@/components/layout/authLayout/PasswordChangeDialog.js';

/**
 * Profile Content Component
 * 
 * This component contains the profile information and editing functionality.
 * It's designed to be used within a tab panel in the profile page.
 */
class ProfileContent extends App {
    constructor() {
        super();
        this.userData = null;
        this.isLoading = true;
        this.isSaving = false;
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
            const editButton = e.target.closest('[data-action="edit-profile"]');
            if (editButton) {
                e.preventDefault();
                this.showEditProfileDialog();
            }


        });

        // Listen for profile image upload events
        this.addEventListener('preview', (e) => {
            if (e.target.tagName === 'UI-PROFILE-IMAGE-UPLOADER') {
                // Show preview notification
                Toast.show({
                    title: 'Image Selected',
                    message: 'Click the check icon to confirm upload',
                    variant: 'info',
                    duration: 3000
                });
            }
        });

        this.addEventListener('upload-success', (e) => {
            if (e.target.tagName === 'UI-PROFILE-IMAGE-UPLOADER') {
                this.handleUploadSuccess(e.detail);
            }
        });

        this.addEventListener('upload-error', (e) => {
            if (e.target.tagName === 'UI-PROFILE-IMAGE-UPLOADER') {
                this.handleUploadError(e.detail);
            }
        });
    }

    showEditProfileDialog() {
        // Create and show edit profile dialog
        const dialog = document.createElement('ui-dialog');
        dialog.setAttribute('title', 'Edit Profile');
        dialog.setAttribute('open', '');
        dialog.setAttribute('no-footer', '');
        
        // Create form content
        const formContent = document.createElement('div');
        formContent.setAttribute('slot', 'content');
        formContent.className = 'space-y-4';
        formContent.innerHTML = `
            <div>
                <label class="block text-sm font-medium text-gray-700 mb-2">Full Name</label>
                <ui-input 
                    type="text" 
                    value="${this.userData.name || ''}"
                    placeholder="Enter your full name"
                    size="md"
                    id="edit-name"
                ></ui-input>
            </div>
            <div>
                <label class="block text-sm font-medium text-gray-700 mb-2">Email Address</label>
                <ui-input 
                    type="email" 
                    value="${this.userData.email || ''}"
                    placeholder="Enter your email"
                    size="md"
                    id="edit-email"
                ></ui-input>
            </div>
        `;
        
        // Create custom footer with buttons
        const footerContent = document.createElement('div');
        footerContent.setAttribute('slot', 'footer');
        footerContent.innerHTML = `
            <div class="flex justify-end space-x-3">
                <button
                    type="button"
                    id="cancel-btn"
                    class="px-4 py-2 bg-gray-500 text-white rounded-md hover:bg-gray-600 transition-colors"
                >
                    Cancel
                </button>
                <button
                    type="submit"
                    id="save-btn"
                    data-submit-button
                    class="px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 transition-colors"
                >
                    Save Changes
                </button>
            </div>
        `;
        
        // Add content to dialog
        dialog.appendChild(formContent);
        dialog.appendChild(footerContent);
        
        // Add dialog to body
        document.body.appendChild(dialog);
        
        // Set up event listeners after dialog is in DOM
        setTimeout(() => {
            const saveBtn = dialog.querySelector('#save-btn');
            const cancelBtn = dialog.querySelector('#cancel-btn');
            
            if (saveBtn) {
                saveBtn.addEventListener('click', () => this.saveProfileFromDialog(dialog));
            }
            
            if (cancelBtn) {
                cancelBtn.addEventListener('click', () => {
                    dialog.remove();
                });
            }
            
            // Listen for dialog close event
            dialog.addEventListener('dialog-close', () => {
                dialog.remove();
            });
        }, 100);
    }

    async saveProfileFromDialog(dialog) {
        try {
            const nameInput = dialog.querySelector('#edit-name');
            const emailInput = dialog.querySelector('#edit-email');
            const saveBtn = dialog.querySelector('#save-btn');
            
            const updatedData = {
                name: nameInput.value,
                email: emailInput.value
            };
            
            // Update button state
            this.set('isSaving', true);
            if (saveBtn) {
                saveBtn.disabled = true;
                saveBtn.innerHTML = '<i class="fas fa-spinner fa-spin mr-2"></i>Saving...';
                saveBtn.classList.add('opacity-50', 'cursor-not-allowed');
                saveBtn.classList.remove('hover:bg-blue-700');
            }
            
            const userId = this.userData.id;
            const token = localStorage.getItem('token');
            
            const response = await api.withToken(token).put(`/users/${userId}/profile`, updatedData);
            
            // Update local storage with new data
            const updatedUserData = { ...this.userData, ...updatedData };
            localStorage.setItem('userData', JSON.stringify(updatedUserData));
            
            this.userData = updatedUserData;
            this.set('userData', this.userData);
            
            // Close dialog
            dialog.remove();
            
            Toast.show({
                title: 'Success',
                message: 'Profile updated successfully',
                variant: 'success',
                duration: 3000
            });
        } catch (error) {
            console.error('Error saving profile:', error);
            const errorMessage = error.response?.data?.error || 'Failed to update profile';
            Toast.show({
                title: 'Error',
                message: errorMessage,
                variant: 'error',
                duration: 5000
            });
        } finally {
            this.set('isSaving', false);
        }
    }





    // Helper method to get proper image URL (same as PageViewModal)
    getImageUrl(imagePath) {
        if (!imagePath) return null;
        
        // If it's already a full URL, return as is
        if (imagePath.startsWith('http://') || imagePath.startsWith('https://')) {
            return imagePath;
        }
        
        // If it's a relative path starting with /, construct the full URL
        if (imagePath.startsWith('/')) {
            const baseUrl = window.location.origin;
            return baseUrl + imagePath;
        }
        
        // If it's a relative path without /, construct the URL with /api/ prefix
        const baseUrl = window.location.origin;
        const apiPath = '/api';
        return baseUrl + apiPath + '/' + imagePath;
    }

    handleUploadSuccess(detail) {
        console.log('Upload success:', detail);
        
        // Update user data with new image URL
        this.userData.profile_image = detail.result.image_url;
        this.set('userData', this.userData);

        // Update local storage
        const updatedUserData = { ...JSON.parse(localStorage.getItem('userData') || '{}'), profile_image: detail.result.image_url };
        localStorage.setItem('userData', JSON.stringify(updatedUserData));

        Toast.show({
            title: 'Success',
            message: 'Profile image updated successfully',
            variant: 'success',
            duration: 3000
        });
    }

    handleUploadError(detail) {
        console.error('Upload error:', detail);
        
        Toast.show({
            title: 'Upload Error',
            message: detail.error || 'Failed to upload profile image. Please try again.',
            variant: 'error',
            duration: 5000
        });
    }

    render() {
        if (this.get('isLoading')) {
            return `<profile-content-skeleton></profile-content-skeleton>`;
        }

        const user = this.get('userData');
        const isSaving = this.get('isSaving');

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
                <!-- Profile Picture and Basic Info -->
                <div class="bg-white shadow rounded-lg p-6">
                    <div class="flex items-center justify-between mb-6">
                        <h2 class="text-xl font-semibold text-gray-900">Personal Information</h2>
                        <ui-button 
                            data-action="edit-profile"
                            variant="outline"
                            size="sm"
                            class="hover:bg-gray-50 hover:border-gray-300 transition-all duration-200"
                        >
                            <i class="fas fa-edit mr-2"></i>
                            Edit
                        </ui-button>
                    </div>

                    <div class="flex flex-col lg:flex-row items-center justify-center lg:items-start gap-8 space-x-8 mb-8">
                        <!-- Profile Picture (Left) -->
                        <div class="flex-shrink-0 w-2/6" style="aspect-ratio: 1; min-width: 8rem;">
                            <ui-profile-image-uploader 
                                src="${this.getImageUrl(user.profile_image) || ''}" 
                                name="${user.name || 'User'}" 
                                size="lg"
                                accept="image/*"
                                max-size="5"
                            ></ui-profile-image-uploader>
                        </div>
                        
                        <!-- Information Fields (Right) -->
                        <div class="flex-1 border border-gray-200 rounded-lg p-6 w-full">
                            <div class="space-y-6">
                                <!-- Name -->
                                <div>
                                    <label class="block text-sm font-medium text-gray-700 mb-2">Full Name</label>
                                    <div class="flex items-center space-x-3 p-3 bg-gradient-to-r from-amber-50 to-orange-50 border border-amber-200 rounded-lg">
                                        <div class="flex-shrink-0 w-8 h-8 bg-amber-100 rounded-lg flex items-center justify-center">
                                            <i class="fas fa-user text-amber-600 text-sm"></i>
                                        </div>
                                        <div>
                                            <div class="text-gray-900 font-semibold text-lg">${user.name || 'Not provided'}</div>
                                            <div class="text-xs text-gray-500">Your display name</div>
                                        </div>
                                    </div>
                                </div>

                                <!-- Email -->
                                <div>
                                    <label class="block text-sm font-medium text-gray-700 mb-2">Email Address</label>
                                    <div class="flex items-center space-x-3 p-3 bg-gradient-to-r from-teal-50 to-cyan-50 border border-teal-200 rounded-lg">
                                        <div class="flex-shrink-0 w-8 h-8 bg-teal-100 rounded-lg flex items-center justify-center">
                                            <i class="fas fa-envelope text-teal-600 text-sm"></i>
                                        </div>
                                        <div>
                                            <div class="text-gray-900 font-semibold">${user.email || 'Not provided'}</div>
                                            <div class="text-xs text-gray-500">Your email address</div>
                                        </div>
                                    </div>
                                </div>

                                <!-- Role -->
                                <div>
                                    <label class="block text-sm font-medium text-gray-700 mb-2">Role</label>
                                    <div class="flex items-center space-x-3 p-3 bg-gradient-to-r from-blue-50 to-indigo-50 border border-blue-200 rounded-lg">
                                        <div class="flex-shrink-0 w-8 h-8 bg-blue-100 rounded-lg flex items-center justify-center">
                                            <i class="fas fa-user-tag text-blue-600 text-sm"></i>
                                        </div>
                                        <div>
                                            <div class="text-gray-900 font-semibold capitalize">${user.role || 'Not assigned'}</div>
                                            <div class="text-xs text-gray-500">User role in the system</div>
                                        </div>
                                    </div>
                                </div>

                                <!-- Status -->
                                <div>
                                    <label class="block text-sm font-medium text-gray-700 mb-2">Status</label>
                                    <div class="flex items-center space-x-3 p-3 ${
                                        user.status === 'active' ? 'bg-gradient-to-r from-green-50 to-emerald-50 border border-green-200' : 
                                        user.status === 'inactive' ? 'bg-gradient-to-r from-red-50 to-pink-50 border border-red-200' : 
                                        'bg-gradient-to-r from-gray-50 to-slate-50 border border-gray-200'
                                    } rounded-lg">
                                        <div class="flex-shrink-0 w-8 h-8 ${
                                            user.status === 'active' ? 'bg-green-100' : 
                                            user.status === 'inactive' ? 'bg-red-100' : 
                                            'bg-gray-100'
                                        } rounded-lg flex items-center justify-center">
                                            <i class="fas ${
                                                user.status === 'active' ? 'fa-check-circle text-green-600' : 
                                                user.status === 'inactive' ? 'fa-times-circle text-red-600' : 
                                                'fa-question-circle text-gray-600'
                                            } text-sm"></i>
                                        </div>
                                        <div>
                                            <div class="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${
                                                user.status === 'active' ? 'bg-green-100 text-green-800' : 
                                                user.status === 'inactive' ? 'bg-red-100 text-red-800' : 
                                                'bg-gray-100 text-gray-800'
                                            }">
                                                ${user.status || 'Unknown'}
                                            </div>
                                            <div class="text-xs text-gray-500 mt-1">Account status</div>
                                        </div>
                                    </div>
                                </div>

                                <!-- Created Date -->
                                <div>
                                    <label class="block text-sm font-medium text-gray-700 mb-2">Member Since</label>
                                    <div class="flex items-center space-x-3 p-3 bg-gradient-to-r from-purple-50 to-violet-50 border border-purple-200 rounded-lg">
                                        <div class="flex-shrink-0 w-8 h-8 bg-purple-100 rounded-lg flex items-center justify-center">
                                            <i class="fas fa-calendar-alt text-purple-600 text-sm"></i>
                                        </div>
                                        <div>
                                            <div class="text-gray-900 font-semibold">
                                                ${user.created_at ? new Date(user.created_at).toLocaleDateString('en-US', { 
                                                    year: 'numeric', 
                                                    month: 'long', 
                                                    day: 'numeric' 
                                                }) : 'Unknown'}
                                            </div>
                                            <div class="text-xs text-gray-500">Account creation date</div>
                                        </div>
                                    </div>
                                </div>
                            </div>
                        </div>
                    </div>


                </div>




            </div>
        `;
    }
}

customElements.define('profile-content', ProfileContent);
export default ProfileContent; 
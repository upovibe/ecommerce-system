import '@/components/ui/Modal.js';
import '@/components/ui/Toast.js';
import '@/components/ui/Input.js';
import '@/components/ui/Dropdown.js';
import '@/components/ui/Switch.js';
import '@/components/ui/FileUpload.js';
import api from '@/services/api.js';

/**
 * Team Settings Modal Component
 * 
 * A modal component for adding new team members in the admin panel
 * 
 * Attributes:
 * - open: boolean - controls modal visibility
 * 
 * Events:
 * - team-saved: Fired when a team member is successfully saved
 * - modal-closed: Fired when modal is closed
 */
class TeamSettingsModal extends HTMLElement {
    constructor() {
        super();
    }

    static get observedAttributes() {
        return ['open'];
    }

    connectedCallback() {
        this.render();
        this.setupEventListeners();
    }

    setupEventListeners() {
        // Listen for confirm button click (Save Team Member)
        this.addEventListener('confirm', () => {
            this.saveTeamMember();
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

    // Save the new team member
    async saveTeamMember() {
        try {
            // Get form data using the data-field attributes for reliable selection
            const nameInput = this.querySelector('ui-input[data-field="name"]');
            const positionInput = this.querySelector('ui-input[data-field="position"]');
            const departmentDropdown = this.querySelector('ui-dropdown[data-field="department"]');
            const statusSwitch = this.querySelector('ui-switch[name="is_active"]');
            const profileImageFileUpload = this.querySelector('ui-file-upload[data-field="profile-image"]');

            const teamData = {
                name: nameInput ? nameInput.value : '',
                position: positionInput ? positionInput.value : '',
                department: departmentDropdown ? departmentDropdown.value : '',
                is_active: statusSwitch ? (statusSwitch.checked ? 1 : 0) : 1
            };

            console.log('Team data being sent:', teamData); // Debug log

            // Validate required fields
            if (!teamData.name) {
                Toast.show({
                    title: 'Validation Error',
                    message: 'Please fill in the team member name',
                    variant: 'error',
                    duration: 3000
                });
                return;
            }

            if (!teamData.position) {
                Toast.show({
                    title: 'Validation Error',
                    message: 'Please fill in the position',
                    variant: 'error',
                    duration: 3000
                });
                return;
            }

            if (!teamData.department) {
                Toast.show({
                    title: 'Validation Error',
                    message: 'Please select a department',
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
                    message: 'Please log in to add team members',
                    variant: 'error',
                    duration: 3000
                });
                return;
            }

            // Prepare form data for file upload
            const formData = new FormData();
            
            // Add text fields
            Object.keys(teamData).forEach(key => {
                formData.append(key, teamData[key]);
            });

            // Add profile image if uploaded
            if (profileImageFileUpload && profileImageFileUpload.getFiles && profileImageFileUpload.getFiles().length > 0) {
                formData.append('profile_image', profileImageFileUpload.getFiles()[0]);
            }

            // Create the team member
            const response = await api.withToken(token).post('/teams', formData, {
                headers: {
                    'Content-Type': 'multipart/form-data'
                }
            });

            console.log('✅ Team member created successfully:', response.data);

            Toast.show({
                title: 'Success',
                message: 'Team member created successfully',
                variant: 'success',
                duration: 3000
            });

            // Close modal and dispatch event
            this.close();
            this.dispatchEvent(new CustomEvent('team-saved', {
                detail: { team: response.data.data },
                bubbles: true,
                composed: true
            }));

        } catch (error) {
            console.error('❌ Error creating team member:', error);
            Toast.show({
                title: 'Error',
                message: error.response?.data?.message || 'Failed to create team member',
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
                <div slot="title">Add Team Member</div>
                    <form id="team-form" class="space-y-4">
                        <div>
                            <label class="block text-sm font-medium text-gray-700 mb-1">Full Name</label>
                            <ui-input 
                                data-field="name"
                                type="text" 
                                placeholder="Enter team member's full name"
                                class="w-full">
                            </ui-input>
                        </div>
                        
                        <div>
                            <label class="block text-sm font-medium text-gray-700 mb-1">Position</label>
                            <ui-input 
                                data-field="position"
                                type="text" 
                                placeholder="Enter position/title"
                                class="w-full">
                            </ui-input>
                        </div>
                        
                        <div>
                            <label class="block text-sm font-medium text-gray-700 mb-1">Department</label>
                            <ui-dropdown 
                                data-field="department"
                                placeholder="Select department"
                                class="w-full">
                                <ui-option value="District Pastor">District Pastor</ui-option>
                                <ui-option value="Presiding Elder">Presiding Elder</ui-option>
                                <ui-option value="Senior Pastor">Senior Pastor</ui-option>
                                <ui-option value="Associate Pastor">Associate Pastor</ui-option>
                                <ui-option value="Youth Pastor">Youth Pastor</ui-option>
                                <ui-option value="Worship Pastor">Worship Pastor</ui-option>
                            </ui-dropdown>
                        </div>
                        
                        <div>
                            <label class="block text-sm font-medium text-gray-700 mb-1">Profile Image</label>
                            <ui-file-upload 
                                data-field="profile-image"
                                accept="image/*"
                                max-size="5242880"
                                max-files="1"
                                class="w-full">
                            </ui-file-upload>
                        </div>
                        
                        <div>
                            <label class="block text-sm font-medium text-gray-700 mb-1">Status</label>
                            <ui-switch 
                                name="is_active"
                                checked
                                class="w-full">
                                <span slot="label">Active</span>
                            </ui-switch>
                        </div>
                    </form>
            </ui-modal>
        `;
    }
}

customElements.define('team-settings-modal', TeamSettingsModal);
export default TeamSettingsModal; 
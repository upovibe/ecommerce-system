import '@/components/ui/Modal.js';
import '@/components/ui/Toast.js';
import '@/components/ui/Badge.js';

/**
 * Team View Modal Component
 * 
 * A simple modal component for viewing team member details
 * 
 * Attributes:
 * - open: boolean - controls modal visibility
 * 
 * Events:
 * - modal-closed: Fired when modal is closed
 */
class TeamViewModal extends HTMLElement {
    constructor() {
        super();
        this.teamData = null;
    }

    static get observedAttributes() {
        return ['open'];
    }

    connectedCallback() {
        this.render();
        this.setupEventListeners();
    }

    setupEventListeners() {
        // Listen for confirm button click (Close)
        this.addEventListener('confirm', () => {
            this.close();
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
        this.teamData = null;
    }

    // Set team data for viewing
    setTeamData(teamData) {
        this.teamData = teamData;
        // Re-render the modal with the new data
        this.render();
    }

    // Helper method to get proper image URL
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
        
        // If it's a relative path without /, construct the URL
        const baseUrl = window.location.origin;
        const apiPath = '/api';
        return baseUrl + apiPath + '/' + imagePath;
    }

    render() {
        this.innerHTML = `
            <ui-modal 
                ${this.hasAttribute('open') ? 'open' : ''} 
                position="right" 
                size="lg"
                close-button="true">
                <div slot="title">View Team Member Details</div>
                
                <div>
                    ${this.teamData ? `
                        <!-- Team Member Header -->
                        <div class="flex items-center gap-3 border-b pb-4">
                            <h3 class="text-xl font-semibold text-gray-900">${this.teamData.name || 'N/A'}</h3>
                            <ui-badge color="secondary"><i class="fas fa-building mr-1"></i>${this.teamData.department || 'N/A'}</ui-badge>
                            <ui-badge color="${this.teamData.is_active ? 'success' : 'error'}">
                                ${this.teamData.is_active ? '<i class="fas fa-check mr-1"></i> Active' : '<i class="fas fa-times mr-1"></i> Inactive'}
                            </ui-badge>
                        </div>

                        <!-- Profile Image Preview -->
                        <div class="border-b pb-4">
                            <div class="flex items-center gap-2 mb-3">
                                <i class="fas fa-user-circle text-blue-500"></i>
                                <h4 class="text-md font-semibold text-gray-800">Profile Image</h4>
                            </div>
                            ${this.teamData.profile_image ? `
                                <div class="relative group">
                                    <div class="relative w-48 h-48 mx-auto">
                                        <img src="${this.getImageUrl(this.teamData.profile_image)}" 
                                             alt="Profile Image" 
                                             class="w-full h-full object-cover rounded-lg border border-gray-200"
                                             onerror="this.style.display='none'; this.nextElementSibling.style.display='flex';">
                                        <div class="absolute inset-0 hidden items-center justify-center bg-gray-50 rounded-lg border border-gray-200">
                                            <div class="text-center">
                                                <i class="fas fa-user text-gray-400 text-xl mb-1"></i>
                                                <p class="text-gray-500 text-xs">Image not found</p>
                                            </div>
                                        </div>
                                    </div>
                                    <div class="absolute top-2 right-2 opacity-0 group-hover:opacity-100 transition-opacity">
                                        <button onclick="window.open('${this.getImageUrl(this.teamData.profile_image)}', '_blank')" 
                                                class="bg-white bg-opacity-90 text-blue-500 hover:text-blue-700 text-xs px-2 py-1 rounded border border-blue-200 hover:bg-blue-50">
                                            <i class="fas fa-external-link-alt"></i>
                                        </button>
                                    </div>
                                </div>
                            ` : `
                                <div class="w-48 h-48 mx-auto bg-gradient-to-br from-gray-100 to-gray-200 rounded-lg border-2 border-dashed border-gray-300 flex items-center justify-center">
                                    <div class="text-center">
                                        <i class="fas fa-user text-gray-400 text-4xl mb-3"></i>
                                        <p class="text-gray-500 text-sm font-medium">No profile image</p>
                                        <p class="text-gray-400 text-xs mt-1">Upload a profile image</p>
                                    </div>
                                </div>
                            `}
                        </div>

                        <!-- Team Member Information -->
                        <div class="border-b pb-4">
                            <div class="flex items-center gap-2 mb-3">
                                <i class="fas fa-info-circle text-blue-500"></i>
                                <h4 class="text-md font-semibold text-gray-800">Team Member Information</h4>
                            </div>
                            <div class="grid grid-cols-1 md:grid-cols-2 gap-4">
                                <div class="bg-gray-50 p-3 rounded-lg">
                                    <label class="block text-sm font-medium text-gray-700 mb-1">
                                        <i class="fas fa-user mr-1"></i>Full Name
                                    </label>
                                    <p class="text-gray-900 text-sm leading-relaxed">${this.teamData.name || 'N/A'}</p>
                                </div>
                                <div class="bg-gray-50 p-3 rounded-lg">
                                    <label class="block text-sm font-medium text-gray-700 mb-1">
                                        <i class="fas fa-briefcase mr-1"></i>Position
                                    </label>
                                    <p class="text-gray-900 text-sm leading-relaxed">${this.teamData.position || 'N/A'}</p>
                                </div>
                                <div class="bg-gray-50 p-3 rounded-lg">
                                    <label class="block text-sm font-medium text-gray-700 mb-1">
                                        <i class="fas fa-building mr-1"></i>Department
                                    </label>
                                    <p class="text-gray-900 text-sm leading-relaxed">${this.teamData.department || 'N/A'}</p>
                                </div>
                                <div class="bg-gray-50 p-3 rounded-lg">
                                    <label class="block text-sm font-medium text-gray-700 mb-1">
                                        <i class="fas fa-toggle-on mr-1"></i>Status
                                    </label>
                                    <p class="text-gray-900 text-sm leading-relaxed">
                                        ${this.teamData.is_active ? 'Active' : 'Inactive'}
                                    </p>
                                </div>
                            </div>
                        </div>

                        <!-- Timestamps -->
                        <div>
                            <div class="flex items-center gap-2 mb-3">
                                <i class="fas fa-clock text-orange-500"></i>
                                <h4 class="text-md font-semibold text-gray-800">Timestamps</h4>
                            </div>
                            <div class="grid grid-cols-1 md:grid-cols-2 gap-4">
                                <div class="bg-gray-50 p-3 rounded-lg">
                                    <label class="block text-sm font-medium text-gray-700 mb-1">
                                        <i class="fas fa-plus mr-1"></i>Created
                                    </label>
                                    <span class="text-gray-900 text-sm">${this.teamData.created_at ? new Date(this.teamData.created_at).toLocaleString() : 'N/A'}</span>
                                </div>
                                <div class="bg-gray-50 p-3 rounded-lg">
                                    <label class="block text-sm font-medium text-gray-700 mb-1">
                                        <i class="fas fa-edit mr-1"></i>Updated
                                    </label>
                                    <span class="text-gray-900 text-sm">${this.teamData.updated_at ? new Date(this.teamData.updated_at).toLocaleString() : 'N/A'}</span>
                                </div>
                            </div>
                        </div>
                    ` : `
                        <div class="text-center py-8">
                            <p class="text-gray-500">No team member data available</p>
                        </div>
                    `}
                </div>
                <div slot="footer" class="flex justify-end">
                    <ui-button variant="outline" color="secondary" modal-action="cancel">Close</ui-button>
                </div>
            </ui-modal>
        `;
    }
}

customElements.define('team-view-modal', TeamViewModal);
export default TeamViewModal; 
import '@/components/ui/Dialog.js';
import '@/components/ui/Toast.js';
import api from '@/services/api.js';

/**
 * Team Delete Dialog Component
 * 
 * A dialog component for confirming team member deletions in the admin panel
 * 
 * Attributes:
 * - open: boolean - controls dialog visibility
 * 
 * Events:
 * - team-deleted: Fired when a team member is successfully deleted
 * - dialog-closed: Fired when dialog is closed
 */
class TeamDeleteDialog extends HTMLElement {
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
        // Listen for dialog confirm/cancel events
        this.addEventListener('confirm', () => {
            this.confirmDelete();
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
        this.teamData = null;
    }

    // Set team data for deletion
    setTeamData(teamData) {
        this.teamData = teamData;
        // Update the dialog content immediately
        this.updateDialogContent();
    }

    // Update dialog content without full re-render
    updateDialogContent() {
        const contentSlot = this.querySelector('[slot="content"]');
        if (contentSlot && this.teamData) {
            const teamName = this.teamData.name || 'Unknown';
            const teamPosition = this.teamData.position || 'Unknown Position';
            contentSlot.innerHTML = `
                <p class="text-gray-700 mb-4">
                    Are you sure you want to delete the team member "<strong>${teamName}</strong>" (${teamPosition})?
                </p>
                <p class="text-sm text-gray-500">
                    This action cannot be undone. The team member and their profile image will be permanently removed.
                </p>
            `;
        }
    }

    // Handle delete confirmation
    async confirmDelete() {
        if (!this.teamData) {
            console.error('❌ No team data available for deletion');
            Toast.show({
                title: 'Error',
                message: 'No team data available for deletion',
                variant: 'error',
                duration: 3000
            });
            return;
        }

        try {
            // Get the auth token
            const token = localStorage.getItem('token');
            if (!token) {
                console.error('❌ No authentication token found');
                Toast.show({
                    title: 'Authentication Error',
                    message: 'Please log in to delete team members',
                    variant: 'error',
                    duration: 3000
                });
                return;
            }

            // Store team ID before deletion
            const teamId = this.teamData.id;

            // Delete the team member
            await api.withToken(token).delete(`/teams/${teamId}`);
            
            Toast.show({
                title: 'Success',
                message: 'Team member deleted successfully',
                variant: 'success',
                duration: 3000
            });

            // Close dialog and dispatch event
            this.close();
            this.dispatchEvent(new CustomEvent('team-deleted', {
                detail: { teamId: teamId },
                bubbles: true,
                composed: true
            }));

        } catch (error) {
            console.error('❌ Error deleting team member:', error);
            Toast.show({
                title: 'Error',
                message: error.response?.data?.message || 'Failed to delete team member',
                variant: 'error',
                duration: 3000
            });
        }
    }

    render() {
        const teamName = this.teamData?.name || 'Unknown';
        const teamPosition = this.teamData?.position || 'Unknown Position';
        
        this.innerHTML = `
            <ui-dialog 
                ${this.hasAttribute('open') ? 'open' : ''} 
                title="Confirm Delete" 
                position="center"
                variant="danger">
                <div slot="content">
                    <p class="text-gray-700 mb-4">
                        Are you sure you want to delete the team member "<strong>${teamName}</strong>" (${teamPosition})?
                    </p>
                    <p class="text-sm text-gray-500">
                        This action cannot be undone. The team member and their profile image will be permanently removed.
                    </p>
                </div>
            </ui-dialog>
        `;
    }
}

customElements.define('team-delete-dialog', TeamDeleteDialog);
export default TeamDeleteDialog; 
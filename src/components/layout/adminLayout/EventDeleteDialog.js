import '@/components/ui/Dialog.js';
import '@/components/ui/Toast.js';
import api from '@/services/api.js';

/**
 * Event Delete Dialog Component
 * 
 * A dialog component for confirming event deletion in the admin panel
 * 
 * Attributes:
 * - open: boolean - controls dialog visibility
 * 
 * Events:
 * - event-deleted: Fired when an event is successfully deleted
 * - modal-closed: Fired when dialog is closed
 */
class EventDeleteDialog extends HTMLElement {
    constructor() {
        super();
        this.eventData = null;
    }

    static get observedAttributes() {
        return ['open'];
    }

    connectedCallback() {
        this.render();
        this.setupEventListeners();
    }

    setupEventListeners() {
        // Listen for confirm button click (Delete Event)
        this.addEventListener('confirm', () => {
            this.deleteEvent();
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

    // Set event data for deletion
    setEventData(eventData) {
        this.eventData = eventData;
        this.populateDialog();
    }

    // Populate dialog with event data
    populateDialog() {
        if (!this.eventData) return;

        const eventTitleElement = this.querySelector('#event-title');
        const eventCategoryElement = this.querySelector('#event-category');
        const eventDateElement = this.querySelector('#event-date');

        if (eventTitleElement) eventTitleElement.textContent = this.eventData.title || 'Unknown Event';
        if (eventCategoryElement) eventCategoryElement.textContent = this.eventData.category || 'N/A';
        if (eventDateElement) {
            const startDate = this.eventData.start_date ? new Date(this.eventData.start_date).toLocaleDateString() : 'N/A';
            eventDateElement.textContent = startDate;
        }
    }

    // Delete the event
    async deleteEvent() {
        try {
            if (!this.eventData) {
                Toast.show({
                    title: 'Error',
                    message: 'No event data available for deletion',
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
                    message: 'Please log in to delete events',
                    variant: 'error',
                    duration: 3000
                });
                return;
            }

            // Delete the event
            const response = await api.withToken(token).delete(`/events/${this.eventData.id}`);
            
            Toast.show({
                title: 'Success',
                message: 'Event deleted successfully',
                variant: 'success',
                duration: 3000
            });

            // Close dialog and dispatch event
            this.close();
            this.dispatchEvent(new CustomEvent('event-deleted', {
                detail: { eventId: this.eventData.id },
                bubbles: true,
                composed: true
            }));

        } catch (error) {
            console.error('❌ Error deleting event:', error);
            console.error('Error response:', error.response?.data); // Debug log
            Toast.show({
                title: 'Error',
                message: error.response?.data?.message || 'Failed to delete event',
                variant: 'error',
                duration: 3000
            });
        }
    }

    render() {
        this.innerHTML = `
            <ui-dialog 
                ${this.hasAttribute('open') ? 'open' : ''} 
                title="Delete Event"
                variant="danger">
                <div slot="content" class="space-y-4">
                    <div class="flex items-center space-x-2 mb-4">
                        <i class="fas fa-exclamation-triangle text-red-500"></i>
                        <span class="font-semibold text-red-900">Delete Event</span>
                    </div>
                    
                    <p class="text-gray-700">
                        Are you sure you want to delete this event? This action cannot be undone.
                    </p>
                    
                    <div class="bg-red-50 border border-red-200 rounded-lg p-4">
                        <div class="flex items-start space-x-3">
                            <i class="fas fa-calendar-times text-red-500 mt-1"></i>
                            <div class="flex-1">
                                <h4 id="event-title" class="font-semibold text-red-900">Event Title</h4>
                                <div class="mt-1 text-sm text-red-700">
                                    <span id="event-category">Category</span> • 
                                    <span id="event-date">Date</span>
                                </div>
                            </div>
                        </div>
                    </div>
                    
                    <p class="text-sm text-gray-600">
                        This will permanently remove the event from the system and cannot be recovered.
                    </p>
                </div>
            </ui-dialog>
        `;
    }
}

customElements.define('event-delete-dialog', EventDeleteDialog);
export default EventDeleteDialog; 
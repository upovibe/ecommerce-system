import '@/components/ui/Modal.js';
import '@/components/ui/Toast.js';
import '@/components/ui/Input.js';
import '@/components/ui/Textarea.js';
import '@/components/ui/Dropdown.js';
import '@/components/ui/Switch.js';
import '@/components/ui/FileUpload.js';
import '@/components/ui/Wysiwyg.js';
import api from '@/services/api.js';

/**
 * Event Settings Modal Component
 * 
 * A modal component for adding new events in the admin panel
 * 
 * Attributes:
 * - open: boolean - controls modal visibility
 * 
 * Events:
 * - event-saved: Fired when an event is successfully saved
 * - modal-closed: Fired when modal is closed
 */
class EventSettingsModal extends HTMLElement {
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
        // Listen for confirm button click (Save Event)
        this.addEventListener('confirm', () => {
            this.saveEvent();
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

    // Save the new event
    async saveEvent() {
        try {
            // Get form data using the data-field attributes for reliable selection
            const titleInput = this.querySelector('ui-input[data-field="title"]');
            const descriptionTextarea = this.querySelector('ui-textarea[data-field="description"]');
            const contentWysiwyg = this.querySelector('ui-wysiwyg[data-field="content"]');
            const locationInput = this.querySelector('ui-input[data-field="location"]');
            const startDateInput = this.querySelector('ui-input[data-field="start_date"]');
            const endDateInput = this.querySelector('ui-input[data-field="end_date"]');
            
            const categoryDropdown = this.querySelector('ui-dropdown[data-field="category"]');
            const statusDropdown = this.querySelector('ui-dropdown[data-field="status"]');
            const isActiveSwitch = this.querySelector('ui-switch[name="is_active"]');
            const bannerFileUpload = this.querySelector('ui-file-upload[data-field="banner"]');

            const eventData = {
                title: titleInput ? titleInput.value : '',
                description: descriptionTextarea ? descriptionTextarea.value : '',
                content: contentWysiwyg ? contentWysiwyg.value : '',
                category: categoryDropdown ? categoryDropdown.value : '',
                status: statusDropdown ? statusDropdown.value : '',
                start_date: startDateInput ? startDateInput.value : '',
                end_date: endDateInput ? endDateInput.value : '',
                location: locationInput ? locationInput.value : '',
                is_active: isActiveSwitch ? (isActiveSwitch.checked ? 1 : 0) : 1
            };

            console.log('Event data being sent:', eventData); // Debug log

            // Validate required fields
            if (!eventData.title) {
                Toast.show({
                    title: 'Validation Error',
                    message: 'Please fill in the event title',
                    variant: 'error',
                    duration: 3000
                });
                return;
            }

            if (!eventData.start_date) {
                Toast.show({
                    title: 'Validation Error',
                    message: 'Please select a start date',
                    variant: 'error',
                    duration: 3000
                });
                return;
            }

            if (!eventData.end_date) {
                Toast.show({
                    title: 'Validation Error',
                    message: 'Please select an end date',
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
                    message: 'Please log in to add events',
                    variant: 'error',
                    duration: 3000
                });
                return;
            }

            Toast.show({
                title: 'Adding Event',
                message: 'Please wait...',
                variant: 'info',
                duration: 2000
            });

            // Prepare form data for multipart request
            const formData = new FormData();
            
            // Add all form fields
            Object.keys(eventData).forEach(key => {
                formData.append(key, eventData[key]);
            });
            
            // Add banner files if selected
            if (bannerFileUpload && bannerFileUpload.getFiles().length > 0) {
                const files = bannerFileUpload.getFiles();
                // Filter out existing files (which are strings/paths) and only include new File objects
                const newFiles = files.filter(file => file instanceof File);
                newFiles.forEach(file => {
                    formData.append('banner', file, file.name);
                });
            }

            console.log('FormData entries:'); // Debug log
            for (let [key, value] of formData.entries()) {
                console.log(key, value);
            }

            // Create the event with multipart data
            const response = await api.withToken(token).post('/events', formData);
            
            Toast.show({
                title: 'Success',
                message: 'Event created successfully',
                variant: 'success',
                duration: 3000
            });

            // Construct the new event data from response
            const newEvent = {
                id: response.data.data?.id || response.data.id,
                title: eventData.title,
                description: eventData.description,
                category: eventData.category,
                status: eventData.status,
                start_date: eventData.start_date,
                end_date: eventData.end_date,
                location: eventData.location,
                is_active: eventData.is_active,
                banner_image: response.data.data?.banner_image || null,
                created_at: new Date().toISOString().slice(0, 19).replace('T', ' '),
                updated_at: new Date().toISOString().slice(0, 19).replace('T', ' ')
            };

            // Close modal and dispatch event
            this.close();
            this.dispatchEvent(new CustomEvent('event-saved', {
                detail: { event: newEvent },
                bubbles: true,
                composed: true
            }));

        } catch (error) {
            console.error('❌ Error saving event:', error);
            console.error('Error response:', error.response?.data); // Debug log
            Toast.show({
                title: 'Error',
                message: error.response?.data?.message || 'Failed to create event',
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
                <div slot="title">Event Settings</div>
                    <form id="event-form" class="space-y-4">
                        <div>
                            <label class="block text-sm font-medium text-gray-700 mb-1">Event Title</label>
                            <ui-input 
                                data-field="title"
                                type="text" 
                                placeholder="Enter event title"
                                class="w-full">
                            </ui-input>
                        </div>
                        
                        <div>
                            <label class="block text-sm font-medium text-gray-700 mb-1">Description</label>
                            <ui-textarea 
                                data-field="description"
                                placeholder="Enter event description"
                                rows="4"
                                class="w-full">
                            </ui-textarea>
                        </div>

                        <div>
                            <label class="block text-sm font-medium text-gray-700 mb-1">Content</label>
                            <ui-wysiwyg 
                                data-field="content"
                                placeholder="Enter detailed event content"
                                class="w-full">
                            </ui-wysiwyg>
                        </div>

                        <div>
                            <label class="block text-sm font-medium text-gray-700 mb-1">Category</label>
                            <ui-dropdown 
                                data-field="category"
                                placeholder="Select category"
                                class="w-full">
                                <ui-option value="service">Service</ui-option>
                                <ui-option value="bible_study">Bible Study</ui-option>
                                <ui-option value="prayer">Prayer Meeting</ui-option>
                                <ui-option value="fellowship">Fellowship</ui-option>
                                <ui-option value="youth">Youth Event</ui-option>
                                <ui-option value="children">Children's Event</ui-option>
                                <ui-option value="outreach">Outreach/Missions</ui-option>
                                <ui-option value="training">Training</ui-option>
                                <ui-option value="special">Special Event</ui-option>
                                <ui-option value="missions">Missions Trip</ui-option>
                                <ui-option value="concert">Concert/Worship Night</ui-option>
                            </ui-dropdown>
                        </div>

                        <div class="grid grid-cols-2 gap-4">
                            <div>
                                <label class="block text-sm font-medium text-gray-700 mb-1">Start Date & Time</label>
                                <ui-input 
                                    data-field="start_date"
                                    type="datetime-local" 
                                    class="w-full">
                                </ui-input>
                            </div>
                            <div>
                                <label class="block text-sm font-medium text-gray-700 mb-1">End Date & Time</label>
                                <ui-input 
                                    data-field="end_date"
                                    type="datetime-local" 
                                    class="w-full">
                                </ui-input>
                            </div>
                        </div>

                        <div>
                            <label class="block text-sm font-medium text-gray-700 mb-1">Location</label>
                            <ui-input 
                                data-field="location"
                                type="text" 
                                placeholder="Enter event location"
                                class="w-full">
                            </ui-input>
                        </div>

                        <div>
                            <label class="block text-sm font-medium text-gray-700 mb-1">Status</label>
                            <ui-dropdown 
                                data-field="status"
                                placeholder="Select status"
                                class="w-full">
                                <ui-option value="upcoming">Upcoming</ui-option>
                                <ui-option value="ongoing">Ongoing</ui-option>
                                <ui-option value="completed">Completed</ui-option>
                                <ui-option value="cancelled">Cancelled</ui-option>
                            </ui-dropdown>
                        </div>

                        <div>
                            <label class="block text-sm font-medium text-gray-700 mb-1">Banner Image</label>
                            <ui-file-upload 
                                data-field="banner"
                                accept="image/*"
                                multiple="false"
                                class="w-full">
                            </ui-file-upload>
                        </div>

                        <div>
                            <label class="block text-sm font-medium text-gray-700 mb-1">Event Status</label>
                            <ui-switch 
                                name="is_active"
                                checked
                                class="w-full">
                                <span slot="label">Published</span>
                            </ui-switch>
                        </div>
                    </form>
            </ui-modal>
        `;
    }
}

customElements.define('event-settings-modal', EventSettingsModal);
export default EventSettingsModal; 
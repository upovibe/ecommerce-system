import '@/components/ui/Modal.js';
import '@/components/ui/Toast.js';
import '@/components/ui/Input.js';
import '@/components/ui/Textarea.js';
import api from '@/services/api.js';

class TestimonialSettingsModal extends HTMLElement {
    constructor() {
        super();
        this.testimonialData = { title: '', description: '' };
    }
    static get observedAttributes() { return ['open']; }
    connectedCallback() { this.render(); this.setupEventListeners(); }
    setupEventListeners() {
        this.addEventListener('confirm', () => this.saveTestimonial());
        this.addEventListener('cancel', () => this.close());
    }
    open() { this.setAttribute('open', ''); }
    close() { this.removeAttribute('open'); this.resetForm(); }
    resetForm() { this.testimonialData = { title: '', description: '' }; this.render(); }
    async saveTestimonial() {
        try {
            const titleInput = this.querySelector('ui-input[data-field="title"]');
            const descriptionTextarea = this.querySelector('ui-textarea[data-field="description"]');
            const testimonialData = {
                title: titleInput ? titleInput.value : '',
                description: descriptionTextarea ? descriptionTextarea.value : ''
            };
            if (!testimonialData.title.trim()) {
                Toast.show({ title: 'Validation Error', message: 'Title is required', variant: 'error', duration: 3000 });
                return;
            }
            if (!testimonialData.description.trim()) {
                Toast.show({ title: 'Validation Error', message: 'Description is required', variant: 'error', duration: 3000 });
                return;
            }
            const token = localStorage.getItem('token');
            if (!token) {
                Toast.show({ title: 'Authentication Error', message: 'Please log in to create testimonials', variant: 'error', duration: 3000 });
                return;
            }
            const response = await api.withToken(token).post('/testimonials', testimonialData);
            if (response.data.success) {
                Toast.show({ title: 'Success', message: 'Testimonial created successfully', variant: 'success', duration: 3000 });
                const newTestimonial = response.data.data;
                this.close();
                this.dispatchEvent(new CustomEvent('testimonial-saved', { detail: { testimonial: newTestimonial }, bubbles: true, composed: true }));
            } else {
                throw new Error(response.data.message || 'Failed to create testimonial');
            }
        } catch (error) {
            Toast.show({ title: 'Error', message: error.response?.data?.message || error.message || 'Failed to create testimonial', variant: 'error', duration: 3000 });
        }
    }
    render() {
        this.innerHTML = `
            <ui-modal 
                ${this.hasAttribute('open') ? 'open' : ''} 
                position="right" 
                close-button="true">
                <div slot="title">Add New Testimonial</div>
                <form id="testimonial-form" class="space-y-4">
                    <div>
                        <label class="block text-sm font-medium text-gray-700 mb-1">Title</label>
                        <ui-input 
                            data-field="title"
                            type="text" 
                            placeholder="Enter testimonial title"
                            class="w-full">
                        </ui-input>
                    </div>
                    <div>
                        <label class="block text-sm font-medium text-gray-700 mb-1">Description</label>
                        <ui-textarea 
                            data-field="description"
                            placeholder="Enter testimonial description"
                            rows="3"
                            class="w-full">
                        </ui-textarea>
                    </div>
                </form>
            </ui-modal>
        `;
    }
}
customElements.define('testimonial-settings-modal', TestimonialSettingsModal);
export default TestimonialSettingsModal; 
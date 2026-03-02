import '@/components/ui/Modal.js';
import '@/components/ui/Toast.js';
import '@/components/ui/Input.js';
import '@/components/ui/Textarea.js';
import api from '@/services/api.js';

class TestimonialUpdateModal extends HTMLElement {
    constructor() {
        super();
        this.testimonialData = null;
    }
    static get observedAttributes() { return ['open']; }
    connectedCallback() { this.render(); this.setupEventListeners(); }
    setupEventListeners() {
        this.addEventListener('confirm', () => this.updateTestimonial());
        this.addEventListener('cancel', () => this.close());
    }
    open() { this.setAttribute('open', ''); }
    close() { this.removeAttribute('open'); this.resetForm(); }
    resetForm() { this.testimonialData = null; this.render(); }
    setTestimonialData(data) { this.testimonialData = { ...data }; this.render(); }
    async updateTestimonial() {
        try {
            if (!this.testimonialData) return;
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
                Toast.show({ title: 'Authentication Error', message: 'Please log in to update testimonials', variant: 'error', duration: 3000 });
                return;
            }
            const response = await api.withToken(token).put(`/testimonials/${this.testimonialData.id}`, testimonialData);
            if (response.data.success) {
                Toast.show({ title: 'Success', message: 'Testimonial updated successfully', variant: 'success', duration: 3000 });
                this.dispatchEvent(new CustomEvent('testimonial-updated', { detail: { testimonial: response.data.data }, bubbles: true, composed: true }));
                this.close();
            } else {
                throw new Error(response.data.message || 'Failed to update testimonial');
            }
        } catch (error) {
            Toast.show({ title: 'Error', message: error.response?.data?.message || error.message || 'Failed to update testimonial', variant: 'error', duration: 3000 });
        }
    }
    render() {
        if (!this.testimonialData) {
            this.innerHTML = `
                <ui-modal 
                    title="Edit Testimonial"
                    size="md"
                    ${this.hasAttribute('open') ? 'open' : ''}>
                    <div class="text-center py-8 text-gray-500">
                        <p>No testimonial data available</p>
                    </div>
                </ui-modal>
            `;
            return;
        }
        this.innerHTML = `
            <ui-modal 
                title="Edit Testimonial"
                size="md"
                ${this.hasAttribute('open') ? 'open' : ''}>
                <form class="space-y-6">
                    <div>
                        <label for="title" class="block text-sm font-medium text-gray-700 mb-2">Title *</label>
                        <ui-input 
                            id="title"
                            data-field="title"
                            type="text" 
                            placeholder="Enter testimonial title"
                            value="${this.testimonialData.title}"
                            required
                            class="w-full">
                        </ui-input>
                    </div>
                    <div>
                        <label for="description" class="block text-sm font-medium text-gray-700 mb-2">Description</label>
                        <ui-textarea 
                            id="description"
                            data-field="description"
                            placeholder="Enter testimonial description"
                            rows="3"
                            value="${this.testimonialData.description}"
                            class="w-full">
                        </ui-textarea>
                    </div>
                </form>
            </ui-modal>
        `;
    }
}
customElements.define('testimonial-update-modal', TestimonialUpdateModal);
export default TestimonialUpdateModal; 
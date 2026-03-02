import '@/components/ui/Dialog.js';
import '@/components/ui/Toast.js';
import api from '@/services/api.js';

class TestimonialDeleteDialog extends HTMLElement {
    constructor() {
        super();
        this.testimonialData = null;
    }
    static get observedAttributes() { return ['open']; }
    connectedCallback() { this.render(); this.setupEventListeners(); }
    setupEventListeners() {
        this.addEventListener('confirm', () => this.deleteTestimonial());
        this.addEventListener('cancel', () => this.close());
    }
    open() { this.setAttribute('open', ''); }
    close() { this.removeAttribute('open'); this.resetForm(); }
    resetForm() { this.testimonialData = null; this.render(); }
    setTestimonialData(data) { this.testimonialData = { ...data }; this.render(); }
    async deleteTestimonial() {
        try {
            if (!this.testimonialData || !this.testimonialData.id) {
                Toast.show({ title: 'Error', message: 'No testimonial data available for deletion', variant: 'error', duration: 3000 });
                return;
            }
            const token = localStorage.getItem('token');
            if (!token) {
                Toast.show({ title: 'Authentication Error', message: 'Please log in to delete testimonials', variant: 'error', duration: 3000 });
                return;
            }
            const response = await api.withToken(token).delete(`/testimonials/${this.testimonialData.id}`);
            if (response.data.success) {
                Toast.show({ title: 'Success', message: 'Testimonial deleted successfully', variant: 'success', duration: 3000 });
                this.dispatchEvent(new CustomEvent('testimonial-deleted', { detail: { testimonialId: this.testimonialData.id }, bubbles: true, composed: true }));
                this.close();
            } else {
                throw new Error(response.data.message || 'Failed to delete testimonial');
            }
        } catch (error) {
            Toast.show({ title: 'Error', message: error.response?.data?.message || error.message || 'Failed to delete testimonial', variant: 'error', duration: 3000 });
        }
    }
    render() {
        const testimonialTitle = this.testimonialData?.title || 'Unknown';
        this.innerHTML = `
            <ui-dialog 
                ${this.hasAttribute('open') ? 'open' : ''} 
                title="Confirm Delete" 
                position="center"
                variant="danger">
                <div slot="content">
                    <p class="text-gray-700 mb-4">
                        Are you sure you want to delete the testimonial "<strong>${testimonialTitle}</strong>"?
                    </p>
                    <p class="text-sm text-gray-500">
                        This action cannot be undone. The testimonial will be permanently deleted from the system.
                    </p>
                </div>
            </ui-dialog>
        `;
    }
}
customElements.define('testimonial-delete-dialog', TestimonialDeleteDialog);
export default TestimonialDeleteDialog; 
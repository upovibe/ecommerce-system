import '@/components/ui/Modal.js';
import '@/components/ui/Toast.js';

class TestimonialViewModal extends HTMLElement {
    constructor() {
        super();
        this.testimonialData = null;
    }
    static get observedAttributes() { return ['open']; }
    connectedCallback() { this.render(); this.setupEventListeners(); }
    setupEventListeners() {
        this.addEventListener('confirm', () => this.close());
        this.addEventListener('cancel', () => this.close());
    }
    open() { this.setAttribute('open', ''); }
    close() { this.removeAttribute('open'); this.resetForm(); }
    resetForm() { this.testimonialData = null; this.render(); }
    setTestimonialData(data) { this.testimonialData = { ...data }; this.render(); }
    formatDate(dateString) {
        if (!dateString) return 'N/A';
        try {
            const date = new Date(dateString);
            return date.toLocaleDateString('en-US', {
                year: 'numeric', month: 'long', day: 'numeric', hour: '2-digit', minute: '2-digit'
            });
        } catch (error) { return dateString; }
    }
    render() {
        this.innerHTML = `
            <ui-modal 
                ${this.hasAttribute('open') ? 'open' : ''} 
                position="right" 
                size="lg"
                close-button="true">
                <div slot="title">View Testimonial Details</div>
                <div>
                    ${this.testimonialData ? `
                        <div class="flex items-center gap-3 border-b pb-4">
                            <h3 class="text-xl font-semibold text-gray-900">${this.testimonialData.title || 'N/A'}</h3>
                        </div>
                        <div class="border-b pb-4">
                            <div class="flex items-center gap-2 mb-3">
                                <i class="fas fa-align-left text-blue-500"></i>
                                <h4 class="text-md font-semibold text-gray-800">Description</h4>
                            </div>
                            <div class="bg-gray-50 p-4 rounded-lg">
                                <p class="text-gray-900 text-sm leading-relaxed">${this.testimonialData.description || 'No description provided'}</p>
                            </div>
                        </div>
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
                                    <span class="text-gray-900 text-sm">${this.formatDate(this.testimonialData.created_at)}</span>
                                </div>
                                <div class="bg-gray-50 p-3 rounded-lg">
                                    <label class="block text-sm font-medium text-gray-700 mb-1">
                                        <i class="fas fa-edit mr-1"></i>Updated
                                    </label>
                                    <span class="text-gray-900 text-sm">${this.formatDate(this.testimonialData.updated_at)}</span>
                                </div>
                            </div>
                        </div>
                    ` : `
                        <div class="text-center py-8">
                            <p class="text-gray-500">No testimonial data available</p>
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
customElements.define('testimonial-view-modal', TestimonialViewModal);
export default TestimonialViewModal; 
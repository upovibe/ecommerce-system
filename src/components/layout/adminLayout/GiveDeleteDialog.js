import '@/components/ui/Dialog.js';
import '@/components/ui/Toast.js';
import api from '@/services/api.js';

class GiveDeleteDialog extends HTMLElement {
    constructor() {
        super();
        this.giveData = null;
    }

    static get observedAttributes() { return ['open']; }
    
    connectedCallback() { 
        this.render(); 
        this.setupEventListeners(); 
    }
    
    setupEventListeners() {
        this.addEventListener('confirm', () => this.deleteGive());
        this.addEventListener('cancel', () => this.close());
    }
    
    open() { this.setAttribute('open', ''); }
    close() { this.removeAttribute('open'); this.resetForm(); }
    resetForm() { this.giveData = null; this.render(); }
    setGiveData(data) { this.giveData = { ...data }; this.render(); }
    
    async deleteGive() {
        try {
            if (!this.giveData || !this.giveData.id) {
                Toast.show({ title: 'Error', message: 'No give entry data available for deletion', variant: 'error', duration: 3000 });
                return;
            }
            const token = localStorage.getItem('token');
            if (!token) {
                Toast.show({ title: 'Authentication Error', message: 'Please log in to delete give entries', variant: 'error', duration: 3000 });
                return;
            }
            const response = await api.withToken(token).delete(`/give/${this.giveData.id}`);
            if (response.data.success) {
                Toast.show({ title: 'Success', message: 'Give entry deleted successfully', variant: 'success', duration: 3000 });
                this.dispatchEvent(new CustomEvent('give-deleted', { detail: { giveId: this.giveData.id }, bubbles: true, composed: true }));
                this.close();
            } else {
                throw new Error(response.data.message || 'Failed to delete give entry');
            }
        } catch (error) {
            Toast.show({ title: 'Error', message: error.response?.data?.message || error.message || 'Failed to delete give entry', variant: 'error', duration: 3000 });
        }
    }
    
    render() {
        const giveTitle = this.giveData?.title || 'Unknown';
        this.innerHTML = `
            <ui-dialog 
                ${this.hasAttribute('open') ? 'open' : ''} 
                title="Confirm Delete" 
                position="center"
                variant="danger">
                <div slot="content">
                    <p class="text-gray-700 mb-4">
                        Are you sure you want to delete the payment method "<strong>${giveTitle}</strong>"?
                    </p>
                    <p class="text-sm text-gray-500">
                        This action cannot be undone. The payment method will be permanently deleted from the system.
                    </p>
                </div>
            </ui-dialog>
        `;
    }
}

customElements.define('give-delete-dialog', GiveDeleteDialog);
export default GiveDeleteDialog;

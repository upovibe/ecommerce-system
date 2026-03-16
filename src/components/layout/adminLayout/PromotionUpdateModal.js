import "@/components/ui/Modal.js";
import "@/components/ui/Input.js";
import "@/components/ui/Textarea.js";
import "@/components/ui/Dropdown.js";

class PromotionUpdateModal extends HTMLElement {
  constructor() {
    super();
    this.promotion = null;
  }

  connectedCallback() {
    this.render();
  }

  setPromotion(promotion) {
    this.promotion = promotion;
    this.render();
    if (promotion) {
      this.querySelector("#edit-name").value = promotion.name || "";
      this.querySelector("#edit-description").value = promotion.description || "";
      this.querySelector("#edit-discount-type").value = promotion.discount_type || "percentage";
      this.querySelector("#edit-discount-value").value = promotion.discount_value || 0;
      
      // Format dates for datetime-local input (YYYY-MM-DDTHH:mm)
      if (promotion.start_date) {
        this.querySelector("#edit-start-date").value = promotion.start_date.replace(" ", "T").substring(0, 16);
      }
      if (promotion.end_date) {
        this.querySelector("#edit-end-date").value = promotion.end_date.replace(" ", "T").substring(0, 16);
      }
      
      this.querySelector("#edit-status").value = promotion.status || "active";
    }
  }

  render() {
    this.innerHTML = `
      <ui-modal id="promotion-update-modal" position="right" size="lg" close-on-backdrop-click="false">
        <span slot="title">Update Promotion</span>
        <form id="promotion-update-form" class="space-y-4">
          <div class="space-y-4">
            <div>
              <label class="block text-sm font-medium text-slate-700 mb-1">Promotion Name *</label>
              <ui-input id="edit-name" placeholder="e.g. Summer Sale 2026" class="w-full"></ui-input>
            </div>

            <div>
              <label class="block text-sm font-medium text-slate-700 mb-1">Description</label>
              <ui-textarea id="edit-description" rows="3" placeholder="Describe the promotion..." class="w-full"></ui-textarea>
            </div>

            <div class="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <label class="block text-sm font-medium text-slate-700 mb-1">Discount Type *</label>
                <ui-dropdown id="edit-discount-type" placeholder="Select type..." class="w-full">
                  <ui-option value="percentage">Percentage (%)</ui-option>
                  <ui-option value="fixed">Fixed Amount</ui-option>
                </ui-dropdown>
              </div>
              <div>
                <label class="block text-sm font-medium text-slate-700 mb-1">Discount Value *</label>
                <ui-input id="edit-discount-value" type="number" min="0" step="0.01" placeholder="0.00" class="w-full"></ui-input>
              </div>
            </div>

            <div class="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <label class="block text-sm font-medium text-slate-700 mb-1">Start Date *</label>
                <ui-input id="edit-start-date" type="datetime-local" class="w-full"></ui-input>
              </div>
              <div>
                <label class="block text-sm font-medium text-slate-700 mb-1">End Date *</label>
                <ui-input id="edit-end-date" type="datetime-local" class="w-full"></ui-input>
              </div>
            </div>

            <div>
              <label class="block text-sm font-medium text-slate-700 mb-1">Status</label>
              <ui-dropdown id="edit-status" placeholder="Select status..." class="w-full">
                <ui-option value="active">Active</ui-option>
                <ui-option value="inactive">Inactive</ui-option>
              </ui-dropdown>
            </div>
          </div>
        </form>
        <div slot="footer" class="w-full flex gap-3 justify-end items-center">
          <button modal-action="cancel" class="px-4 py-2 rounded-md text-slate-500 font-medium hover:bg-slate-50 transition text-sm">Cancel</button>
          <button id="edit-save-btn" onclick="this.closest('app-promotions-page').submitUpdate()" class="px-4 py-2 rounded-md bg-blue-600 text-white font-medium hover:bg-blue-700 transition text-sm flex items-center gap-2 shadow-sm">
            <i class="fas fa-save text-xs"></i> Save Changes
          </button>
        </div>
      </ui-modal>
    `;
  }

  open() {
    this.querySelector("#promotion-update-modal")?.open();
  }

  close() {
    this.querySelector("#promotion-update-modal")?.close();
  }
}

customElements.define("promotion-update-modal", PromotionUpdateModal);
export default PromotionUpdateModal;

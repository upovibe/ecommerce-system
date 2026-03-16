import "@/components/ui/Modal.js";
import "@/components/ui/Input.js";
import "@/components/ui/Textarea.js";
import "@/components/ui/Dropdown.js";

class PromotionUpdateModal extends HTMLElement {
  constructor() {
    super();
    this.promotion = null;
    this.currentProducts = [];
  }

  connectedCallback() {
    this.render();
  }

  setPromotion(promotion) {
    this.promotion = promotion;
    this.currentProducts = promotion ? [...(promotion.products || [])] : [];
    this.render();
    
    if (promotion) {
      setTimeout(() => {
        const nameInp = this.querySelector("#edit-name");
        const descInp = this.querySelector("#edit-description");
        const typeDrop = this.querySelector("#edit-discount-type");
        const valInp = this.querySelector("#edit-discount-value");
        const startInp = this.querySelector("#edit-start-date");
        const endInp = this.querySelector("#edit-end-date");
        const statusDrop = this.querySelector("#edit-status");

        if (nameInp) nameInp.value = promotion.name || "";
        if (descInp) descInp.value = promotion.description || "";
        if (typeDrop) typeDrop.value = promotion.discount_type || "percentage";
        if (valInp) valInp.value = promotion.discount_value || 0;
        if (startInp && promotion.start_date) startInp.value = promotion.start_date.replace(" ", "T").substring(0, 16);
        if (endInp && promotion.end_date) endInp.value = promotion.end_date.replace(" ", "T").substring(0, 16);
        if (statusDrop) statusDrop.value = promotion.status || "active";
      }, 0);
    }
  }

  removeProduct(productId) {
    this.currentProducts = this.currentProducts.filter(p => p.id !== productId);
    this.renderProductList();
  }

  renderProductList() {
    const container = this.querySelector("#managed-products-list");
    const countBadge = this.querySelector("#managed-products-count");
    
    if (countBadge) countBadge.textContent = `${this.currentProducts.length} Items`;
    
    if (container) {
      if (this.currentProducts.length === 0) {
        container.innerHTML = `<div class="py-4 text-center text-[10px] text-slate-400 italic bg-white rounded-lg border border-dashed border-slate-200">No products targeted</div>`;
      } else {
        container.innerHTML = this.currentProducts.map(p => `
          <div class="flex items-center justify-between bg-white p-2 rounded-lg border border-slate-100 group hover:border-blue-100 transition-colors">
            <div class="min-w-0 flex-1">
              <div class="text-[11px] font-bold text-slate-700 truncate group-hover:text-blue-600">${p.name}</div>
              <div class="text-[9px] text-slate-400 font-mono">${p.sku || 'N/A'}</div>
            </div>
            <button onclick="this.closest('promotion-update-modal').removeProduct(${p.id})" 
              class="size-6 flex items-center justify-center rounded-lg text-slate-300 hover:text-rose-500 hover:bg-rose-50 transition" title="Remove Product">
              <i class="fas fa-times text-[10px]"></i>
            </button>
          </div>
        `).join("");
      }
    }
  }

  get productIds() {
    return this.currentProducts.map(p => p.id);
  }

  render() {
    this.innerHTML = `
      <ui-modal id="promotion-update-modal" position="right" size="md" close-on-backdrop-click="false">
        <span slot="title" class="flex items-center gap-2 font-black uppercase tracking-tighter text-slate-800">
          <i class="fas fa-edit text-blue-500"></i> Update Promotion
        </span>
        <div class="space-y-6">
          <div class="space-y-4">
            <h4 class="text-[10px] font-black text-slate-400 uppercase tracking-widest border-b border-slate-50 pb-2">Campaign Details</h4>
            <form id="promotion-update-form" class="grid grid-cols-1 gap-4">
              <div>
                <label class="block text-[11px] font-bold text-slate-700 mb-1">Promotion Name *</label>
                <ui-input id="edit-name" class="w-full"></ui-input>
              </div>
              <div>
                <label class="block text-[11px] font-bold text-slate-700 mb-1">Description</label>
                <ui-textarea id="edit-description" rows="2" class="w-full"></ui-textarea>
              </div>
              <div class="grid grid-cols-2 gap-4">
                <div>
                  <label class="block text-[11px] font-bold text-slate-700 mb-1">Discount Type *</label>
                  <ui-dropdown id="edit-discount-type" class="w-full">
                    <ui-option value="percentage">Percentage (%)</ui-option>
                    <ui-option value="fixed">Fixed Amount</ui-option>
                  </ui-dropdown>
                </div>
                <div>
                  <label class="block text-[11px] font-bold text-slate-700 mb-1">Value *</label>
                  <ui-input id="edit-discount-value" type="number" step="0.01" class="w-full"></ui-input>
                </div>
              </div>
              <div class="grid grid-cols-2 gap-4">
                <div>
                  <label class="block text-[11px] font-bold text-slate-700 mb-1">Start Date *</label>
                  <ui-input id="edit-start-date" type="datetime-local" class="w-full"></ui-input>
                </div>
                <div>
                  <label class="block text-[11px] font-bold text-slate-700 mb-1">End Date *</label>
                  <ui-input id="edit-end-date" type="datetime-local" class="w-full"></ui-input>
                </div>
              </div>
              <div>
                <label class="block text-[11px] font-bold text-slate-700 mb-1">Status</label>
                <ui-dropdown id="edit-status" class="w-full">
                  <ui-option value="active">Active</ui-option>
                  <ui-option value="inactive">Inactive</ui-option>
                </ui-dropdown>
              </div>
            </form>

            <div class="p-4 bg-slate-50 border border-slate-100 rounded-2xl mt-6">
              <div class="flex items-center justify-between mb-3 border-b border-slate-200 pb-2">
                <div class="text-[10px] font-black text-slate-400 uppercase tracking-widest">Targeted Products</div>
                <div id="managed-products-count" class="text-[10px] font-bold bg-white px-2 py-0.5 rounded-lg border border-slate-200 text-slate-600">
                  ${this.currentProducts.length} Items
                </div>
              </div>
              <div id="managed-products-list" class="max-h-[160px] overflow-y-auto space-y-1.5 pr-2 custom-scrollbar">
                <!-- Row content injected here -->
              </div>
              <div class="mt-3 text-[9px] text-center text-slate-400 italic">Remove items to stop applying this discount to them</div>
            </div>
          </div>
        </div>

        <div slot="footer" class="w-full flex gap-3 justify-end items-center">
          <button modal-action="cancel" class="px-5 py-2 rounded-xl text-slate-500 font-bold uppercase tracking-widest text-[10px] hover:bg-slate-50 transition">Cancel</button>
          <button id="edit-save-btn" onclick="this.closest('app-promotions-page').submitUpdate()" class="px-6 py-2 rounded-xl bg-blue-600 text-white font-bold uppercase tracking-widest text-[10px] hover:bg-blue-700 transition shadow-lg flex items-center gap-2">
            <i class="fas fa-save text-[8px]"></i> Save Changes
          </button>
        </div>
      </ui-modal>
    `;
    
    // Initial render of product list
    this.renderProductList();
  }

  open() { this.querySelector("#promotion-update-modal")?.open(); }
  close() { this.querySelector("#promotion-update-modal")?.close(); }
}

customElements.define("promotion-update-modal", PromotionUpdateModal);
export default PromotionUpdateModal;

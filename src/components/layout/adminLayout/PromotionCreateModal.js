import "@/components/ui/Modal.js";
import "@/components/ui/Input.js";
import "@/components/ui/Textarea.js";
import "@/components/ui/Dropdown.js";

class PromotionCreateModal extends HTMLElement {
  constructor() {
    super();
    this.selectedIds = new Set();
    this.products = [];
  }

  connectedCallback() {
    this.render();
  }

  setOptions({ products, categories, selectedIds } = {}) {
    this.products = products || [];
    this.selectedIds = new Set(selectedIds || []);
    this.render();
  }

  render() {
    this.innerHTML = `
      <ui-modal id="promotion-create-modal" position="right" size="md" close-on-backdrop-click="false">
        <span slot="title">Launch New Promotion</span>
        <div class="space-y-6">
          <div class="space-y-4">
            <h4 class="text-[10px] font-black text-slate-400 uppercase tracking-widest border-b border-slate-50 pb-2">Campaign Details</h4>
            <form id="promotion-create-form" class="space-y-4">
              <div>
                <label class="block text-[11px] font-bold text-slate-700 mb-1">Promotion Name *</label>
                <ui-input id="create-name" placeholder="e.g. Summer Sale 2026" class="w-full"></ui-input>
              </div>

              <div>
                <label class="block text-[11px] font-bold text-slate-700 mb-1">Description</label>
                <ui-textarea id="create-description" rows="2" placeholder="Describe the promotion..." class="w-full"></ui-textarea>
              </div>

              <div class="grid grid-cols-2 gap-4">
                <div>
                  <label class="block text-[11px] font-bold text-slate-700 mb-1">Discount Type *</label>
                  <ui-dropdown id="create-discount-type" placeholder="Type..." class="w-full">
                    <ui-option value="percentage">Percentage (%)</ui-option>
                    <ui-option value="fixed">Fixed Amount</ui-option>
                  </ui-dropdown>
                </div>
                <div>
                  <label class="block text-[11px] font-bold text-slate-700 mb-1">Value *</label>
                  <ui-input id="create-discount-value" type="number" min="0" step="0.01" placeholder="0.00" class="w-full"></ui-input>
                </div>
              </div>

              <div class="grid grid-cols-2 gap-4">
                <div>
                  <label class="block text-[11px] font-bold text-slate-700 mb-1">Start Date *</label>
                  <ui-input id="create-start-date" type="datetime-local" class="w-full"></ui-input>
                </div>
                <div>
                  <label class="block text-[11px] font-bold text-slate-700 mb-1">End Date *</label>
                  <ui-input id="create-end-date" type="datetime-local" class="w-full"></ui-input>
                </div>
              </div>

              <div>
                <label class="block text-[11px] font-bold text-slate-700 mb-1">Status</label>
                <ui-dropdown id="create-status" placeholder="Status..." class="w-full">
                  <ui-option value="active">Active</ui-option>
                  <ui-option value="inactive">Inactive</ui-option>
                </ui-dropdown>
              </div>
            </form>
            
            <div class="p-4 bg-indigo-50 border border-indigo-100 rounded-2xl mt-6">
              <div class="flex items-center gap-3">
                <div class="w-10 h-10 bg-indigo-500 rounded-xl flex items-center justify-center text-white shadow-lg shadow-indigo-500/20">
                  <i class="fas fa-box-open text-sm"></i>
                </div>
                <div>
                  <div class="text-sm font-bold text-indigo-900">${this.selectedIds.size} Products Targeted</div>
                  <div class="text-[10px] text-indigo-600 font-medium uppercase tracking-wider">Scouted from catalog</div>
                </div>
              </div>
            </div>
          </div>
        </div>

        <div slot="footer" class="w-full flex gap-3 justify-end items-center">
          <button modal-action="cancel" class="px-4 py-2 rounded-md text-slate-500 font-medium hover:bg-slate-50 transition text-sm">Cancel</button>
          <button id="create-save-btn" onclick="this.closest('app-promotions-page').submitCreate()" class="px-4 py-2 rounded-md bg-blue-600 text-white font-medium hover:bg-blue-700 transition text-sm flex items-center gap-2 shadow-sm">
            <i class="fas fa-bullhorn text-[10px]"></i> Launch Promotion
          </button>
        </div>
      </ui-modal>
    `;
  }

  open() {
    this.querySelector("#promotion-create-modal")?.open();
  }

  close() {
    this.querySelector("#promotion-create-modal")?.close();
  }
}

customElements.define("promotion-create-modal", PromotionCreateModal);
export default PromotionCreateModal;

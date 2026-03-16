import "@/components/ui/Modal.js";
import "@/components/ui/Button.js";

class PromotionViewModal extends HTMLElement {
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
  }

  render() {
    if (!this.promotion) return;

    const productsHtml = (this.promotion.products || []).map(p => `
      <div class="flex items-center justify-between p-3 bg-white border border-slate-100 rounded-lg shadow-sm">
        <div class="flex items-center gap-3">
          <div class="w-10 h-10 rounded bg-slate-100 flex items-center justify-center text-slate-400">
            <i class="fas fa-box"></i>
          </div>
          <div>
            <p class="text-sm font-bold text-slate-900">${p.name}</p>
            <p class="text-[10px] text-slate-500 font-mono">${p.sku || p.product_code || 'No SKU'}</p>
          </div>
        </div>
        <button onclick="this.closest('app-promotions-page').detachProduct(${this.promotion.id}, ${p.id})" class="p-1.5 text-rose-500 hover:bg-rose-50 rounded-md transition-colors">
          <i class="fas fa-unlink text-xs"></i>
        </button>
      </div>
    `).join("");

    this.innerHTML = `
      <ui-modal id="promotion-view-modal" size="lg" position="right">
        <span slot="title">Promotion Details</span>
        <div class="space-y-6">
          <div class="bg-blue-50/50 p-4 rounded-xl border border-blue-100/50">
            <h3 class="text-lg font-black text-slate-900 mb-1">${this.promotion.name}</h3>
            <p class="text-sm text-slate-600">${this.promotion.description || 'No description provided.'}</p>
          </div>

          <div class="grid grid-cols-2 gap-4">
            <div class="p-4 bg-slate-50 rounded-xl border border-slate-100">
              <p class="text-[10px] font-bold text-slate-400 uppercase tracking-wider mb-1">Discount</p>
              <p class="text-lg font-black text-slate-900">
                ${this.promotion.discount_type === 'percentage' ? this.promotion.discount_value + '%' : '$' + this.promotion.discount_value}
              </p>
            </div>
            <div class="p-4 bg-slate-50 rounded-xl border border-slate-100">
              <p class="text-[10px] font-bold text-slate-400 uppercase tracking-wider mb-1">Status</p>
              <span class="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-bold ${this.promotion.status === 'active' ? 'bg-emerald-100 text-emerald-700' : 'bg-slate-100 text-slate-700'} uppercase tracking-tight">
                ${this.promotion.status}
              </span>
            </div>
          </div>

          <div class="grid grid-cols-2 gap-4">
            <div class="p-4 bg-slate-50 rounded-xl border border-slate-100">
              <p class="text-[10px] font-bold text-slate-400 uppercase tracking-wider mb-1">Start Date</p>
              <p class="text-sm font-bold text-slate-700">${new Date(this.promotion.start_date).toLocaleString()}</p>
            </div>
            <div class="p-4 bg-slate-50 rounded-xl border border-slate-100">
              <p class="text-[10px] font-bold text-slate-400 uppercase tracking-wider mb-1">End Date</p>
              <p class="text-sm font-bold text-slate-700">${new Date(this.promotion.end_date).toLocaleString()}</p>
            </div>
          </div>

          <div class="space-y-3">
            <div class="flex items-center justify-between">
              <h4 class="text-sm font-black text-slate-900 uppercase tracking-wider">Assigned Products</h4>
              <button onclick="this.closest('app-promotions-page').openProductSelectionModal(${this.promotion.id})" class="px-3 py-1.5 rounded-lg bg-blue-600 text-white text-[10px] font-bold uppercase tracking-widest hover:bg-blue-700 transition-all shadow-sm flex items-center gap-2">
                <i class="fas fa-plus"></i> Attach Products
              </button>
            </div>
            <div class="space-y-2 max-h-[300px] overflow-y-auto pr-1">
              ${productsHtml || '<p class="text-center py-8 text-slate-400 text-sm italic">No products attached to this promotion.</p>'}
            </div>
          </div>
        </div>
        <div slot="footer" class="w-full flex justify-end">
          <button modal-action="cancel" class="px-6 py-2 bg-slate-900 text-white text-sm font-bold rounded-xl hover:bg-slate-800 transition-all shadow-lg hover:shadow-xl uppercase tracking-widest">Close</button>
        </div>
      </ui-modal>
    `;
  }

  open() {
    this.querySelector("#promotion-view-modal")?.open();
  }

  close() {
    this.querySelector("#promotion-view-modal")?.close();
  }
}

customElements.define("promotion-view-modal", PromotionViewModal);
export default PromotionViewModal;

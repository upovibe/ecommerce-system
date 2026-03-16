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

  getImageUrl(path) {
    if (!path) return "";
    if (path.startsWith("http://") || path.startsWith("https://") || path.startsWith("data:")) {
      return path;
    }
    const baseUrl = window.location.origin;
    if (path.startsWith("/api/")) return baseUrl + path;
    if (path.startsWith("/")) return baseUrl + path;
    if (path.startsWith("uploads/")) return `${baseUrl}/api/${path}`;
    return `${baseUrl}/api/${path.replace(/^\//, "")}`;
  }

  render() {
    if (!this.promotion) return;

    const productsHtml = (this.promotion.products || []).map(p => {
      const image = p.main_image ? this.getImageUrl(p.main_image) : "";
      return `
        <div class="flex items-center justify-between p-3 bg-white border border-slate-100 rounded-lg shadow-sm group hover:border-blue-100 transition-colors">
          <div class="flex items-center gap-3 min-w-0 flex-1">
            <div class="size-10 rounded-lg bg-slate-50 border border-slate-100 overflow-hidden flex-shrink-0 flex items-center justify-center">
              ${image ? `<img src="${image}" class="w-full h-full object-cover">` : `<i class="fas fa-box text-slate-300"></i>`}
            </div>
            <div class="min-w-0">
              <p class="text-sm font-bold text-slate-900 truncate group-hover:text-blue-600">${p.name}</p>
              <p class="text-[10px] text-slate-500 font-mono">${p.sku || p.product_code || 'No SKU'}</p>
            </div>
          </div>
          <button onclick="this.closest('app-promotions-page').detachProduct(${this.promotion.id}, ${p.id})" class="p-1.5 text-slate-300 hover:text-rose-500 hover:bg-rose-50 rounded-md transition-all">
            <i class="fas fa-unlink text-xs"></i>
          </button>
        </div>
      `;
    }).join("");

    this.innerHTML = `
      <ui-modal id="promotion-view-modal" size="lg" position="right">
        <span slot="title" class="flex items-center gap-2 font-black uppercase tracking-tighter text-slate-800">
          <i class="fas fa-eye text-indigo-500 font-normal"></i> Promotion Details
        </span>
        <div class="space-y-6">
          <div class="bg-blue-50/50 p-4 rounded-xl border border-blue-100/50">
            <h3 class="text-lg font-black text-slate-900 mb-1">${this.promotion.name}</h3>
            <p class="text-sm text-slate-600">${this.promotion.description || 'No description provided.'}</p>
          </div>

          <div class="grid grid-cols-2 gap-4">
            <div class="p-4 bg-slate-50 rounded-xl border border-slate-100">
              <p class="text-[10px] font-bold text-slate-400 uppercase tracking-wider mb-1 text-xs">Discount</p>
              <p class="text-lg font-black text-slate-900">
                ${this.promotion.discount_type === 'percentage' ? this.promotion.discount_value + '%' : '$' + this.promotion.discount_value}
              </p>
            </div>
            <div class="p-4 bg-slate-50 rounded-xl border border-slate-100">
              <p class="text-[10px] font-bold text-slate-400 uppercase tracking-wider mb-1 text-xs">Status</p>
              <span class="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-bold ${this.promotion.status === 'active' ? 'bg-emerald-100 text-emerald-700' : 'bg-slate-100 text-slate-700'} uppercase tracking-tight">
                ${this.promotion.status}
              </span>
            </div>
          </div>

          <div class="grid grid-cols-2 gap-4">
            <div class="p-4 bg-slate-50 rounded-xl border border-slate-100">
              <p class="text-[10px] font-bold text-slate-400 uppercase tracking-wider mb-1 text-xs">Start Date</p>
              <p class="text-sm font-bold text-slate-700">${new Date(this.promotion.start_date).toLocaleString()}</p>
            </div>
            <div class="p-4 bg-slate-50 rounded-xl border border-slate-100">
              <p class="text-[10px] font-bold text-slate-400 uppercase tracking-wider mb-1 text-xs">End Date</p>
              <p class="text-sm font-bold text-slate-700">${new Date(this.promotion.end_date).toLocaleString()}</p>
            </div>
          </div>

          <div class="space-y-3">
            <div class="flex items-center justify-between border-b border-slate-100 pb-2">
              <h4 class="text-[10px] font-black text-slate-400 uppercase tracking-widest text-xs">Assigned Products</h4>
            </div>
            <div class="grid grid-cols-1 md:grid-cols-2 gap-3 max-h-[400px] overflow-y-auto pr-1 custom-scrollbar">
              ${productsHtml || '<p class="text-center col-span-2 py-8 text-slate-400 text-sm italic">No products attached to this promotion.</p>'}
            </div>
          </div>
        </div>
        <div slot="footer" class="w-full flex justify-end">
          <button modal-action="cancel" class="px-6 py-2 bg-slate-900 text-white text-sm font-bold rounded-xl hover:bg-slate-800 transition-all shadow-lg hover:shadow-xl uppercase tracking-widest rounded-md">Close</button>
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

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
        <div class="flex items-center justify-between bg-white p-2 rounded-lg border border-slate-100 group hover:border-blue-100 transition-colors">
          <div class="flex items-center gap-3 min-w-0 flex-1">
            <div class="size-8 rounded-lg bg-slate-50 border border-slate-100 overflow-hidden flex-shrink-0 flex items-center justify-center">
              ${image ? `<img src="${image}" class="w-full h-full object-cover">` : `<i class="fas fa-image text-slate-300 text-xs"></i>`}
            </div>
            <div class="min-w-0">
              <div class="text-[11px] font-bold text-slate-700 truncate group-hover:text-blue-600">${p.name}</div>
              <div class="text-[9px] text-slate-400 font-mono">${p.sku || p.product_code || 'N/A'}</div>
            </div>
          </div>
          <button onclick="this.closest('app-promotions-page').detachProduct(${this.promotion.id}, ${p.id})" class="size-6 flex items-center justify-center rounded-lg text-slate-300 hover:text-rose-50 hover:bg-rose-50 transition" title="Detach Product">
            <i class="fas fa-unlink text-[10px]"></i>
          </button>
        </div>
      `;
    }).join("");

    this.innerHTML = `
      <ui-modal id="promotion-view-modal" size="md" position="right">
        <span slot="title" class="flex items-center gap-2 font-black uppercase tracking-tighter text-slate-800">
          <i class="fas fa-eye text-blue-500 font-normal"></i> Promotion Details
        </span>
        <div class="space-y-6">
          <div class="bg-blue-50/50 p-4 rounded-2xl border border-blue-100/50">
            <h3 class="text-base font-black text-slate-900 mb-1 tracking-tight">${this.promotion.name}</h3>
            <p class="text-[11px] text-slate-600 leading-relaxed">${this.promotion.description || 'No description provided.'}</p>
          </div>

          <div class="grid grid-cols-2 gap-4">
            <div class="p-4 bg-slate-50 rounded-2xl border border-slate-100">
              <p class="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-1">Discount</p>
              <p class="text-lg font-black text-slate-900 tracking-tight">
                ${this.promotion.discount_type === 'percentage' ? this.promotion.discount_value + '%' : '$' + this.promotion.discount_value}
              </p>
            </div>
            <div class="p-4 bg-slate-50 rounded-2xl border border-slate-100">
              <p class="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-1">Status</p>
              <span class="inline-flex items-center px-2 py-0.5 rounded-full text-[10px] font-bold ${this.promotion.status === 'active' ? 'bg-emerald-100 text-emerald-700' : 'bg-slate-100 text-slate-700'} uppercase tracking-tight">
                ${this.promotion.status}
              </span>
            </div>
          </div>

          <div class="grid grid-cols-2 gap-4">
            <div class="p-4 bg-slate-50 rounded-2xl border border-slate-100">
              <p class="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-1">Start Date</p>
              <p class="text-[11px] font-bold text-slate-700">${new Date(this.promotion.start_date).toLocaleString()}</p>
            </div>
            <div class="p-4 bg-slate-50 rounded-2xl border border-slate-100">
              <p class="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-1">End Date</p>
              <p class="text-[11px] font-bold text-slate-700">${new Date(this.promotion.end_date).toLocaleString()}</p>
            </div>
          </div>

          <div class="p-4 bg-slate-50 border border-slate-100 rounded-2xl mt-6">
            <div class="flex items-center justify-between mb-3 border-b border-slate-200 pb-2">
              <div class="text-[10px] font-black text-slate-400 uppercase tracking-widest">Assigned Products</div>
              <div class="text-[10px] font-bold bg-white px-2 py-0.5 rounded-lg border border-slate-200 text-slate-600">
                ${(this.promotion.products || []).length} Items
              </div>
            </div>
            <div class="max-h-[200px] overflow-y-auto space-y-1.5 pr-2 custom-scrollbar">
              ${productsHtml || '<p class="text-center py-8 text-slate-400 text-[11px] italic">No products attached to this promotion.</p>'}
            </div>
          </div>
        </div>
        <div slot="footer" class="w-full flex justify-end items-center">
          <button modal-action="cancel" class="px-5 py-2 rounded-md bg-slate-900 text-white font-bold uppercase tracking-widest text-[10px] hover:bg-slate-800 transition shadow-lg">Close</button>
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

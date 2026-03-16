import "@/components/ui/Modal.js";
import "@/components/ui/Input.js";

class ProductSelectionModal extends HTMLElement {
  constructor() {
    super();
    this.products = [];
    this.promotionId = null;
    this.selectedIds = new Set();
  }

  connectedCallback() {
    this.render();
  }

  setOptions({ products, promotionId } = {}) {
    this.products = products || [];
    this.promotionId = promotionId;
    this.selectedIds.clear();
    this.render();
  }

  render() {
    const rows = this.products.map(p => `
      <div class="flex items-center gap-4 p-3 hover:bg-slate-50 rounded-xl transition-colors cursor-pointer" onclick="this.querySelector('input').click()">
        <input type="checkbox" value="${p.id}" class="w-4 h-4 text-blue-600 rounded border-slate-300 focus:ring-blue-500" 
          onchange="this.closest('product-selection-modal').toggleProduct(this, ${p.id})">
        <div class="flex items-center gap-3 flex-1">
          <div class="w-10 h-10 rounded-lg bg-slate-100 flex items-center justify-center text-slate-400 overflow-hidden">
            ${p.main_image ? `<img src="/api/${p.main_image}" class="w-full h-full object-cover">` : '<i class="fas fa-box"></i>'}
          </div>
          <div class="min-w-0 flex-1">
            <p class="text-sm font-bold text-slate-900 truncate">${p.name}</p>
            <p class="text-[10px] text-slate-500 font-mono">${p.sku || p.product_code || 'No SKU'}</p>
          </div>
          <div class="text-right">
            <p class="text-xs font-black text-slate-900">$${p.base_price}</p>
            <p class="text-[10px] text-slate-400">Stock: ${p.total_stock || 0}</p>
          </div>
        </div>
      </div>
    `).join("");

    this.innerHTML = `
      <ui-modal id="product-selection-modal" size="md">
        <span slot="title">Attach Products to Promotion</span>
        <div class="space-y-4">
          <div class="relative">
            <i class="fas fa-search absolute left-3 top-1/2 -translate-y-1/2 text-slate-400 text-sm"></i>
            <input type="text" placeholder="Search products..." class="w-full pl-9 pr-4 py-2 bg-slate-100 border-none rounded-xl text-sm focus:ring-2 focus:ring-blue-500/20 transition-all outline-none" oninput="this.closest('product-selection-modal').filterProducts(this.value)">
          </div>
          
          <div class="space-y-2 max-h-[400px] overflow-y-auto pr-1" id="selection-product-list">
            ${rows || '<p class="text-center py-10 text-slate-400 italic">No products available.</p>'}
          </div>
        </div>
        <div slot="footer" class="w-full flex justify-between items-center gap-4">
          <p class="text-xs text-slate-500 font-medium"><span id="selected-count" class="font-bold text-blue-600">0</span> products selected</p>
          <div class="flex gap-3">
            <button modal-action="cancel" class="px-4 py-2 rounded-xl text-slate-500 font-bold uppercase tracking-widest text-[10px] hover:bg-slate-100 transition-all">Cancel</button>
            <button id="selection-attach-btn" onclick="this.closest('app-promotions-page').attachSelectedProducts()" class="px-6 py-2 bg-blue-600 text-white text-[10px] font-bold uppercase tracking-widest rounded-xl hover:bg-blue-700 transition-all shadow-lg hover:shadow-xl disabled:opacity-50 disabled:cursor-not-allowed">
              Attach Selected
            </button>
          </div>
        </div>
      </ui-modal>
    `;
  }

  toggleProduct(checkbox, id) {
    if (checkbox.checked) {
      this.selectedIds.add(id);
    } else {
      this.selectedIds.delete(id);
    }
    this.querySelector("#selected-count").textContent = this.selectedIds.size;
  }

  filterProducts(query) {
    const list = this.querySelector("#selection-product-list");
    const items = list.querySelectorAll(".hover\\:bg-slate-50");
    const q = query.toLowerCase();
    
    items.forEach(item => {
      const text = item.textContent.toLowerCase();
      if (text.includes(q)) {
        item.classList.remove("hidden");
      } else {
        item.classList.add("hidden");
      }
    });
  }

  open() {
    this.querySelector("#product-selection-modal")?.open();
  }

  close() {
    this.querySelector("#product-selection-modal")?.close();
  }
}

customElements.define("product-selection-modal", ProductSelectionModal);
export default ProductSelectionModal;

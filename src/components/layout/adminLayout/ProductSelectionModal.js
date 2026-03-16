import "@/components/ui/Modal.js";
import "@/components/ui/Input.js";
import "@/components/ui/Dropdown.js";

class ProductSelectionModal extends HTMLElement {
  constructor() {
    super();
    this.products = [];
    this.categories = [];
    this.promotionId = null;
    this.selectedIds = new Set();
    this.filters = {
      query: "",
      category: "",
      subcategory: ""
    };
  }

  connectedCallback() {
    this.render();
  }

  setOptions({ products, categories, promotionId } = {}) {
    this.products = products || [];
    this.categories = categories || [];
    this.promotionId = promotionId;
    this.selectedIds.clear();
    this.filters = { query: "", category: "", subcategory: "" };
    this.render();
  }

  render() {
    const parentCategories = this.categories.filter(c => !c.parent_id);
    const subCategories = this.filters.category 
      ? this.categories.filter(c => c.parent_id == this.filters.category)
      : [];

    const categoryToParent = {};
    this.categories.forEach(c => {
      categoryToParent[String(c.id)] = c.parent_id ? String(c.parent_id) : null;
    });

    const filteredProducts = this.products.filter(p => {
      const matchesQuery = !this.filters.query || 
        p.name.toLowerCase().includes(this.filters.query.toLowerCase()) || 
        (p.sku && p.sku.toLowerCase().includes(this.filters.query.toLowerCase()));
      
      const pCatId = p.category_id ? String(p.category_id) : null;
      const pParentId = categoryToParent[pCatId] || null;

      let matchesCategory = true;
      if (this.filters.category) {
        matchesCategory = (pCatId == this.filters.category) || (pParentId == this.filters.category);
      }

      let matchesSubcategory = true;
      if (this.filters.subcategory) {
        matchesSubcategory = (pCatId == this.filters.subcategory);
      }
      
      return matchesQuery && matchesCategory && matchesSubcategory;
    });

    const rows = filteredProducts.map(p => `
      <div class="flex items-center gap-4 p-3 hover:bg-slate-50 rounded-xl transition-colors cursor-pointer" onclick="this.querySelector('input').click()">
        <input type="checkbox" value="${p.id}" ${this.selectedIds.has(p.id) ? 'checked' : ''} class="w-4 h-4 text-blue-600 rounded border-slate-300 focus:ring-blue-500" 
          onclick="event.stopPropagation()"
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
          <!-- Advanced Filtering -->
          <div class="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div>
              <label class="block text-[10px] font-bold text-slate-400 uppercase tracking-wider mb-1 px-1">Category</label>
              <ui-dropdown id="select-filter-category" placeholder="All Categories" searchable class="w-full">
                <ui-option value="">All Categories</ui-option>
                ${parentCategories.map(c => `<ui-option value="${c.id}">${c.name}</ui-option>`).join("")}
              </ui-dropdown>
            </div>
            <div>
              <label class="block text-[10px] font-bold text-slate-400 uppercase tracking-wider mb-1 px-1">Subcategory</label>
              <ui-dropdown id="select-filter-subcategory" placeholder="All Subcategories" searchable class="w-full">
                <ui-option value="">All Subcategories</ui-option>
                ${subCategories.map(c => `<ui-option value="${c.id}">${c.name}</ui-option>`).join("")}
              </ui-dropdown>
            </div>
          </div>

          <div class="relative">
            <i class="fas fa-search absolute left-3 top-1/2 -translate-y-1/2 text-slate-400 text-sm"></i>
            <input type="text" id="product-search-input" value="${this.filters.query}" placeholder="Search by name or SKU..." class="w-full pl-9 pr-4 py-2 bg-slate-100 border-none rounded-xl text-sm focus:ring-2 focus:ring-blue-500/20 transition-all outline-none">
          </div>

          <div class="flex items-center justify-between px-1">
             <p class="text-xs font-bold text-slate-500">${filteredProducts.length} products found</p>
             <button id="select-all-visible-btn" class="text-[10px] font-black text-blue-600 uppercase tracking-widest hover:text-blue-700 transition-colors">
               Select All Visible
             </button>
          </div>
          
          <div class="space-y-2 max-h-[350px] overflow-y-auto pr-1" id="selection-product-list">
            ${rows || '<div class="text-center py-10"><i class="fas fa-search text-slate-200 text-3xl mb-3 block"></i><p class="text-slate-400 italic text-sm">No products match your filters.</p></div>'}
          </div>
        </div>
        <div slot="footer" class="w-full flex justify-between items-center gap-4">
          <div class="flex flex-col">
            <p class="text-xs text-slate-900 font-black"><span id="selected-count" class="text-blue-600">${this.selectedIds.size}</span> Selected</p>
            <button id="clear-selection-btn" class="text-[9px] text-rose-500 font-bold uppercase tracking-tighter text-left hover:underline">Clear all</button>
          </div>
          <div class="flex gap-3">
            <button modal-action="cancel" class="px-4 py-2 rounded-xl text-slate-500 font-bold uppercase tracking-widest text-[10px] hover:bg-slate-100 transition-all">Cancel</button>
            <button id="selection-attach-btn" class="px-6 py-2 bg-blue-600 text-white text-[10px] font-bold uppercase tracking-widest rounded-xl hover:bg-blue-700 transition-all shadow-lg hover:shadow-xl disabled:opacity-50 disabled:cursor-not-allowed">
              Attach Selected
            </button>
          </div>
        </div>
      </ui-modal>
    `;

    this.setupInternalEventListeners();
  }

  setupInternalEventListeners() {
    const catDropdown = this.querySelector("#select-filter-category");
    const subDropdown = this.querySelector("#select-filter-subcategory");
    const searchInput = this.querySelector("#product-search-input");
    const selectAllBtn = this.querySelector("#select-all-visible-btn");
    const clearBtn = this.querySelector("#clear-selection-btn");
    const attachBtn = this.querySelector("#selection-attach-btn");

    if (catDropdown) {
      if (this.filters.category) catDropdown.value = this.filters.category;
      catDropdown.addEventListener("change", (e) => this.handleCategoryFilter(e.detail.value));
    }

    if (subDropdown) {
      if (this.filters.subcategory) subDropdown.value = this.filters.subcategory;
      subDropdown.addEventListener("change", (e) => this.handleSubcategoryFilter(e.detail.value));
    }

    if (searchInput) {
      searchInput.addEventListener("input", (e) => this.handleSearchFilter(e.target.value));
    }

    if (selectAllBtn) {
      selectAllBtn.addEventListener("click", () => this.selectAllVisible());
    }

    if (clearBtn) {
      clearBtn.addEventListener("click", () => this.clearSelection());
    }

    if (attachBtn) {
      attachBtn.addEventListener("click", () => {
         const page = this.closest("app-promotions-page");
         if (page) page.attachSelectedProducts();
      });
    }
  }

  handleCategoryFilter(value) {
    this.filters.category = value;
    this.filters.subcategory = ""; 
    this.render();
  }

  handleSubcategoryFilter(value) {
    this.filters.subcategory = value;
    this.render();
  }

  handleSearchFilter(value) {
    this.filters.query = value;
    // Don't re-render everything on search to keep focus, but here it's fine for now
    this.render();
    // Refocus search
    setTimeout(() => {
      const input = this.querySelector("#product-search-input");
      if (input) {
        input.focus();
        input.setSelectionRange(input.value.length, input.value.length);
      }
    }, 0);
  }

  toggleProduct(checkbox, id) {
    if (checkbox.checked) {
      this.selectedIds.add(id);
    } else {
      this.selectedIds.delete(id);
    }
    this.querySelector("#selected-count").textContent = this.selectedIds.size;
  }

  selectAllVisible() {
    const categoryToParent = {};
    this.categories.forEach(c => {
      categoryToParent[String(c.id)] = c.parent_id ? String(c.parent_id) : null;
    });

    const filteredProducts = this.products.filter(p => {
      const matchesQuery = !this.filters.query || 
        p.name.toLowerCase().includes(this.filters.query.toLowerCase()) || 
        (p.sku && p.sku.toLowerCase().includes(this.filters.query.toLowerCase()));
      
      const pCatId = p.category_id ? String(p.category_id) : null;
      const pParentId = categoryToParent[pCatId] || null;

      let matchesCategory = true;
      if (this.filters.category) {
        matchesCategory = (pCatId == this.filters.category) || (pParentId == this.filters.category);
      }

      let matchesSubcategory = true;
      if (this.filters.subcategory) {
        matchesSubcategory = (pCatId == this.filters.subcategory);
      }
      return matchesQuery && matchesCategory && matchesSubcategory;
    });

    filteredProducts.forEach(p => this.selectedIds.add(p.id));
    this.render();
  }

  clearSelection() {
    this.selectedIds.clear();
    this.render();
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

import App from "@/core/App.js";
import "@/components/ui/Button.js";
import "@/components/ui/Table.js";
import "@/components/ui/Modal.js";
import "@/components/ui/Input.js";
import "@/components/ui/Dropdown.js";
import "@/components/ui/Toast.js";
import "@/components/ui/Skeleton.js";
import "@/components/layout/adminLayout/PromotionCreateModal.js";
import "@/components/layout/adminLayout/PromotionUpdateModal.js";
import "@/components/layout/adminLayout/PromotionViewModal.js";
import "@/components/layout/adminLayout/PromotionDeleteDialog.js";
import "@/components/layout/adminLayout/ProductSelectionModal.js";
import api from "@/services/api.js";
import Toast from "@/components/ui/Toast.js";

class PromotionsPage extends App {
  constructor() {
    super();
    this.promotions = [];
    this.products = [];
    this.categories = [];
    this.brands = [];
    this.materials = [];
    this.loading = true;
    this.selectedPromotion = null;
    this.activeTab = "promotions"; // 'promotions' or 'scouting'
    this.productFilters = { type: "", category: "", brand: "", status: "" };
    this.selectedProductIds = new Set();
    this._lastRendered = "";
    this._isInitialized = false;

    this._onTableRefresh = () => this.fetchData(true);
    this._onTableEdit = (e) => { const id = e?.detail?.row?.id; const p = this.promotions.find(x => x.id == id); if (p) this.openUpdateModal(p); };
    this._onTableView = (e) => { const id = e?.detail?.row?.id; const p = this.promotions.find(x => x.id == id); if (p) this.openViewModal(p); };
    this._onTableDelete = (e) => { const id = e?.detail?.row?.id; const p = this.promotions.find(x => x.id == id); if (p) this.openDeleteDialog(p); };
    this._onProductSelect = (e) => {
      const { row, selected } = e.detail;
      if (selected) this.selectedProductIds.add(row.id);
      else this.selectedProductIds.delete(row.id);
      this.updateView();
    };
    this._onProductPromote = (e) => {
        const id = e?.detail?.row?.id;
        const p = this.products.find(x => x.id == id);
        if (p) this.openApplyPromotionModal([p.id]);
    };
  }

  async connectedCallback() {
    super.connectedCallback();
    if (this._isInitialized) return;
    this._isInitialized = true;

    this.addEventListener("table-refresh", this._onTableRefresh);
    this.addEventListener("table-edit", this._onTableEdit);
    this.addEventListener("table-view", this._onTableView);
    this.addEventListener("table-delete", this._onTableDelete);
    this.addEventListener("table-select", this._onProductSelect);
    this.addEventListener("table-action-promote", this._onProductPromote);

    await this.fetchData();
  }

  async fetchData(force = false) {
    if (!this.loading || force) {
      this.loading = true;
      this.updateView();
    }
    try {
      const [promosRes, productsRes, categoriesRes, brandsRes, materialsRes] = await Promise.all([
        api.get("/promotions"),
        api.get("/products"),
        api.get("/categories"),
        api.get("/brands"),
        api.get("/materials"),
      ]);
      this.promotions = promosRes.data?.data || [];
      this.products = productsRes.data?.data || [];
      this.categories = categoriesRes.data?.data || [];
      this.brands = brandsRes.data?.data || [];
      this.materials = materialsRes.data?.data || [];
    } catch (e) {
      Toast.show({ title: "Error", message: "Failed to load promotions", variant: "error" });
    } finally {
      this.loading = false;
      this.updateView();
    }
  }

  updateView() {
    const next = this.render();
    if (next === this._lastRendered) return;
    this._lastRendered = next;
    this.innerHTML = next;
  }

  getHeaderCounts() {
    const p = this.promotions || [];
    const now = new Date();
    return {
      total: p.length,
      active: p.filter(x => x.status === 'active' && new Date(x.end_date) > now).length,
      inactive: p.filter(x => x.status === 'inactive').length,
      percentage: p.filter(x => x.discount_type === 'percentage').length,
      fixed: p.filter(x => x.discount_type === 'fixed').length,
    };
  }

  renderHeader() {
    const c = this.getHeaderCounts();
    return `
      <div class="bg-slate-700 rounded-xl shadow-lg p-5 text-white mb-6">
        <div class="flex flex-col sm:flex-row sm:items-center sm:justify-between mb-5">
          <div class="flex items-center gap-3">
            <h1 class="text-2xl sm:text-3xl font-bold">Promotions</h1>
            <button onclick="this.closest('app-promotions-page').fetchData(true)"
              class="size-8 mt-1 flex items-center justify-center text-white/80 hover:text-white hover:bg-white/10 rounded-lg transition" title="Refresh">
              <i class="fas fa-sync-alt text-lg ${this.loading ? "animate-spin" : ""}"></i>
            </button>
          </div>
          <p class="text-slate-300 text-sm mt-1 sm:mt-0">Manage scheduled discounts and promotional events</p>
        </div>
        <div class="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 gap-3">
          ${[
            { label: "Total", value: c.total, icon: "fa-bullhorn", color: "bg-indigo-500" },
            { label: "Active", value: c.active, icon: "fa-check-circle", color: "bg-emerald-500" },
            { label: "Inactive", value: c.inactive, icon: "fa-times-circle", color: "bg-rose-500" },
            { label: "Percentage", value: c.percentage, icon: "fa-percent", color: "bg-blue-500" },
            { label: "Fixed", value: c.fixed, icon: "fa-dollar-sign", color: "bg-purple-500" },
          ].map(({ label, value, icon, color }) => `
            <div class="bg-white/10 backdrop-blur rounded-xl p-3 flex items-center gap-3">
              <div class="w-9 h-9 ${color} rounded-lg flex items-center justify-center flex-shrink-0">
                <i class="fas ${icon} text-white text-sm"></i>
              </div>
              <div>
                <div class="text-lg font-bold">${this.loading ? "—" : value}</div>
                <div class="text-white/60 text-xs">${label}</div>
              </div>
            </div>
          `).join("")}
        </div>
      </div>
    `;
  }

  setTab(tab) {
    this.activeTab = tab;
    this.updateView();
  }

  handleFilterChange(e) {
    const target = e?.target;
    const value = e?.detail?.value ?? target?.value ?? "";
    if (!target?.id) return;

    if (target.id === "scout-filter-type") this.productFilters.type = value;
    if (target.id === "scout-filter-category") this.productFilters.category = value;
    if (target.id === "scout-filter-status") this.productFilters.status = value;
    if (target.id === "scout-filter-brand") this.productFilters.brand = value;

    this.updateView();
  }

  resetFilters() {
    this.productFilters = { type: "", category: "", brand: "", status: "" };
    this.updateView();
  }

  getFilteredProducts() {
    let items = Array.isArray(this.products) ? [...this.products] : [];
    const { type, category, status, brand } = this.productFilters || {};

    if (type) items = items.filter((p) => String(p.type) === String(type));
    if (category) items = items.filter((p) => String(p.category_id) === String(category));
    if (brand) items = items.filter((p) => String(p.brand_id) === String(brand));
    if (status) {
      const wantActive = status === "active";
      items = items.filter((p) => !!p.is_active === wantActive);
    }
    return items;
  }

  openCreateModal() {
    const m = this.querySelector("promotion-create-modal");
    if (m) {
      m.setOptions({ selectedIds: [] });
      m.open();
    }
  }

  async openUpdateModal(promotion) {
    try {
      const res = await api.get(`/promotions/${promotion.id}`);
      this.selectedPromotion = res.data?.data;
      const m = this.querySelector("promotion-update-modal");
      if (m) {
        m.setPromotion(this.selectedPromotion);
        m.open();
      }
    } catch (e) {
      Toast.show({ title: "Error", message: "Failed to load promotion details", variant: "error" });
    }
  }

  async openViewModal(promotion) {
    try {
      const res = await api.get(`/promotions/${promotion.id}`);
      this.selectedPromotion = res.data?.data;
      const m = this.querySelector("promotion-view-modal");
      if (m) {
        m.setPromotion(this.selectedPromotion);
        m.open();
      }
    } catch (e) {
      Toast.show({ title: "Error", message: "Failed to load promotion details", variant: "error" });
    }
  }

  openDeleteDialog(promotion) {
    this.selectedPromotion = promotion;
    const m = this.querySelector("promotion-delete-dialog");
    if (m) {
      m.setPromotion(promotion);
      m.open();
    }
  }


  async submitCreate() {
    const m = this.querySelector("promotion-create-modal");
    const form = m.querySelector("#promotion-create-form");
    const data = {
      name: form.querySelector("#create-name")?.value,
      description: form.querySelector("#create-description")?.value,
      discount_type: form.querySelector("#create-discount-type")?.value,
      discount_value: form.querySelector("#create-discount-value")?.value,
      start_date: form.querySelector("#create-start-date")?.value?.replace("T", " "),
      end_date: form.querySelector("#create-end-date")?.value?.replace("T", " "),
      status: form.querySelector("#create-status")?.value,
      product_ids: Array.from(m.selectedIds || [])
    };

    if (!data.name || !data.discount_type || !data.discount_value || !data.start_date || !data.end_date) {
      Toast.show({ title: "Required", message: "Please fill all required fields", variant: "error" });
      return;
    }

    try {
      await api.post("/promotions", data);
      Toast.show({ title: "Success", message: "Promotion created", variant: "success" });
      this.querySelector("promotion-create-modal").close();
      await this.fetchData(true);
    } catch (e) {
      Toast.show({ title: "Error", message: "Failed to create promotion", variant: "error" });
    }
  }

  async submitUpdate() {
    const m = this.querySelector("promotion-update-modal");
    const data = {
      name: m.querySelector("#edit-name")?.value,
      description: m.querySelector("#edit-description")?.value,
      discount_type: m.querySelector("#edit-discount-type")?.value,
      discount_value: m.querySelector("#edit-discount-value")?.value,
      start_date: m.querySelector("#edit-start-date")?.value?.replace("T", " "),
      end_date: m.querySelector("#edit-end-date")?.value?.replace("T", " "),
      status: m.querySelector("#edit-status")?.value,
      product_ids: m.productIds
    };

    try {
      await api.put(`/promotions/${this.selectedPromotion.id}`, data);
      Toast.show({ title: "Updated", message: "Promotion updated", variant: "success" });
      m.close();
      await this.fetchData(true);
    } catch (e) {
      Toast.show({ title: "Error", message: "Failed to update promotion", variant: "error" });
    }
  }

  async confirmDelete() {
    try {
      await api.delete(`/promotions/${this.selectedPromotion.id}`);
      Toast.show({ title: "Deleted", message: "Promotion removed", variant: "success" });
      this.querySelector("promotion-delete-dialog").close();
      await this.fetchData(true);
    } catch (e) {
      Toast.show({ title: "Error", message: "Failed to delete promotion", variant: "error" });
    }
  }

  async detachProduct(promotionId, productId) {
    try {
      await api.delete(`/promotions/${promotionId}/products/${productId}`);
      Toast.show({ title: "Detached", message: "Product removed", variant: "success" });
      await this.openViewModal(this.selectedPromotion);
    } catch (e) {
      Toast.show({ title: "Error", message: "Failed to detach product", variant: "error" });
    }
  }

  openApplyPromotionModal(productIds) {
    const m = this.querySelector("promotion-create-modal");
    if (m) {
      m.setOptions({ products: this.products, categories: this.categories, selectedIds: productIds });
      m.open();
    }
  }


  render() {
    if (this.loading && this.promotions.length === 0) {
      return `
        ${this.renderHeader()}
        <div class="bg-white rounded-xl shadow-sm border border-slate-100 p-4">
          <div class="space-y-4">
            <ui-skeleton class="h-12 w-full"></ui-skeleton>
            <ui-skeleton class="h-12 w-full"></ui-skeleton>
            <ui-skeleton class="h-12 w-full"></ui-skeleton>
          </div>
        </div>
      `;
    }

    return `
      <div class="min-h-screen pb-20">
        ${this.renderHeader()}

        <!-- Tab Switcher -->
        <div class="flex items-center gap-2 mb-6 p-1 bg-slate-100 rounded-xl w-fit">
          <button onclick="this.closest('app-promotions-page').setTab('promotions')"
            class="px-5 py-2 rounded-lg text-sm font-bold transition-all ${this.activeTab === 'promotions' ? 'bg-white text-indigo-600 shadow-sm' : 'text-slate-500 hover:text-slate-700'}">
            <i class="fas fa-bullhorn mr-2"></i> Campaigns
          </button>
          <button onclick="this.closest('app-promotions-page').setTab('scouting')"
            class="px-5 py-2 rounded-lg text-sm font-bold transition-all ${this.activeTab === 'scouting' ? 'bg-white text-indigo-600 shadow-sm' : 'text-slate-500 hover:text-slate-700'}">
            <i class="fas fa-search mr-2"></i> Product Scouting
          </button>
        </div>

        ${this.activeTab === 'promotions' ? this.renderPromotionsTab() : this.renderProductScoutingTab()}

        <promotion-create-modal></promotion-create-modal>
        <promotion-update-modal></promotion-update-modal>
        <promotion-view-modal></promotion-view-modal>
        <promotion-delete-dialog></promotion-delete-dialog>

        <!-- Batch Action Bar -->
        ${this.selectedProductIds.size > 0 ? `
          <div class="fixed bottom-8 left-1/2 -translate-x-1/2 bg-slate-900 text-white px-6 py-4 rounded-2xl shadow-2xl flex items-center gap-6 animate-in slide-in-from-bottom-10 duration-300 z-50 border border-white/10 backdrop-blur-md">
            <div class="flex items-center gap-3 pr-6 border-r border-white/10">
              <div class="w-10 h-10 bg-indigo-500 rounded-xl flex items-center justify-center shadow-lg shadow-indigo-500/20">
                <i class="fas fa-shopping-basket text-sm"></i>
              </div>
              <div>
                <div class="text-sm font-bold">${this.selectedProductIds.size} products selected</div>
                <div class="text-[10px] text-white/50 uppercase tracking-widest font-black">Available for promotion</div>
              </div>
            </div>
            <div class="flex items-center gap-2">
              <button onclick="this.closest('app-promotions-page').openApplyPromotionModal(Array.from(this.closest('app-promotions-page').selectedProductIds))"
                class="px-6 py-2.5 bg-indigo-500 hover:bg-indigo-400 text-white rounded-xl text-sm font-bold transition-all shadow-lg shadow-indigo-500/25 flex items-center gap-2">
                <i class="fas fa-plus-circle"></i> Create Campaign
              </button>
              <button onclick="this.closest('app-promotions-page').selectedProductIds.clear(); this.closest('app-promotions-page').updateView()"
                class="px-4 py-2.5 bg-white/5 hover:bg-white/10 text-white/70 hover:text-white rounded-xl text-sm font-bold transition-all">
                Cancel
              </button>
            </div>
          </div>
        ` : ""}
      </div>
    `;
  }

  renderPromotionsTab() {
    const rows = this.promotions.map((p, i) => ({
      id: p.id,
      no: i + 1,
      name: `
        <div>
          <p class="font-bold text-slate-900 line-clamp-1">${p.name}</p>
          <p class="text-[10px] text-slate-500 truncate">${p.description || "No description"}</p>
        </div>
      `,
      discount: `<span class="px-2 py-0.5 rounded-lg bg-blue-50 text-blue-700 text-xs font-black border border-blue-100 uppercase tracking-tight">${p.discount_type === 'percentage' ? p.discount_value + '%' : '$' + p.discount_value}</span>`,
      period: `
        <div class="text-[10px] text-slate-600 font-medium">
          <div class="flex items-center gap-1"><i class="far fa-calendar-alt text-[8px]"></i> From: ${new Date(p.start_date).toLocaleDateString()}</div>
          <div class="flex items-center gap-1"><i class="far fa-calendar-check text-[8px]"></i> To: ${new Date(p.end_date).toLocaleDateString()}</div>
        </div>
      `,
      status: p.status === 'active' 
        ? `<span class="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-bold bg-emerald-100 text-emerald-700 uppercase tracking-tight"><span class="w-1 h-1 rounded-full bg-emerald-500"></span>Active</span>`
        : `<span class="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-bold bg-slate-100 text-slate-500 uppercase tracking-tight"><span class="w-1 h-1 rounded-full bg-slate-400"></span>Inactive</span>`,
    }));

    const columns = [
      { key: "no", label: "#", html: false },
      { key: "name", label: "Promotion Details" },
      { key: "discount", label: "Discount" },
      { key: "period", label: "Active Period" },
      { key: "status", label: "Status" },
    ];

    const safeData = JSON.stringify(rows).replace(/"/g, "&quot;");
    const safeCols = JSON.stringify(columns).replace(/"/g, "&quot;");

    return `
      <div class="bg-white rounded-xl shadow-sm border border-slate-100 p-4">
        <ui-table 
          data="${safeData}" 
          columns="${safeCols}"
          sortable searchable search-placeholder="Search campaigns..."
          pagination page-size="20"
          action actions="view,edit,delete"
          refresh print bordered striped>
        </ui-table>
      </div>
    `;
  }

  renderProductScoutingTab() {
    const categoryOptions = (this.categories || [])
      .map((c) => `<ui-option value="${c.id}">${c.name}</ui-option>`)
      .join("");
    const brandOptions = (this.brands || [])
      .map((b) => `<ui-option value="${b.id}">${b.name}</ui-option>`)
      .join("");

    const activeProductPromotions = new Map();
    const now = new Date();
    (this.promotions || []).forEach(p => {
      const isCurrentlyActive = p.status === 'active' && new Date(p.start_date) <= now && new Date(p.end_date) > now;
      if (isCurrentlyActive) {
        (p.product_ids || []).forEach(id => {
          activeProductPromotions.set(Number(id), {
            name: p.name,
            discount: p.discount_type === 'percentage' ? p.discount_value + '%' : '$' + p.discount_value,
            type: p.discount_type
          });
        });
      }
    });

    const filteredProducts = this.getFilteredProducts();
    const rows = filteredProducts.map((p, i) => {
      const activePromo = activeProductPromotions.get(Number(p.id));
      return {
        id: p.id,
        no: i + 1,
        name: `
          <div class="py-1">
            <p class="font-bold text-slate-900 text-sm mb-1 line-clamp-1">${p.name}</p>
            <div class="flex items-center gap-2">
              <span class="text-[9px] bg-slate-100 px-1 rounded font-mono">${p.sku || "N/A"}</span>
              <span class="text-[9px] text-indigo-500 font-bold uppercase">${p.category_name || ""}</span>
            </div>
          </div>
        `,
        type: `<span class="capitalize text-[10px] px-2 py-0.5 rounded-full font-bold ${p.type === "physical" ? "bg-blue-50 text-blue-600" : "bg-purple-50 text-purple-600"}">${p.type}</span>`,
        price: `<span class="font-bold text-slate-700">$${p.base_price}</span>`,
        stock: `<span class="${p.total_stock < 10 ? 'text-rose-600' : 'text-slate-600'} font-bold">${p.total_stock}</span>`,
        promotion: activePromo
          ? `
            <div class="flex flex-col">
              <span class="text-[10px] font-black text-blue-600 tracking-tight">${activePromo.discount}</span>
              <span class="text-[8px] text-slate-400 uppercase font-bold truncate max-w-[80px]" title="${activePromo.name}">${activePromo.name}</span>
            </div>
          `
          : `<span class="text-slate-300 text-[10px] italic">No active offer</span>`,
        promo_type: activePromo
          ? `<span class="text-[9px] font-bold text-slate-600 uppercase tracking-tighter">${activePromo.type}</span>`
          : "-",
        status: activePromo
          ? `<span class="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-bold bg-amber-100 text-amber-700 uppercase tracking-tight"><i class="fas fa-tag text-[8px]"></i> On Promotion</span>`
          : (p.is_active 
              ? `<span class="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-bold bg-emerald-100 text-emerald-700 uppercase tracking-tight"><span class="w-1 h-1 rounded-full bg-emerald-500"></span>Active</span>`
              : `<span class="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-bold bg-slate-100 text-slate-500 uppercase tracking-tight"><span class="w-1 h-1 rounded-full bg-slate-400"></span>Inactive</span>`),
        _disabled: !!activePromo
      };
    });

    const columns = [
      { key: "no", label: "#", html: false },
      { key: "name", label: "Product Info" },
      { key: "type", label: "Type" },
      { key: "price", label: "Price" },
      { key: "stock", label: "Stock" },
      { key: "promotion", label: "Active Offer" },
      { key: "promo_type", label: "Promo Type" },
      { key: "status", label: "Status" },
    ];

    const safeData = JSON.stringify(rows).replace(/"/g, "&quot;");
    const safeCols = JSON.stringify(columns).replace(/"/g, "&quot;");

    return `
      <div class="space-y-4">
        <!-- Filters (Mirroring Products Page) -->
        <div class="bg-white rounded-xl shadow-sm border border-slate-100 p-4">
          <div class="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-3">
            <div>
              <label class="block text-[10px] font-black text-slate-400 mb-1 uppercase tracking-widest">Product Type</label>
              <ui-dropdown id="scout-filter-type" value="${this.productFilters.type}" placeholder="All types" class="w-full" onchange="this.closest('app-promotions-page').handleFilterChange(event)">
                <ui-option value="">All Types</ui-option>
                <ui-option value="physical">Physical</ui-option>
                <ui-option value="digital">Digital</ui-option>
              </ui-dropdown>
            </div>
            <div>
              <label class="block text-[10px] font-black text-slate-400 mb-1 uppercase tracking-widest">Category</label>
              <ui-dropdown id="scout-filter-category" value="${this.productFilters.category}" placeholder="All categories" searchable class="w-full" onchange="this.closest('app-promotions-page').handleFilterChange(event)">
                <ui-option value="">All Categories</ui-option>
                ${categoryOptions}
              </ui-dropdown>
            </div>
            <div>
              <label class="block text-[10px] font-black text-slate-400 mb-1 uppercase tracking-widest">Brand</label>
              <ui-dropdown id="scout-filter-brand" value="${this.productFilters.brand}" placeholder="All brands" searchable class="w-full" onchange="this.closest('app-promotions-page').handleFilterChange(event)">
                <ui-option value="">All Brands</ui-option>
                ${brandOptions}
              </ui-dropdown>
            </div>
            <div>
              <label class="block text-[10px] font-black text-slate-400 mb-1 uppercase tracking-widest">Status</label>
              <ui-dropdown id="scout-filter-status" value="${this.productFilters.status}" placeholder="All statuses" class="w-full" onchange="this.closest('app-promotions-page').handleFilterChange(event)">
                <ui-option value="">All Status</ui-option>
                <ui-option value="active">Active</ui-option>
                <ui-option value="inactive">Inactive</ui-option>
              </ui-dropdown>
            </div>
            <div class="flex items-end">
              <button onclick="this.closest('app-promotions-page').resetFilters()" 
                class="w-full h-[38px] px-3 rounded-lg border border-slate-200 text-slate-600 font-bold hover:bg-slate-50 transition text-xs uppercase tracking-widest">
                Clear Filters
              </button>
            </div>
          </div>
        </div>

        <div class="bg-white rounded-xl shadow-sm border border-slate-100 p-4">
          <ui-table 
            data="${safeData}" 
            columns="${safeCols}"
            selectable sortable searchable search-placeholder="Filter by name or SKU..."
            pagination page-size="20"
            action actions="promote"
            bordered striped>
          </ui-table>
        </div>
      </div>
    `;
  }

}

customElements.define("app-promotions-page", PromotionsPage);
export default PromotionsPage;

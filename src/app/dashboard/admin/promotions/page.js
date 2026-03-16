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
    this.loading = true;
    this.selectedPromotion = null;
    this._lastRendered = "";
    this._isInitialized = false;

    this._onTableAdd = () => this.openCreateModal();
    this._onTableRefresh = () => this.fetchData(true);
    this._onTableEdit = (e) => { const id = e?.detail?.row?.id; const p = this.promotions.find(x => x.id == id); if (p) this.openUpdateModal(p); };
    this._onTableView = (e) => { const id = e?.detail?.row?.id; const p = this.promotions.find(x => x.id == id); if (p) this.openViewModal(p); };
    this._onTableDelete = (e) => { const id = e?.detail?.row?.id; const p = this.promotions.find(x => x.id == id); if (p) this.openDeleteDialog(p); };
  }

  async connectedCallback() {
    super.connectedCallback();
    if (this._isInitialized) return;
    this._isInitialized = true;

    this.addEventListener("table-add", this._onTableAdd);
    this.addEventListener("table-refresh", this._onTableRefresh);
    this.addEventListener("table-edit", this._onTableEdit);
    this.addEventListener("table-view", this._onTableView);
    this.addEventListener("table-delete", this._onTableDelete);

    await this.fetchData();
  }

  async fetchData(force = false) {
    if (!this.loading || force) {
      this.loading = true;
      this.updateView();
    }
    try {
      const [promosRes, productsRes] = await Promise.all([
        api.get("/promotions"),
        api.get("/products"),
      ]);
      this.promotions = promosRes.data?.data || [];
      this.products = productsRes.data?.data || [];
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

  openCreateModal() {
    this.querySelector("promotion-create-modal")?.open();
  }

  async openUpdateModal(promotion) {
    this.selectedPromotion = promotion;
    const m = this.querySelector("promotion-update-modal");
    if (m) {
      m.setPromotion(promotion);
      m.open();
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

  openProductSelectionModal(promotionId) {
    const m = this.querySelector("product-selection-modal");
    if (m) {
      const assignedIds = new Set((this.selectedPromotion.products || []).map(p => p.id));
      const availableProducts = this.products.filter(p => !assignedIds.has(p.id));
      m.setOptions({ products: availableProducts, promotionId });
      m.open();
    }
  }

  async submitCreate() {
    const form = this.querySelector("#promotion-create-form");
    const data = {
      name: form.querySelector("#create-name")?.value,
      description: form.querySelector("#create-description")?.value,
      discount_type: form.querySelector("#create-discount-type")?.value,
      discount_value: form.querySelector("#create-discount-value")?.value,
      start_date: form.querySelector("#create-start-date")?.value?.replace("T", " "),
      end_date: form.querySelector("#create-end-date")?.value?.replace("T", " "),
      status: form.querySelector("#create-status")?.value
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
      status: m.querySelector("#edit-status")?.value
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

  async attachSelectedProducts() {
    const m = this.querySelector("product-selection-modal");
    const productIds = Array.from(m.selectedIds);
    if (!productIds.length) return;

    try {
      await api.post(`/promotions/${m.promotionId}/products`, { product_ids: productIds });
      Toast.show({ title: "Success", message: `${productIds.length} products attached`, variant: "success" });
      m.close();
      await this.openViewModal(this.selectedPromotion);
    } catch (e) {
      Toast.show({ title: "Error", message: "Failed to attach products", variant: "error" });
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
      <div>
        ${this.renderHeader()}
        <div class="bg-white rounded-xl shadow-sm border border-slate-100 p-4">
          <ui-table 
            data="${safeData}" 
            columns="${safeCols}"
            sortable searchable search-placeholder="Search campaigns..."
            pagination page-size="20"
            action actions="view,edit,delete"
            addable refresh print bordered striped>
          </ui-table>
        </div>

        <promotion-create-modal></promotion-create-modal>
        <promotion-update-modal></promotion-update-modal>
        <promotion-view-modal></promotion-view-modal>
        <promotion-delete-dialog></promotion-delete-dialog>
        <product-selection-modal></product-selection-modal>
      </div>
    `;
  }
}

customElements.define("app-promotions-page", PromotionsPage);
export default PromotionsPage;

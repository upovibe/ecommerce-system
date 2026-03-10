import App from "@/core/App.js";
import "@/components/ui/Button.js";
import "@/components/ui/Table.js";
import "@/components/ui/Modal.js";
import "@/components/ui/Input.js";
import "@/components/ui/Skeleton.js";
import "@/components/ui/Toast.js";
import api from "@/services/api.js";
import Toast from "@/components/ui/Toast.js";

class ProductsPage extends App {
  constructor() {
    super();
    this.products = [];
    this.summary = { total_products: 0, total_variants: 0, total_units: 0, out_of_stock: 0, low_stock: 0, in_stock: 0 };
    this.loading = true;
    this.selectedProduct = null;
    this.variants = [];
    this.variantsLoading = false;
    this._lastRendered = "";
    this._isInitialized = false;
  }

  updateView() {
    const next = this.renderPage();
    if (next === this._lastRendered) return;
    this._lastRendered = next;
    this.innerHTML = next;
    this.bindEvents();
  }

  async connectedCallback() {
    super.connectedCallback();
    if (this._isInitialized) return;
    this._isInitialized = true;
    this.addEventListener("table-view", (e) => {
      const id = e?.detail?.row?.id;
      if (id == null) return;
      const product = this.products.find((p) => p.id == id);
      if (!product) return;
      this.openVariantPanel(product);
    });
    this.addEventListener("table-refresh", () => this.fetchData(true));
    await this.fetchData();
  }

  async fetchData(force = false) {
    this.loading = true;
    this.updateView();
    try {
      const [sumRes, prodRes] = await Promise.all([
        api.get("/inventory/summary"),
        api.get("/inventory"),
      ]);
      this.summary = sumRes.data?.data || this.summary;
      this.products = prodRes.data?.data || [];
    } catch (e) {
      Toast.show({ title: "Error", message: "Failed to load inventory", variant: "error" });
    } finally {
      this.loading = false;
      this.updateView();
    }
  }

  async loadVariants(productId) {
    this.variantsLoading = true;
    this.variants = [];
    this.renderVariantsPanel();
    try {
      const res = await api.get(`/inventory/${productId}/variants`);
      this.variants = res.data?.data || [];
    } catch (e) {
      Toast.show({ title: "Error", message: "Failed to load variants", variant: "error" });
    } finally {
      this.variantsLoading = false;
      this.renderVariantsPanel();
    }
  }

  async updateStock(variantId, stock) {
    try {
      await api.put(`/inventory/variants/${variantId}/stock`, { stock });
      Toast.show({ title: "Updated", message: "Stock level saved", variant: "success" });
      await this.loadVariants(this.selectedProduct.id);
      await this.fetchData();
    } catch (e) {
      Toast.show({ title: "Error", message: "Failed to update stock", variant: "error" });
    }
  }

  // Format currency
  fmt(val) {
    return new Intl.NumberFormat("en-US", { style: "currency", currency: "USD" }).format(val || 0);
  }

  // Stock status badge HTML
  stockBadge(total, out, low) {
    if (out > 0) return `<span class="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-xs font-bold bg-red-100 text-red-700"><span class="w-1.5 h-1.5 rounded-full bg-red-500 inline-block"></span>Out of Stock</span>`;
    if (low > 0) return `<span class="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-xs font-bold bg-amber-100 text-amber-700"><span class="w-1.5 h-1.5 rounded-full bg-amber-500 inline-block"></span>Low Stock</span>`;
    if (total === 0) return `<span class="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-xs font-bold bg-slate-100 text-slate-500">No Variants</span>`;
    return `<span class="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-xs font-bold bg-emerald-100 text-emerald-700"><span class="w-1.5 h-1.5 rounded-full bg-emerald-500 inline-block"></span>In Stock</span>`;
  }

  openVariantPanel(product) {
    this.selectedProduct = product;
    const panel = this.querySelector("#variants-panel");
    const overlay = this.querySelector("#variants-panel-overlay");
    const title = this.querySelector("#variants-panel-title");
    const subtitle = this.querySelector("#variants-panel-subtitle");
    if (panel) {
      panel.classList.remove("translate-x-full");
      panel.classList.add("translate-x-0");
    }
    if (overlay) overlay.classList.remove("hidden");
    if (title) title.textContent = product.name;
    if (subtitle) subtitle.textContent = `${product.category_name || "Uncategorized"} · ${product.variant_count} variant${product.variant_count !== 1 ? "s" : ""}  · ${this.fmt(product.base_price)} base`;
    this.renderVariantsPanel();
    this.loadVariants(product.id);
  }

  closeVariantPanel() {
    const panel = this.querySelector("#variants-panel");
    const overlay = this.querySelector("#variants-panel-overlay");
    if (panel) {
      panel.classList.add("translate-x-full");
      panel.classList.remove("translate-x-0");
    }
    if (overlay) overlay.classList.add("hidden");
    this.selectedProduct = null;
  }

  renderVariantsPanel() {
    const body = this.querySelector("#variants-panel-body");
    if (!body) return;

    if (this.variantsLoading) {
      body.innerHTML = `
        <div class="space-y-3 p-5">
          <div class="h-16 bg-slate-100 animate-pulse rounded-xl"></div>
          <div class="h-16 bg-slate-100 animate-pulse rounded-xl"></div>
          <div class="h-16 bg-slate-100 animate-pulse rounded-xl"></div>
        </div>`;
      return;
    }

    if (!this.variants.length) {
      body.innerHTML = `<div class="p-10 text-center text-slate-400"><i class="fas fa-box-open text-3xl mb-3 block"></i><p>No variants found</p></div>`;
      return;
    }

    body.innerHTML = this.variants.map((v) => {
      const opts = Array.isArray(v.variant_options)
        ? v.variant_options.map((o) => o.label || JSON.stringify(o)).join(", ")
        : v.variant_options?.label || "Default";

      const stockClr = v.stock === 0 ? "text-red-600 font-bold" : v.stock <= 10 ? "text-amber-600 font-bold" : "text-emerald-600 font-bold";
      return `
        <div class="flex items-center gap-4 p-4 border border-slate-100 rounded-xl bg-white shadow-sm" data-variant-id="${v.id}">
          <div class="flex-1 min-w-0">
            <p class="font-semibold text-slate-900 text-sm truncate">${opts}</p>
            <p class="text-xs text-slate-400 mt-0.5">SKU: ${v.sku || "—"}</p>
            <p class="text-xs text-slate-500 mt-0.5">${v.price_override ? this.fmt(v.price_override) : "Base price"}</p>
          </div>
          <div class="flex items-center gap-3">
            <button
              class="flex items-center justify-center w-7 h-7 rounded-lg border border-slate-200 text-slate-500 hover:bg-slate-50 text-sm font-bold"
              onclick="this.closest('app-inventory-page').adjustStock(${v.id}, ${v.stock}, -1)">
              −
            </button>
            <span class="${stockClr} text-base w-8 text-center">${v.stock}</span>
            <button
              class="flex items-center justify-center w-7 h-7 rounded-lg border border-slate-200 text-slate-500 hover:bg-slate-50 text-sm font-bold"
              onclick="this.closest('app-inventory-page').adjustStock(${v.id}, ${v.stock}, 1)">
              +
            </button>
            <button
              class="ml-1 text-xs px-2 py-1 bg-indigo-50 text-indigo-600 font-semibold rounded-lg hover:bg-indigo-100 transition-colors"
              onclick="this.closest('app-inventory-page').openSetStockDialog(${v.id}, ${v.stock}, '${opts.replace(/'/g, "\\'")}')">
              Set
            </button>
          </div>
        </div>
      `;
    }).join("");
  }

  adjustStock(variantId, current, delta) {
    const newStock = Math.max(0, current + delta);
    this.updateStock(variantId, newStock);
  }

  openSetStockDialog(variantId, current, label) {
    const dialog = this.querySelector("#set-stock-dialog");
    const input = this.querySelector("#set-stock-input");
    const title = this.querySelector("#set-stock-label");
    if (dialog && input) {
      if (title) title.textContent = label;
      input.value = current;
      dialog.setAttribute("data-variant-id", variantId);
      dialog.classList.remove("hidden");
    }
  }

  closeSetStockDialog() {
    const dialog = this.querySelector("#set-stock-dialog");
    if (dialog) dialog.classList.add("hidden");
  }

  confirmSetStock() {
    const dialog = this.querySelector("#set-stock-dialog");
    const input = this.querySelector("#set-stock-input");
    if (!dialog || !input) return;
    const variantId = dialog.getAttribute("data-variant-id");
    const stock = parseInt(input.value, 10);
    if (isNaN(stock) || stock < 0) {
      Toast.show({ title: "Invalid", message: "Please enter a valid stock number", variant: "error" });
      return;
    }
    this.updateStock(parseInt(variantId), stock);
    this.closeSetStockDialog();
  }

  bindEvents() {
    // Close panel on outside click
    this.querySelector("#variants-panel-overlay")?.addEventListener("click", () => this.closeVariantPanel());
  }

  renderPage() {
    const s = this.summary;
    const tableRows = this.products.map((p, i) => ({
      id: p.id,
      no: i + 1,
      product: `<div>
        <p class="font-semibold text-slate-900">${p.name}</p>
        <p class="text-xs text-slate-400">${p.category_name || "Uncategorized"} · ${p.type || "physical"}</p>
      </div>`,
      price: this.fmt(p.base_price),
      variants: p.variant_count,
      stock: `<span class="font-mono font-bold ${p.total_stock === 0 && p.variant_count > 0 ? 'text-red-600' : p.low_stock_count > 0 ? 'text-amber-600' : 'text-slate-900'}">${p.total_stock}</span>`,
      status: this.stockBadge(p.total_stock, p.out_of_stock_count, p.low_stock_count),
      updated: p.updated_at ? new Date(p.updated_at).toLocaleDateString() : "—",
    }));

    const columns = [
      { key: "no", label: "#", html: false },
      { key: "product", label: "Product" },
      { key: "price", label: "Base Price", html: false },
      { key: "variants", label: "Variants", html: false },
      { key: "stock", label: "Total Stock" },
      { key: "status", label: "Stock Status" },
      { key: "updated", label: "Updated", html: false },
    ];

    const safeData = JSON.stringify(tableRows).replace(/"/g, "&quot;");
    const safeCols = JSON.stringify(columns).replace(/"/g, "&quot;");

    return `
      <div class="relative">
        <!-- Header -->
        <div class="bg-slate-700 rounded-xl shadow-lg p-5 text-white mb-6">
          <div class="flex flex-col sm:flex-row sm:items-center sm:justify-between mb-5">
            <div class="flex items-center gap-3">
              <h1 class="text-2xl sm:text-3xl font-bold">Inventory</h1>
              <button
                onclick="this.closest('app-inventory-page').fetchData(true)"
                class="size-8 mt-1 flex items-center justify-center text-white/80 hover:text-white hover:bg-white/10 rounded-lg transition"
                title="Refresh">
                <i class="fas fa-sync-alt text-lg ${this.loading ? "animate-spin" : ""}"></i>
              </button>
            </div>
            <p class="text-slate-300 text-sm mt-1 sm:mt-0">Manage products and stock levels</p>
          </div>

          <!-- Stats row -->
          <div class="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-3">
            ${[
              { label: "Products", value: s.total_products, icon: "fa-box", color: "bg-indigo-500" },
              { label: "Variants", value: s.total_variants, icon: "fa-layer-group", color: "bg-blue-500" },
              { label: "Total Units", value: s.total_units, icon: "fa-cubes", color: "bg-teal-500" },
              { label: "In Stock", value: s.in_stock, icon: "fa-check-circle", color: "bg-emerald-500" },
              { label: "Low Stock", value: s.low_stock, icon: "fa-exclamation-triangle", color: "bg-amber-500" },
              { label: "Out of Stock", value: s.out_of_stock, icon: "fa-times-circle", color: "bg-red-500" },
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

        <!-- Table -->
        <div class="bg-white rounded-xl shadow-sm border border-slate-100 p-4">
          ${this.loading ? `
            <div class="space-y-3">
              <div class="h-12 bg-slate-100 animate-pulse rounded-xl"></div>
              <div class="h-12 bg-slate-100 animate-pulse rounded-xl"></div>
              <div class="h-12 bg-slate-100 animate-pulse rounded-xl"></div>
              <div class="h-12 bg-slate-100 animate-pulse rounded-xl"></div>
            </div>
          ` : `
            <ui-table
              data="${safeData}"
              columns="${safeCols}"
              sortable
              searchable
              search-placeholder="Search products..."
              pagination
              page-size="20"
              action
              actions="view"
              refresh
              print
              bordered
              striped>
            </ui-table>
          `}
        </div>

        <!-- Side Panel Overlay -->
        <div id="variants-panel-overlay"
          class="fixed inset-0 bg-black/30 backdrop-blur-sm z-40 hidden"
          data-panel-overlay>
        </div>

        <!-- Side Panel -->
        <div id="variants-panel"
          class="fixed top-0 right-0 h-full w-full max-w-md bg-white shadow-2xl z-50 flex flex-col transform translate-x-full transition-transform duration-300 ease-in-out">

          <div class="flex items-center justify-between p-5 border-b border-slate-100">
            <div>
              <h3 class="font-bold text-slate-900 text-lg" id="variants-panel-title">Stock Management</h3>
              <p class="text-xs text-slate-400 mt-0.5" id="variants-panel-subtitle"></p>
            </div>
            <button
              onclick="this.closest('app-inventory-page').closeVariantPanel()"
              class="w-9 h-9 flex items-center justify-center rounded-full hover:bg-slate-100 text-slate-400 hover:text-slate-700 transition">
              <i class="fas fa-times"></i>
            </button>
          </div>

          <div id="variants-panel-body" class="flex-1 overflow-y-auto p-5 space-y-3">
            <div class="text-center text-slate-400 py-10">Select a product to view variants</div>
          </div>

        </div>

        <!-- Set Stock Dialog -->
        <div id="set-stock-dialog"
          class="hidden fixed inset-0 z-[60] flex items-center justify-center bg-black/40 backdrop-blur-sm">
          <div class="bg-white rounded-2xl shadow-2xl p-6 w-full max-w-sm mx-4">
            <h3 class="font-bold text-slate-900 text-lg mb-1">Set Stock Level</h3>
            <p class="text-sm text-slate-500 mb-4" id="set-stock-label"></p>
            <input
              type="number"
              id="set-stock-input"
              min="0"
              class="w-full border border-slate-200 rounded-xl px-4 py-3 text-lg font-bold text-center focus:outline-none focus:ring-2 focus:ring-indigo-400 mb-5"
              placeholder="0">
            <div class="flex gap-3">
              <button
                onclick="this.closest('app-inventory-page').closeSetStockDialog()"
                class="flex-1 py-2.5 rounded-xl border border-slate-200 text-slate-600 font-semibold hover:bg-slate-50 transition">
                Cancel
              </button>
              <button
                onclick="this.closest('app-inventory-page').confirmSetStock()"
                class="flex-1 py-2.5 rounded-xl bg-indigo-600 text-white font-semibold hover:bg-indigo-700 transition">
                Save
              </button>
            </div>
          </div>
        </div>

      </div>
    `;
  }

  render() {
    return this.renderPage();
  }
}

customElements.define("app-inventory-page", ProductsPage);
export default ProductsPage;

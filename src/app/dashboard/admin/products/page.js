import App from "@/core/App.js";
import "@/components/ui/Button.js";
import "@/components/ui/Table.js";
import "@/components/ui/Modal.js";
import "@/components/ui/Input.js";
import "@/components/ui/Textarea.js";
import "@/components/ui/Switch.js";
import "@/components/ui/Skeleton.js";
import "@/components/ui/Dropdown.js";
import "@/components/ui/Toast.js";
import api from "@/services/api.js";
import Toast from "@/components/ui/Toast.js";

class ProductsPage extends App {
  constructor() {
    super();
    this.products = [];
    this.categories = [];
    this.brands = [];
    this.materials = [];
    this.loading = true;
    this.selectedProduct = null;
    this._lastRendered = "";
    this._isInitialized = false;
    this._onTableEdit  = (e) => { const p = this._findRow(e); if (p) this.openEditModal(p); };
    this._onTableView  = (e) => { const p = this._findRow(e); if (p) this.openViewModal(p); };
    this._onTableDelete = (e) => { const p = this._findRow(e); if (p) this.openDeleteDialog(p); };
    this._onTableAdd   = () => this.openCreateModal();
    this._onTableRefresh = () => this.fetchData(true);
  }

  _findRow(e) {
    const id = e?.detail?.row?.id;
    return id != null ? this.products.find((p) => p.id == id) : null;
  }

  updateView() {
    const next = this.renderPage();
    if (next === this._lastRendered) return;
    this._lastRendered = next;
    this.innerHTML = next;
  }

  async connectedCallback() {
    super.connectedCallback();
    if (this._isInitialized) return;
    this._isInitialized = true;
    this.addEventListener("table-add",     this._onTableAdd);
    this.addEventListener("table-refresh", this._onTableRefresh);
    this.addEventListener("table-edit",    this._onTableEdit);
    this.addEventListener("table-view",    this._onTableView);
    this.addEventListener("table-delete",  this._onTableDelete);
    await this.fetchData();
  }

  async fetchData(force = false) {
    this.loading = true;
    this.updateView();
    try {
      const [prodRes, catRes, brandRes, materialRes] = await Promise.all([
        api.get("/products"),
        api.get("/categories"),
        api.get("/brands"),
        api.get("/materials"),
      ]);
      this.products   = prodRes.data?.data || [];
      this.categories = catRes.data?.data  || [];
      this.brands     = brandRes.data?.data || [];
      this.materials  = materialRes.data?.data || [];
    } catch (e) {
      Toast.show({ title: "Error", message: "Failed to load products", variant: "error" });
    } finally {
      this.loading = false;
      this.updateView();
    }
  }

  fmt(v) {
    return new Intl.NumberFormat("en-US", { style: "currency", currency: "USD" }).format(v || 0);
  }

  imgUrl(p) {
    const meta = p.metadata || {};
    const img = meta.image || "";
    if (!img) return "";
    if (img.startsWith("http")) return img;
    return `/api/${img.replace(/^\//, "")}`;
  }

  getBrandById(id) {
    return (this.brands || []).find((b) => String(b.id) === String(id));
  }

  getMaterialById(id) {
    return (this.materials || []).find((m) => String(m.id) === String(id));
  }

  findBrandIdByName(name) {
    if (!name) return "";
    const match = (this.brands || []).find(
      (b) => (b.name || "").toLowerCase() === String(name).toLowerCase(),
    );
    return match ? String(match.id) : "";
  }

  findMaterialIdByName(name) {
    if (!name) return "";
    const match = (this.materials || []).find(
      (m) => (m.name || "").toLowerCase() === String(name).toLowerCase(),
    );
    return match ? String(match.id) : "";
  }

  // ── CREATE ──────────────────────────────────────────
  openCreateModal() {
    const m = this.querySelector("#product-create-modal");
    if (m) {
      m.querySelector("form")?.reset();
      const cat = m.querySelector("#create-category");
      const brand = m.querySelector("#create-brand");
      const material = m.querySelector("#create-material");
      if (cat) cat.value = "";
      if (brand) brand.value = "";
      if (material) material.value = "";
      m.open();
    }
  }
  closeCreateModal() {
    const m = this.querySelector("#product-create-modal");
    if (m) m.close();
  }
  async submitCreate() {
    const form    = this.querySelector("#product-create-form");
    const saveBtn = this.querySelector("#create-save-btn");
    if (!form) return;
    const name        = form.querySelector("#create-name")?.value?.trim();
    const category_id = form.querySelector("#create-category")?.value;
    const type        = form.querySelector("#create-type")?.value || "physical";
    const base_price  = parseFloat(form.querySelector("#create-price")?.value) || 0;
    const description = form.querySelector("#create-description")?.value;
    const image       = form.querySelector("#create-image")?.value;
    const brand_id    = form.querySelector("#create-brand")?.value;
    const material_id = form.querySelector("#create-material")?.value;
    const is_active   = form.querySelector("#create-active")?.checked ? 1 : 0;
    const brandName   = this.getBrandById(brand_id)?.name || "";
    const materialName = this.getMaterialById(material_id)?.name || "";
    if (!name) { Toast.show({ title: "Required", message: "Product name is required", variant: "error" }); return; }
    if (!category_id) { Toast.show({ title: "Required", message: "Category is required", variant: "error" }); return; }
    if (saveBtn) saveBtn.textContent = "Saving...";
    try {
      const payload = {
        name,
        category_id,
        type,
        base_price,
        description,
        image,
        brand_id,
        brand: brandName,
        material_id,
        material: materialName,
        is_active,
      };
      if (!brand_id) {
        delete payload.brand_id;
        delete payload.brand;
      }
      if (!material_id) {
        delete payload.material_id;
        delete payload.material;
      }
      await api.post("/products", payload);
      Toast.show({ title: "Created", message: "Product added successfully", variant: "success" });
      this.closeCreateModal();
      await this.fetchData(true);
    } catch (e) {
      Toast.show({ title: "Error", message: e.response?.data?.message || "Failed to create product", variant: "error" });
    } finally {
      if (saveBtn) saveBtn.textContent = "Create Product";
    }
  }

  // ── EDIT ────────────────────────────────────────────
  openEditModal(product) {
    this.selectedProduct = product;
    const m = this.querySelector("#product-edit-modal");
    if (!m) return;
    m.querySelector("#edit-name").value        = product.name || "";
    m.querySelector("#edit-category").value    = product.category_id || "";
    m.querySelector("#edit-type").value        = product.type || "physical";
    m.querySelector("#edit-price").value       = product.base_price || "";
    m.querySelector("#edit-description").value = product.description || "";
    m.querySelector("#edit-image").value       = product.metadata?.image || "";
    const brandId = product.metadata?.brand_id || this.findBrandIdByName(product.metadata?.brand);
    const materialId = product.metadata?.material_id || this.findMaterialIdByName(product.metadata?.material);
    m.querySelector("#edit-brand").value       = brandId || "";
    m.querySelector("#edit-material").value    = materialId || "";
    const sw = m.querySelector("#edit-active");
    if (sw) sw.checked = !!product.is_active;
    m.open();
  }
  closeEditModal() {
    const m = this.querySelector("#product-edit-modal");
    if (m) m.close();
  }
  async submitEdit() {
    const m       = this.querySelector("#product-edit-modal");
    const saveBtn = this.querySelector("#edit-save-btn");
    if (!m || !this.selectedProduct) return;
    const name        = m.querySelector("#edit-name")?.value?.trim();
    const category_id = m.querySelector("#edit-category")?.value;
    const type        = m.querySelector("#edit-type")?.value;
    const base_price  = parseFloat(m.querySelector("#edit-price")?.value) || 0;
    const description = m.querySelector("#edit-description")?.value;
    const image       = m.querySelector("#edit-image")?.value;
    const brand_id    = m.querySelector("#edit-brand")?.value;
    const material_id = m.querySelector("#edit-material")?.value;
    const brand       = this.getBrandById(brand_id)?.name || "";
    const material    = this.getMaterialById(material_id)?.name || "";
    const is_active   = m.querySelector("#edit-active")?.checked ? 1 : 0;
    if (!name) { Toast.show({ title: "Required", message: "Name is required", variant: "error" }); return; }
    if (saveBtn) saveBtn.textContent = "Saving...";
    try {
      const payload = {
        name,
        category_id,
        type,
        base_price,
        description,
        image,
        brand_id,
        brand,
        material_id,
        material,
        is_active,
      };
      if (!brand_id) {
        delete payload.brand_id;
        delete payload.brand;
      }
      if (!material_id) {
        delete payload.material_id;
        delete payload.material;
      }
      await api.put(`/products/${this.selectedProduct.id}`, payload);
      Toast.show({ title: "Updated", message: "Product updated successfully", variant: "success" });
      this.closeEditModal();
      await this.fetchData(true);
    } catch (e) {
      Toast.show({ title: "Error", message: e.response?.data?.message || "Failed to update product", variant: "error" });
    } finally {
      if (saveBtn) saveBtn.textContent = "Save Changes";
    }
  }

  // ── VIEW ────────────────────────────────────────────
  openViewModal(product) {
    this.selectedProduct = product;
    const m = this.querySelector("#product-view-modal");
    if (!m) return;
    const imgSrc = this.imgUrl(product);
    m.querySelector("#view-banner").innerHTML = imgSrc
      ? `<img src="${imgSrc}" class="w-full h-full object-cover" alt="${product.name}" onerror="this.parentElement.innerHTML='<i class=\\'fas fa-box text-slate-300 text-3xl\\'></i>'">`
      : `<i class="fas fa-box text-slate-300 text-3xl"></i>`;
    m.querySelector("#view-name").textContent     = product.name;
    m.querySelector("#view-category").textContent = product.category_name || "—";
    m.querySelector("#view-type").textContent     = product.type || "—";
    m.querySelector("#view-price").textContent    = this.fmt(product.base_price);
    m.querySelector("#view-stock").textContent    = product.total_stock ?? "—";
    m.querySelector("#view-variants").textContent = product.variant_count ?? "—";
    const viewBrand = product.metadata?.brand_id
      ? this.getBrandById(product.metadata.brand_id)?.name
      : product.metadata?.brand;
    const viewMaterial = product.metadata?.material_id
      ? this.getMaterialById(product.metadata.material_id)?.name
      : product.metadata?.material;
    m.querySelector("#view-brand").textContent    = viewBrand || "—";
    m.querySelector("#view-material").textContent = viewMaterial || "—";
    m.querySelector("#view-desc").innerHTML       = product.description || "<span class='text-slate-400 italic'>No description</span>";
    m.querySelector("#view-status").innerHTML     = product.is_active
      ? `<span class="px-2 py-0.5 rounded-full bg-emerald-100 text-emerald-700 text-xs font-bold">Active</span>`
      : `<span class="px-2 py-0.5 rounded-full bg-slate-100 text-slate-500 text-xs font-bold">Inactive</span>`;
    m.open();
  }
  closeViewModal() {
    const m = this.querySelector("#product-view-modal");
    if (m) m.close();
  }

  // ── DELETE ──────────────────────────────────────────
  openDeleteDialog(product) {
    this.selectedProduct = product;
    const d = this.querySelector("#product-delete-dialog");
    if (!d) return;
    d.querySelector("#delete-product-name").textContent = product.name;
    d.querySelector("#delete-product-cat").textContent  = product.category_name || "—";
    d.open();
  }
  closeDeleteDialog() {
    const d = this.querySelector("#product-delete-dialog");
    if (d) d.close();
  }
  async confirmDelete() {
    if (!this.selectedProduct) return;
    const btn = this.querySelector("#delete-confirm-btn");
    if (btn) btn.textContent = "Deleting...";
    try {
      await api.delete(`/products/${this.selectedProduct.id}`);
      Toast.show({ title: "Deleted", message: `"${this.selectedProduct.name}" removed`, variant: "success" });
      this.closeDeleteDialog();
      await this.fetchData(true);
    } catch (e) {
      Toast.show({ title: "Error", message: e.response?.data?.message || "Failed to delete", variant: "error" });
    } finally {
      if (btn) btn.textContent = "Delete";
    }
  }

  renderPage() {
    const counts = {
      total:    this.products.length,
      active:   this.products.filter((p) => p.is_active).length,
      physical: this.products.filter((p) => p.type === "physical").length,
      digital:  this.products.filter((p) => p.type === "digital").length,
      service:  this.products.filter((p) => p.type === "service").length,
    };

    const rows = this.products.map((p, i) => {
      const imgSrc = this.imgUrl(p);
      return {
        id: p.id,
        no: i + 1,
        image: imgSrc
          ? `<img src="${imgSrc}" class="w-10 h-10 rounded-lg object-cover border border-slate-200" alt="${p.name}" onerror="this.style.display='none'">`
          : `<div class="w-10 h-10 rounded-lg bg-slate-100 flex items-center justify-center text-slate-300"><i class="fas fa-box text-sm"></i></div>`,
        name: `<div><p class="font-semibold text-slate-900 text-sm">${p.name}</p><p class="text-xs text-slate-400">${p.category_name || "—"}</p></div>`,
        type: `<span class="capitalize text-xs px-2 py-0.5 rounded-full font-medium ${p.type === "physical" ? "bg-blue-50 text-blue-600" : p.type === "digital" ? "bg-purple-50 text-purple-600" : "bg-teal-50 text-teal-600"}">${p.type}</span>`,
        price: this.fmt(p.base_price),
        variants: p.variant_count,
        stock: p.total_stock,
        status: p.is_active
          ? `<span class="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-xs font-bold bg-emerald-100 text-emerald-700"><span class="w-1.5 h-1.5 rounded-full bg-emerald-500 inline-block"></span>Active</span>`
          : `<span class="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-xs font-bold bg-slate-100 text-slate-500"><span class="w-1.5 h-1.5 rounded-full bg-slate-400 inline-block"></span>Inactive</span>`,
      };
    });

    const columns = [
      { key: "no", label: "#", html: false },
      { key: "image", label: "Image" },
      { key: "name", label: "Product" },
      { key: "type", label: "Type" },
      { key: "price", label: "Price", html: false },
      { key: "variants", label: "Variants", html: false },
      { key: "stock", label: "Stock", html: false },
      { key: "status", label: "Status" },
    ];

    const safeData = JSON.stringify(rows).replace(/"/g, "&quot;");
    const safeCols = JSON.stringify(columns).replace(/"/g, "&quot;");
    const catOptions = this.categories.map((c) => `<ui-option value="${c.id}">${c.name}</ui-option>`).join("");
    const brandOptions = this.brands.map((b) => `<ui-option value="${b.id}">${b.name}</ui-option>`).join("");
    const materialOptions = this.materials.map((m) => `<ui-option value="${m.id}">${m.name}</ui-option>`).join("");

    return `
    <div>
      <!-- Header -->
      <div class="bg-slate-700 rounded-xl shadow-lg p-5 text-white mb-6">
        <div class="flex flex-col sm:flex-row sm:items-center sm:justify-between mb-5">
          <div class="flex items-center gap-3">
            <h1 class="text-2xl sm:text-3xl font-bold">Products</h1>
            <button onclick="this.closest('app-products-page').fetchData(true)"
              class="size-8 mt-1 flex items-center justify-center text-white/80 hover:text-white hover:bg-white/10 rounded-lg transition" title="Refresh">
              <i class="fas fa-sync-alt text-lg ${this.loading ? "animate-spin" : ""}"></i>
            </button>
          </div>
          <p class="text-slate-300 text-sm mt-1 sm:mt-0">Manage your product catalog</p>
        </div>
        <div class="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 gap-3">
          ${[
            { label: "Total", value: counts.total, icon: "fa-box", color: "bg-indigo-500" },
            { label: "Active", value: counts.active, icon: "fa-check-circle", color: "bg-emerald-500" },
            { label: "Physical", value: counts.physical, icon: "fa-shopping-bag", color: "bg-blue-500" },
            { label: "Digital", value: counts.digital, icon: "fa-download", color: "bg-purple-500" },
            { label: "Services", value: counts.service, icon: "fa-concierge-bell", color: "bg-teal-500" },
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
            ${Array(5).fill(`<div class="h-12 bg-slate-100 animate-pulse rounded-xl"></div>`).join("")}
          </div>
        ` : `
          <ui-table
            data="${safeData}" columns="${safeCols}"
            sortable searchable search-placeholder="Search products..."
            pagination page-size="20"
            action actions="view,edit,delete"
            addable refresh print bordered striped>
          </ui-table>
        `}
      </div>

      <!-- ── CREATE MODAL ───────────────────────────────── -->
      <ui-modal id="product-create-modal" position="right" size="lg" close-on-backdrop-click="false">
        <span slot="title">Add New Product</span>
        <form id="product-create-form" class="space-y-4 px-2" onsubmit="return false;">
          <div class="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div class="sm:col-span-2">
              <label class="block text-sm font-medium text-slate-700 mb-1">Product Name *</label>
              <input id="create-name" name="name" class="w-full border border-slate-200 rounded-xl px-4 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-400" placeholder="e.g. Classic White T-Shirt" required>
            </div>
            <div>
              <label class="block text-sm font-medium text-slate-700 mb-1">Category *</label>
              <ui-dropdown id="create-category" placeholder="Select category..." searchable class="w-full">
                ${catOptions}
              </ui-dropdown>
            </div>
            <div>
              <label class="block text-sm font-medium text-slate-700 mb-1">Type</label>
              <select id="create-type" name="type" class="w-full border border-slate-200 rounded-xl px-4 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-400">
                <option value="physical">Physical</option>
                <option value="digital">Digital</option>
                <option value="service">Service</option>
              </select>
            </div>
            <div>
              <label class="block text-sm font-medium text-slate-700 mb-1">Base Price (USD)</label>
              <input id="create-price" name="base_price" type="number" min="0" step="0.01" class="w-full border border-slate-200 rounded-xl px-4 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-400" placeholder="0.00">
            </div>
            <div>
              <label class="block text-sm font-medium text-slate-700 mb-1">Brand</label>
              <ui-dropdown id="create-brand" placeholder="Select brand..." searchable class="w-full">
                ${brandOptions}
              </ui-dropdown>
            </div>
            <div>
              <label class="block text-sm font-medium text-slate-700 mb-1">Material</label>
              <ui-dropdown id="create-material" placeholder="Select material..." searchable class="w-full">
                ${materialOptions}
              </ui-dropdown>
            </div>
            <div class="sm:col-span-2">
              <label class="block text-sm font-medium text-slate-700 mb-1">Image URL</label>
              <input id="create-image" name="image" type="url" class="w-full border border-slate-200 rounded-xl px-4 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-400" placeholder="https://...">
            </div>
            <div class="sm:col-span-2">
              <label class="block text-sm font-medium text-slate-700 mb-1">Description</label>
              <textarea id="create-description" name="description" rows="3" class="w-full border border-slate-200 rounded-xl px-4 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-400 resize-none" placeholder="Product description..."></textarea>
            </div>
            <div class="sm:col-span-2 flex items-center gap-3 mt-2">
              <input type="checkbox" id="create-active" class="w-4 h-4 rounded text-indigo-600" checked>
              <label for="create-active" class="text-sm font-medium text-slate-700">Active (visible on store)</label>
            </div>
          </div>
        </form>
        <div slot="footer" class="w-full flex gap-3 justify-end">
          <button modal-action="cancel" class="px-5 py-2.5 rounded-xl border border-slate-200 text-slate-600 font-semibold hover:bg-slate-50 transition text-sm">Cancel</button>
          <button id="create-save-btn" onclick="this.closest('app-products-page').submitCreate()" class="px-5 py-2.5 rounded-xl bg-indigo-600 text-white font-semibold hover:bg-indigo-700 transition text-sm">Create Product</button>
        </div>
      </ui-modal>

      <!-- ── EDIT MODAL ─────────────────────────────────── -->
      <ui-modal id="product-edit-modal" position="right" size="lg" close-on-backdrop-click="false">
        <span slot="title">Edit Product</span>
        <div class="space-y-4 px-2">
          <div class="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div class="sm:col-span-2">
              <label class="block text-sm font-medium text-slate-700 mb-1">Product Name *</label>
              <input id="edit-name" class="w-full border border-slate-200 rounded-xl px-4 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-400">
            </div>
            <div>
              <label class="block text-sm font-medium text-slate-700 mb-1">Category *</label>
              <ui-dropdown id="edit-category" placeholder="Select category..." searchable class="w-full">
                ${catOptions}
              </ui-dropdown>
            </div>
            <div>
              <label class="block text-sm font-medium text-slate-700 mb-1">Type</label>
              <select id="edit-type" class="w-full border border-slate-200 rounded-xl px-4 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-400">
                <option value="physical">Physical</option>
                <option value="digital">Digital</option>
                <option value="service">Service</option>
              </select>
            </div>
            <div>
              <label class="block text-sm font-medium text-slate-700 mb-1">Base Price (USD)</label>
              <input id="edit-price" type="number" min="0" step="0.01" class="w-full border border-slate-200 rounded-xl px-4 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-400">
            </div>
            <div>
              <label class="block text-sm font-medium text-slate-700 mb-1">Brand</label>
              <ui-dropdown id="edit-brand" placeholder="Select brand..." searchable class="w-full">
                ${brandOptions}
              </ui-dropdown>
            </div>
            <div>
              <label class="block text-sm font-medium text-slate-700 mb-1">Material</label>
              <ui-dropdown id="edit-material" placeholder="Select material..." searchable class="w-full">
                ${materialOptions}
              </ui-dropdown>
            </div>
            <div class="sm:col-span-2">
              <label class="block text-sm font-medium text-slate-700 mb-1">Image URL</label>
              <input id="edit-image" type="url" class="w-full border border-slate-200 rounded-xl px-4 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-400">
            </div>
            <div class="sm:col-span-2">
              <label class="block text-sm font-medium text-slate-700 mb-1">Description</label>
              <textarea id="edit-description" rows="3" class="w-full border border-slate-200 rounded-xl px-4 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-400 resize-none"></textarea>
            </div>
            <div class="sm:col-span-2 flex items-center gap-3 mt-2">
              <input type="checkbox" id="edit-active" class="w-4 h-4 rounded text-indigo-600">
              <label for="edit-active" class="text-sm font-medium text-slate-700">Active (visible on store)</label>
            </div>
          </div>
        </div>
        <div slot="footer" class="w-full flex gap-3 justify-end">
          <button modal-action="cancel" class="px-5 py-2.5 rounded-xl border border-slate-200 text-slate-600 font-semibold hover:bg-slate-50 transition text-sm">Cancel</button>
          <button id="edit-save-btn" onclick="this.closest('app-products-page').submitEdit()" class="px-5 py-2.5 rounded-xl bg-indigo-600 text-white font-semibold hover:bg-indigo-700 transition text-sm">Save Changes</button>
        </div>
      </ui-modal>

      <!-- ── VIEW MODAL ─────────────────────────────────── -->
      <ui-modal id="product-view-modal" position="right" size="md">
        <span slot="title">Product Details</span>
        <div class="space-y-4 px-2">
          <div id="view-banner" class="w-full h-48 bg-slate-100 rounded-xl overflow-hidden flex items-center justify-center"></div>
          <div>
            <h2 id="view-name" class="text-xl font-bold text-slate-900"></h2>
            <div id="view-status" class="mt-1"></div>
          </div>
          <div class="grid grid-cols-2 gap-3">
            ${[
              ["Category",  "view-category"],
              ["Type",      "view-type"],
              ["Price",     "view-price"],
              ["Total Stock","view-stock"],
              ["Variants",  "view-variants"],
              ["Brand",     "view-brand"],
              ["Material",  "view-material"],
            ].map(([label, id]) => `
              <div class="bg-slate-50 rounded-xl p-3">
                <p class="text-xs font-bold text-slate-400 uppercase tracking-wider">${label}</p>
                <p id="${id}" class="mt-1 text-sm font-semibold text-slate-900"></p>
              </div>
            `).join("")}
          </div>
          <div class="bg-slate-50 rounded-xl p-4">
            <p class="text-xs font-bold text-slate-400 uppercase tracking-wider mb-2">Description</p>
            <div id="view-desc" class="text-sm text-slate-700 leading-relaxed"></div>
          </div>
        </div>
        <div slot="footer" class="w-full flex gap-3 justify-end">
          <button modal-action="cancel" class="px-5 py-2.5 rounded-xl border border-slate-200 text-slate-600 font-semibold hover:bg-slate-50 transition text-sm">Close</button>
          <button onclick="this.closest('ui-modal').close(); this.closest('app-products-page').openEditModal(this.closest('app-products-page').selectedProduct)" class="px-5 py-2.5 rounded-xl bg-indigo-600 text-white font-semibold hover:bg-indigo-700 transition text-sm">
            <i class="fas fa-pencil-alt mr-1"></i> Edit
          </button>
        </div>
      </ui-modal>

      <!-- ── DELETE DIALOG ──────────────────────────────── -->
      <ui-modal id="product-delete-dialog" position="top" size="md" close-button="false">
        <div class="space-y-4 px-2 text-center pt-4">
          <div class="w-16 h-16 rounded-full bg-red-100 mx-auto flex items-center justify-center">
            <i class="fas fa-trash text-red-600 text-2xl"></i>
          </div>
          <h3 class="text-xl font-bold text-slate-900 mt-4">Delete Product?</h3>
          <p class="text-sm text-slate-500">This will permanently delete the product and all its variants. This cannot be undone.</p>
          <div class="bg-slate-50 rounded-xl p-4 mt-6">
            <p id="delete-product-name" class="font-bold text-slate-900"></p>
            <p id="delete-product-cat" class="text-xs text-slate-400 mt-1"></p>
          </div>
        </div>
        <div slot="footer" class="w-full flex gap-3">
          <button modal-action="cancel" class="flex-1 py-2.5 rounded-xl border border-slate-200 text-slate-600 font-semibold hover:bg-slate-50 transition text-sm">Cancel</button>
          <button id="delete-confirm-btn" onclick="this.closest('app-products-page').confirmDelete()" class="flex-1 py-2.5 rounded-xl bg-red-600 text-white font-semibold hover:bg-red-700 transition text-sm">Delete</button>
        </div>
      </ui-modal>

    </div>
    `;
  }

  render() { return this.renderPage(); }
}

customElements.define("app-products-page", ProductsPage);
export default ProductsPage;

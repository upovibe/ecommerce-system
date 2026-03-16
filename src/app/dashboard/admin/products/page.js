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
import "@/components/ui/FileUpload.js";
import "@/components/ui/Wysiwyg.js";
import "@/components/layout/adminLayout/ProductViewModal.js";
import "@/components/layout/adminLayout/ProductCreateModal.js";
import "@/components/layout/adminLayout/ProductUpdateModal.js";
import "@/components/layout/adminLayout/ProductDeleteDialog.js";
import api from "@/services/api.js";
import Toast from "@/components/ui/Toast.js";

class ProductsPage extends App {
  constructor() {
    super();
    this.products = [];
    this.categories = [];
    this.brands = [];
    this.materials = [];
    this.productAttributes = []; // Global attributes
    this.loading = true;
    this.selectedProduct = null;
    this.filters = { type: "", category: "", status: "", brand: "" };
    this._lastRendered = "";
    this._isInitialized = false;
    this._onTableEdit  = (e) => { const p = this._findRow(e); if (p) this.openEditModal(p); };
    this._onTableView  = (e) => { const p = this._findRow(e); if (p) this.openViewModal(p); };
    this._onTableDelete = (e) => { const p = this._findRow(e); if (p) this.openDeleteDialog(p); };
    this._onTableAdd   = () => this.openCreateModal();
    this._onTableRefresh = () => this.fetchData(true);
    this._onCategoryChange = (e) => this.handleCategoryChange(e);
  }

  handleFilterChange(e) {
    const target = e?.target;
    const value = e?.detail?.value ?? target?.value ?? "";
    if (!target?.id) return;

    if (target.id === "filter-type") this.filters.type = value;
    if (target.id === "filter-category") this.filters.category = value;
    if (target.id === "filter-status") this.filters.status = value;
    if (target.id === "filter-brand") this.filters.brand = value;

    this.updateView();
  }

  resetFilters() {
    this.filters = { type: "", category: "", status: "", brand: "" };
    this.updateView();
  }

  getFilteredProducts() {
    let items = Array.isArray(this.products) ? [...this.products] : [];
    const { type, category, status, brand } = this.filters || {};

    if (type) items = items.filter((p) => String(p.type) === String(type));
    if (category) items = items.filter((p) => String(p.category_id) === String(category));
    if (brand) items = items.filter((p) => String(p.brand_id) === String(brand));
    if (status) {
      const wantActive = status === "active";
      items = items.filter((p) => !!p.is_active === wantActive);
    }
    return items;
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
    this.syncProductModals();
  }

  syncProductModals() {
    const createModal = this.querySelector("product-create-modal");
    if (createModal && createModal.setOptions) {
      createModal.setOptions({
        categories: this.categories,
        brands: this.brands,
        materials: this.materials,
      });
    }
    const updateModal = this.querySelector("product-update-modal");
    if (updateModal && updateModal.setOptions) {
      updateModal.setOptions({
        categories: this.categories,
        brands: this.brands,
        materials: this.materials,
      });
    }
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
      const [prodRes, catRes, brandRes, materialRes, attrRes] = await Promise.all([
        api.get("/products"),
        api.get("/categories"),
        api.get("/brands"),
        api.get("/materials"),
        api.get("/attributes"),
      ]);
      this.products   = prodRes.data?.data || [];
      this.categories = catRes.data?.data  || [];
      this.brands     = brandRes.data?.data || [];
      this.materials  = materialRes.data?.data || [];
      this.productAttributes = attrRes.data?.data || [];
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
    let img = p.main_image || p.metadata?.image || "";
    if (!img && p.images) {
      const imgs = Array.isArray(p.images) ? p.images : (typeof p.images === "string" ? JSON.parse(p.images) : []);
      img = imgs?.[0] || "";
    }
    return this.fileUrl(img);
  }

  fileUrl(path) {
    if (!path) return "";
    if (path.startsWith("http")) return path;
    if (path.startsWith("/api/")) return path;
    if (path.startsWith("api/")) return `/${path}`;
    if (path.startsWith("/uploads/")) return `/api${path}`;
    return `/api/${path.replace(/^\//, "")}`;
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

  getAttributeByName(name) {
    if (!name) return null;
    const target = String(name).toLowerCase();
    return (this.productAttributes || []).find(
      (a) => String(a.name || "").toLowerCase() === target,
    ) || null;
  }

  buildTypeOptionsHtml() {
    const attrs = (this.productAttributes || [])
      .slice()
      .sort((a, b) => String(a.name || "").localeCompare(String(b.name || "")));
    const opts = attrs.map(a => `<ui-option value="${a.name}">${a.name}</ui-option>`).join("");
    return `
      <ui-option value="">Select type...</ui-option>
      ${opts}
      <ui-option value="Other">Other (Custom)</ui-option>
    `;
  }


  handleCategoryChange(e) {
    const dropdown = e.target;
    const value = e.detail?.value || dropdown?.value;
    const isEdit = dropdown.id.includes("edit");
    const subId = isEdit ? "edit-subcategory" : "create-subcategory";
    const subDropdown = this.querySelector(`#${subId}`);
    if (!subDropdown) return;

    // Filter categories that have this value as parent_id
    const filtered = (this.categories || []).filter(c => String(c.parent_id) === String(value));

    // Clear existing options
    Array.from(subDropdown.querySelectorAll('ui-option')).forEach(opt => opt.remove());
    
    // Add default option
    const defaultOpt = document.createElement('ui-option');
    defaultOpt.setAttribute('value', '');
    defaultOpt.textContent = 'Select subcategory...';
    subDropdown.appendChild(defaultOpt);

    // Add filtered subcategories
    filtered.forEach(c => {
      const opt = document.createElement('ui-option');
      opt.setAttribute('value', String(c.id));
      opt.textContent = c.name;
      subDropdown.appendChild(opt);
    });
    
    subDropdown.value = "";
  }

  // ── CREATE ──────────────────────────────────────────
  openCreateModal() {
    const m = this.querySelector("#product-create-modal");
    if (m) {
      m.querySelector("form")?.reset();
      const cat = m.querySelector("#create-category");
      const subcat = m.querySelector("#create-subcategory");
      const brand = m.querySelector("#create-brand");
      const material = m.querySelector("#create-material");
      const active = m.querySelector("#create-active");
      const status = m.querySelector("#create-status");
      const name = m.querySelector("#create-name");
      const type = m.querySelector("#create-type");
      const price = m.querySelector("#create-price");
      const uploader = m.querySelector("#create-uploader");
      const desc = m.querySelector("#create-description");
      if (cat) cat.value = "";
      if (subcat) {
        Array.from(subcat.querySelectorAll('ui-option')).forEach(opt => opt.remove());
        const defaultOpt = document.createElement('ui-option');
        defaultOpt.setAttribute('value', '');
        defaultOpt.textContent = 'Select subcategory...';
        subcat.appendChild(defaultOpt);
        subcat.value = "";
      }
      if (brand) brand.value = "";
      if (material) material.value = "";
      if (name) name.value = "";
      if (type) type.value = "physical";
      if (uploader) uploader.clear();
      const gallery = m.querySelector("#create-gallery");
      if (gallery) gallery.clear();
      if (desc) desc.setValue("");
      const details = m.querySelector("#create-details");
      if (details) details.value = "";
      if (active) {
        active.checked = true;
        active.setAttribute("checked", "");
      }
      const variants = m.querySelector("#variant-list");
      if (variants) variants.innerHTML = "";
      m.open();
    }
  }
  closeCreateModal() {
    const m = this.querySelector("#product-create-modal");
    if (m) m.close();
  }
  async submitCreate(targetStatus = "active") {
    const form    = this.querySelector("#product-create-form");
    const saveBtn = targetStatus === "active" ? this.querySelector("#create-publish-btn") : this.querySelector("#create-draft-btn");
    if (!form) return;
    const name           = form.querySelector("#create-name")?.value?.trim();
    const parent_cat_id  = form.querySelector("#create-category")?.value;
    const subcat_id      = form.querySelector("#create-subcategory")?.value;
    const category_id    = subcat_id || parent_cat_id;
    const type           = form.querySelector("#create-type")?.value || "physical";
    const status         = targetStatus;
    const base_price     = parseFloat(form.querySelector("#create-price")?.value) || 0;
    const descEl         = form.querySelector("#create-description");
    const description    = descEl?.getValue ? descEl.getValue() : descEl?.value;
    const details        = form.querySelector("#create-details")?.value;
    const uploader       = form.querySelector("#create-uploader");
    const gallery        = form.querySelector("#create-gallery");
    const brand_id       = form.querySelector("#create-brand")?.value;
    const material_id    = form.querySelector("#create-material")?.value;
    const is_active      = form.querySelector("#create-active")?.checked ? 1 : 0;
    const variants       = this.collectVariants(form.querySelector("#variant-list"));

    if (!name) { Toast.show({ title: "Required", message: "Product name is required", variant: "error" }); return; }
    if (!category_id) { Toast.show({ title: "Required", message: "Category is required", variant: "error" }); return; }

    const oldBtnText = saveBtn?.textContent;
    if (saveBtn) saveBtn.textContent = "Saving...";
    try {
      const payload = {
        name,
        product_code: form.querySelector("#create-code")?.value?.trim(),
        sku: form.querySelector("#create-sku")?.value?.trim(),
        category_id,
        type,
        status,
        base_price,
        description,
        details: details ? { note: details } : null,
        brand_id,
        material_id,
        is_active,
        variants,
      };

      const res = await api.post("/products", payload);
      const newId = res.data?.data?.id;

      if (newId) {
        // 1. Handle main image upload
        if (uploader) {
          const files = uploader.getFiles();
          const file = files.find(f => !f.isExisting);
          if (file) {
            const formData = new FormData();
            formData.append("image", file);
            await api.post(`/products/${newId}/upload-image`, formData, {
              headers: { "Content-Type": "multipart/form-data" }
            });
          }
        }

        // 2. Handle gallery uploads
        if (gallery) {
          const files = gallery.getFiles();
          const newFiles = files.filter(f => !f.isExisting);
          if (newFiles.length > 0) {
            const formData = new FormData();
            newFiles.forEach(f => formData.append("images[]", f));
            await api.post(`/products/${newId}/upload-gallery`, formData, {
              headers: { "Content-Type": "multipart/form-data" }
            });
          }
        }
      }

      Toast.show({ title: "Created", message: `Product ${status === 'active' ? 'published' : 'saved as draft'}`, variant: "success" });
      this.closeCreateModal();
      await this.fetchData(true);
    } catch (e) {
      Toast.show({ title: "Error", message: e.response?.data?.message || "Failed to create product", variant: "error" });
    } finally {
      if (saveBtn) saveBtn.textContent = oldBtnText;
    }
  }

  addVariantRow(data = null, targetList = null) {
    const list = targetList || this.getActiveVariantList();
    if (!list) return;
    
    const row = document.createElement("div");
    row.className = "p-4 bg-slate-50 rounded-xl border border-slate-100 space-y-3 variant-row";

    row.innerHTML = `
      <div class="flex flex-col gap-4">
        <div class="space-y-2">
          <label class="block text-[11px] font-bold text-slate-400 uppercase tracking-wider">Variation Type</label>
          <ui-dropdown data-field="type" placeholder="Select type..." class="w-full bg-white border-slate-200" onchange="this.closest('app-products-page').handleVariantTypeChange(event)">
            ${this.buildTypeOptionsHtml()}
          </ui-dropdown>
          <div class="mt-2 hidden custom-type-container animate-in fade-in slide-in-from-top-1 duration-200">
            <ui-input data-field="custom_type" placeholder="Type name (e.g. Resolution)" class="w-full bg-white border-slate-200"></ui-input>
          </div>
        </div>
        <div class="space-y-2">
          <label class="block text-[11px] font-bold text-slate-400 uppercase tracking-wider">Value</label>
          <ui-input data-field="value" placeholder="Enter value (e.g. Yellow, XL)" class="w-full bg-white border-slate-200"></ui-input>
        </div>
        <div class="space-y-2">
          <label class="block text-[11px] font-bold text-slate-400 uppercase tracking-wider">Quantity</label>
          <ui-input data-field="quantity" type="number" step="1" min="0" placeholder="0" class="w-full bg-white border-slate-200" oninput="this.closest('app-products-page').updateTotalStock()"></ui-input>
        </div>
      </div>
      <div class="flex items-center justify-end pt-3 border-t border-slate-200/60">
        <button type="button" onclick="this.closest('app-products-page').removeVariantRow(this)" class="px-4 py-2 rounded-xl text-rose-600 hover:bg-rose-50 hover:text-rose-700 transition-all duration-200 text-xs font-bold uppercase tracking-widest flex items-center gap-2">
          <i class="fas fa-trash-alt text-[10px]"></i> Remove variant
        </button>
      </div>
    `;
    list.appendChild(row);

    if (data && typeof data === "object" && !data.nodeType) {
      const typeDrop = row.querySelector('[data-field="type"]');
      const customTypeEl = row.querySelector('[data-field="custom_type"]');
      const rawType = data.type || "Size";
      const attr = this.getAttributeByName(rawType);
      const isOther = !attr;

      if (isOther) {
        typeDrop.value = "Other";
        const container = row.querySelector(".custom-type-container");
        if (container) container.classList.remove("hidden");
        if (customTypeEl) customTypeEl.value = rawType;
      } else {
        typeDrop.value = attr.name;
      }

      row.querySelector('[data-field="value"]').value = data.value || data.label || "";
      row.querySelector('[data-field="quantity"]').value = data.quantity ?? data.stock ?? 0;
    } else {
    }
    this.updateTotalStock();
  }

  getActiveVariantList() {
    const editModal = this.querySelector("#product-edit-modal");
    const createModal = this.querySelector("#product-create-modal");
    if (editModal?.hasAttribute("open")) {
      return editModal.querySelector("#variant-list");
    }
    if (createModal?.hasAttribute("open")) {
      return createModal.querySelector("#variant-list");
    }
    return this.querySelector("#variant-list");
  }

  handleVariantTypeChange(e) {
    const dropdown = e.target;
    const value = e.detail?.value || dropdown?.value;
    const row = dropdown.closest(".variant-row");
    if (!row) return;
    const container = row.querySelector(".custom-type-container");
    if (value === "Other") {
      container?.classList.remove("hidden");
    } else {
      container?.classList.add("hidden");
    }
  }

  updateTotalStock() {
    const isCreate = this.querySelector("#product-create-modal").hasAttribute("open");
    const m = isCreate ? this.querySelector("#product-create-modal") : this.querySelector("#product-edit-modal");
    
    if (!m) return;
    
    const rows = Array.from(m.querySelectorAll(".variant-row"));
    const stockField = m.querySelector("#create-stock-total") || m.querySelector("#edit-stock-total");
    
    if (rows.length === 0) {
      if (stockField) {
        stockField.removeAttribute("readonly");
        stockField.classList.remove("bg-slate-50");
        stockField.classList.add("bg-white");
        stockField.placeholder = "Enter direct stock";
      }
      return;
    }

    if (stockField) {
      stockField.setAttribute("readonly", "");
      stockField.classList.add("bg-slate-50");
      stockField.classList.remove("bg-white");
      stockField.placeholder = "Sum of variants";
    }

    const total = rows.reduce((sum, row) => {
      const val = parseInt(row.querySelector('[data-field="quantity"]')?.value || 0, 10);
      return sum + (isNaN(val) ? 0 : val);
    }, 0);

    if (stockField) {
      stockField.value = total;
    }
  }

  removeVariantRow(button) {
    const row = button?.closest(".variant-row");
    if (row) {
      row.remove();
      this.updateTotalStock();
    }
  }

  collectVariants(list) {
    if (!list) return [];
    
    const rows = Array.from(list.querySelectorAll(".variant-row"));
    
    // If no variants, check the total stock field and return a default variant
    if (rows.length === 0) {
      const m = list.closest("ui-modal");
      const stockField = m?.querySelector("#create-stock-total") || m?.querySelector("#edit-stock-total");
      const quantity = stockField?.value ? parseInt(stockField.value, 10) : 0;
      return [{ type: "Default", value: "Default", quantity }];
    }

    const variants = rows.map((row) => {
      const typeDrop = row.querySelector('[data-field="type"]');
      const customTypeEl = row.querySelector('[data-field="custom_type"]');
      const valueEl = row.querySelector('[data-field="value"]');
      const quantityEl = row.querySelector('[data-field="quantity"]');

      let type = typeDrop?.value || "";
      if (type === "Other" || type === "") {
        type = customTypeEl?.value?.trim() || "Other";
      }

      const value = valueEl?.value?.trim() || "";
      const quantity = quantityEl?.value ? parseInt(quantityEl.value, 10) : null;
      
      return { type, value, quantity };
    });
    return variants.filter((v) => v.value || v.quantity);
  }

  // ── EDIT ────────────────────────────────────────────
  async openEditModal(product) {
    if (!product?.id) return;
    this.selectedProduct = product;
    const m = this.querySelector("#product-edit-modal");
    if (!m) return;
    const updateModal = this.querySelector("product-update-modal");
    if (updateModal?.setStatus) {
      updateModal.setStatus(product.status);
    }
    m.open();

    try {
      const res = await api.get(`/products/${product.id}`);
      const fullProduct = res.data?.data;
      if (!fullProduct) throw new Error("Product data not found");
      this.selectedProduct = fullProduct;
      const p = fullProduct;
      
      m.querySelector("#edit-name").value        = p.name || "";
      m.querySelector("#edit-code").value        = p.product_code || "";
      m.querySelector("#edit-sku").value         = p.sku || "";
      m.querySelector("#edit-type").value        = p.type || "physical";
      m.querySelector("#edit-price").value       = p.base_price || "";
      
      // Category mapping
      const cat = this.categories.find(c => String(c.id) === String(p.category_id));
      if (cat && cat.parent_id) {
        m.querySelector("#edit-category").value = String(cat.parent_id);
        this.handleCategoryChange({ target: m.querySelector("#edit-category"), detail: { value: String(cat.parent_id) } });
        m.querySelector("#edit-subcategory").value = String(p.category_id);
      } else {
        m.querySelector("#edit-category").value = String(p.category_id || "");
        this.handleCategoryChange({ target: m.querySelector("#edit-category"), detail: { value: String(p.category_id || "") } });
        m.querySelector("#edit-subcategory").value = "";
      }

      const vList = m.querySelector("#variant-list");
      if (vList) {
        vList.innerHTML = "";
        if (p.variants && Array.isArray(p.variants)) {
          p.variants.forEach(v => {
            const opt = typeof v.variant_options === 'string' ? JSON.parse(v.variant_options) : v.variant_options;
            let resolvedValue = opt?.value || opt?.label || "";
            if (resolvedValue.includes(":")) {
              resolvedValue = resolvedValue.split(":").slice(1).join(":").trim();
            }
            this.addVariantRow({
              type: opt?.type || "Size",
              value: resolvedValue,
              quantity: v.quantity ?? v.stock ?? null
            }, vList);
          });
        }
      }
      this.updateTotalStock();

      const editDesc = m.querySelector("#edit-description");
      if (editDesc?.setValue) {
        editDesc.setValue(p.description || "");
      }

      const editDetails = m.querySelector("#edit-details");
      if (editDetails) {
        let d = p.details;
        if (typeof d === "string") {
          try {
            d = JSON.parse(d);
          } catch (_) {
            d = { note: d };
          }
        }
        const note = d?.note || "";
        if (typeof editDetails.setValue === "function") {
          editDetails.setValue(note);
        } else {
          editDetails.value = note;
        }
      }

      const uploader = m.querySelector("#edit-uploader");
      if (uploader) uploader.setValue(this.fileUrl(p.main_image || ""));

      const gallery = m.querySelector("#edit-gallery");
      if (gallery && p.images) {
          const imgs = typeof p.images === 'string' ? JSON.parse(p.images) : p.images;
          const mapped = (imgs || []).map((img) => this.fileUrl(img)).filter(Boolean);
          gallery.setValue(mapped);
      }

      m.querySelector("#edit-brand").value       = String(p.brand_id || "");
      m.querySelector("#edit-material").value    = String(p.material_id || "");
      
      const sw = m.querySelector("#edit-active");
      if (sw) {
        sw.checked = !!p.is_active;
        if (sw.checked) sw.setAttribute("checked", "");
        else sw.removeAttribute("checked");
      }
    } catch (e) {
      console.error(e);
      Toast.show({ title: "Error", message: "Failed to load product details", variant: "error" });
    }
  }
  closeEditModal() {
    const m = this.querySelector("#product-edit-modal");
    if (m) m.close();
  }
  async submitEdit(targetStatus = null) {
    const m       = this.querySelector("#product-edit-modal");
    const saveBtn = targetStatus === "active" ? m.querySelector("#edit-publish-btn") : (targetStatus === "draft" ? m.querySelector("#edit-draft-btn") : m.querySelector("#edit-save-btn"));
    if (!m || !this.selectedProduct) return;
    const name           = m.querySelector("#edit-name")?.value?.trim();
    const parent_cat_id  = m.querySelector("#edit-category")?.value;
    const subcat_id      = m.querySelector("#edit-subcategory")?.value;
    const category_id    = subcat_id || parent_cat_id;
    const type           = m.querySelector("#edit-type")?.value;
    const status         = targetStatus || this.selectedProduct.status;
    const base_price     = parseFloat(m.querySelector("#edit-price")?.value) || 0;
    const descEl         = m.querySelector("#edit-description");
    const description    = descEl?.getValue ? descEl.getValue() : descEl?.value;
    const details        = m.querySelector("#edit-details")?.value;
    const uploader       = m.querySelector("#edit-uploader");
    const gallery        = m.querySelector("#edit-gallery");
    const brand_id       = m.querySelector("#edit-brand")?.value;
    const material_id    = m.querySelector("#edit-material")?.value;
    const is_active      = m.querySelector("#edit-active")?.checked ? 1 : 0;

    if (!name) { Toast.show({ title: "Required", message: "Name is required", variant: "error" }); return; }
    const oldBtnText = saveBtn?.textContent;
    if (saveBtn) saveBtn.textContent = "Saving...";

    try {
      // 1. Handle image upload first if a NEW file was selected
      if (uploader) {
        const files = uploader.getFiles();
        const file = files.find(f => !f.isExisting);
        if (file) {
          const formData = new FormData();
          formData.append("image", file);
          await api.post(`/products/${this.selectedProduct.id}/upload-image`, formData, {
            headers: { "Content-Type": "multipart/form-data" }
          });
        }
      }

      // 2. Handle gallery uploads
      if (gallery) {
        const files = gallery.getFiles();
        const newFiles = files.filter(f => !f.isExisting);
        if (newFiles.length > 0) {
          const formData = new FormData();
          newFiles.forEach(f => formData.append("images[]", f));
          await api.post(`/products/${this.selectedProduct.id}/upload-gallery`, formData, {
            headers: { "Content-Type": "multipart/form-data" }
          });
        }
      }

      // 3. Update product details
      const payload = {
        name,
        product_code: m.querySelector("#edit-code")?.value?.trim(),
        sku: m.querySelector("#edit-sku")?.value?.trim(),
        category_id,
        type,
        status,
        base_price,
        description,
        details: details ? { note: details } : null,
        brand_id,
        material_id,
        is_active,
        variants: this.collectVariants(m.querySelector("#variant-list")),
      };

      await api.put(`/products/${this.selectedProduct.id}`, payload);
      Toast.show({ title: "Updated", message: "Product updated successfully", variant: "success" });
      this.closeEditModal();
      await this.fetchData(true);
    } catch (e) {
      Toast.show({ title: "Error", message: e.response?.data?.message || "Failed to update product", variant: "error" });
    } finally {
      if (saveBtn) saveBtn.textContent = oldBtnText;
    }
  }

  // ── VIEW ────────────────────────────────────────────
  async openViewModal(product) {
    if (!product?.id) return;
    this.selectedProduct = product;

    try {
      const res = await api.get(`/products/${product.id}`);
      const fullProduct = res.data?.data;
      if (!fullProduct) throw new Error("Product details not found");
      this.selectedProduct = fullProduct;
      const viewModal = this.querySelector("product-view-modal");
      if (viewModal) {
        viewModal.setProductData(fullProduct);
        viewModal.open();
      }
    } catch (e) {
      console.error(e);
      Toast.show({ title: "Error", message: "Failed to load product details", variant: "error" });
    }
  }

  // ── DELETE ──────────────────────────────────────────
  openDeleteDialog(product) {
    this.selectedProduct = product;
    const d = this.querySelector("product-delete-dialog");
    if (!d) return;
    if (typeof d.setProductData === "function") {
      d.setProductData(product);
    }
    if (typeof d.open === "function") {
      d.open();
    }
  }
  closeDeleteDialog() {
    const d = this.querySelector("product-delete-dialog");
    if (d && typeof d.close === "function") d.close();
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

    const filteredProducts = this.getFilteredProducts();
    const rows = filteredProducts.map((p, i) => {
      const imgSrc = this.imgUrl(p);
      return {
        id: p.id,
        no: i + 1,
        image: imgSrc
          ? `<img src="${imgSrc}" class="w-10 h-10 rounded-lg object-cover border border-slate-200" alt="${p.name}" onerror="this.style.display='none'">`
          : `<div class="w-10 h-10 rounded-lg bg-slate-100 flex items-center justify-center text-slate-300"><i class="fas fa-box text-sm"></i></div>`,
        name: `
          <div class="py-1">
            <p class="font-bold text-slate-900 text-sm mb-1.5">${p.name}</p>
            <div class="space-y-1">
              <div class="flex items-center gap-1.5">
                <span class="text-[9px] font-bold text-slate-400 uppercase tracking-tight w-7">Code:</span>
                <span class="text-[10px] bg-slate-100 text-slate-600 px-1.5 py-0.5 rounded font-mono border border-slate-200/50">${p.product_code || "—"}</span>
              </div>
              <div class="flex items-center gap-1.5">
                <span class="text-[9px] font-bold text-slate-400 uppercase tracking-tight w-7">SKU:</span>
                <span class="text-[10px] text-slate-500 font-mono italic">${p.sku || "—"}</span>
              </div>
            </div>
            <p class="text-[10px] text-indigo-500 mt-2 font-semibold uppercase tracking-wider">${p.category_name || "—"}</p>
          </div>
        `,
        type: `<span class="capitalize text-xs px-2 py-0.5 rounded-full font-medium ${p.type === "physical" ? "bg-blue-50 text-blue-600" : p.type === "digital" ? "bg-purple-50 text-purple-600" : "bg-teal-50 text-teal-600"}">${p.type}</span>`,
        price: p.is_on_promotion 
          ? `<div class="flex flex-col">
               <span class="text-[10px] text-slate-400 line-through leading-none mb-1">${this.fmt(p.base_price)}</span>
               <span class="text-sm font-bold text-rose-600 leading-none">${this.fmt(p.discounted_price)}</span>
               <div class="mt-1 flex items-center gap-1">
                 <span class="text-[8px] font-black bg-rose-500 text-white px-1 py-0.5 rounded leading-none uppercase tracking-tighter">-${p.promotion_details?.label || ''}</span>
               </div>
             </div>`
          : `<span class="font-bold text-slate-700">${this.fmt(p.base_price)}</span>`,
        variants: p.variant_count,
        stock: p.stock_status === 'out_of_stock' 
          ? `<span class="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-bold bg-rose-100 text-rose-700">Out of Stock</span>`
          : p.stock_status === 'low_stock'
            ? `<div class="flex flex-col">
                 <span class="font-bold text-amber-600 leading-none">${p.total_stock}</span>
                 <span class="text-[9px] font-bold text-amber-500 uppercase tracking-tighter mt-1">Low Stock</span>
               </div>`
            : `<span class="font-bold text-slate-700">${p.total_stock}</span>`,
        status: p.is_active
          ? `<span class="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-xs font-bold bg-emerald-100 text-emerald-700"><span class="w-1.5 h-1.5 rounded-full bg-emerald-500 inline-block"></span>Active</span>`
          : `<span class="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-xs font-bold bg-slate-100 text-slate-500"><span class="w-1.5 h-1.5 rounded-full bg-slate-400 inline-block"></span>Inactive</span>`,
      };
    });

    const columns = [
      { key: "no", label: "#", html: false },
      { key: "image", label: "Image" },
      { key: "name", label: "Product & Identifiers" },
      { key: "type", label: "Type" },
      { key: "price", label: "Price", html: true },
      { key: "variants", label: "Variants", html: false },

      { key: "stock", label: "Stock", html: true },
      { key: "status", label: "Status" },
    ];

    const safeData = JSON.stringify(rows).replace(/"/g, "&quot;");
    const safeCols = JSON.stringify(columns).replace(/"/g, "&quot;");

    const categoryOptions = (this.categories || [])
      .map((c) => `<ui-option value="${c.id}">${c.name}</ui-option>`)
      .join("");
    const brandOptions = (this.brands || [])
      .map((b) => `<ui-option value="${b.id}">${b.name}</ui-option>`)
      .join("");
    
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

      <!-- Filters -->
      <div class="bg-white rounded-xl shadow-sm border border-slate-100 p-4 mb-4">
        <div class="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-3">
          <div>
            <label class="block text-xs font-semibold text-slate-500 mb-1">Type</label>
            <ui-dropdown id="filter-type" value="${this.filters.type}" placeholder="All types" class="w-full" onchange="this.closest('app-products-page').handleFilterChange(event)">
              <ui-option value="">All Types</ui-option>
              <ui-option value="physical">Physical</ui-option>
              <ui-option value="digital">Digital</ui-option>
              <ui-option value="service">Service</ui-option>
            </ui-dropdown>
          </div>
          <div>
            <label class="block text-xs font-semibold text-slate-500 mb-1">Category</label>
            <ui-dropdown id="filter-category" value="${this.filters.category}" placeholder="All categories" searchable class="w-full" onchange="this.closest('app-products-page').handleFilterChange(event)">
              <ui-option value="">All Categories</ui-option>
              ${categoryOptions}
            </ui-dropdown>
          </div>
          <div>
            <label class="block text-xs font-semibold text-slate-500 mb-1">Brand</label>
            <ui-dropdown id="filter-brand" value="${this.filters.brand}" placeholder="All brands" searchable class="w-full" onchange="this.closest('app-products-page').handleFilterChange(event)">
              <ui-option value="">All Brands</ui-option>
              ${brandOptions}
            </ui-dropdown>
          </div>
          <div>
            <label class="block text-xs font-semibold text-slate-500 mb-1">Status</label>
            <ui-dropdown id="filter-status" value="${this.filters.status}" placeholder="All statuses" class="w-full" onchange="this.closest('app-products-page').handleFilterChange(event)">
              <ui-option value="">All Status</ui-option>
              <ui-option value="active">Active</ui-option>
              <ui-option value="inactive">Inactive</ui-option>
            </ui-dropdown>
          </div>
          <div class="flex items-end">
            <button onclick="this.closest('app-products-page').resetFilters()" class="w-full px-3 py-2 rounded-md border border-slate-200 text-slate-600 font-semibold hover:bg-slate-50 transition text-sm">
              Clear Filters
            </button>
          </div>
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
      <product-create-modal></product-create-modal>
      <product-update-modal></product-update-modal>
      <product-view-modal></product-view-modal>
      <product-delete-dialog></product-delete-dialog>
</div>
    `;
  }

  render() { return this.renderPage(); }
}

customElements.define("app-products-page", ProductsPage);
export default ProductsPage;






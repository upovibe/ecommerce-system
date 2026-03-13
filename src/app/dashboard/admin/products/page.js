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
    this._lastRendered = "";
    this._isInitialized = false;
    this._onTableEdit  = (e) => { const p = this._findRow(e); if (p) this.openEditModal(p); };
    this._onTableView  = (e) => { const p = this._findRow(e); if (p) this.openViewModal(p); };
    this._onTableDelete = (e) => { const p = this._findRow(e); if (p) this.openDeleteDialog(p); };
    this._onTableAdd   = () => this.openCreateModal();
    this._onTableRefresh = () => this.fetchData(true);
    this._onCategoryChange = (e) => this.handleCategoryChange(e);
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
          const d = typeof p.details === 'string' ? JSON.parse(p.details) : p.details;
          editDetails.value = d?.note || "";
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
    
    const m = this.querySelector("#product-view-modal");
    if (!m) return;
    
    m.open();

    try {
      const res = await api.get(`/products/${product.id}`);
      const fullProduct = res.data?.data;
      if (!fullProduct) throw new Error("Product details not found");
      this.selectedProduct = fullProduct;
      const p = fullProduct;

      const imgSrc = this.imgUrl(p);
      m.querySelector("#view-banner").innerHTML = imgSrc
        ? `<img src="${imgSrc}" class="w-full h-full object-cover rounded-2xl shadow-inner" alt="${p.name}">`
        : `<div class="bg-indigo-50 size-20 rounded-3xl flex items-center justify-center text-indigo-300 shadow-sm"><i class="fas fa-box text-4xl"></i></div>`;
        
      m.querySelector("#view-name").textContent = p.name;
      m.querySelector("#view-code").textContent = p.product_code || "—";
      m.querySelector("#view-sku").textContent  = p.sku || "—";
      
      // Header Badges
      m.querySelector("#view-category-badge").textContent = p.category_name || "Uncategorized";
      m.querySelector("#view-type-badge").textContent     = (p.type || "physical").toUpperCase();
      
      // Status Badge
      m.querySelector("#view-status-badge").innerHTML = p.is_active
        ? `<span class="px-3 py-1.5 rounded-xl bg-emerald-500/20 backdrop-blur-md text-emerald-400 text-xs font-bold border border-emerald-500/30 flex items-center gap-2"><span class="size-1.5 rounded-full bg-emerald-400 animate-pulse"></span>ACTIVE</span>`
        : `<span class="px-3 py-1.5 rounded-xl bg-slate-500/20 backdrop-blur-md text-slate-400 text-xs font-bold border border-slate-500/30">INACTIVE</span>`;
        
      // Stats
      m.querySelector("#view-price").textContent     = this.fmt(p.base_price);
      m.querySelector("#view-stock").textContent     = p.total_stock ?? "0";
      m.querySelector("#view-variants").textContent  = p.variant_count ?? "0";
      m.querySelector("#view-type-stat").textContent = p.type || "Physical";
      
      // Meta
      const viewBrand = p.brand_name || (p.brand_id ? this.getBrandById(p.brand_id)?.name : "—");
      const viewMaterial = p.material_name || (p.material_id ? this.getMaterialById(p.material_id)?.name : "—");
      m.querySelector("#view-brand").textContent    = viewBrand || "—";
      m.querySelector("#view-material").textContent = viewMaterial || "—";
      
      // Description
      m.querySelector("#view-desc").innerHTML = p.description || "<span class='text-slate-400 italic'>No description provided</span>";

      // Gallery
      const galleryImages = Array.isArray(p.images)
        ? p.images
        : (typeof p.images === "string" ? JSON.parse(p.images) : []);
      const galleryUrls = (galleryImages || []).map((img) => this.fileUrl(img)).filter(Boolean);
      const galleryBlock = m.querySelector("#view-gallery");
      if (galleryBlock) {
        if (galleryUrls.length) {
          galleryBlock.innerHTML = `
            <div class="grid grid-cols-2 sm:grid-cols-3 gap-3">
              ${galleryUrls.map((src) => `
                <div class="aspect-square rounded-xl overflow-hidden border border-slate-100 bg-slate-50">
                  <img src="${src}" class="w-full h-full object-cover" alt="Product image">
                </div>
              `).join("")}
            </div>
          `;
        } else {
          galleryBlock.innerHTML = `<div class="text-sm text-slate-400 italic">No gallery images</div>`;
        }
      }

      // Render variations in view modal
      const vContainer = m.querySelector("#view-variants-list");
      if (vContainer) {
        const variants = p.variants || [];
        if (variants.length === 0) {
          vContainer.innerHTML = `<div class="p-6 text-center text-slate-400 italic bg-white rounded-2xl border border-dashed border-slate-200">No variations configured</div>`;
        } else {
          vContainer.innerHTML = `
            <div class="overflow-hidden bg-white rounded-2xl border border-slate-100 shadow-sm">
              <table class="w-full text-left text-sm">
                <thead class="bg-slate-50 border-b border-slate-100">
                  <tr>
                    <th class="px-4 py-3 font-bold text-slate-500 uppercase tracking-wider text-[10px]">Variation</th>
                    <th class="px-4 py-3 font-bold text-slate-500 uppercase tracking-wider text-[10px]">Stock</th>
                  </tr>
                </thead>
                <tbody class="divide-y divide-slate-50">
                  ${variants.map(v => {
                    const opt = typeof v.variant_options === 'string' ? JSON.parse(v.variant_options) : v.variant_options;
                    const type = opt?.type || "Default";
                    const value = opt?.value || opt?.label || "Default";
                    const qty = v.quantity ?? v.stock ?? 0;
                    const isLowStock = qty <= 5;
                    return `
                      <tr class="hover:bg-slate-50 transition">
                        <td class="px-4 py-3">
                          <div class="text-[10px] text-slate-400 font-bold uppercase">${type}</div>
                          <div class="font-semibold text-slate-700">${value}</div>
                        </td>
                        <td class="px-4 py-3">
                          <span class="px-2 py-0.5 rounded-full text-[11px] font-bold ${isLowStock ? 'bg-orange-100 text-orange-600' : 'bg-emerald-100 text-emerald-600'}">
                            ${qty} pcs
                          </span>
                        </td>
                      </tr>
                    `;
                  }).join('')}
                </tbody>
              </table>
            </div>
          `;
        }
      }
    } catch (e) {
      console.error(e);
      Toast.show({ title: "Error", message: "Failed to load product details", variant: "error" });
    }
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
      { key: "name", label: "Product & Identifiers" },
      { key: "type", label: "Type" },
      { key: "price", label: "Price", html: false },
      { key: "variants", label: "Variants", html: false },
      { key: "stock", label: "Stock", html: false },
      { key: "status", label: "Status" },
    ];

    const safeData = JSON.stringify(rows).replace(/"/g, "&quot;");
    const safeCols = JSON.stringify(columns).replace(/"/g, "&quot;");
    
    // Only top level categories for the first dropdown
    const parentCatOptions = this.categories
      .filter(c => !c.parent_id)
      .map((c) => `<ui-option value="${c.id}">${c.name}</ui-option>`)
      .join("");
      
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
        <form id="product-create-form" class="space-y-4" onsubmit="return false;">
          
          <div class="space-y-4">
            <!-- 1. Product Name -->
            <div>
              <label class="block text-sm font-medium text-slate-700 mb-1">Product Name *</label>
              <ui-input id="create-name" placeholder="e.g. Classic White T-Shirt" class="w-full"></ui-input>
            </div>

            <!-- 1a. Product Identifiers -->
            <div class="space-y-4">
              <div>
                <label class="block text-sm font-medium text-slate-700 mb-1">Product Code</label>
                <ui-input id="create-code" placeholder="Auto-gen" class="w-full"></ui-input>
              </div>
              <div>
                <label class="block text-sm font-medium text-slate-700 mb-1">SKU</label>
                <ui-input id="create-sku" placeholder="Auto-gen" class="w-full"></ui-input>
              </div>
            </div>

            <!-- 2. Description (WYSIWYG) -->
            <div>
              <label class="block text-sm font-medium text-slate-700 mb-1">Description</label>
              <ui-wysiwyg id="create-description" placeholder="Product description..." height="200px" toolbar="basic"></ui-wysiwyg>
            </div>

            <!-- 3. Details (Content Area) -->
            <div>
              <label class="block text-sm font-medium text-slate-700 mb-2">More Information (Optional)</label>
              <ui-textarea id="create-details" rows="3" placeholder="Additional details, features, etc..." class="w-full"></ui-textarea>
            </div>

            <div class="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <!-- 4. Price & Type -->
              <div>
                <label class="block text-sm font-medium text-slate-700 mb-1">Base Price (USD)</label>
                <ui-input id="create-price" type="number" min="0" step="0.01" placeholder="0.00" class="w-full"></ui-input>
              </div>
              <div>
                <label class="block text-sm font-medium text-slate-700 mb-1">Type</label>
                <ui-dropdown id="create-type" placeholder="Select type..." class="w-full">
                  <ui-option value="physical">Physical</ui-option>
                  <ui-option value="digital">Digital</ui-option>
                  <ui-option value="service">Service</ui-option>
                </ui-dropdown>
              </div>
              <div>
                <label class="block text-sm font-medium text-slate-700 mb-1">Total Stock (Calculated)</label>
                <ui-input id="create-stock-total" readonly placeholder="Sum of variants" class="w-full bg-slate-50"></ui-input>
              </div>

              <!-- 5. Category & Subcategory -->
              <div>
                <label class="block text-sm font-medium text-slate-700 mb-1">Category *</label>
                <ui-dropdown id="create-category" placeholder="Select category..." searchable class="w-full" onchange="this.closest('app-products-page').handleCategoryChange(event)">
                  <ui-option value="">Select category...</ui-option>
                  ${parentCatOptions}
                </ui-dropdown>
              </div>
              <div>
                <label class="block text-sm font-medium text-slate-700 mb-1">Subcategory</label>
                <ui-dropdown id="create-subcategory" placeholder="Select subcategory..." searchable class="w-full">
                  <ui-option value="">Select subcategory...</ui-option>
                </ui-dropdown>
              </div>

              <!-- 6. Brand & Material -->
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
            </div>

            <!-- 7. Variations -->
            <div class="pt-2 border-t border-slate-100">
              <div class="flex items-center justify-between mb-3">
                <label class="block text-sm font-medium text-slate-700">Product Variations</label>
              </div>
              <div id="variant-list" class="space-y-3"></div>
              <div class="flex justify-end mt-3">
                <button type="button" onclick="this.closest('app-products-page').addVariantRow(null, this.closest('ui-modal').querySelector('#variant-list'))" class="px-4 py-2 rounded-xl text-blue-600 hover:bg-blue-50 hover:text-blue-700 transition-all duration-200 text-xs font-bold uppercase tracking-widest flex items-center gap-2">
                  <i class="fas fa-plus text-[10px]"></i> Add variant
                </button>
              </div>
              <p class="text-[10px] text-slate-400 mt-2 italic">Add sizes, colors, or direct stock entries. Leave empty for single item.</p>
            </div>

            <!-- Images Section -->
            <div class="space-y-4 pt-2 border-t border-slate-100">
                <!-- 8. Main Image -->
                <div>
                  <label class="block text-sm font-medium text-slate-700 mb-1">Product Main Image</label>
                  <ui-file-upload id="create-uploader" accept="image/*" max-size="5242880"></ui-file-upload>
                </div>
                <!-- 9. Other Images -->
                <div>
                  <label class="block text-sm font-medium text-slate-700 mb-1">Other Images (Gallery)</label>
                  <ui-file-upload id="create-gallery" accept="image/*" multiple max-files="10" max-size="5242880"></ui-file-upload>
                </div>
            </div>

            <!-- 10. Status -->
            <div class="pt-4 border-t border-slate-100">
              <label class="block text-sm font-medium text-slate-700 mb-2">Product Status</label>
              <ui-switch id="create-active" checked>
                <span slot="label">Available for sale (Active)</span>
              </ui-switch>
            </div>
          </div>
        </form>
        <div slot="footer" class="w-full flex gap-3 justify-end items-center">
          <button modal-action="cancel" class="px-4 py-2 rounded-md text-slate-500 font-medium hover:bg-slate-50 transition text-sm">Cancel</button>
          <div class="flex items-center gap-2">
            <button id="create-draft-btn" onclick="this.closest('app-products-page').submitCreate('draft')" class="px-4 py-2 rounded-md border border-slate-300 text-slate-600 font-medium hover:bg-slate-50 transition text-sm flex items-center gap-2">
              <i class="fas fa-save text-xs"></i> Save as Draft
            </button>
            <button id="create-publish-btn" onclick="this.closest('app-products-page').submitCreate('active')" class="px-4 py-2 rounded-md bg-blue-600 text-white font-medium hover:bg-blue-700 transition text-sm flex items-center gap-2 shadow-sm">
              <i class="fas fa-paper-plane text-xs"></i> Publish Product
            </button>
          </div>
        </div>
      </ui-modal>

      <!-- ── EDIT MODAL ─────────────────────────────────── -->
      <ui-modal id="product-edit-modal" position="right" size="lg" close-on-backdrop-click="false">
        <span slot="title">Edit Product</span>
        <div class="space-y-4">
          
          <div class="space-y-4">
            <!-- 1. Product Name -->
            <div>
              <label class="block text-sm font-medium text-slate-700 mb-1">Product Name *</label>
              <ui-input id="edit-name" placeholder="e.g. Classic White T-Shirt" class="w-full"></ui-input>
            </div>

            <!-- 1a. Product Identifiers -->
            <div class="space-y-4">
              <div>
                <label class="block text-sm font-medium text-slate-700 mb-1">Product Code</label>
                <ui-input id="edit-code" placeholder="Auto-gen" class="w-full"></ui-input>
              </div>
              <div>
                <label class="block text-sm font-medium text-slate-700 mb-1">SKU</label>
                <ui-input id="edit-sku" placeholder="Auto-gen" class="w-full"></ui-input>
              </div>
            </div>

            <!-- 2. Description (WYSIWYG) -->
            <div>
              <label class="block text-sm font-medium text-slate-700 mb-1">Description</label>
              <ui-wysiwyg id="edit-description" placeholder="Product description..." height="200px" toolbar="basic"></ui-wysiwyg>
            </div>

            <!-- 3. Details (Content Area) -->
            <div>
              <label class="block text-sm font-medium text-slate-700 mb-2">More Information (Optional)</label>
              <ui-textarea id="edit-details" rows="3" placeholder="Additional details, features, etc..." class="w-full"></ui-textarea>
            </div>

            <div class="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <!-- 4. Price & Type -->
              <div>
                <label class="block text-sm font-medium text-slate-700 mb-1">Base Price (USD)</label>
                <ui-input id="edit-price" type="number" min="0" step="0.01" placeholder="0.00" class="w-full"></ui-input>
              </div>
              <div>
                <label class="block text-sm font-medium text-slate-700 mb-1">Type</label>
                <ui-dropdown id="edit-type" placeholder="Select type..." class="w-full">
                  <ui-option value="physical">Physical</ui-option>
                  <ui-option value="digital">Digital</ui-option>
                  <ui-option value="service">Service</ui-option>
                </ui-dropdown>
              </div>
              <div>
                <label class="block text-sm font-medium text-slate-700 mb-1">Total Stock (Calculated)</label>
                <ui-input id="edit-stock-total" readonly placeholder="Sum of variants" class="w-full bg-slate-50"></ui-input>
              </div>

              <!-- 5. Category & Subcategory -->
              <div>
                <label class="block text-sm font-medium text-slate-700 mb-1">Category *</label>
                <ui-dropdown id="edit-category" placeholder="Select category..." searchable class="w-full" onchange="this.closest('app-products-page').handleCategoryChange(event)">
                  <ui-option value="">Select category...</ui-option>
                  ${parentCatOptions}
                </ui-dropdown>
              </div>
              <div>
                <label class="block text-sm font-medium text-slate-700 mb-1">Subcategory</label>
                <ui-dropdown id="edit-subcategory" placeholder="Select subcategory..." searchable class="w-full">
                  <ui-option value="">Select subcategory...</ui-option>
                </ui-dropdown>
              </div>

              <!-- 6. Brand & Material -->
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
            </div>

            <!-- 7. Variations -->
            <div class="pt-2 border-t border-slate-100">
              <div class="flex items-center justify-between mb-3">
                <label class="block text-sm font-medium text-slate-700">Product Variations</label>
              </div>
              <div id="variant-list" class="space-y-3"></div>
              <div class="flex justify-end mt-3">
                <button type="button" onclick="this.closest('app-products-page').addVariantRow(null, this.closest('ui-modal').querySelector('#variant-list'))" class="px-4 py-2 rounded-xl text-blue-600 hover:bg-blue-50 hover:text-blue-700 transition-all duration-200 text-xs font-bold uppercase tracking-widest flex items-center gap-2">
                  <i class="fas fa-plus text-[10px]"></i> Add variant
                </button>
              </div>
              <p class="text-[10px] text-slate-400 mt-2 italic">Add sizes, colors, or direct stock entries. Leave empty for single item.</p>
            </div>

            <!-- Images Section -->
            <div class="space-y-4 pt-2 border-t border-slate-100">
                <!-- 8. Main Image -->
                <div>
                  <label class="block text-sm font-medium text-slate-700 mb-1">Product Main Image</label>
                  <ui-file-upload id="edit-uploader" accept="image/*" max-size="5242880"></ui-file-upload>
                </div>
                <!-- 9. Other Images -->
                <div>
                  <label class="block text-sm font-medium text-slate-700 mb-1">Other Images (Gallery)</label>
                  <ui-file-upload id="edit-gallery" accept="image/*" multiple max-files="10" max-size="5242880"></ui-file-upload>
                </div>
            </div>

            <!-- 10. Status -->
            <div class="pt-4 border-t border-slate-100">
              <label class="block text-sm font-medium text-slate-700 mb-2">Product Status</label>
              <ui-switch id="edit-active">
                <span slot="label">Available for sale (Active)</span>
              </ui-switch>
            </div>
          </div>
        </div>
        <div slot="footer" class="w-full flex gap-3 justify-end items-center">
          <button modal-action="cancel" class="px-4 py-2 rounded-md text-slate-500 font-medium hover:bg-slate-50 transition text-sm">Cancel</button>
          <div class="flex items-center gap-2">
            <button id="edit-save-btn" onclick="this.closest('app-products-page').submitEdit()" class="px-4 py-2 rounded-md border border-slate-300 text-slate-600 font-medium hover:bg-slate-50 transition text-sm">
                <i class="fas fa-save mr-1 text-xs"></i> Save Changes
            </button>
            <button id="edit-publish-btn" onclick="this.closest('app-products-page').submitEdit('active')" class="px-4 py-2 rounded-md bg-blue-600 text-white font-medium hover:bg-blue-700 transition text-sm flex items-center gap-2 shadow-sm">
              <i class="fas fa-paper-plane mr-1 text-xs"></i> ${this.selectedProduct?.status === 'active' ? 'Update Product' : 'Publish Product'}
            </button>
          </div>
        </div>
      </ui-modal>

      <!-- ── VIEW MODAL ─────────────────────────────────── -->
      <ui-modal id="product-view-modal" position="right" size="lg">
        <span slot="title">Product Overview</span>
        <div class="space-y-6">
          <!-- Banner & Primary Info -->
          <div class="relative h-64 bg-slate-900 rounded-2xl overflow-hidden group">
            <div id="view-banner" class="w-full h-full opacity-60 group-hover:opacity-100 transition duration-500 flex items-center justify-center"></div>
            <div class="absolute inset-0 bg-gradient-to-t from-slate-900 via-transparent to-transparent"></div>
            <div class="absolute bottom-6 left-6 right-6">
              <div class="flex items-start justify-between gap-4">
                <div>
                  <h2 id="view-name" class="text-3xl font-extrabold text-white tracking-tight"></h2>
                  <div class="flex items-center gap-2 mt-2">
                    <span id="view-category-badge" class="px-2.5 py-1 rounded-lg bg-white/10 backdrop-blur-md text-white/90 text-xs font-semibold border border-white/20"></span>
                    <span id="view-type-badge" class="px-2.5 py-1 rounded-lg bg-indigo-500/20 backdrop-blur-md text-indigo-300 text-xs font-semibold border border-indigo-500/30"></span>
                  </div>
                </div>
                <div id="view-status-badge"></div>
              </div>
            </div>
          </div>

          <!-- Stats Grid -->
          <div class="grid grid-cols-1 sm:grid-cols-2 gap-5">
            ${[
              { label: "Price", id: "view-price", icon: "fa-tag", color: "text-emerald-500" },
              { label: "Total Stock", id: "view-stock", icon: "fa-cubes", color: "text-blue-500" },
              { label: "Variants", id: "view-variants", icon: "fa-layer-group", color: "text-purple-500" },
              { label: "Product Type", id: "view-type-stat", icon: "fa-shapes", color: "text-indigo-500" },
            ].map(s => `
              <div class="bg-white rounded-2xl border border-slate-100 p-5 shadow-sm hover:shadow-md transition">
                <div class="flex items-center gap-3 mb-3">
                  <div class="size-10 rounded-xl bg-slate-50 flex items-center justify-center">
                    <i class="fas ${s.icon} ${s.color} text-base"></i>
                  </div>
                  <span class="text-xs font-bold text-slate-400 uppercase tracking-wider">${s.label}</span>
                </div>
                <p id="${s.id}" class="text-2xl font-black text-slate-900 tracking-tight"></p>
              </div>
            `).join("")}
          </div>

          <!-- Description -->
          <div class="bg-white rounded-2xl border border-slate-100 p-6 shadow-sm">
            <div class="flex items-center gap-3 mb-4">
              <div class="size-10 rounded-xl bg-indigo-50 flex items-center justify-center text-indigo-600">
                <i class="fas fa-align-left text-lg"></i>
              </div>
              <h3 class="font-bold text-slate-900 text-lg">Description</h3>
            </div>
            <div id="view-desc" class="text-slate-600 text-sm leading-relaxed prose prose-sm max-w-none"></div>
          </div>

          <!-- Gallery -->
          <div class="bg-white rounded-2xl border border-slate-100 p-6 shadow-sm">
            <div class="flex items-center gap-3 mb-4">
              <div class="size-10 rounded-xl bg-emerald-50 flex items-center justify-center text-emerald-600">
                <i class="fas fa-images text-lg"></i>
              </div>
              <h3 class="font-bold text-slate-900 text-lg">Gallery</h3>
            </div>
            <div id="view-gallery"></div>
          </div>

          <!-- Product Identifiers & Meta -->
          <div class="grid grid-cols-1 md:grid-cols-2 gap-5">
            <div class="bg-white rounded-2xl p-6 border border-slate-100 shadow-sm">
              <div class="flex items-center gap-3 mb-4">
                <div class="size-8 rounded-lg bg-orange-50 flex items-center justify-center text-orange-500">
                  <i class="fas fa-barcode text-sm"></i>
                </div>
                <h3 class="text-xs font-bold text-slate-400 uppercase tracking-wider">Identifiers</h3>
              </div>
              <div class="space-y-4">
                <div class="flex flex-col gap-1">
                  <span class="text-[10px] font-bold text-slate-400 uppercase">Product Code</span>
                  <span id="view-code" class="text-base font-bold text-slate-900 font-mono tracking-wider"></span>
                </div>
                <div class="flex flex-col gap-1 pt-3 border-t border-slate-50">
                  <span class="text-[10px] font-bold text-slate-400 uppercase">SKU</span>
                  <span id="view-sku" class="text-base font-bold text-slate-900 font-mono tracking-wider italic"></span>
                </div>
              </div>
            </div>
            <div class="bg-white rounded-2xl p-6 border border-slate-100 shadow-sm">
              <div class="flex items-center gap-3 mb-4">
                <div class="size-8 rounded-lg bg-teal-50 flex items-center justify-center text-teal-500">
                  <i class="fas fa-info-circle text-sm"></i>
                </div>
                <h3 class="text-xs font-bold text-slate-400 uppercase tracking-wider">Properties</h3>
              </div>
              <div class="space-y-4">
                <div class="flex flex-col gap-1">
                  <span class="text-[10px] font-bold text-slate-400 uppercase">Brand</span>
                  <span id="view-brand" class="text-base font-bold text-slate-900"></span>
                </div>
                <div class="flex flex-col gap-1 pt-3 border-t border-slate-50">
                  <span class="text-[10px] font-bold text-slate-400 uppercase">Material</span>
                  <span id="view-material" class="text-base font-bold text-slate-900"></span>
                </div>
              </div>
            </div>
          </div>

          <!-- Product Variations -->
          <div class="space-y-4">
            <div class="flex items-center gap-3">
              <div class="size-10 rounded-xl bg-purple-50 flex items-center justify-center text-purple-600">
                <i class="fas fa-layer-group text-lg"></i>
              </div>
              <div>
                <h3 class="font-bold text-slate-900 text-lg leading-tight">Product Variations</h3>
                <p class="text-xs text-slate-500 font-medium mt-0.5">Inventory and price overrides for variants</p>
              </div>
            </div>
            <div id="view-variants-list"></div>
          </div>
        </div>
        <div slot="footer" class="w-full flex gap-3 justify-end items-center">
          <button modal-action="cancel" class="px-5 py-2.5 rounded-xl border border-slate-200 text-slate-600 font-semibold hover:bg-slate-50 transition text-sm">Close</button>
          <button onclick="this.closest('ui-modal').close(); this.closest('app-products-page').openEditModal(this.closest('app-products-page').selectedProduct)" class="px-8 py-2.5 rounded-xl bg-indigo-600 text-white font-bold hover:bg-indigo-700 transition text-sm shadow-lg shadow-indigo-200 flex items-center gap-2">
            <i class="fas fa-pencil-alt text-xs"></i> Edit Product
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

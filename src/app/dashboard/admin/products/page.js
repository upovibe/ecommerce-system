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
    const img = p.main_image || p.metadata?.image || "";
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

  handleCategoryChange(e) {
    const dropdown = e.target;
    const value = e.detail?.value || dropdown?.value;
    const isEdit = dropdown.id.includes("edit");
    const subId = isEdit ? "edit-subcategory" : "create-subcategory";
    const subDropdown = this.querySelector(`#${subId}`);
    if (!subDropdown) return;

    // Filter categories that have this value as parent_id
    const filtered = (this.categories || []).filter(c => String(c.parent_id) === String(value));
    
    subDropdown.innerHTML = '<ui-option value="">Select subcategory...</ui-option>' + 
      filtered.map(c => `<ui-option value="${c.id}">${c.name}</ui-option>`).join("");
    
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
        subcat.innerHTML = '<ui-option value="">Select subcategory...</ui-option>';
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

  addVariantRow(data = null) {
    const list = this.querySelector("#variant-list");
    if (!list) return;
    
    const row = document.createElement("div");
    row.className = "p-4 bg-slate-50 rounded-xl border border-slate-100 space-y-3 variant-row";

    // Attribute Options
    const attrOptions = this.productAttributes.map(a => `<ui-option value="${a.id}">${a.name}</ui-option>`).join("");
    
    row.innerHTML = `
      <div class="grid grid-cols-1 sm:grid-cols-2 gap-3">
        <div>
          <label class="block text-xs font-bold text-slate-500 uppercase mb-1">Attribute</label>
          <ui-dropdown data-field="attribute_id" placeholder="Select attribute..." class="w-full bg-white">
            <ui-option value="">Select...</ui-option>
            ${attrOptions}
          </ui-dropdown>
        </div>
        <div>
          <label class="block text-xs font-bold text-slate-500 uppercase mb-1">Label / Value</label>
          <ui-input data-field="label" placeholder="e.g. Red, XL" class="w-full bg-white"></ui-input>
        </div>
      </div>
      <div class="grid grid-cols-1 sm:grid-cols-3 gap-3 items-end pt-2 border-t border-slate-200/50">
        <div>
          <label class="block text-xs font-bold text-slate-500 uppercase mb-1">Price Override</label>
          <ui-input data-field="price_override" type="number" step="0.01" min="0" placeholder="0.00" class="w-full bg-white"></ui-input>
        </div>
        <div>
          <label class="block text-xs font-bold text-slate-500 uppercase mb-1">Stock</label>
          <ui-input data-field="stock" type="number" step="1" min="0" placeholder="0" class="w-full bg-white"></ui-input>
        </div>
        <div class="flex justify-end">
          <button type="button" onclick="this.closest('app-products-page').removeVariantRow(this)" class="px-3 py-2 rounded-lg text-rose-600 hover:bg-rose-50 transition text-xs font-bold uppercase tracking-wider">
            <i class="fas fa-trash-alt mr-1"></i> Remove
          </button>
        </div>
      </div>
    `;
    list.appendChild(row);

    if (data) {
      row.querySelector('[data-field="attribute_id"]').value   = data.attribute_id || "";
      row.querySelector('[data-field="label"]').value          = data.label || "";
      row.querySelector('[data-field="price_override"]').value = data.price_override || "";
      row.querySelector('[data-field="stock"]').value          = data.stock || 0;
    }
  }

  removeVariantRow(button) {
    const row = button?.closest(".variant-row");
    if (row) row.remove();
  }

  collectVariants(list) {
    if (!list) return [];
    const rows = Array.from(list.querySelectorAll(".variant-row"));
    const variants = rows.map((row) => {
      const attrIdEl = row.querySelector('[data-field="attribute_id"]');
      const labelEl = row.querySelector('[data-field="label"]');
      const priceEl = row.querySelector('[data-field="price_override"]');
      const stockEl = row.querySelector('[data-field="stock"]');
      
      const attribute_id = attrIdEl?.value || "";
      const label = labelEl?.value?.trim();
      const price_override = priceEl?.value ? parseFloat(priceEl.value) : null;
      const stock = stockEl?.value ? parseInt(stockEl.value, 10) : 0;
      
      return { attribute_id, label, price_override, stock };
    });
    return variants.filter((v) => v.attribute_id || v.label || v.price_override || v.stock);
  }

  // ── EDIT ────────────────────────────────────────────
  openEditModal(product) {
    this.selectedProduct = product;
    const m = this.querySelector("#product-edit-modal");
    if (!m) return;
    
    m.querySelector("#edit-name").value        = product.name || "";
    m.querySelector("#edit-code").value        = product.product_code || "";
    m.querySelector("#edit-sku").value         = product.sku || "";
    m.querySelector("#edit-type").value        = product.type || "physical";
    m.querySelector("#edit-price").value       = product.base_price || "";
    
    // Category mapping
    const cat = this.categories.find(c => String(c.id) === String(product.category_id));
    if (cat && cat.parent_id) {
      m.querySelector("#edit-category").value = String(cat.parent_id);
      // Trigger update for subcategory
      this.handleCategoryChange({ target: m.querySelector("#edit-category"), detail: { value: cat.parent_id } });
      m.querySelector("#edit-subcategory").value = String(product.category_id);
    } else {
      m.querySelector("#edit-category").value = String(product.category_id || "");
      this.handleCategoryChange({ target: m.querySelector("#edit-category"), detail: { value: product.category_id } });
      m.querySelector("#edit-subcategory").value = "";
    }

    const vList = m.querySelector("#variant-list");
    if (vList) {
      vList.innerHTML = "";
      if (product.variants && Array.isArray(product.variants)) {
        product.variants.forEach(v => {
          const vData = typeof v.variant_values === 'string' ? JSON.parse(v.variant_values) : v.variant_values;
          const label = typeof v.variant_options === 'string' ? JSON.parse(v.variant_options)?.label : v.variant_options?.label;
          this.addVariantRow({
            attribute_id: vData?.attribute_id,
            label: label || "",
            price_override: v.price_override,
            stock: v.stock
          });
        });
      }
    }

    const editDesc = m.querySelector("#edit-description");
    if (editDesc?.setValue) {
      editDesc.setValue(product.description || "");
    }

    const editDetails = m.querySelector("#edit-details");
    if (editDetails) {
        const d = typeof product.details === 'string' ? JSON.parse(product.details) : product.details;
        editDetails.value = d?.note || "";
    }

    const uploader = m.querySelector("#edit-uploader");
    if (uploader) uploader.setValue(product.main_image || "");

    const gallery = m.querySelector("#edit-gallery");
    if (gallery && product.images) {
        const imgs = typeof product.images === 'string' ? JSON.parse(product.images) : product.images;
        gallery.setValue(imgs || []);
    }

    m.querySelector("#edit-brand").value       = product.brand_id || "";
    m.querySelector("#edit-material").value    = product.material_id || "";
    
    const sw = m.querySelector("#edit-active");
    if (sw) {
      sw.checked = !!product.is_active;
      if (sw.checked) sw.setAttribute("checked", "");
      else sw.removeAttribute("checked");
    }
    m.open();
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
    const viewBrand = product.brand_name || (product.brand_id ? this.getBrandById(product.brand_id)?.name : "—");
    const viewMaterial = product.material_name || (product.material_id ? this.getMaterialById(product.material_id)?.name : "—");
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
            <div class="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <!-- 1. Product Name -->
              <div>
                <label class="block text-sm font-medium text-slate-700 mb-1">Product Name *</label>
                <ui-input id="create-name" placeholder="e.g. Classic White T-Shirt" class="w-full"></ui-input>
              </div>
              <!-- 1a. Product Code & SKU -->
              <div class="grid grid-cols-2 gap-2">
                <div>
                  <label class="block text-sm font-medium text-slate-700 mb-1">Product Code</label>
                  <ui-input id="create-code" placeholder="Auto-gen" class="w-full"></ui-input>
                </div>
                <div>
                  <label class="block text-sm font-medium text-slate-700 mb-1">SKU</label>
                  <ui-input id="create-sku" placeholder="Auto-gen" class="w-full"></ui-input>
                </div>
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
                <button type="button" onclick="this.closest('app-products-page').addVariantRow()" class="px-3 py-1.5 rounded-lg border border-slate-200 text-slate-600 text-xs font-semibold hover:bg-slate-50 transition">
                  <i class="fas fa-plus mr-1"></i> Add Variant
                </button>
              </div>
              <div id="variant-list" class="space-y-3"></div>
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

            <!-- 10. Active Toggle -->
            <div class="pt-4 border-t border-slate-100">
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
            <div class="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <!-- 1. Product Name -->
              <div>
                <label class="block text-sm font-medium text-slate-700 mb-1">Product Name *</label>
                <ui-input id="edit-name" placeholder="e.g. Classic White T-Shirt" class="w-full"></ui-input>
              </div>
              <!-- 1a. Product Code & SKU -->
              <div class="grid grid-cols-2 gap-2">
                <div>
                  <label class="block text-sm font-medium text-slate-700 mb-1">Product Code</label>
                  <ui-input id="edit-code" placeholder="Auto-gen" class="w-full"></ui-input>
                </div>
                <div>
                  <label class="block text-sm font-medium text-slate-700 mb-1">SKU</label>
                  <ui-input id="edit-sku" placeholder="Auto-gen" class="w-full"></ui-input>
                </div>
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

            <!-- 10. Active Toggle -->
            <div class="pt-4 border-t border-slate-100">
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

import "@/components/ui/Modal.js";
import "@/components/ui/Input.js";
import "@/components/ui/Textarea.js";
import "@/components/ui/Switch.js";
import "@/components/ui/Dropdown.js";
import "@/components/ui/FileUpload.js";
import "@/components/ui/Wysiwyg.js";

class ProductUpdateModal extends HTMLElement {
  constructor() {
    super();
    this.categories = [];
    this.brands = [];
    this.materials = [];
    this.status = null;
  }

  connectedCallback() {
    this.render();
  }

  setOptions({ categories, brands, materials } = {}) {
    this.categories = Array.isArray(categories) ? categories : [];
    this.brands = Array.isArray(brands) ? brands : [];
    this.materials = Array.isArray(materials) ? materials : [];
    this.render();
  }

  setStatus(status) {
    this.status = status;
    const btn = this.querySelector("#edit-publish-btn");
    if (btn) {
      btn.innerHTML = `<i class=\"fas fa-paper-plane mr-1 text-xs\"></i> ${this.getPublishLabel()}`;
    }
  }

  getPublishLabel() {
    return this.status === "active" ? "Update Product" : "Publish Product";
  }

  render() {
    const parentCatOptions = (this.categories || [])
      .filter((c) => !c.parent_id)
      .map((c) => `<ui-option value=\"${c.id}\">${c.name}</ui-option>`)
      .join("");
    const brandOptions = (this.brands || [])
      .map((b) => `<ui-option value=\"${b.id}\">${b.name}</ui-option>`)
      .join("");
    const materialOptions = (this.materials || [])
      .map((m) => `<ui-option value=\"${m.id}\">${m.name}</ui-option>`)
      .join("");

    this.innerHTML = `
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
              <i class="fas fa-paper-plane mr-1 text-xs"></i> ${this.getPublishLabel()}
            </button>
          </div>
        </div>
      </ui-modal>
    `;
  }
}

customElements.define("product-update-modal", ProductUpdateModal);
export default ProductUpdateModal;

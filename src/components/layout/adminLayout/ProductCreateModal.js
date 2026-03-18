import "@/components/ui/Modal.js";
import "@/components/ui/Input.js";
import "@/components/ui/Textarea.js";
import "@/components/ui/Switch.js";
import "@/components/ui/Dropdown.js";
import "@/components/ui/FileUpload.js";
import "@/components/ui/Wysiwyg.js";

class ProductCreateModal extends HTMLElement {
  constructor() {
    super();
    this.categories = [];
    this.brands = [];
    this.materials = [];
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
      <ui-modal id="product-create-modal" position="right" size="lg" close-on-backdrop-click="false">
        <span slot="title">Add New Product</span>
        <form class="space-y-4">
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

              <!-- 6. Brand -->
              <div>
                <div class="p-4 rounded-2xl border border-slate-100 bg-white shadow-sm">
                  <div class="flex items-start justify-between gap-4 mb-4">
                    <div>
                      <label class="block text-sm font-medium text-slate-700">Brand</label>
                      <p class="text-[11px] text-slate-400 mt-1">Optional merchandising data for the product.</p>
                    </div>
                    <ui-switch id="create-has-brand" checked onchange="this.closest('app-products-page').toggleBrandSection('create')">
                      <span slot="label">Enable</span>
                    </ui-switch>
                  </div>
                  <div id="create-brand-field" class="transition-all duration-300" style="max-height: 1000px; opacity: 1; overflow: visible;">
                    <label class="block text-sm font-medium text-slate-700 mb-1">Brand</label>
                    <ui-dropdown id="create-brand" placeholder="Select brand..." search-placeholder="Select brand..." searchable allow-add class="w-full relative z-50">
                      ${brandOptions}
                    </ui-dropdown>
                  </div>
                </div>
              </div>

              <!-- 6b. Material -->
              <div>
                <div class="p-4 rounded-2xl border border-slate-100 bg-white shadow-sm">
                  <div class="flex items-start justify-between gap-4 mb-4">
                    <div>
                      <label class="block text-sm font-medium text-slate-700">Material</label>
                      <p class="text-[11px] text-slate-400 mt-1">Optional merchandising data for the product.</p>
                    </div>
                    <ui-switch id="create-has-material" checked onchange="this.closest('app-products-page').toggleMaterialSection('create')">
                      <span slot="label">Enable</span>
                    </ui-switch>
                  </div>
                  <div id="create-material-field" class="transition-all duration-300" style="max-height: 1000px; opacity: 1; overflow: visible;">
                    <label class="block text-sm font-medium text-slate-700 mb-1">Material</label>
                    <ui-dropdown id="create-material" placeholder="Select material..." search-placeholder="Select material..." searchable allow-add class="w-full relative z-50">
                      ${materialOptions}
                    </ui-dropdown>
                  </div>
                </div>
              </div>
            </div>

            <!-- 7a. Variations -->
            <div id="create-variant-section" class="pt-2 border-t border-slate-100">
              <div class="p-4 rounded-2xl border border-slate-100 bg-white shadow-sm">
                <div class="flex items-start justify-between gap-4 mb-4">
                  <div>
                    <label class="block text-sm font-medium text-slate-700">Product Variations</label>
                    <p class="text-[11px] text-slate-400 mt-1">Add sizes, colors, or direct stock entries.</p>
                  </div>
                  <ui-switch id="create-has-variants" checked onchange="this.closest('app-products-page').toggleVariantSection('create')">
                    <span slot="label">Enable</span>
                  </ui-switch>
                </div>
              <div id="create-variant-body" class="space-y-3 overflow-hidden transition-all duration-300" style="max-height: 1000px; opacity: 1;">
                <div class="p-3 rounded-xl bg-slate-50 border border-slate-100 flex items-center justify-between text-xs font-semibold">
                  <span class="text-slate-500">Total stock</span>
                  <span id="create-stock-total" class="text-slate-900">0</span>
                </div>
                <div id="variant-list" class="space-y-3"></div>
              </div>
                <div id="create-variant-actions" class="flex justify-end mt-3 transition-opacity duration-200">
                  <button type="button" onclick="this.closest('app-products-page').addVariantRow(null, this.closest('ui-modal').querySelector('#variant-list'))" class="px-4 py-2 rounded-xl text-blue-600 hover:bg-blue-50 hover:text-blue-700 transition-all duration-200 text-xs font-bold uppercase tracking-widest flex items-center gap-2">
                    <i class="fas fa-plus text-[10px]"></i> Add variant
                  </button>
                </div>
              </div>
            </div>

            <!-- 7b. Attributes -->
            <div id="create-attribute-section" class="pt-2 border-t border-slate-100">
              <div class="p-4 rounded-2xl border border-slate-100 bg-white shadow-sm">
                <div class="flex items-start justify-between gap-4 mb-4">
                  <div>
                    <label class="block text-sm font-medium text-slate-700">Product Attributes</label>
                    <p class="text-[11px] text-slate-400 mt-1">Use attributes for details like property size, storage, or warranty.</p>
                  </div>
                  <ui-switch id="create-has-attributes" checked onchange="this.closest('app-products-page').toggleAttributeSection('create')">
                    <span slot="label">Enable</span>
                  </ui-switch>
                </div>
                <div id="create-attribute-body" class="space-y-3 overflow-hidden transition-all duration-300" style="max-height: 1000px; opacity: 1;">
                  <div id="attribute-list" class="space-y-3"></div>
                </div>
                <div id="create-attribute-actions" class="flex justify-end mt-3 transition-opacity duration-200">
                  <button type="button" onclick="this.closest('app-products-page').addAttributeRow(null, this.closest('ui-modal').querySelector('#attribute-list'))" class="px-4 py-2 rounded-xl text-emerald-600 hover:bg-emerald-50 hover:text-emerald-700 transition-all duration-200 text-xs font-bold uppercase tracking-widest flex items-center gap-2">
                    <i class="fas fa-plus text-[10px]"></i> Add attribute
                  </button>
                </div>
              </div>
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
    `;
  }
}

customElements.define("product-create-modal", ProductCreateModal);
export default ProductCreateModal;

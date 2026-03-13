import "@/components/ui/Dialog.js";

class ProductDeleteDialog extends HTMLElement {
  constructor() {
    super();
    this.productData = null;
  }

  connectedCallback() {
    this.render();
  }

  setProductData(product) {
    this.productData = product || null;
    this.render();
  }

  open() {
    const dialog = this.querySelector("#product-delete-dialog");
    if (dialog) dialog.open();
  }

  close() {
    const dialog = this.querySelector("#product-delete-dialog");
    if (dialog) dialog.close();
  }

  getImageUrl(path) {
    if (!path) return "";
    if (path.startsWith("http://") || path.startsWith("https://") || path.startsWith("data:")) {
      return path;
    }

    const baseUrl = window.location.origin;
    if (path.startsWith("/api/")) return baseUrl + path;
    if (path.startsWith("/")) return baseUrl + path;
    if (path.startsWith("uploads/")) return `${baseUrl}/api/${path}`;
    return `${baseUrl}/api/${path.replace(/^\//, "")}`;
  }

  render() {
    const p = this.productData || {};
    const image = p.main_image ? this.getImageUrl(p.main_image) : "";

    this.innerHTML = `
      <ui-dialog id="product-delete-dialog" title="Delete Product" variant="danger" confirm-label="Delete">
        <div slot="content" class="space-y-3 text-sm text-slate-700">
          <div class="w-full h-36 bg-slate-50 border border-slate-200 rounded-xl overflow-hidden flex items-center justify-center">
            ${
              image
                ? `<img src="${image}" alt="${p.name || "Product"}" class="w-full h-full object-cover" />`
                : `<i class="fas fa-image text-slate-300 text-2xl"></i>`
            }
          </div>
          <p>Are you sure you want to delete:</p>
          <p id="delete-product-name" class="font-bold text-slate-900">${p.name || "this product"}?</p>
          <p id="delete-product-cat" class="text-xs text-slate-400">${p.category_name || "-"}</p>
          <p class="text-slate-500">This will permanently delete the product and all its variants. This cannot be undone.</p>
        </div>
        <div slot="footer" class="w-full flex gap-3">
          <button dialog-action="cancel" class="flex-1 py-2.5 rounded-xl border border-slate-200 text-slate-600 font-semibold hover:bg-slate-50 transition text-sm">Cancel</button>
          <button id="delete-confirm-btn" onclick="this.closest('app-products-page').confirmDelete()" class="flex-1 py-2.5 rounded-xl bg-red-600 text-white font-semibold hover:bg-red-700 transition text-sm">Delete</button>
        </div>
      </ui-dialog>
    `;
  }
}

customElements.define("product-delete-dialog", ProductDeleteDialog);
export default ProductDeleteDialog;

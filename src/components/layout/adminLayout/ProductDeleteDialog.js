import "@/components/ui/Modal.js";

class ProductDeleteDialog extends HTMLElement {
  connectedCallback() {
    this.render();
  }

  render() {
    this.innerHTML = `
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
    `;
  }
}

customElements.define("product-delete-dialog", ProductDeleteDialog);
export default ProductDeleteDialog;

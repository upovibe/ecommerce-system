import "@/components/ui/Modal.js";

class PromotionDeleteDialog extends HTMLElement {
  constructor() {
    super();
    this.promotion = null;
  }

  connectedCallback() {
    this.render();
  }

  setPromotion(promotion) {
    this.promotion = promotion;
    this.render();
  }

  render() {
    if (!this.promotion) return;

    this.innerHTML = `
      <ui-modal id="promotion-delete-dialog" size="sm">
        <span slot="title" class="text-rose-600">Delete Promotion</span>
        <div class="py-4">
          <p class="text-slate-600">Are you sure you want to delete <span class="font-bold text-slate-900">"${this.promotion.name}"</span>? This action cannot be undone.</p>
        </div>
        <div slot="footer" class="w-full flex gap-3 justify-end items-center">
          <button modal-action="cancel" class="px-4 py-2 rounded-md text-slate-500 font-medium hover:bg-slate-50 transition text-sm">Cancel</button>
          <button id="delete-confirm-btn" onclick="this.closest('app-promotions-page').confirmDelete()" class="px-4 py-2 rounded-md bg-rose-600 text-white font-medium hover:bg-rose-700 transition text-sm flex items-center gap-2 shadow-sm">
            <i class="fas fa-trash-alt text-xs"></i> Delete
          </button>
        </div>
      </ui-modal>
    `;
  }

  open() {
    this.querySelector("#promotion-delete-dialog")?.open();
  }

  close() {
    this.querySelector("#promotion-delete-dialog")?.close();
  }
}

customElements.define("promotion-delete-dialog", PromotionDeleteDialog);
export default PromotionDeleteDialog;

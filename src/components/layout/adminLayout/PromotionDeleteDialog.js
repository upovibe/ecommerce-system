import "@/components/ui/Dialog.js";

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

  open() {
    const dialog = this.querySelector("#promotion-delete-dialog");
    if (dialog) dialog.open();
  }

  close() {
    const dialog = this.querySelector("#promotion-delete-dialog");
    if (dialog) dialog.close();
  }

  render() {
    const p = this.promotion || {};

    this.innerHTML = `
      <ui-dialog id="promotion-delete-dialog" title="Delete Promotion" variant="danger" confirm-label="Delete">
        <div slot="content" class="space-y-4 text-sm text-slate-700">
          <div class="w-full h-32 bg-rose-50 border border-rose-100 rounded-xl flex items-center justify-center">
            <div class="size-16 bg-white rounded-2xl shadow-sm flex items-center justify-center text-rose-500">
              <i class="fas fa-bullhorn text-2xl"></i>
            </div>
          </div>
          <div class="space-y-2">
            <p>Are you sure you want to delete the promotion:</p>
            <p class="font-bold text-slate-900 text-base">"${p.name || 'this campaign'}"?</p>
            <div class="p-3 bg-slate-50 rounded-lg border border-slate-100 text-[11px] text-slate-500">
              <p><i class="fas fa-info-circle mr-1"></i> This will stop applying the ${p.discount_type === 'percentage' ? p.discount_value + '%' : '$' + p.discount_value} discount to all assigned products.</p>
            </div>
            <p class="text-rose-600 font-medium">This action cannot be undone.</p>
          </div>
        </div>
        <div slot="footer" class="w-full flex gap-3">
          <button dialog-action="cancel" class="flex-1 py-2.5 rounded-xl border border-slate-200 text-slate-600 font-semibold hover:bg-slate-50 transition text-sm">Cancel</button>
          <button id="delete-confirm-btn" onclick="this.closest('app-promotions-page').confirmDelete()" class="flex-1 py-2.5 rounded-xl bg-rose-600 text-white font-semibold hover:bg-rose-700 transition text-sm flex items-center justify-center gap-2">
            <i class="fas fa-trash-alt text-xs"></i> Delete
          </button>
        </div>
      </ui-dialog>
    `;
  }
}

customElements.define("promotion-delete-dialog", PromotionDeleteDialog);
export default PromotionDeleteDialog;

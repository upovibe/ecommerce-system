import "@/components/ui/Modal.js";
import "@/components/ui/Button.js";
import "@/components/ui/Dropdown.js";

class OrderUpdateModal extends HTMLElement {
  constructor() {
    super();
    this.order = null;
    this.allowedOrderTypes = [];
    this.allowedPaymentModes = [];
    this.statusOptions = ["pending", "processing", "completed", "cancelled", "refunded"];
  }

  connectedCallback() {
    this.render();
  }

  setOrder(order, options = {}) {
    this.order = order;
    this.allowedOrderTypes = options.orderTypes || this.allowedOrderTypes;
    this.allowedPaymentModes = options.paymentModes || this.allowedPaymentModes;
    this.render();
  }

  render() {
    if (!this.order) return;
    const orderTypes = (this.allowedOrderTypes.length ? this.allowedOrderTypes : ["delivery", "service"])
      .map((t) => `<ui-option value="${t}">${t}</ui-option>`)
      .join("");
    const paymentModes = (this.allowedPaymentModes.length ? this.allowedPaymentModes : ["whatsapp", "card", "mobile_money"])
      .map((t) => `<ui-option value="${t}">${t}</ui-option>`)
      .join("");
    const statuses = this.statusOptions
      .map((s) => `<ui-option value="${s}">${s}</ui-option>`)
      .join("");

    this.innerHTML = `
      <ui-modal id="order-update-modal" size="sm" position="center">
        <span slot="title" class="flex items-center gap-2 font-black uppercase tracking-tighter text-slate-800">
          <i class="fas fa-pen text-amber-500 font-normal"></i> Update Order
        </span>
        <div class="space-y-4">
          <div class="bg-slate-50 border border-slate-100 rounded-2xl p-4">
            <div class="text-xs font-semibold text-slate-500">Order #${this.order.id}</div>
            <div class="text-sm font-bold text-slate-800">${this.order.user_name || this.order.guest_name || "Guest"}</div>
          </div>
          <div>
            <label class="block text-xs font-semibold text-slate-500 mb-1">Status</label>
            <ui-dropdown id="order-status" value="${this.order.status || "pending"}" class="w-full">
              ${statuses}
            </ui-dropdown>
          </div>
          <div>
            <label class="block text-xs font-semibold text-slate-500 mb-1">Order Type</label>
            <ui-dropdown id="order-type" value="${this.order.order_type || "delivery"}" class="w-full">
              ${orderTypes}
            </ui-dropdown>
          </div>
          <div>
            <label class="block text-xs font-semibold text-slate-500 mb-1">Payment Mode</label>
            <ui-dropdown id="order-payment-mode" value="${this.order.payment_mode || this.order.payment_method || "whatsapp"}" class="w-full">
              ${paymentModes}
            </ui-dropdown>
          </div>
        </div>
        <div slot="footer" class="w-full flex justify-end items-center gap-3">
          <button modal-action="cancel" class="px-4 py-2 rounded-md border border-slate-200 text-slate-600 font-semibold hover:bg-slate-50 transition text-sm">Cancel</button>
          <button onclick="this.closest('app-orders-page').submitOrderUpdate()" class="px-4 py-2 rounded-md bg-slate-900 text-white font-semibold text-sm hover:bg-slate-800 transition">Save</button>
        </div>
      </ui-modal>
    `;
  }

  open() {
    this.querySelector("#order-update-modal")?.open();
  }

  close() {
    this.querySelector("#order-update-modal")?.close();
  }
}

customElements.define("order-update-modal", OrderUpdateModal);
export default OrderUpdateModal;


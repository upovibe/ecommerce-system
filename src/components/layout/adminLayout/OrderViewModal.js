import "@/components/ui/Modal.js";
import "@/components/ui/Button.js";

class OrderViewModal extends HTMLElement {
  constructor() {
    super();
    this.order = null;
  }

  connectedCallback() {
    this.render();
  }

  setOrder(order) {
    this.order = order;
    this.render();
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
    if (!this.order) return;

    const metaCustomer =
      this.order && this.order.metadata && this.order.metadata.customer
        ? this.order.metadata.customer
        : {};
    const displayName =
      this.order.user_name || this.order.guest_name || metaCustomer.name || "Guest";
    const displayEmail =
      this.order.user_email || this.order.guest_email || metaCustomer.email || "â€”";
    const displayPhone = this.order.guest_phone || metaCustomer.phone || "";
    const rawAddress = this.order.guest_address || metaCustomer.address || "";
    const displayAddress =
      rawAddress && typeof rawAddress === "object"
        ? [rawAddress.line1, rawAddress.line2, rawAddress.city, rawAddress.state, rawAddress.country, rawAddress.postal]
            .filter(Boolean)
            .join(", ")
        : rawAddress;
    const whatsappUrl =
      this.order && this.order.metadata && this.order.metadata.admin_whatsapp
        ? this.order.metadata.admin_whatsapp.url
        : "";
    const pickupContact =
      this.order && this.order.metadata && this.order.metadata.pickup_contact
        ? this.order.metadata.pickup_contact
        : null;

    const items = this.order.items || [];
    const itemsHtml = items.map((item) => {
      const image = item.main_image ? this.getImageUrl(item.main_image) : "";
      const variant = item.variant_type && item.variant_value
        ? `${item.variant_type}: ${item.variant_value}`
        : "Default";
      return `
        <div class="flex items-center justify-between gap-3 bg-white p-3 rounded-xl border border-slate-100">
          <div class="flex items-center gap-3 min-w-0">
            <div class="size-10 rounded-lg bg-slate-50 border border-slate-100 overflow-hidden flex items-center justify-center flex-shrink-0">
              ${image ? `<img src="${image}" class="w-full h-full object-cover">` : `<i class="fas fa-image text-slate-300 text-xs"></i>`}
            </div>
            <div class="min-w-0">
              <div class="text-[12px] font-semibold text-slate-800 truncate">${item.product_name || "Product"}</div>
              <div class="text-[10px] text-slate-400">${variant}</div>
            </div>
          </div>
          <div class="text-right">
            <div class="text-[11px] font-bold text-slate-700">${item.quantity} × ${Number(item.price_at_purchase || 0).toFixed(2)}</div>
            <div class="text-[10px] text-slate-400">Line ${Number(item.line_total || 0).toFixed(2)}</div>
          </div>
        </div>
      `;
    }).join("");

    this.innerHTML = `
      <ui-modal id="order-view-modal" size="lg" position="right">
        <span slot="title" class="flex items-center gap-2 font-black uppercase tracking-tighter text-slate-800">
          <i class="fas fa-receipt text-indigo-500 font-normal"></i> Order Details
        </span>
        <div class="space-y-6">
          <div class="bg-slate-50 rounded-2xl border border-slate-100 p-5">
            <div class="flex items-center justify-between">
              <div>
                <div class="text-xs font-semibold text-slate-400 uppercase tracking-widest">Order</div>
                <div class="text-lg font-black text-slate-900">#${this.order.id}</div>
              </div>
              <span class="inline-flex items-center px-3 py-1 rounded-full text-[10px] font-bold uppercase tracking-widest ${
                this.order.status === "completed"
                  ? "bg-emerald-100 text-emerald-700"
                  : this.order.status === "cancelled"
                    ? "bg-rose-100 text-rose-700"
                    : "bg-amber-100 text-amber-700"
              }">${this.order.status || "pending"}</span>
            </div>
            <div class="grid grid-cols-2 gap-4 mt-4 text-[11px]">
              <div>
                <div class="text-slate-400 font-semibold uppercase tracking-widest">Customer</div>
                <div class="text-slate-700 font-semibold">${displayName}</div>
                <div class="text-slate-400">${displayEmail}</div>
                ${displayPhone || displayAddress ? `<div class="text-slate-400 mt-1">${displayPhone}${displayPhone && displayAddress ? " • " : ""}${displayAddress}</div>` : ""}
              </div>
              <div>
                <div class="text-slate-400 font-semibold uppercase tracking-widest">Placed</div>
                <div class="text-slate-700 font-semibold">${new Date(this.order.created_at).toLocaleString()}</div>
              </div>
            </div>
            ${
              pickupContact && (pickupContact.name || pickupContact.phone)
                ? `<div class="mt-3 text-[11px]">
                    <div class="text-slate-400 font-semibold uppercase tracking-widest">Pickup Person</div>
                    <div class="text-slate-700 font-semibold">${pickupContact.name || "—"}</div>
                    <div class="text-slate-400">${pickupContact.phone || "—"}</div>
                  </div>`
                : ""
            }
          </div>

          <div class="grid grid-cols-3 gap-3">
            <div class="p-4 rounded-2xl bg-white border border-slate-100">
              <div class="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-1">Order Type</div>
              <div class="text-sm font-semibold text-slate-800 capitalize">${this.order.order_type || "delivery"}</div>
            </div>
            <div class="p-4 rounded-2xl bg-white border border-slate-100">
              <div class="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-1">Payment Mode</div>
              <div class="text-sm font-semibold text-slate-800">${this.order.payment_mode || this.order.payment_method || "—"}</div>
            </div>
            <div class="p-4 rounded-2xl bg-white border border-slate-100">
              <div class="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-1">Total</div>
              <div class="text-sm font-semibold text-slate-900">${Number(this.order.total_amount || this.order.items_total || 0).toFixed(2)}</div>
            </div>
          </div>
          ${
            whatsappUrl
              ? `<a href="${whatsappUrl}" target="_blank" rel="noopener" class="inline-flex items-center gap-2 px-4 py-2 rounded-xl bg-emerald-50 text-emerald-700 border border-emerald-100 text-xs font-semibold">
                  <i class="fab fa-whatsapp"></i> Message on WhatsApp
                </a>`
              : ""
          }

          <div class="p-4 bg-slate-50 border border-slate-100 rounded-2xl">
            <div class="flex items-center justify-between mb-3 border-b border-slate-200 pb-2">
              <div class="text-[10px] font-black text-slate-400 uppercase tracking-widest">Items</div>
              <div class="text-[10px] font-bold bg-white px-2 py-0.5 rounded-lg border border-slate-200 text-slate-600">
                ${items.length} Items
              </div>
            </div>
            <div class="max-h-[240px] overflow-y-auto space-y-2 pr-2 custom-scrollbar">
              ${itemsHtml || '<p class="text-center py-6 text-slate-400 text-[11px] italic">No items found.</p>'}
            </div>
          </div>
        </div>
        <div slot="footer" class="w-full flex justify-end items-center">
          <button modal-action="cancel" class="px-5 py-2 rounded-md bg-slate-900 text-white font-bold uppercase tracking-widest text-[10px] hover:bg-slate-800 transition shadow-lg">Close</button>
        </div>
      </ui-modal>
    `;
  }

  open() {
    this.querySelector("#order-view-modal")?.open();
  }

  close() {
    this.querySelector("#order-view-modal")?.close();
  }
}

customElements.define("order-view-modal", OrderViewModal);
export default OrderViewModal;







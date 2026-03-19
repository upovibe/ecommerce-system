import App from "@/core/App.js";
import "@/components/ui/Toast.js";
import api from "@/services/api.js";

class PublicOrderSummaryPage extends App {
  constructor() {
    super();
    this.loading = true;
    this.items = [];
    this.total = 0;
    this.currencyCode = "USD";
    this.allowedPaymentModes = [];
    this.paymentMode = "";
    this.whatsappNumber = "";
    this.submitting = false;
    this.orderRef = "";
    this.confirmOpen = false;
    this.draft = null;
    this.customer = { name: "", email: "", phone: "", note: "" };
    this.deliveryAddress = { line1: "", line2: "", city: "", state: "", country: "", postal: "" };
    this.pickupContact = { name: "", phone: "", note: "" };
    this.orderType = "";
    this.pickupMode = "self";
    this.selectedAddressId = "";
    this.selectedPickupId = "";
    this._lastRendered = "";
  }

  async connectedCallback() {
    this.loadDraft();
    if (!this.draft) return;
    await this.loadSettings();
    await this.loadCart();
  }

  loadDraft() {
    try {
      const raw = localStorage.getItem("order_draft");
      if (!raw) {
        window.location.href = "/public/order";
        return;
      }
      const draft = JSON.parse(raw);
      this.draft = draft;
      this.orderType = draft.orderType || "";
      this.customer = { ...this.customer, ...(draft.customer || {}) };
      this.deliveryAddress = { ...this.deliveryAddress, ...(draft.deliveryAddress || {}) };
      this.pickupContact = { ...this.pickupContact, ...(draft.pickupContact || {}) };
      this.pickupMode = draft.pickupMode || "self";
      this.selectedAddressId = draft.selectedAddressId || "";
      this.selectedPickupId = draft.selectedPickupId || "";
    } catch (_) {
      window.location.href = "/public/order";
    }
  }

  parseSettingList(value) {
    if (!value) return [];
    try {
      const parsed = JSON.parse(value);
      return Array.isArray(parsed) ? parsed : [];
    } catch (_) {
      return String(value)
        .split(",")
        .map((v) => v.trim())
        .filter(Boolean);
    }
  }

  fmt(amount) {
    try {
      return new Intl.NumberFormat("en-US", {
        style: "currency",
        currency: this.currencyCode || "USD",
      }).format(Number(amount || 0));
    } catch (_) {
      return `${this.currencyCode} ${Number(amount || 0).toFixed(2)}`;
    }
  }

  getImageUrl(path) {
    if (!path) return "";
    if (path.startsWith("http://") || path.startsWith("https://") || path.startsWith("data:")) return path;
    const baseUrl = window.location.origin;
    const clean = path.startsWith("/") ? path.slice(1) : path;
    return `${baseUrl}/api/${clean}`;
  }

  async loadSettings() {
    try {
      const [currencyRes, modesRes, whatsappRes] = await Promise.all([
        api.get("/settings/key/currency").catch(() => null),
        api.get("/settings/key/allowed_payment_modes").catch(() => null),
        api.get("/settings/key/admin_whatsapp").catch(() => null),
      ]);
      const currencyVal = currencyRes?.data?.data?.setting_value;
      if (currencyVal) this.currencyCode = String(currencyVal).toUpperCase();
      this.allowedPaymentModes = this.parseSettingList(modesRes?.data?.data?.setting_value);
      if (whatsappRes?.data?.success) {
        this.whatsappNumber = String(whatsappRes.data.data.setting_value || "").trim();
      }
      if (!this.paymentMode) this.paymentMode = this.allowedPaymentModes[0] || "whatsapp";
    } catch (_) {
      this.allowedPaymentModes = [];
    }
  }

  async loadCart() {
    try {
      const token = localStorage.getItem("token");
      if (token) {
        const res = await api.get("/cart").catch(() => null);
        if (res?.data?.success) {
          this.items = res.data.data?.items || [];
          this.total = res.data.data?.total_amount || 0;
        } else {
          this.items = [];
          this.total = 0;
        }
      } else {
        this.loadGuestCart();
      }
    } catch (_) {
      this.items = [];
      this.total = 0;
    } finally {
      this.loading = false;
      this.updateView();
    }
  }

  loadGuestCart() {
    try {
      const raw = localStorage.getItem("guest_cart");
      const items = raw ? JSON.parse(raw) : [];
      this.items = Array.isArray(items) ? items : [];
      this.total = this.items.reduce(
        (sum, item) => sum + Number(item.unit_price || 0) * Number(item.quantity || 0),
        0,
      );
    } catch (_) {
      this.items = [];
      this.total = 0;
    }
  }

  isCustomerLoggedIn() {
    const token = localStorage.getItem("token");
    if (!token) return false;
    try {
      const user = JSON.parse(localStorage.getItem("user") || "{}");
      return user && user.user_type === "customer";
    } catch (_) {
      return false;
    }
  }

  buildOrderRef() {
    const seed = Math.floor(Math.random() * 900000) + 100000;
    return `REF-${seed}`;
  }

  formatWhatsAppMessage({ items, customer, pickup, total, ref }) {
    const lines = [];
    lines.push("Hi, I'd like to buy these items:");
    lines.push("");
    items.forEach((item) => {
      const name = item.product_name || item.name || "Item";
      const variant = item.variant_label ? ` (${item.variant_label})` : "";
      const qty = item.quantity || 1;
      const price = this.fmt(Number(item.unit_price || 0) * Number(qty || 0));
      lines.push(`📦 ${name}${variant} - ${qty}x - ${price}`);
    });
    lines.push("");
    lines.push(`🙍🏽‍♂️ Customer: ${customer.name || "N/A"}`);
    if (this.orderType === "pickup") {
      lines.push("");
      lines.push("*PICKUP INFO:*");
      lines.push(`Name: ${customer.name || "N/A"}`);
      if (customer.phone) lines.push(`Phone: ${customer.phone}`);
      if (pickup?.name || pickup?.phone) {
        lines.push(`Pickup Person: ${pickup.name || customer.name} (${pickup.phone || customer.phone || ""})`);
      }
    } else {
      lines.push("");
      lines.push("*DELIVERY INFO:*");
      lines.push(`Name: ${customer.name || "N/A"}`);
      if (customer.phone) lines.push(`Phone: ${customer.phone}`);
      if (customer.address) lines.push(`Address: ${customer.address}`);
    }
    lines.push("");
    lines.push(`💰 Total Price: *${total}*`);
    lines.push("");
    lines.push(`🗒 Order Ref: *${ref}*`);
    return lines.join("\n");
  }

  openWhatsApp(message) {
    if (!this.whatsappNumber) return;
    const number = String(this.whatsappNumber).replace(/\s+/g, "");
    if (!number) return;
    const url = `https://api.whatsapp.com/send?phone=${encodeURIComponent(number)}&text=${encodeURIComponent(
      message,
    )}`;
    window.open(url, "_blank");
  }

  async placeOrder() {
    if (this.submitting) return;
    if (!this.items.length) {
      window.Toast?.show?.({
        title: "Cart empty",
        message: "Please add items to your cart before placing an order.",
        variant: "warning",
      });
      return;
    }

    const { name, email, phone, note } = this.customer;
    const addr = [
      this.deliveryAddress.line1,
      this.deliveryAddress.line2,
      this.deliveryAddress.city,
      this.deliveryAddress.state,
      this.deliveryAddress.country,
      this.deliveryAddress.postal,
    ]
      .filter(Boolean)
      .join(", ");
    const requiresAddress = this.orderType === "delivery";
    if (!name || !email || !phone || (requiresAddress && !addr)) {
      window.Toast?.show?.({
        title: "Missing details",
        message: "Please go back and complete your order details.",
        variant: "warning",
      });
      return;
    }

    this.submitting = true;
    this.updateView();
    try {
      const ref = this.buildOrderRef();
      this.orderRef = ref;
      const payloadCustomer = {
        name,
        email,
        phone,
        address: requiresAddress ? addr : "",
        note: note || "",
      };
      const pickupPayload =
        this.orderType === "pickup"
          ? {
              mode: this.pickupMode,
              name: this.pickupContact.name,
              phone: this.pickupContact.phone,
              note: this.pickupContact.note || "",
            }
          : null;

      if (this.isCustomerLoggedIn()) {
        await api.post("/orders", {
          order_type: this.orderType || "delivery",
          payment_mode: this.paymentMode || this.allowedPaymentModes[0] || "whatsapp",
          metadata: {
            customer: payloadCustomer,
            pickup_contact: pickupPayload,
            source: "customer",
            reference: ref,
          },
        });
      } else {
        await api.post("/orders/guest", {
          customer: {
            ...payloadCustomer,
            pickup_contact: pickupPayload,
          },
          items: this.items.map((item) => ({
            product_id: item.product_id,
            quantity: item.quantity || 1,
            variant_id: item.variant_id || null,
          })),
          order_type: this.orderType || "delivery",
          payment_mode: this.paymentMode || this.allowedPaymentModes[0] || "whatsapp",
        });
      }

      const message = this.formatWhatsAppMessage({
        items: this.items,
        customer: { ...payloadCustomer, address: addr },
        pickup: pickupPayload,
        total: this.fmt(this.total),
        ref,
      });
      this.openWhatsApp(message);
      this.confirmOpen = true;

      localStorage.removeItem("guest_cart");
      localStorage.setItem("cart_count", "0");
      localStorage.removeItem("order_draft");
      this.items = [];
      this.total = 0;
    } catch (e) {
      window.Toast?.show?.({
        title: "Checkout failed",
        message: e.response?.data?.message || "Unable to place order.",
        variant: "error",
      });
    } finally {
      this.submitting = false;
      this.updateView();
    }
  }

  attachEvents() {
    const place = this.querySelector("[data-place-order]");
    if (place) place.addEventListener("click", () => this.placeOrder());
  }

  updateView() {
    const next = this.render();
    if (next === this._lastRendered) return;
    this._lastRendered = next;
    this.innerHTML = next;
    this.attachEvents();
  }

  render() {
    if (this.loading) {
      return `
        <section class="max-w-6xl mx-auto px-6 py-12">
          <div class="space-y-4">
            ${Array(4).fill('<div class="h-16 bg-slate-100 rounded-2xl animate-pulse"></div>').join("")}
          </div>
        </section>
      `;
    }

    const paymentModes = this.allowedPaymentModes.length
      ? this.allowedPaymentModes
      : ["whatsapp", "card", "mobile_money"];
    const isDelivery = this.orderType === "delivery";
    const isPickup = this.orderType === "pickup";
    const addressSummary = [
      this.deliveryAddress.line1,
      this.deliveryAddress.line2,
      this.deliveryAddress.city,
      this.deliveryAddress.state,
      this.deliveryAddress.country,
      this.deliveryAddress.postal,
    ]
      .filter(Boolean)
      .join(", ");

    return `
      <section class="max-w-6xl mx-auto px-6 py-10">
        <div class="flex items-center justify-between mb-8">
          <div>
            <p class="text-xs font-semibold text-slate-500 mb-2">Order summary</p>
            <h1 class="text-3xl font-black text-slate-900">Review and checkout</h1>
          </div>
          <a href="/public/order" class="text-sm font-semibold text-slate-500 hover:text-slate-900">Back to order</a>
        </div>

        <div class="grid lg:grid-cols-[1.2fr_0.8fr] gap-8">
          <div class="space-y-6">
            <div class="bg-white border border-slate-100 rounded-3xl p-6 space-y-4">
              <h2 class="text-lg font-black text-slate-900">Order details</h2>
              <div class="grid sm:grid-cols-2 gap-4 text-sm text-slate-600">
                <div>
                  <div class="text-xs font-semibold text-slate-500">Order type</div>
                  <div class="font-semibold text-slate-900 capitalize">${this.orderType || "—"}</div>
                </div>
                <div>
                  <div class="text-xs font-semibold text-slate-500">Customer</div>
                  <div class="font-semibold text-slate-900">${this.customer.name || "—"}</div>
                </div>
                <div>
                  <div class="text-xs font-semibold text-slate-500">Email</div>
                  <div class="font-semibold text-slate-900">${this.customer.email || "—"}</div>
                </div>
                <div>
                  <div class="text-xs font-semibold text-slate-500">Phone</div>
                  <div class="font-semibold text-slate-900">${this.customer.phone || "—"}</div>
                </div>
              </div>
              ${
                isDelivery
                  ? `<div class="text-sm text-slate-600">
                      <div class="text-xs font-semibold text-slate-500">Delivery address</div>
                      <div class="font-semibold text-slate-900">${addressSummary || "—"}</div>
                    </div>`
                  : ""
              }
              ${
                isPickup
                  ? `<div class="text-sm text-slate-600">
                      <div class="text-xs font-semibold text-slate-500">Pickup person</div>
                      <div class="font-semibold text-slate-900">${this.pickupContact.name || this.customer.name || "—"} ${this.pickupContact.phone ? `(${this.pickupContact.phone})` : ""}</div>
                    </div>`
                  : ""
              }
              ${this.customer.note ? `<div class="text-sm text-slate-600"><span class="text-xs font-semibold text-slate-500">Note</span><div class="font-semibold text-slate-900">${this.customer.note}</div></div>` : ""}
            </div>
          </div>

          <div class="bg-white border border-slate-100 rounded-3xl p-6 h-fit lg:sticky lg:top-28">
            <h3 class="text-lg font-black text-slate-900 mb-4">Order summary</h3>
            <div class="space-y-4">
              ${this.items
                .map((item) => {
                  const image = this.getImageUrl(item.main_image);
                  return `
                    <div class="flex items-center gap-4">
                      <div class="size-14 rounded-xl overflow-hidden bg-slate-50 border border-slate-100 flex items-center justify-center">
                        ${image ? `<img src="${image}" class="w-full h-full object-cover">` : `<i class="fas fa-image text-slate-300"></i>`}
                      </div>
                      <div class="flex-1 min-w-0">
                        <p class="text-sm font-semibold text-slate-900 truncate">${item.product_name || item.name || "Product"}</p>
                        <p class="text-xs text-slate-500">Qty ${item.quantity || 1}</p>
                      </div>
                      <p class="text-sm font-semibold text-slate-900">${this.fmt(Number(item.unit_price || 0) * Number(item.quantity || 0))}</p>
                    </div>
                  `;
                })
                .join("")}
            </div>
            <div class="mt-6 border-t border-slate-100 pt-4">
              <div class="flex items-center justify-between text-sm text-slate-600">
                <span>Total</span>
                <span class="font-semibold text-slate-900">${this.fmt(this.total)}</span>
              </div>
            </div>
            <div class="mt-6">
              <div class="flex items-center justify-between mb-3">
                <h4 class="text-sm font-bold text-slate-900">Choose Checkout Method</h4>
              </div>
              <div class="space-y-3">
                ${paymentModes
                  .map((mode) => {
                    const active = this.paymentMode === mode;
                    const label =
                      mode === "whatsapp"
                        ? "Checkout via WhatsApp"
                        : mode === "card"
                          ? "Pay with Card"
                          : "Mobile Money";
                    const subText =
                      mode === "whatsapp"
                        ? "More options coming soon"
                        : "Coming Soon";
                    return `
                      <button type="button" class="w-full text-left border ${active ? "border-slate-900 ring-2 ring-slate-900/10" : "border-slate-100"} rounded-2xl px-4 py-3 flex items-start gap-3 hover:border-slate-300 transition" onclick="this.closest('app-public-order-summary-page').paymentMode='${mode}'; this.closest('app-public-order-summary-page').updateView();">
                        <div class="w-4 h-4 rounded-full border ${active ? "border-slate-900" : "border-slate-300"} flex items-center justify-center mt-1">
                          ${active ? `<span class="w-2 h-2 bg-slate-900 rounded-full"></span>` : ""}
                        </div>
                        <div>
                          <div class="text-sm font-semibold text-slate-900">${label}</div>
                          <div class="text-xs text-slate-500">${subText}</div>
                        </div>
                      </button>
                    `;
                  })
                  .join("")}
              </div>
            </div>
            <button data-place-order class="w-full mt-6 px-4 py-3 rounded-2xl bg-slate-900 text-white text-sm font-semibold hover:bg-slate-800 transition ${this.submitting ? "opacity-60 cursor-not-allowed" : ""}" ${this.submitting ? "disabled" : ""}>
              ${this.submitting ? "Placing order..." : "Place order"}
            </button>
          </div>
        </div>

        ${
          this.confirmOpen
            ? `<div class="fixed inset-0 bg-slate-900/50 flex items-center justify-center z-[9999]">
              <div class="bg-white rounded-3xl shadow-xl w-full max-w-md p-6">
                <h3 class="text-xl font-black text-slate-900 mb-2">Order Confirmed!</h3>
                <p class="text-sm text-slate-600 mb-4">Successfully sent to WhatsApp</p>
                <div class="bg-slate-50 border border-slate-100 rounded-2xl p-4 text-sm text-slate-600 mb-4">
                  We've sent your order details to WhatsApp. Please check your messages to complete payment.
                </div>
                <div class="text-sm font-semibold text-slate-700 mb-2">Your Order Reference:</div>
                <div class="text-lg font-black text-slate-900 mb-6">${this.orderRef}</div>
                <div class="text-sm font-semibold text-slate-700 mb-2">What's next?</div>
                <ul class="text-sm text-slate-600 space-y-1 mb-6">
                  <li>Check your WhatsApp messages</li>
                  <li>Confirm your order details</li>
                  <li>Complete payment as instructed</li>
                </ul>
                <button class="w-full px-4 py-3 rounded-2xl bg-slate-900 text-white text-sm font-semibold hover:bg-slate-800 transition" onclick="this.closest('app-public-order-summary-page').confirmOpen=false; this.closest('app-public-order-summary-page').updateView();">Close</button>
              </div>
            </div>`
            : ""
        }
      </section>
    `;
  }
}

customElements.define("app-public-order-summary-page", PublicOrderSummaryPage);
export default PublicOrderSummaryPage;

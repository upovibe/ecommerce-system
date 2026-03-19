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
    this.confirmTitle = "Order Confirmed!";
    this.confirmSubtitle = "Successfully sent to WhatsApp";
    this.confirmBody = "We've sent your order details to WhatsApp. Please check your messages to complete payment.";
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
    await this.handlePaystackVerify();
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
      if (Array.isArray(draft.items) && draft.items.length) {
        this.items = draft.items;
        this.total = Number(draft.total || 0) || this.total;
      }
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

  async handlePaystackVerify() {
    const params = new URLSearchParams(window.location.search);
    const reference = params.get("reference") || params.get("trxref");
    if (!reference) return;

    try {
      const res = await api.get(`/payments/verify?reference=${encodeURIComponent(reference)}`).catch(() => null);
      if (res?.data?.success) {
        this.confirmTitle = "Payment Successful!";
        this.confirmSubtitle = "Your payment has been confirmed";
        this.confirmBody = "We have received your payment and your order is now being processed.";
        this.confirmOpen = true;
        localStorage.removeItem("guest_cart");
        localStorage.setItem("cart_count", "0");
        localStorage.removeItem("order_draft");
        this.items = [];
        this.total = 0;
        this.updateView();
      } else {
        window.Toast?.show?.({
          title: "Payment verification failed",
          message: res?.data?.message || "Unable to verify payment.",
          variant: "error",
        });
      }
    } catch (_) {
      window.Toast?.show?.({
        title: "Payment verification failed",
        message: "Unable to verify payment.",
        variant: "error",
      });
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
      if (!this.items.length && Array.isArray(this.draft?.items) && this.draft.items.length) {
        this.items = this.draft.items;
        this.total = Number(this.draft.total || 0) || this.total;
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
    if (!this.isCustomerLoggedIn() && this.paymentMode !== "whatsapp") {
      window.Toast?.show?.({
        title: "Sign in required",
        message: "Please sign in to use card or mobile money payments.",
        variant: "warning",
      });
      window.location.href = "/auth/customer-login";
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

      let orderId = null;
      if (this.isCustomerLoggedIn()) {
        const res = await api.post("/orders", {
          order_type: this.orderType || "delivery",
          payment_mode: this.paymentMode || this.allowedPaymentModes[0] || "whatsapp",
          metadata: {
            customer: payloadCustomer,
            pickup_contact: pickupPayload,
            source: "customer",
            reference: ref,
          },
        });
        orderId = res?.data?.order_id || null;
      } else {
        const res = await api.post("/orders/guest", {
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
        orderId = res?.data?.order_id || null;
      }

      if (this.paymentMode === "whatsapp") {
        const message = this.formatWhatsAppMessage({
          items: this.items,
          customer: { ...payloadCustomer, address: addr },
          pickup: pickupPayload,
          total: this.fmt(this.total),
          ref,
        });
        this.openWhatsApp(message);
        this.confirmTitle = "Order Confirmed!";
        this.confirmSubtitle = "Successfully sent to WhatsApp";
        this.confirmBody = "We've sent your order details to WhatsApp. Please check your messages to complete payment.";
        this.confirmOpen = true;
      } else {
        const init = await api.post("/payments/initialize", {
          order_id: orderId,
          email: payloadCustomer.email,
          payment_mode: this.paymentMode,
          reference: ref,
        });
        const url = init?.data?.data?.authorization_url;
        if (url) {
          window.location.href = url;
          return;
        }
        window.Toast?.show?.({
          title: "Payment failed",
          message: "Unable to initialize payment.",
          variant: "error",
        });
      }

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

    const isLoggedIn = this.isCustomerLoggedIn();
    const paymentModes = (this.allowedPaymentModes.length
      ? this.allowedPaymentModes
      : ["whatsapp", "card", "mobile_money"]).filter((mode) =>
      isLoggedIn ? true : mode === "whatsapp",
    );
    if (!paymentModes.includes(this.paymentMode)) {
      this.paymentMode = paymentModes[0] || "whatsapp";
    }
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
                        ? "Chat and confirm your order"
                        : "Secure Paystack checkout";
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
            ? `<div class="fixed inset-0 z-[9999] overflow-y-auto">
                <div class="fixed inset-0 bg-slate-900/75 backdrop-blur-sm" onclick="this.closest('app-public-order-summary-page').confirmOpen=false; this.closest('app-public-order-summary-page').updateView();"></div>
                <div class="flex items-center justify-center min-h-screen px-4 py-10">
                  <div class="relative bg-white rounded-2xl shadow-2xl w-full max-w-lg overflow-hidden">
                    <div class="px-8 py-6 bg-gradient-to-r from-emerald-50 to-sky-50 border-b border-slate-100">
                      <div class="flex items-center justify-between">
                        <div class="flex items-center gap-3">
                          <div class="p-2 rounded-full bg-emerald-100">
                            <i class="fas fa-check-circle text-emerald-600 text-2xl"></i>
                          </div>
                          <div>
                            <h3 class="text-2xl font-black text-slate-900">${this.confirmTitle}</h3>
                            <p class="text-sm text-emerald-600 mt-1">${this.confirmSubtitle}</p>
                          </div>
                        </div>
                        <button type="button" class="text-slate-400 hover:text-slate-600" onclick="this.closest('app-public-order-summary-page').confirmOpen=false; this.closest('app-public-order-summary-page').updateView();">
                          <i class="fas fa-times"></i>
                        </button>
                      </div>
                    </div>

                    <div class="px-8 py-6 space-y-6">
                      <div class="text-center">
                        <div class="mx-auto flex items-center justify-center h-24 w-24 rounded-full bg-emerald-100 mb-4">
                          <i class="fas fa-check text-emerald-600 text-3xl"></i>
                        </div>
                        <p class="text-lg text-slate-700">
                          ${this.confirmBody}
                        </p>
                      </div>

                      <div class="p-5 bg-gradient-to-r from-sky-50 to-emerald-50 rounded-xl border border-sky-100">
                        <div class="flex items-center gap-3">
                          <i class="fas fa-hashtag text-sky-500"></i>
                          <div>
                            <p class="text-sm font-medium text-slate-600">Your Order Reference:</p>
                            <p class="text-xl font-black text-slate-900 tracking-wide">${this.orderRef}</p>
                          </div>
                        </div>
                      </div>

                      <div class="bg-sky-50/60 p-4 rounded-lg border border-sky-100">
                        <div class="flex gap-3">
                          <i class="fas fa-info-circle text-sky-500 mt-0.5"></i>
                          <div>
                            <h4 class="text-sm font-semibold text-sky-800">What's next?</h4>
                            <div class="mt-2 text-sm text-sky-700 space-y-1">
                              <div>Check your WhatsApp messages</div>
                              <div>Confirm your order details</div>
                              <div>Complete payment as instructed</div>
                            </div>
                          </div>
                        </div>
                      </div>
                    </div>

                    <div class="px-8 py-4 bg-slate-50 border-t border-slate-100 flex justify-end">
                        <button class="inline-flex items-center px-5 py-2.5 border border-slate-200 shadow-sm text-sm font-semibold rounded-lg text-slate-700 bg-white hover:bg-slate-50 transition" onclick="this.closest('app-public-order-summary-page').confirmOpen=false; this.closest('app-public-order-summary-page').updateView(); window.location.href='/public/products';">
                          Close
                        </button>
                    </div>
                  </div>
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

import App from "@/core/App.js";
import "@/components/ui/Dropdown.js";
import "@/components/ui/Input.js";
import "@/components/ui/Textarea.js";
import "@/components/ui/Toast.js";
import api from "@/services/api.js";

class PublicOrderPage extends App {
  constructor() {
    super();
    this.loading = true;
    this.items = [];
    this.total = 0;
    this.currencyCode = "USD";
    this.allowedOrderTypes = [];
    this.allowedPaymentModes = [];
    this.userLoginEnabled = true;
    this.settingsLoaded = false;
    this.submitting = false;
    this.customer = {
      name: "",
      email: "",
      phone: "",
      address: "",
      note: "",
    };
    this.orderType = "";
    this.paymentMode = "";
    this._lastRendered = "";
  }

  updateView() {
    const next = this.render();
    if (next === this._lastRendered) return;
    this._lastRendered = next;
    this.innerHTML = next;
    this.attachEvents();
  }

  async connectedCallback() {
    super.connectedCallback();
    await this.loadSettings();
    this.hydrateCustomerFromUser();
    await this.loadCart();
  }

  hydrateCustomerFromUser() {
    try {
      const user = JSON.parse(localStorage.getItem("userData") || "null");
      if (!user) return;
      if (!this.customer.name) this.customer.name = user.name || "";
      if (!this.customer.email) this.customer.email = user.email || "";
      if (!this.customer.phone) this.customer.phone = user.phone || user.phone_number || "";
      if (!this.customer.address) this.customer.address = user.address || "";
    } catch (_) {
      // ignore
    }
  }

  async loadSettings() {
    try {
      const [currencyRes, typesRes, modesRes, loginRes] = await Promise.all([
        api.get("/settings/key/currency").catch(() => null),
        api.get("/settings/key/allowed_order_types").catch(() => null),
        api.get("/settings/key/allowed_payment_modes").catch(() => null),
        api.get("/settings/key/enable_user_login").catch(() => null),
      ]);
      const currencyVal = currencyRes?.data?.data?.setting_value;
      if (currencyVal) this.currencyCode = String(currencyVal).toUpperCase();
      this.allowedOrderTypes = this.parseSettingList(
        typesRes?.data?.data?.setting_value,
      );
      this.allowedPaymentModes = this.parseSettingList(
        modesRes?.data?.data?.setting_value,
      );
      const raw = String(loginRes?.data?.data?.setting_value ?? "1").toLowerCase();
      this.userLoginEnabled = !(raw === "0" || raw === "false" || raw === "no");
      this.settingsLoaded = true;
      this.syncOrderType();
      if (!this.paymentMode) this.paymentMode = this.allowedPaymentModes[0] || "pay_on_delivery";
      this.updateView();
    } catch (_) {
      this.settingsLoaded = true;
      this.updateView();
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
    const val = Number(amount || 0);
    return new Intl.NumberFormat("en-US", {
      style: "currency",
      currency: this.currencyCode || "USD",
    }).format(val);
  }

  getImageUrl(path) {
    if (!path) return "";
    if (
      path.startsWith("http://") ||
      path.startsWith("https://") ||
      path.startsWith("data:")
    )
      return path;
    const baseUrl = window.location.origin;
    if (path.startsWith("/api/")) return baseUrl + path;
    if (path.startsWith("/")) return baseUrl + path;
    if (path.startsWith("uploads/")) return `${baseUrl}/api/${path}`;
    return `${baseUrl}/api/${path.replace(/^\/+/, "")}`;
  }

  async loadCart() {
    const token = localStorage.getItem("token");
    if (!token) {
      this.loadGuestCart();
      return;
    }
    this.loading = true;
    this.updateView();
    try {
      const res = await api.get("/cart");
      this.items = res?.data?.data?.items || [];
      this.total = res?.data?.data?.total_amount || 0;
      localStorage.setItem(
        "cart_count",
        String(
          (this.items || []).reduce(
            (sum, item) => sum + (Number(item.quantity || 0) || 0),
            0,
          ),
        ),
      );
    } catch (e) {
      if (e?.response?.status === 401) {
        localStorage.removeItem("token");
        localStorage.removeItem("userData");
        this.items = [];
        this.total = 0;
        this.loading = false;
        this.loadGuestCart();
        return;
      }
      this.items = [];
      this.total = 0;
    } finally {
      this.loading = false;
      this.syncOrderType();
      this.updateView();
    }
  }

  loadGuestCart() {
    try {
      const raw = localStorage.getItem("guest_cart");
      const items = raw ? JSON.parse(raw) : [];
      this.items = Array.isArray(items) ? items : [];
      this.total = this.items.reduce(
        (sum, item) =>
          sum + Number(item.unit_price || 0) * Number(item.quantity || 0),
        0,
      );
      localStorage.setItem(
        "cart_count",
        String(
          this.items.reduce(
            (sum, item) => sum + (Number(item.quantity || 0) || 0),
            0,
          ),
        ),
      );
      this.loading = false;
      this.syncOrderType();
      this.updateView();
    } catch (_) {
      this.items = [];
      this.total = 0;
      this.loading = false;
      this.syncOrderType();
      this.updateView();
    }
  }

  hasServiceItems() {
    return (this.items || []).some(
      (item) => String(item.product_type || item.type || "").toLowerCase() === "service",
    );
  }

  getOrderTypeOptions() {
    const allowed = this.allowedOrderTypes.length
      ? this.allowedOrderTypes
      : ["delivery", "service", "pickup"];
    if (this.hasServiceItems()) {
      return allowed.includes("service") ? ["service"] : ["service"];
    }
    const filtered = allowed.filter((type) =>
      ["delivery", "pickup"].includes(String(type).toLowerCase()),
    );
    return filtered.length ? filtered : ["delivery", "pickup"];
  }

  syncOrderType() {
    const options = this.getOrderTypeOptions();
    if (this.hasServiceItems()) {
      this.orderType = "service";
      return;
    }
    if (!this.orderType || !options.includes(this.orderType)) {
      this.orderType = options[0] || "delivery";
    }
  }

  selectOrderType(value) {
    const options = this.getOrderTypeOptions();
    if (!options.includes(value)) return;
    this.orderType = value;
    this.updateView();
  }

  handleCustomerInput(field, value) {
    this.customer[field] = value;
  }

  isCustomerLoggedIn() {
    const token = localStorage.getItem("token");
    if (!token) return false;
    try {
      const user = JSON.parse(localStorage.getItem("userData") || "null");
      return !!(user && user.user_type === "customer");
    } catch (_) {
      return false;
    }
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
    const isLoggedIn = this.isCustomerLoggedIn();
    const { name, email, phone, address } = this.customer;
    const requiresAddress = this.orderType === "delivery";
    if (!name || !email || !phone || (requiresAddress && !address)) {
      window.Toast?.show?.({
        title: "Missing details",
        message: requiresAddress
          ? "Please complete the required customer fields and delivery address."
          : "Please complete the required customer fields.",
        variant: "error",
      });
      return;
    }

    this.submitting = true;
    this.updateView();
    try {
      if (isLoggedIn) {
        const res = await api.post("/orders", {
          order_type: this.orderType || this.allowedOrderTypes[0] || "delivery",
          payment_mode: this.paymentMode || this.allowedPaymentModes[0] || "pay_on_delivery",
          metadata: {
            customer: {
              name,
              email,
              phone,
              address: address || "",
              note: this.customer.note || "",
            },
            source: "customer",
          },
        });
        const orderId = res?.data?.order_id;
        window.Toast?.show?.({
          title: "Order created",
          message: orderId
            ? `Order #${orderId} created successfully.`
            : "Order created successfully.",
          variant: "success",
        });
      } else {
        await api.post("/orders/guest", {
          customer: {
            name,
            email,
            phone,
            address: address || "",
            note: this.customer.note || "",
          },
          items: this.items.map((item) => ({
            product_id: item.product_id,
            quantity: item.quantity || 1,
            variant_id: item.variant_id || null,
          })),
          order_type: this.orderType || this.allowedOrderTypes[0] || "delivery",
          payment_mode: this.paymentMode || this.allowedPaymentModes[0] || "pay_on_delivery",
        });
        window.Toast?.show?.({
          title: "Order placed",
          message: "Your order has been received. A receipt was sent to your email.",
          variant: "success",
        });
      }

      localStorage.removeItem("guest_cart");
      localStorage.setItem("cart_count", "0");
      this.items = [];
      this.total = 0;
      this.updateView();
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
    const orderType = this.querySelector("#order-type");
    if (orderType) {
      orderType.addEventListener("change", (e) => {
        this.orderType = e.detail?.value || "";
      });
    }
    const paymentMode = this.querySelector("#payment-mode");
    if (paymentMode) {
      paymentMode.addEventListener("change", (e) => {
        this.paymentMode = e.detail?.value || "";
      });
    }
    const place = this.querySelector("[data-place-order]");
    if (place) place.addEventListener("click", () => this.placeOrder());
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

    if (!this.items.length) {
      return `
        <section class="max-w-4xl mx-auto px-6 py-20 text-center">
          <div class="w-16 h-16 bg-slate-50 rounded-2xl flex items-center justify-center text-slate-300 mx-auto mb-4">
            <i class="fas fa-shopping-cart text-2xl"></i>
          </div>
          <h1 class="text-3xl font-black text-slate-900 mb-3">Your cart is empty</h1>
          <p class="text-slate-500 mb-8">Add items to your cart before placing an order.</p>
          <a href="/public/products" class="inline-flex items-center gap-2 px-6 py-3 rounded-xl bg-slate-900 text-white text-sm font-semibold hover:bg-slate-800 transition">Browse products</a>
        </section>
      `;
    }

    const orderTypes = this.getOrderTypeOptions();
    const paymentModes = this.allowedPaymentModes.length
      ? this.allowedPaymentModes
      : ["pay_on_delivery", "pay_before_delivery", "in_person"];
    const isService = this.hasServiceItems();
    const hasSelection = !!this.orderType;
    const isDelivery = this.orderType === "delivery";
    const isPickup = this.orderType === "pickup";

    return `
      <section class="max-w-6xl mx-auto px-6 py-12">
        <div class="flex items-center justify-between mb-8">
          <div>
            <p class="text-xs font-semibold text-slate-500 mb-2">Checkout</p>
            <h1 class="text-3xl font-black text-slate-900">Complete your order</h1>
          </div>
          <a href="/public/cart" class="text-sm font-semibold text-slate-500 hover:text-slate-900">Back to cart</a>
        </div>

        <div class="grid lg:grid-cols-[1.5fr_1fr] gap-8">
          <div class="space-y-6">
            <div class="bg-white border border-slate-100 rounded-3xl p-6 space-y-4">
              <h2 class="text-lg font-black text-slate-900">Delivery type</h2>
              <div class="grid sm:grid-cols-2 gap-4">
                ${orderTypes
                  .map((type) => {
                    const active = this.orderType === type;
                    const label =
                      type === "service"
                        ? "Service"
                        : type === "pickup"
                          ? "Pickup"
                          : "Delivery";
                    const subtitle =
                      type === "service"
                        ? "Schedule and confirm service details."
                        : type === "pickup"
                          ? "Collect from the store."
                          : "Ship to your address.";
                    return `
                      <button type="button" class="text-left border ${active ? "border-slate-900 ring-2 ring-slate-900/10" : "border-slate-100"} rounded-2xl p-4 flex items-start gap-3 hover:border-slate-300 transition" ${isService ? "disabled" : ""} onclick="this.closest('app-public-order-page').selectOrderType('${type}')">
                        <div class="mt-1 w-5 h-5 rounded-full border ${active ? "border-slate-900" : "border-slate-300"} flex items-center justify-center">
                          ${active ? `<span class="w-2.5 h-2.5 bg-slate-900 rounded-full"></span>` : ""}
                        </div>
                        <div>
                          <p class="text-sm font-semibold text-slate-900">${label}</p>
                          <p class="text-xs text-slate-500 mt-1">${subtitle}</p>
                        </div>
                      </button>
                    `;
                  })
                  .join("")}
              </div>
            </div>
            ${
              hasSelection
                ? `
                <div class="bg-white border border-slate-100 rounded-3xl p-6 space-y-4">
                  <h2 class="text-lg font-black text-slate-900">Payment</h2>
                  <div class="grid sm:grid-cols-2 gap-4">
                    ${paymentModes
                      .map((mode) => {
                        const active = this.paymentMode === mode;
                        const label =
                          mode === "pay_before_delivery"
                            ? "Pay before delivery"
                            : mode === "in_person"
                              ? "Pay in person"
                              : "Pay on delivery";
                        const subtitle =
                          mode === "pay_before_delivery"
                            ? "Pay now to confirm the order."
                            : mode === "in_person"
                              ? "Settle when you arrive."
                              : "Pay when your order arrives.";
                        return `
                          <button type="button" class="text-left border ${active ? "border-slate-900 ring-2 ring-slate-900/10" : "border-slate-100"} rounded-2xl p-4 flex items-start gap-3 hover:border-slate-300 transition" onclick="this.closest('app-public-order-page').paymentMode='${mode}'; this.closest('app-public-order-page').updateView();">
                            <div class="mt-1 w-5 h-5 rounded-full border ${active ? "border-slate-900" : "border-slate-300"} flex items-center justify-center">
                              ${active ? `<span class="w-2.5 h-2.5 bg-slate-900 rounded-full"></span>` : ""}
                            </div>
                            <div>
                              <p class="text-sm font-semibold text-slate-900">${label}</p>
                              <p class="text-xs text-slate-500 mt-1">${subtitle}</p>
                            </div>
                          </button>
                        `;
                      })
                      .join("")}
                  </div>
                  ${
                    isPickup
                      ? `<p class="text-xs text-slate-500">We will notify you when your order is ready for pickup.</p>`
                      : isService
                        ? `<p class="text-xs text-slate-500">We will contact you to confirm service time and delivery.</p>`
                        : `<p class="text-xs text-slate-500">Delivery timelines will be confirmed after payment.</p>`
                  }
                </div>
                <div class="bg-white border border-slate-100 rounded-3xl p-6 space-y-4">
                  <h2 class="text-lg font-black text-slate-900">Customer details</h2>
                  <div>
                    <label class="block text-xs font-semibold text-slate-500 mb-1">Full name</label>
                    <ui-input value="${this.customer.name}" placeholder="Jane Doe" oninput="this.closest('app-public-order-page').handleCustomerInput('name', this.value)"></ui-input>
                  </div>
                  <div>
                    <label class="block text-xs font-semibold text-slate-500 mb-1">Email</label>
                    <ui-input type="email" value="${this.customer.email}" placeholder="you@email.com" oninput="this.closest('app-public-order-page').handleCustomerInput('email', this.value)"></ui-input>
                  </div>
                  <div>
                    <label class="block text-xs font-semibold text-slate-500 mb-1">Phone</label>
                    <ui-input value="${this.customer.phone}" placeholder="+1 555 000 000" oninput="this.closest('app-public-order-page').handleCustomerInput('phone', this.value)"></ui-input>
                  </div>
                  ${
                    isDelivery
                      ? `
                    <div>
                      <label class="block text-xs font-semibold text-slate-500 mb-1">Delivery address</label>
                      <ui-textarea rows="3" value="${this.customer.address}" placeholder="Street, City, State" oninput="this.closest('app-public-order-page').handleCustomerInput('address', this.value)"></ui-textarea>
                    </div>
                  `
                      : ""
                  }
                  <div>
                    <label class="block text-xs font-semibold text-slate-500 mb-1">Notes (optional)</label>
                    <ui-textarea rows="2" value="${this.customer.note}" placeholder="Add delivery instructions" oninput="this.closest('app-public-order-page').handleCustomerInput('note', this.value)"></ui-textarea>
                  </div>
                </div>
              `
                : `
                <div class="bg-white border border-slate-100 rounded-3xl p-6 text-sm text-slate-500">
                  Select a delivery type to continue checkout.
                </div>
              `
            }
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
                        <p class="text-sm font-semibold text-slate-900 truncate">${item.product_name || "Product"}</p>
                        <p class="text-xs text-slate-500">Qty ${item.quantity || 1}</p>
                      </div>
                      <p class="text-sm font-semibold text-slate-900">${this.fmt(Number(item.unit_price || 0) * Number(item.quantity || 0))}</p>
                    </div>
                  `;
                })
                .join("")}
            </div>
            <div class="border-t border-slate-100 mt-6 pt-4 flex items-center justify-between text-sm text-slate-600">
              <span>Total</span>
              <span class="font-semibold text-slate-900">${this.fmt(this.total)}</span>
            </div>
            <button data-place-order class="w-full mt-6 px-4 py-3 rounded-2xl bg-slate-900 text-white text-sm font-semibold hover:bg-slate-800 transition ${this.submitting || !hasSelection ? "opacity-60 cursor-not-allowed" : ""}" ${this.submitting || !hasSelection ? "disabled" : ""}>
              ${this.submitting ? "Placing order..." : "Place order"}
            </button>
          </div>
        </div>
      </section>
    `;
  }
}

customElements.define("app-public-order-page", PublicOrderPage);
export default PublicOrderPage;

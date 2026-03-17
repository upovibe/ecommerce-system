import App from "@/core/App.js";
import "@/components/ui/Dropdown.js";
import "@/components/ui/Toast.js";
import api from "@/services/api.js";

class PublicCartPage extends App {
  constructor() {
    super();
    this.loading = true;
    this.cart = null;
    this.items = [];
    this.total = 0;
    this.currencyCode = "USD";
    this.allowedOrderTypes = [];
    this.allowedPaymentModes = [];
    this.userLoginEnabled = true;
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
    await this.loadCart();
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
    } catch (_) {
      // keep defaults
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
    if (!this.userLoginEnabled) {
      this.loading = false;
      this.updateView();
      return;
    }

    const token = localStorage.getItem("token");
    if (!token) {
      this.loading = false;
      this.updateView();
      return;
    }

    this.loading = true;
    this.updateView();
    try {
      const res = await api.get("/cart");
      this.cart = res?.data?.data?.cart || null;
      this.items = res?.data?.data?.items || [];
      this.total = res?.data?.data?.total_amount || 0;
    } catch (e) {
      window.Toast?.show?.({
        title: "Error",
        message: "Failed to load cart",
        variant: "error",
      });
      this.cart = null;
      this.items = [];
      this.total = 0;
    } finally {
      this.loading = false;
      this.updateView();
    }
  }

  attachEvents() {
    this.querySelectorAll("[data-cart-remove]").forEach((btn) => {
      btn.addEventListener("click", async () => {
        const id = btn.dataset.cartRemove;
        if (!id) return;
        await this.removeItem(id);
      });
    });

    this.querySelectorAll("[data-cart-qty]").forEach((input) => {
      input.addEventListener("change", async () => {
        const id = input.dataset.cartQty;
        const qty = Number(input.value || 1);
        if (!id) return;
        await this.updateQty(id, qty);
      });
    });

    const checkoutBtn = this.querySelector("[data-checkout]");
    if (checkoutBtn) {
      checkoutBtn.addEventListener("click", () => this.checkout());
    }
  }

  async updateQty(id, qty) {
    try {
      await api.put(`/cart/items/${id}`, { quantity: qty });
      await this.loadCart();
    } catch (e) {
      window.Toast?.show?.({
        title: "Error",
        message: "Failed to update quantity",
        variant: "error",
      });
    }
  }

  async removeItem(id) {
    try {
      await api.delete(`/cart/items/${id}`);
      await this.loadCart();
    } catch (e) {
      window.Toast?.show?.({
        title: "Error",
        message: "Failed to remove item",
        variant: "error",
      });
    }
  }

  async checkout() {
    try {
      const orderTypeEl = this.querySelector("#checkout-order-type");
      const paymentModeEl = this.querySelector("#checkout-payment-mode");
      const orderType =
        orderTypeEl?.value ||
        (this.allowedOrderTypes[0] || "delivery");
      const paymentMode =
        paymentModeEl?.value ||
        (this.allowedPaymentModes[0] || "pay_on_delivery");

      const res = await api.post("/orders", {
        order_type: orderType,
        payment_mode: paymentMode,
      });
      const orderId = res?.data?.order_id;
      window.Toast?.show?.({
        title: "Order created",
        message: orderId
          ? `Order #${orderId} created successfully.`
          : "Order created successfully.",
        variant: "success",
      });
      await this.loadCart();
    } catch (e) {
      window.Toast?.show?.({
        title: "Error",
        message: e.response?.data?.message || "Failed to create order",
        variant: "error",
      });
    }
  }

  render() {
    if (!this.userLoginEnabled) {
      return `
        <section class="max-w-4xl mx-auto px-6 py-20 text-center">
          <h1 class="text-3xl font-black text-slate-900 mb-4">Cart is disabled</h1>
          <p class="text-slate-500 mb-8">Customer login is currently disabled by the store administrator.</p>
          <a href="/" class="inline-flex items-center gap-2 px-6 py-3 rounded-xl bg-slate-900 text-white text-sm font-semibold hover:bg-slate-800 transition">
            Return home
          </a>
        </section>
      `;
    }

    const token = localStorage.getItem("token");
    if (!token) {
      return `
        <section class="max-w-4xl mx-auto px-6 py-20 text-center">
          <h1 class="text-3xl font-black text-slate-900 mb-4">Sign in to view your cart</h1>
          <p class="text-slate-500 mb-8">Create an account or sign in to manage your cart and orders.</p>
          <a href="/auth/customer-login" class="inline-flex items-center gap-2 px-6 py-3 rounded-xl bg-slate-900 text-white text-sm font-semibold hover:bg-slate-800 transition">
            Sign in
          </a>
        </section>
      `;
    }

    return `
      <section class="max-w-6xl mx-auto px-6 py-12">
        <div class="flex items-center justify-between mb-8">
          <h1 class="text-3xl font-black text-slate-900">Your Cart</h1>
          <a href="/public/products" class="text-sm font-semibold text-slate-500 hover:text-slate-900">Continue shopping</a>
        </div>

        ${
          this.loading
            ? `<div class="space-y-4">
                ${Array(4).fill('<div class="h-16 bg-slate-100 rounded-2xl animate-pulse"></div>').join("")}
              </div>`
            : this.items.length === 0
              ? `
              <div class="bg-white border border-slate-100 rounded-3xl p-10 text-center">
                <div class="w-16 h-16 bg-slate-50 rounded-2xl flex items-center justify-center text-slate-300 mx-auto mb-4">
                  <i class="fas fa-shopping-cart text-2xl"></i>
                </div>
                <h3 class="text-xl font-bold text-slate-900 mb-2">Your cart is empty</h3>
                <p class="text-slate-500 mb-6">Browse products and add items to your cart.</p>
                <a href="/public/products" class="inline-flex items-center gap-2 px-6 py-3 rounded-xl bg-slate-900 text-white text-sm font-semibold hover:bg-slate-800 transition">Shop products</a>
              </div>
            `
              : `
              <div class="grid lg:grid-cols-[1.5fr_1fr] gap-8">
                <div class="space-y-4">
                  ${this.items
                    .map((item) => {
                      const image = this.getImageUrl(item.main_image);
                      return `
                        <div class="bg-white border border-slate-100 rounded-2xl p-4 flex items-center gap-4">
                          <div class="size-16 rounded-xl overflow-hidden bg-slate-50 border border-slate-100 flex items-center justify-center">
                            ${image ? `<img src="${image}" class="w-full h-full object-cover">` : `<i class="fas fa-image text-slate-300"></i>`}
                          </div>
                          <div class="flex-1 min-w-0">
                            <div class="text-sm font-bold text-slate-900 truncate">${item.product_name || "Product"}</div>
                            <div class="text-[11px] text-slate-400">${item.category_name || "—"}</div>
                            <div class="text-sm font-semibold text-slate-700 mt-1">${this.fmt(item.unit_price)}</div>
                          </div>
                          <div class="flex items-center gap-3">
                            <input data-cart-qty="${item.id}" type="number" min="1" value="${item.quantity}" class="w-16 px-2 py-1 rounded-lg border border-slate-200 text-sm">
                            <button data-cart-remove="${item.id}" class="text-slate-400 hover:text-rose-500">
                              <i class="fas fa-trash"></i>
                            </button>
                          </div>
                        </div>
                      `;
                    })
                    .join("")}
                </div>
                <div class="bg-white border border-slate-100 rounded-3xl p-6 h-fit">
                  <h3 class="text-lg font-black text-slate-900 mb-4">Order summary</h3>
                  <div class="flex items-center justify-between text-sm text-slate-600 mb-3">
                    <span>Subtotal</span>
                    <span class="font-semibold">${this.fmt(this.total)}</span>
                  </div>
                  <div class="border-t border-slate-100 pt-4 space-y-3">
                    <div>
                      <label class="block text-xs font-semibold text-slate-500 mb-1">Order type</label>
                      <ui-dropdown id="checkout-order-type" class="w-full" value="${this.allowedOrderTypes[0] || "delivery"}">
                        ${(this.allowedOrderTypes.length ? this.allowedOrderTypes : ["delivery", "service"])
                          .map((t) => `<ui-option value="${t}">${t}</ui-option>`)
                          .join("")}
                      </ui-dropdown>
                    </div>
                    <div>
                      <label class="block text-xs font-semibold text-slate-500 mb-1">Payment mode</label>
                      <ui-dropdown id="checkout-payment-mode" class="w-full" value="${this.allowedPaymentModes[0] || "pay_on_delivery"}">
                        ${(this.allowedPaymentModes.length ? this.allowedPaymentModes : ["pay_on_delivery", "pay_before_delivery", "in_person"])
                          .map((t) => `<ui-option value="${t}">${t}</ui-option>`)
                          .join("")}
                      </ui-dropdown>
                    </div>
                    <button data-checkout class="w-full mt-3 px-4 py-3 rounded-2xl bg-slate-900 text-white text-sm font-semibold hover:bg-slate-800 transition">
                      Place order
                    </button>
                  </div>
                </div>
              </div>
            `
        }
      </section>
    `;
  }
}

customElements.define("app-public-cart-page", PublicCartPage);
export default PublicCartPage;

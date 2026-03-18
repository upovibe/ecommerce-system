import App from "@/core/App.js";
import "@/components/ui/Dropdown.js";
import "@/components/ui/Dialog.js";
import "@/components/ui/Input.js";
import "@/components/ui/Textarea.js";
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
    this.settingsLoaded = false;
    this.guestCheckoutOpen = false;
    this.guestCheckoutSubmitting = false;
    this.guestForm = {
      name: "",
      email: "",
      phone: "",
      address: "",
      note: "",
    };
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
      this.settingsLoaded = true;
      this.updateView();
    } catch (_) {
      // keep defaults
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
      this.loading = false;
      this.loadGuestCart();
      return;
    }

    this.loading = true;
    this.updateView();
    try {
      const res = await api.get("/cart");
      this.cart = res?.data?.data?.cart || null;
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
      this.emitCartUpdated();
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
      this.emitCartUpdated();
      this.updateView();
    } catch (_) {
      this.items = [];
      this.total = 0;
      this.updateView();
    }
  }

  handleGuestInputChange(field, value) {
    this.guestForm[field] = value;
  }

  openGuestCheckout() {
    if (!this.items.length) {
      window.Toast?.show?.({
        title: "Cart empty",
        message: "Please add an item before checking out.",
        variant: "warning",
      });
      return;
    }
    this.guestCheckoutOpen = true;
    this.updateView();
  }

  closeGuestCheckout() {
    this.guestCheckoutOpen = false;
    this.updateView();
  }

  async submitGuestCheckout() {
    if (this.guestCheckoutSubmitting) return;
    const { name, email, phone, address } = this.guestForm;
    if (!name || !email || !phone || !address) {
      window.Toast?.show?.({
        title: "Missing details",
        message: "Please complete the required customer fields.",
        variant: "error",
      });
      return;
    }
    this.guestCheckoutSubmitting = true;
    this.updateView();
    try {
      const orderTypeEl =
        this.querySelector("#guest-order-type") ||
        this.querySelector("#checkout-order-type");
      const paymentModeEl =
        this.querySelector("#guest-payment-mode") ||
        this.querySelector("#checkout-payment-mode");
      const orderType =
        orderTypeEl?.value ||
        (this.allowedOrderTypes[0] || "delivery");
      const paymentMode =
        paymentModeEl?.value ||
        (this.allowedPaymentModes[0] || "pay_on_delivery");

      await api.post("/orders/guest", {
        customer: {
          name,
          email,
          phone,
          address,
          note: this.guestForm.note || "",
        },
        items: this.items.map((item) => ({
          product_id: item.product_id,
          quantity: item.quantity || 1,
          variant_id: item.variant_id || null,
        })),
        order_type: orderType,
        payment_mode: paymentMode,
      });

      localStorage.removeItem("guest_cart");
      localStorage.setItem("cart_count", "0");
      this.items = [];
      this.total = 0;
      this.guestCheckoutOpen = false;
      window.Toast?.show?.({
        title: "Order placed",
        message: "Your order has been received. A receipt was sent to your email.",
        variant: "success",
      });
    } catch (e) {
      window.Toast?.show?.({
        title: "Checkout failed",
        message: e.response?.data?.message || "Unable to place order.",
        variant: "error",
      });
      this.guestCheckoutOpen = true;
    } finally {
      this.guestCheckoutSubmitting = false;
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

    this.querySelectorAll("[data-qty-increase]").forEach((btn) => {
      btn.addEventListener("click", async () => {
        const id = btn.dataset.qtyIncrease;
        if (!id) return;
        const input = this.querySelector(`[data-cart-qty="${id}"]`);
        const current = Number(input?.value || 1);
        const next = current + 1;
        if (input) input.value = String(next);
        this.updateQtyUI(id, next);
        await this.syncQty(id, next);
      });
    });

    this.querySelectorAll("[data-qty-decrease]").forEach((btn) => {
      btn.addEventListener("click", async () => {
        const id = btn.dataset.qtyDecrease;
        if (!id) return;
        const input = this.querySelector(`[data-cart-qty="${id}"]`);
        const current = Number(input?.value || 1);
        const next = Math.max(1, current - 1);
        if (input) input.value = String(next);
        this.updateQtyUI(id, next);
        await this.syncQty(id, next);
      });
    });

    this.querySelectorAll("[data-cart-qty]").forEach((input) => {
      input.addEventListener("change", async () => {
        const id = input.dataset.cartQty;
        const qty = Number(input.value || 1);
        if (!id) return;
        this.updateQtyUI(id, qty);
        await this.syncQty(id, qty);
      });
    });

    const checkoutBtn = this.querySelector("[data-checkout]");
    if (checkoutBtn) {
      checkoutBtn.addEventListener("click", () => this.checkout());
    }

    const guestCancel = this.querySelector("[data-guest-checkout-cancel]");
    const guestSubmit = this.querySelector("[data-guest-checkout-submit]");
    if (guestCancel)
      guestCancel.addEventListener("click", () => this.closeGuestCheckout());
    if (guestSubmit)
      guestSubmit.addEventListener("click", () => this.submitGuestCheckout());
  }

  updateQtyUI(id, qty) {
    const item = this.items.find((i) => String(i.id) === String(id));
    if (!item) return;
    item.quantity = Math.max(1, Number(qty || 1));
    this.total = this.items.reduce(
      (sum, i) => sum + Number(i.unit_price || 0) * Number(i.quantity || 0),
      0,
    );
    const itemTotal = this.querySelector(`[data-item-total="${id}"]`);
    if (itemTotal) {
      itemTotal.textContent = this.fmt(
        Number(item.unit_price || 0) * Number(item.quantity || 0),
      );
    }
    const subtotal = this.querySelector("[data-cart-subtotal]");
    if (subtotal) subtotal.textContent = this.fmt(this.total);
    const count = this.items.reduce(
      (sum, i) => sum + (Number(i.quantity || 0) || 0),
      0,
    );
    localStorage.setItem("cart_count", String(count));
    this.emitCartUpdated();
  }

  async syncQty(id, qty) {
    const token = localStorage.getItem("token");
    if (!token) {
      this.updateGuestQty(id, qty, true);
      return;
    }
    try {
      await api.put(`/cart/items/${id}`, { quantity: qty });
    } catch (e) {
      window.Toast?.show?.({
        title: "Error",
        message: "Failed to update quantity",
        variant: "error",
      });
      await this.loadCart();
    }
  }

  async removeItem(id) {
    const token = localStorage.getItem("token");
    if (!token) {
      this.removeGuestItem(id);
      return;
    }
    try {
      await api.delete(`/cart/items/${id}`);
      await this.loadCart();
      this.emitCartUpdated();
    } catch (e) {
      window.Toast?.show?.({
        title: "Error",
        message: "Failed to remove item",
        variant: "error",
      });
    }
  }

  async checkout() {
    if (!this.settingsLoaded) {
      window.Toast?.show?.({
        title: "Loading settings",
        message: "Please wait a moment and try again.",
        variant: "warning",
      });
      return;
    }
    const token = localStorage.getItem("token");
    let user = null;
    try {
      user = JSON.parse(localStorage.getItem("userData") || "null");
    } catch (_) {
      user = null;
    }
    const isCustomer = !!(user && user.user_type === "customer");
    console.log("[Cart] checkout", {
      settingsLoaded: this.settingsLoaded,
      userLoginEnabled: this.userLoginEnabled,
      hasToken: !!token,
      isCustomer,
    });
    if (!token || !isCustomer) {
      if (this.userLoginEnabled) {
        localStorage.setItem("post_login_redirect", "/public/cart");
        window.Toast?.show?.({
          title: "Sign in required",
          message: "Please sign in to place your order.",
          variant: "warning",
        });
        setTimeout(() => {
          window.location.href = "/auth/customer-login";
        }, 600);
        return;
      }
      console.log("[Cart] guest checkout modal open");
      this.openGuestCheckout();
      return;
    }
    try {
      const orderType =
        this.allowedOrderTypes[0] || "delivery";
      const paymentMode =
        this.allowedPaymentModes[0] || "pay_on_delivery";

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

  renderGuestCheckoutModal() {
    const orderTypes = this.allowedOrderTypes.length
      ? this.allowedOrderTypes
      : ["delivery", "service"];
    const paymentModes = this.allowedPaymentModes.length
      ? this.allowedPaymentModes
      : ["pay_on_delivery", "pay_before_delivery", "in_person"];
    return `
      <ui-dialog id="guest-checkout-dialog" ${this.guestCheckoutOpen ? "open" : ""} title="Guest checkout" position="center" no-footer>
        <div slot="content" class="space-y-4">
          <p class="text-xs text-slate-500">Enter your details to receive a receipt and delivery updates.</p>
          <div>
            <label class="block text-xs font-semibold text-slate-500 mb-1">Full name</label>
            <ui-input value="${this.guestForm.name}" placeholder="Jane Doe" oninput="this.closest('app-public-cart-page').handleGuestInputChange('name', this.value)"></ui-input>
          </div>
          <div>
            <label class="block text-xs font-semibold text-slate-500 mb-1">Email</label>
            <ui-input type="email" value="${this.guestForm.email}" placeholder="you@email.com" oninput="this.closest('app-public-cart-page').handleGuestInputChange('email', this.value)"></ui-input>
          </div>
          <div>
            <label class="block text-xs font-semibold text-slate-500 mb-1">Phone</label>
            <ui-input value="${this.guestForm.phone}" placeholder="+1 555 000 000" oninput="this.closest('app-public-cart-page').handleGuestInputChange('phone', this.value)"></ui-input>
          </div>
          <div>
            <label class="block text-xs font-semibold text-slate-500 mb-1">Delivery address</label>
            <ui-textarea rows="3" value="${this.guestForm.address}" placeholder="Street, City, State" oninput="this.closest('app-public-cart-page').handleGuestInputChange('address', this.value)"></ui-textarea>
          </div>
          <div class="grid grid-cols-2 gap-3">
            <div>
              <label class="block text-xs font-semibold text-slate-500 mb-1">Order type</label>
              <ui-dropdown id="guest-order-type" value="${orderTypes[0]}">
                ${orderTypes.map((t) => `<ui-option value="${t}">${t}</ui-option>`).join("")}
              </ui-dropdown>
            </div>
            <div>
              <label class="block text-xs font-semibold text-slate-500 mb-1">Payment mode</label>
              <ui-dropdown id="guest-payment-mode" value="${paymentModes[0]}">
                ${paymentModes.map((m) => `<ui-option value="${m}">${m}</ui-option>`).join("")}
              </ui-dropdown>
            </div>
          </div>
          <div>
            <label class="block text-xs font-semibold text-slate-500 mb-1">Notes (optional)</label>
            <ui-textarea rows="2" value="${this.guestForm.note}" placeholder="Add delivery instructions" oninput="this.closest('app-public-cart-page').handleGuestInputChange('note', this.value)"></ui-textarea>
          </div>
        </div>
        <div slot="footer" class="flex items-center justify-end gap-3">
          <button class="secondary" data-guest-checkout-cancel>Cancel</button>
          <button class="primary" data-guest-checkout-submit ${this.guestCheckoutSubmitting ? "disabled" : ""}>
            ${this.guestCheckoutSubmitting ? "Placing..." : "Place order"}
          </button>
        </div>
      </ui-dialog>
    `;
  }

  render() {
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
                            <div class="text-xs font-semibold text-slate-500 mt-1" data-item-total="${item.id}">
                              ${this.fmt(Number(item.unit_price || 0) * Number(item.quantity || 0))}
                            </div>
                          </div>
                          <div class="flex items-center gap-3">
                            <div class="flex items-center gap-2 bg-slate-50 border border-slate-200 rounded-xl px-2 py-1">
                              <button data-qty-decrease="${item.id}" class="w-7 h-7 flex items-center justify-center text-slate-500 hover:text-slate-900">
                                <i class="fas fa-chevron-left text-[10px]"></i>
                              </button>
                              <input data-cart-qty="${item.id}" type="number" min="1" value="${item.quantity}" class="w-10 text-center bg-transparent text-sm font-semibold text-slate-900 focus:outline-none">
                              <button data-qty-increase="${item.id}" class="w-7 h-7 flex items-center justify-center text-slate-500 hover:text-slate-900">
                                <i class="fas fa-chevron-right text-[10px]"></i>
                              </button>
                            </div>
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
                    <span class="font-semibold" data-cart-subtotal>${this.fmt(this.total)}</span>
                  </div>
                  <div class="border-t border-slate-100 pt-4 space-y-4">
                    <div class="p-4 rounded-2xl bg-slate-50 border border-slate-100">
                      <p class="text-xs font-semibold text-slate-500 mb-2">Ready to place your order?</p>
                      <p class="text-sm text-slate-600">We will confirm your order details and send a receipt to your email.</p>
                    </div>
                    <button data-checkout class="w-full px-4 py-3 rounded-2xl bg-slate-900 text-white text-sm font-semibold hover:bg-slate-800 transition ${this.settingsLoaded ? "" : "opacity-60 cursor-not-allowed"}" ${this.settingsLoaded ? "" : "disabled"}>
                      ${this.settingsLoaded ? "Place order" : "Loading..."}
                    </button>
                  </div>
                </div>
              </div>
            `
        }
      </section>
      ${this.renderGuestCheckoutModal()}
    `;
  }

  updateGuestQty(id, qty, silent = false) {
    try {
      const raw = localStorage.getItem("guest_cart");
      const items = raw ? JSON.parse(raw) : [];
      const list = Array.isArray(items) ? items : [];
      const target = list.find((i) => String(i.id) === String(id));
      if (target) target.quantity = Math.max(1, Number(qty || 1));
      localStorage.setItem("guest_cart", JSON.stringify(list));
      localStorage.setItem(
        "cart_count",
        String(
          list.reduce(
            (sum, item) => sum + (Number(item.quantity || 0) || 0),
            0,
          ),
        ),
      );
      this.emitCartUpdated();
      if (!silent) this.loadGuestCart();
    } catch (_) {}
  }

  removeGuestItem(id) {
    try {
      const raw = localStorage.getItem("guest_cart");
      const items = raw ? JSON.parse(raw) : [];
      const list = Array.isArray(items) ? items : [];
      const next = list.filter((i) => String(i.id) !== String(id));
      localStorage.setItem("guest_cart", JSON.stringify(next));
      localStorage.setItem(
        "cart_count",
        String(
          next.reduce(
            (sum, item) => sum + (Number(item.quantity || 0) || 0),
            0,
          ),
        ),
      );
      this.emitCartUpdated();
      this.loadGuestCart();
    } catch (_) {}
  }

  emitCartUpdated() {
    const evt = new CustomEvent("cart:updated");
    window.dispatchEvent(evt);
    document.dispatchEvent(evt);
    const layout = document.querySelector("app-public-layout");
    if (layout?.updateCartBadge) layout.updateCartBadge();
  }
}

customElements.define("app-public-cart-page", PublicCartPage);
export default PublicCartPage;



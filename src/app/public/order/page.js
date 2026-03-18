import App from "@/core/App.js";
import "@/components/ui/Dropdown.js";
import "@/components/ui/Input.js";
import "@/components/ui/Textarea.js";
import "@/components/ui/Toast.js";
import "@/components/ui/Switch.js";
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
      note: "",
    };
    this.deliveryAddress = {
      line1: "",
      line2: "",
      city: "",
      state: "",
      country: "Nigeria",
      postal: "",
    };
    this.pickupContact = {
      name: "",
      phone: "",
      note: "",
    };
    this.pickupMode = "self";
    this.savedAddresses = [];
    this.savedPickups = [];
    this.selectedAddressId = "";
    this.selectedPickupId = "";
    this.saveAddress = false;
    this.savePickup = false;
    this.showAddressForm = false;
    this.showPickupForm = false;
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
    await this.loadSavedData();
    await this.loadCart();
  }

  hydrateCustomerFromUser() {
    try {
      const user = JSON.parse(localStorage.getItem("userData") || "null");
      if (!user) return;
      if (!this.customer.name) this.customer.name = user.name || "";
      if (!this.customer.email) this.customer.email = user.email || "";
      if (!this.customer.phone) this.customer.phone = user.phone || user.phone_number || "";
      if (!this.deliveryAddress.line1) this.deliveryAddress.line1 = user.address || "";
    } catch (_) {
      // ignore
    }
  }

  async loadSavedData() {
    if (!this.isCustomerLoggedIn()) return;
    try {
      const [addrRes, pickupRes] = await Promise.all([
        api.get("/addresses").catch(() => null),
        api.get("/pickup-contacts").catch(() => null),
      ]);
      this.savedAddresses = addrRes?.data?.data || [];
      this.savedPickups = pickupRes?.data?.data || [];
      if (!this.savedAddresses.length) {
        this.showAddressForm = true;
        this.saveAddress = true;
      }
      if (!this.selectedAddressId) {
        const def = this.savedAddresses.find((a) => Number(a.is_default) === 1);
        if (def) this.applySavedAddress(def);
      }
      if (!this.selectedPickupId) {
        const def = this.savedPickups.find((p) => Number(p.is_default) === 1);
        if (def) this.applySavedPickup(def);
      }
      this.updateView();
    } catch (_) {
      this.savedAddresses = [];
      this.savedPickups = [];
    }
  }

  applySavedAddress(address) {
    if (!address) return;
    this.selectedAddressId = String(address.id || "");
    this.deliveryAddress = {
      line1: address.address_line1 || "",
      line2: address.address_line2 || "",
      city: address.city || "",
      state: address.state || "",
      country: address.country || "Nigeria",
      postal: address.postal_code || "",
    };
  }

  applySavedPickup(pickup) {
    if (!pickup) return;
    this.selectedPickupId = String(pickup.id || "");
    this.pickupContact = {
      name: pickup.name || "",
      phone: pickup.phone || "",
      note: pickup.note || "",
    };
    this.pickupMode = "someone";
    this.showPickupForm = false;
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
      this.allowedPaymentModes = this.allowedPaymentModes.filter(
        (m) => String(m).toLowerCase() !== "in_person",
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

  handleAddressInput(field, value) {
    this.deliveryAddress[field] = value;
  }

  handlePickupInput(field, value) {
    this.pickupContact[field] = value;
  }

  async removePickupContact(id) {
    if (!id) return;
    try {
      await api.delete(`/pickup-contacts/${id}`);
      this.savedPickups = this.savedPickups.filter((p) => String(p.id) !== String(id));
      if (String(this.selectedPickupId) === String(id)) {
        this.selectedPickupId = "";
      }
      this.updateView();
    } catch (_) {
      window.Toast?.show?.({
        title: "Error",
        message: "Failed to remove pickup contact.",
        variant: "error",
      });
    }
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
    const { name, email, phone } = this.customer;
    const { line1, line2, city, state, country, postal } = this.deliveryAddress;
    const { name: pickerName, phone: pickerPhone, note: pickerNote } = this.pickupContact;
    const requiresAddress = this.orderType === "delivery";
    if (!name || !email || !phone || (requiresAddress && (!line1 || !city))) {
      window.Toast?.show?.({
        title: "Missing details",
        message: requiresAddress
          ? "Please complete the required customer fields and delivery address."
          : "Please complete the required customer fields.",
        variant: "error",
      });
      return;
    }
    if (this.orderType === "pickup" && this.pickupMode === "someone" && (!pickerName || !pickerPhone)) {
      window.Toast?.show?.({
        title: "Missing pickup contact",
        message: "Please provide the pickup person's name and phone.",
        variant: "error",
      });
      return;
    }

    this.submitting = true;
    this.updateView();
    try {
      if (isLoggedIn) {
        if (requiresAddress && this.saveAddress) {
          const res = await api.post("/addresses", {
            address_line1: line1,
            address_line2: line2,
            city,
            state,
            country,
            postal_code: postal,
            type: "shipping",
            is_default: this.savedAddresses.length === 0 ? 1 : 0,
          });
          if (res?.data?.data) {
            this.savedAddresses = [res.data.data, ...this.savedAddresses];
            this.selectedAddressId = String(res.data.data.id || "");
          }
        }
        if (this.orderType === "pickup" && this.savePickup) {
          const res = await api.post("/pickup-contacts", {
            name: pickerName,
            phone: pickerPhone,
            note: pickerNote || "",
            is_default: this.savedPickups.length === 0 ? 1 : 0,
          });
          if (res?.data?.data) {
            this.savedPickups = [res.data.data, ...this.savedPickups];
            this.selectedPickupId = String(res.data.data.id || "");
          }
        }
      }

      if (isLoggedIn) {
        const res = await api.post("/orders", {
          order_type: this.orderType || this.allowedOrderTypes[0] || "delivery",
          payment_mode: this.paymentMode || this.allowedPaymentModes[0] || "pay_on_delivery",
          metadata: {
            customer: {
              name,
              email,
              phone,
              address: requiresAddress
                ? {
                    line1,
                    line2,
                    city,
                    state,
                    country,
                    postal,
                  }
                : "",
              note: this.customer.note || "",
            },
            pickup_contact:
              this.orderType === "pickup"
                ? {
                    mode: this.pickupMode,
                    name: pickerName,
                    phone: pickerPhone,
                    note: pickerNote || "",
                  }
                : null,
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
            address: requiresAddress
              ? {
                  line1,
                  line2,
                  city,
                  state,
                  country,
                  postal,
                }
              : "",
            note: this.customer.note || "",
            pickup_contact:
              this.orderType === "pickup"
                ? {
                    mode: this.pickupMode,
                    name: pickerName,
                    phone: pickerPhone,
                    note: pickerNote || "",
                  }
                : null,
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
      : ["pay_on_delivery", "pay_before_delivery"];
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
                <!-- payment moved to order summary -->
                <div class="bg-white border border-slate-100 rounded-3xl p-6 space-y-4">
                  <h2 class="text-lg font-black text-slate-900">Customer details</h2>
                  <p class="text-xs text-slate-500">
                    ${isPickup ? "Pickup requires customer details and pickup person." : "Delivery requires customer details and delivery address."}
                  </p>
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
                    <div class="space-y-3">
                      <h3 class="text-sm font-semibold text-slate-700">Delivery address</h3>
                      ${this.isCustomerLoggedIn()
                        ? `
                      <div class="space-y-3">
                        <div class="flex items-center justify-between">
                          <label class="block text-xs font-semibold text-slate-500">Saved addresses</label>
                          ${this.showAddressForm ? "" : `
                            <button type="button" class="inline-flex items-center gap-1 text-[11px] font-semibold text-slate-600 border border-slate-200 rounded-full px-3 py-1 hover:bg-slate-50" onclick="const page=this.closest('app-public-order-page'); page.showAddressForm = true; page.updateView();">
                              <i class="fas fa-plus text-[9px]"></i>
                              Add
                            </button>
                          `}
                        </div>
                        ${this.showAddressForm ? "" : `
                        <div class="grid sm:grid-cols-2 gap-3">
                          ${this.savedAddresses.map((a) => `
                            <div class="relative border ${this.selectedAddressId === String(a.id) ? "border-slate-900 ring-2 ring-slate-900/10" : "border-slate-100"} rounded-2xl p-4 hover:border-slate-300 transition">
                              <button type="button" class="absolute top-2 right-2 text-slate-400 hover:text-rose-500" onclick="event.stopPropagation(); this.closest('app-public-order-page').removeAddress(${a.id});">
                                <i class="fas fa-times text-[10px]"></i>
                              </button>
                              <button type="button" class="text-left w-full" onclick="const page=this.closest('app-public-order-page'); page.applySavedAddress(${JSON.stringify(a).replace(/"/g, '&quot;')}); page.updateView();">
                                <p class="text-sm font-semibold text-slate-900">${a.address_line1}</p>
                                <p class="text-xs text-slate-500 mt-1">${a.city}${a.state ? `, ${a.state}` : ""}</p>
                              </button>
                            </div>
                          `).join("")}
                        </div>
                        `}
                      </div>
                      `
                        : ""}
                      ${this.isCustomerLoggedIn() && !this.showAddressForm ? "" : `
                      <div class="relative rounded-2xl border border-slate-200 bg-slate-50/60 p-4 space-y-3">
                        <button type="button" class="absolute top-3 right-3 text-slate-400 hover:text-slate-700" onclick="const page=this.closest('app-public-order-page'); page.showAddressForm=false; page.updateView();">
                          <i class="fas fa-times"></i>
                        </button>
                        <div>
                          <label class="block text-xs font-semibold text-slate-500 mb-1">Address line 1</label>
                          <ui-input value="${this.deliveryAddress.line1}" placeholder="Street address" oninput="this.closest('app-public-order-page').handleAddressInput('line1', this.value)"></ui-input>
                        </div>
                        <div>
                          <label class="block text-xs font-semibold text-slate-500 mb-1">Address line 2</label>
                          <ui-input value="${this.deliveryAddress.line2}" placeholder="Apartment, suite, etc." oninput="this.closest('app-public-order-page').handleAddressInput('line2', this.value)"></ui-input>
                        </div>
                        <div class="grid sm:grid-cols-2 gap-3">
                          <div>
                            <label class="block text-xs font-semibold text-slate-500 mb-1">City</label>
                            <ui-input value="${this.deliveryAddress.city}" placeholder="City" oninput="this.closest('app-public-order-page').handleAddressInput('city', this.value)"></ui-input>
                          </div>
                          <div>
                            <label class="block text-xs font-semibold text-slate-500 mb-1">State</label>
                            <ui-input value="${this.deliveryAddress.state}" placeholder="State" oninput="this.closest('app-public-order-page').handleAddressInput('state', this.value)"></ui-input>
                          </div>
                        </div>
                        <div class="grid sm:grid-cols-2 gap-3">
                          <div>
                            <label class="block text-xs font-semibold text-slate-500 mb-1">Country</label>
                            <ui-input value="${this.deliveryAddress.country}" placeholder="Country" oninput="this.closest('app-public-order-page').handleAddressInput('country', this.value)"></ui-input>
                          </div>
                          <div>
                            <label class="block text-xs font-semibold text-slate-500 mb-1">Postal code</label>
                            <ui-input value="${this.deliveryAddress.postal}" placeholder="Postal code" oninput="this.closest('app-public-order-page').handleAddressInput('postal', this.value)"></ui-input>
                          </div>
                        </div>
                        ${this.isCustomerLoggedIn()
                          ? `<div class="flex items-center justify-between">
                              <span class="text-xs text-slate-500">Save this address for next time</span>
                              <ui-switch ${this.saveAddress ? "checked" : ""} onchange="this.closest('app-public-order-page').saveAddress = event.detail.checked"></ui-switch>
                             </div>`
                          : ""
                        }
                      </div>
                      `}
                      
                    </div>
                  `
                      : ""
                  }
                  ${
                    isPickup
                      ? `
                    <div class="space-y-3">
                      <h3 class="text-sm font-semibold text-slate-700">Pickup details</h3>
                      <p class="text-xs text-slate-500">Who will be picking up the order?</p>
                      <div class="grid sm:grid-cols-2 gap-3">
                        <button type="button" class="text-left border ${this.pickupMode === "self" ? "border-slate-900 ring-2 ring-slate-900/10" : "border-slate-100"} rounded-2xl p-4 flex items-start gap-3 hover:border-slate-300 transition" onclick="const page=this.closest('app-public-order-page'); page.pickupMode='self'; page.updateView();">
                          <div class="mt-1 w-5 h-5 rounded-full border ${this.pickupMode === "self" ? "border-slate-900" : "border-slate-300"} flex items-center justify-center">
                            ${this.pickupMode === "self" ? `<span class="w-2.5 h-2.5 bg-slate-900 rounded-full"></span>` : ""}
                          </div>
                          <div>
                            <p class="text-sm font-semibold text-slate-900">Myself</p>
                            <p class="text-xs text-slate-500 mt-1">I will pick up the order.</p>
                          </div>
                        </button>
                        <button type="button" class="text-left border ${this.pickupMode === "someone" ? "border-slate-900 ring-2 ring-slate-900/10" : "border-slate-100"} rounded-2xl p-4 flex items-start gap-3 hover:border-slate-300 transition" onclick="const page=this.closest('app-public-order-page'); page.pickupMode='someone'; page.updateView();">
                          <div class="mt-1 w-5 h-5 rounded-full border ${this.pickupMode === "someone" ? "border-slate-900" : "border-slate-300"} flex items-center justify-center">
                            ${this.pickupMode === "someone" ? `<span class="w-2.5 h-2.5 bg-slate-900 rounded-full"></span>` : ""}
                          </div>
                          <div>
                            <p class="text-sm font-semibold text-slate-900">Someone else</p>
                            <p class="text-xs text-slate-500 mt-1">I will send another person.</p>
                          </div>
                        </button>
                      </div>
                      ${this.isCustomerLoggedIn() && this.pickupMode === "someone"
                        ? `
                      <div class="space-y-3">
                        <div class="flex items-center justify-between">
                          <label class="block text-xs font-semibold text-slate-500">Saved pickup contacts</label>
                          ${this.showPickupForm ? "" : `
                            <button type="button" class="inline-flex items-center gap-1 text-[11px] font-semibold text-slate-600 border border-slate-200 rounded-full px-3 py-1 hover:bg-slate-50" onclick="const page=this.closest('app-public-order-page'); page.showPickupForm = true; page.updateView();">
                              <i class="fas fa-plus text-[9px]"></i>
                              Add
                            </button>
                          `}
                        </div>
                        ${this.showPickupForm ? "" : `
                        <div class="grid sm:grid-cols-2 gap-3">
                          ${this.savedPickups.map((p) => `
                            <div class="relative border ${this.selectedPickupId === String(p.id) ? "border-slate-900 ring-2 ring-slate-900/10" : "border-slate-100"} rounded-2xl p-4 hover:border-slate-300 transition">
                              <button type="button" class="absolute top-2 right-2 text-slate-400 hover:text-rose-500" onclick="event.stopPropagation(); this.closest('app-public-order-page').removePickupContact(${p.id});">
                                <i class="fas fa-times text-[10px]"></i>
                              </button>
                              <button type="button" class="text-left w-full" onclick="const page=this.closest('app-public-order-page'); page.applySavedPickup(${JSON.stringify(p).replace(/"/g, '&quot;')}); page.updateView();">
                                <p class="text-sm font-semibold text-slate-900">${p.name}</p>
                                <p class="text-xs text-slate-500 mt-1">${p.phone}</p>
                              </button>
                            </div>
                          `).join("")}
                        </div>
                        `}
                      </div>
                      `
                        : ""}
                      ${
                        this.pickupMode === "someone" && (this.showPickupForm || !this.isCustomerLoggedIn())
                          ? `
                        <div class="relative rounded-2xl border border-slate-200 bg-slate-50/60 p-4 space-y-3">
                          <button type="button" class="absolute top-3 right-3 text-slate-400 hover:text-slate-700" onclick="const page=this.closest('app-public-order-page'); page.showPickupForm=false; page.updateView();">
                            <i class="fas fa-times"></i>
                          </button>
                          <div>
                            <label class="block text-xs font-semibold text-slate-500 mb-1">Pickup person</label>
                            <ui-input value="${this.pickupContact.name}" placeholder="Full name" oninput="this.closest('app-public-order-page').handlePickupInput('name', this.value)"></ui-input>
                          </div>
                          <div>
                            <label class="block text-xs font-semibold text-slate-500 mb-1">Phone</label>
                            <ui-input value="${this.pickupContact.phone}" placeholder="+1 555 000 000" oninput="this.closest('app-public-order-page').handlePickupInput('phone', this.value)"></ui-input>
                          </div>
                          <div>
                            <label class="block text-xs font-semibold text-slate-500 mb-1">Notes (optional)</label>
                            <ui-textarea rows="2" value="${this.pickupContact.note}" placeholder="Any pickup notes" oninput="this.closest('app-public-order-page').handlePickupInput('note', this.value)"></ui-textarea>
                          </div>
                        ${
                          this.isCustomerLoggedIn()
                            ? `<div class="flex items-center justify-between">
                                <span class="text-xs text-slate-500">Save pickup person for next time</span>
                                <ui-switch ${this.savePickup ? "checked" : ""} onchange="this.closest('app-public-order-page').savePickup = event.detail.checked"></ui-switch>
                               </div>`
                            : ""
                        }
                        </div>
                      `
                          : ""
                      }
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
            <div class="mt-6">
              <h4 class="text-sm font-bold text-slate-900 mb-3">Payment type</h4>
              <div class="space-y-3">
                ${paymentModes
                  .map((mode) => {
                    const active = this.paymentMode === mode;
                    const isPickupMode = this.orderType === "pickup";
                    const label =
                      mode === "pay_before_delivery"
                        ? isPickupMode
                          ? "Pay before pickup"
                          : "Pay before delivery"
                        : isPickupMode
                          ? "Pay on pickup"
                          : "Pay on delivery";
                    return `
                      <button type="button" class="w-full text-left border ${active ? "border-slate-900 ring-2 ring-slate-900/10" : "border-slate-100"} rounded-2xl px-4 py-3 flex items-center gap-3 hover:border-slate-300 transition" onclick="this.closest('app-public-order-page').paymentMode='${mode}'; this.closest('app-public-order-page').updateView();">
                        <div class="w-4 h-4 rounded-full border ${active ? "border-slate-900" : "border-slate-300"} flex items-center justify-center">
                          ${active ? `<span class="w-2 h-2 bg-slate-900 rounded-full"></span>` : ""}
                        </div>
                        <span class="text-sm font-semibold text-slate-900">${label}</span>
                      </button>
                    `;
                  })
                  .join("")}
              </div>
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

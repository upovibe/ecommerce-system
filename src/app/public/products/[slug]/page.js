import App from "@/core/App.js";
import api from "@/services/api.js";
import "@/components/ui/ContentDisplay.js";
import "@/components/ui/Modal.js";
import "@/components/ui/Input.js";
import "@/components/ui/Dropdown.js";
import "@/components/ui/Textarea.js";
import "@/components/ui/Toast.js";

class PublicProductDetailsPage extends App {
  constructor() {
    super();
    this.product = null;
    this.loading = true;
    this.error = "";
    this.currencyCode = "USD";
    this.gallery = [];
    this.activeImageIndex = 0;
    this.autoSlideTimer = null;
    this.allowedOrderTypes = [];
    this.allowedPaymentModes = [];
    this._checkoutLoading = false;
    this.allowLogin = true;
    this.guestCheckoutOpen = false;
    this.guestCheckoutSubmitting = false;
    this.guestOrderItems = [];
    this.guestCheckoutSource = "single";
    this.guestOrderType = "";
    this.guestPaymentMode = "";
    this.guestForm = {
      name: "",
      email: "",
      phone: "",
      address: "",
      note: "",
    };
    this._lastRendered = "";
    this._routeRetries = 0;
    this.routeParams = {};
  }

  set(key, value) {
    this.data[key] = value;
    if (key === "routeParams") {
      this.routeParams = value || {};
      this.loadProductFromRoute(true);
    }
    if (this.isConnected) this.updateView();
    return this;
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
    await this.loadCurrency();
    await this.loadCheckoutSettings();
    await this.loadLoginSetting();
    if (this.dataset.route) {
      try {
        this.routeParams = JSON.parse(decodeURIComponent(this.dataset.route));
      } catch (_) {
        // ignore bad data
      }
    }
    this.loadProductFromRoute();
  }

  disconnectedCallback() {
    if (this.autoSlideTimer) {
      clearInterval(this.autoSlideTimer);
      this.autoSlideTimer = null;
    }
  }

  async loadCurrency() {
    try {
      const res = await api.get("/settings/key/currency");
      const value = res?.data?.data?.setting_value;
      if (value) this.currencyCode = String(value).toUpperCase();
    } catch (_) {
      // keep default
    }
  }

  async loadCheckoutSettings() {
    try {
      const [typesRes, modesRes] = await Promise.all([
        api.get("/settings/key/allowed_order_types").catch(() => null),
        api.get("/settings/key/allowed_payment_modes").catch(() => null),
      ]);
      this.allowedOrderTypes = this.parseSettingList(
        typesRes?.data?.data?.setting_value,
      );
      this.allowedPaymentModes = this.parseSettingList(
        modesRes?.data?.data?.setting_value,
      );
    } catch (_) {
      this.allowedOrderTypes = [];
      this.allowedPaymentModes = [];
    }
  }

  async loadLoginSetting() {
    try {
      const res = await api.get("/settings/key/enable_user_login");
      const raw = String(res?.data?.data?.setting_value ?? "1").toLowerCase();
      this.allowLogin = !(raw === "0" || raw === "false" || raw === "no");
    } catch (_) {
      this.allowLogin = true;
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

  loadProductFromRoute(force = false) {
    const params = this.routeParams || this.get("routeParams") || {};
    const slug = params.slug;
    if (!slug) {
      if (this._routeRetries < 6) {
        this._routeRetries += 1;
        setTimeout(() => this.loadProductFromRoute(), 60);
        return;
      }
      this.loading = false;
      this.error = "Product not found";
      this.updateView();
      return;
    }

    if (!force && slug === this.currentSlug && this.product) return;
    this.currentSlug = slug;
    this.loadProduct(slug);
  }

  async loadProduct(slug) {
    this.loading = true;
    this.error = "";
    this.updateView();
    try {
      const res = await api.get(`/products/public/${encodeURIComponent(slug)}`);
      this.product = res?.data?.data || null;
      if (!this.product) this.error = "Product not found";
    } catch (e) {
      this.product = null;
      this.error =
        e?.response?.data?.message || "Unable to load this product.";
    } finally {
      this.loading = false;
      this.gallery = this.buildGallery(this.product);
      this.activeImageIndex = 0;
      this.startAutoSlide();
      this.updateView();
    }
  }

  startAutoSlide() {
    if (this.autoSlideTimer) {
      clearInterval(this.autoSlideTimer);
      this.autoSlideTimer = null;
    }
    if (this.gallery.length <= 1) return;
    this.autoSlideTimer = setInterval(() => {
      this.activeImageIndex =
        (this.activeImageIndex + 1) % this.gallery.length;
      this.updateView();
    }, 5000);
  }

  attachEvents() {
    const prev = this.querySelector("[data-gallery-prev]");
    const next = this.querySelector("[data-gallery-next]");
    const thumbs = this.querySelectorAll("[data-gallery-thumb]");
    const dots = this.querySelectorAll("[data-gallery-dot]");

    if (prev) {
      prev.addEventListener("click", () => {
        if (!this.gallery.length) return;
        this.activeImageIndex =
          (this.activeImageIndex - 1 + this.gallery.length) %
          this.gallery.length;
        this.updateView();
      });
    }

    if (next) {
      next.addEventListener("click", () => {
        if (!this.gallery.length) return;
        this.activeImageIndex =
          (this.activeImageIndex + 1) % this.gallery.length;
        this.updateView();
      });
    }

    thumbs.forEach((thumb) => {
      thumb.addEventListener("click", () => {
        const idx = Number(thumb.dataset.index || 0);
        this.activeImageIndex = idx;
        this.updateView();
      });
    });

    dots.forEach((dot) => {
      dot.addEventListener("click", () => {
        const idx = Number(dot.dataset.index || 0);
        this.activeImageIndex = idx;
        this.updateView();
      });
    });

    const addBtn = this.querySelector("[data-add-to-cart]");
    const buyBtn = this.querySelector("[data-buy-now]");
    const wishBtn = this.querySelector("[data-save-wishlist]");
    if (addBtn) addBtn.addEventListener("click", () => this.handleAddToCart());
    if (buyBtn) buyBtn.addEventListener("click", () => this.handleBuyNow());
    if (wishBtn) wishBtn.addEventListener("click", () => this.handleWishlist());

    const guestCancel = this.querySelector("[data-guest-checkout-cancel]");
    const guestSubmit = this.querySelector("[data-guest-checkout-submit]");
    if (guestCancel)
      guestCancel.addEventListener("click", () => this.closeGuestCheckout());
    if (guestSubmit)
      guestSubmit.addEventListener("click", () => this.submitGuestCheckout());
  }

  buildGallery(product) {
    if (!product) return [];
    const images = [];
    if (product.main_image) images.push(product.main_image);
    if (Array.isArray(product.images)) {
      product.images.forEach((img) => {
        if (img && !images.includes(img)) images.push(img);
      });
    }
    return images;
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
    return `${baseUrl}/api/${path.replace(/^\/+/, "")}`;
  }

  formatCurrency(value) {
    const val = Number(value || 0);
    return new Intl.NumberFormat("en-US", {
      style: "currency",
      currency: this.currencyCode || "USD",
    }).format(val);
  }

  ensureAuth() {
    const token = localStorage.getItem("token");
    if (token) return true;
    this.setPostLoginRedirect();
    window.Toast?.show?.({
      title: "Sign in required",
      message: "Please sign in to continue.",
      variant: "warning",
    });
    setTimeout(() => {
      window.location.href = "/auth/customer-login";
    }, 600);
    return false;
  }

  setPostLoginRedirect() {
    const current = `${window.location.pathname}${window.location.search || ""}`;
    localStorage.setItem("post_login_redirect", current);
  }

  handleGuestInputChange(field, value) {
    this.guestForm[field] = value;
  }

  addToGuestWishlist(product) {
    if (!product) return;
    let list = [];
    try {
      list = JSON.parse(localStorage.getItem("guest_wishlist") || "[]");
    } catch (_) {
      list = [];
    }
    if (!Array.isArray(list)) list = [];
    if (list.some((item) => Number(item.product_id) === Number(product.id))) {
      return;
    }
    list.push({
      product_id: product.id,
      product_name: product.name,
      main_image: product.main_image,
      base_price: product.base_price,
    });
    localStorage.setItem("guest_wishlist", JSON.stringify(list));
  }

  openGuestCheckout(items = [], source = "single") {
    this.guestOrderItems = Array.isArray(items) ? items : [];
    this.guestCheckoutSource = source;
    this.guestOrderType =
      this.allowedOrderTypes[0] ||
      (this.product?.type === "service" ? "service" : "delivery");
    this.guestPaymentMode = this.allowedPaymentModes[0] || "pay_on_delivery";
    this.guestCheckoutOpen = true;
    this.updateView();
  }

  closeGuestCheckout() {
    this.guestCheckoutOpen = false;
    this.updateView();
  }

  async submitGuestCheckout() {
    if (this.guestCheckoutSubmitting) return;
    if (!this.guestOrderItems.length) {
      window.Toast?.show?.({
        title: "Cart empty",
        message: "Please add an item before checking out.",
        variant: "warning",
      });
      return;
    }
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
      await api.post("/orders/guest", {
        customer: {
          name,
          email,
          phone,
          address,
          note: this.guestForm.note || "",
        },
        items: this.guestOrderItems.map((item) => ({
          product_id: item.product_id,
          quantity: item.quantity || 1,
          variant_id: item.variant_id || null,
        })),
        order_type:
          this.guestOrderType ||
          this.allowedOrderTypes[0] ||
          (this.product?.type === "service" ? "service" : "delivery"),
        payment_mode:
          this.guestPaymentMode ||
          this.allowedPaymentModes[0] ||
          "pay_on_delivery",
      });

      if (this.guestCheckoutSource === "cart") {
        localStorage.removeItem("guest_cart");
        localStorage.setItem("cart_count", "0");
      }
      window.Toast?.show?.({
        title: "Order placed",
        message: "Your order has been received. A receipt was sent to your email.",
        variant: "success",
      });
      this.guestCheckoutOpen = false;
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

  addToGuestCart(product, quantity = 1) {
    if (!product) return;
    const raw = localStorage.getItem("guest_cart");
    let items = [];
    try {
      items = raw ? JSON.parse(raw) : [];
    } catch (_) {
      items = [];
    }
    if (!Array.isArray(items)) items = [];

    const existing = items.find(
      (i) => Number(i.product_id) === Number(product.id),
    );
    if (existing) {
      existing.quantity = Number(existing.quantity || 0) + Number(quantity || 1);
    } else {
      items.push({
        id: `g_${product.id}`,
        product_id: product.id,
        product_name: product.name,
        main_image: product.main_image,
        category_name: product.category_name,
        unit_price: product.discounted_price ?? product.base_price,
        quantity: Number(quantity || 1),
      });
    }

    localStorage.setItem("guest_cart", JSON.stringify(items));
    localStorage.setItem(
      "cart_count",
      String(items.reduce((sum, i) => sum + (Number(i.quantity || 0) || 0), 0)),
    );
    this.emitCartUpdated();
  }

  emitCartUpdated() {
    const evt = new CustomEvent("cart:updated");
    window.dispatchEvent(evt);
    document.dispatchEvent(evt);
    const layout = document.querySelector("app-public-layout");
    if (layout?.updateCartBadge) layout.updateCartBadge();
  }

  async handleAddToCart() {
    if (!this.product) return;
    if (this._checkoutLoading) return;
    this._checkoutLoading = true;
    const token = localStorage.getItem("token");
    if (!token) {
      this.addToGuestCart(this.product, 1);
      window.Toast?.show?.({
        title: "Added",
        message: "Item added to cart.",
        variant: "success",
      });
      this._checkoutLoading = false;
      return;
    }
    try {
      await api.post("/cart/items", {
        product_id: this.product.id,
        quantity: 1,
      });
      localStorage.setItem(
        "cart_count",
        String((parseInt(localStorage.getItem("cart_count") || "0", 10) || 0) + 1),
      );
      this.emitCartUpdated();
      window.Toast?.show?.({
        title: "Added",
        message: "Item added to cart.",
        variant: "success",
      });
    } catch (e) {
      window.Toast?.show?.({
        title: "Error",
        message: e.response?.data?.message || "Failed to add to cart.",
        variant: "error",
      });
    } finally {
      this._checkoutLoading = false;
    }
  }

  async handleBuyNow() {
    if (!this.product) return;
    if (this._checkoutLoading) return;
    this._checkoutLoading = true;
    try {
      const token = localStorage.getItem("token");
      if (!token) {
        if (this.allowLogin) {
          this.setPostLoginRedirect();
          window.Toast?.show?.({
            title: "Account required",
            message: "Create an account to complete checkout.",
            variant: "warning",
          });
          setTimeout(() => {
            window.location.href = "/auth/customer-signup";
          }, 600);
        } else {
          this.openGuestCheckout(
            [
              {
                product_id: this.product.id,
                quantity: 1,
                variant_id: null,
              },
            ],
            "single",
          );
        }
        return;
      }

      await api.post("/cart/items", {
        product_id: this.product.id,
        quantity: 1,
      });

      const orderType =
        this.allowedOrderTypes[0] ||
        (this.product.type === "service" ? "service" : "delivery");
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
    } catch (e) {
      window.Toast?.show?.({
        title: "Error",
        message: e.response?.data?.message || "Failed to create order.",
        variant: "error",
      });
    } finally {
      this._checkoutLoading = false;
    }
  }

  async handleWishlist() {
    if (!this.product) return;
    if (this.allowLogin) {
      const token = localStorage.getItem("token");
      if (!token) {
        this.setPostLoginRedirect();
        window.Toast?.show?.({
          title: "Sign in required",
          message: "Please sign in to save items.",
          variant: "warning",
        });
        setTimeout(() => {
          window.location.href = "/auth/customer-login";
        }, 600);
        return;
      }
      try {
        await api.post("/wishlist/items", { product_id: this.product.id });
        window.Toast?.show?.({
          title: "Saved",
          message: "Added to wishlist.",
          variant: "success",
        });
      } catch (e) {
        window.Toast?.show?.({
          title: "Error",
          message: e.response?.data?.message || "Failed to add to wishlist.",
          variant: "error",
        });
      }
      return;
    }

    this.addToGuestWishlist(this.product);
    window.Toast?.show?.({
      title: "Saved",
      message: "Added to wishlist.",
      variant: "success",
    });
  }

  renderVariants() {
    const variants = Array.isArray(this.product?.variants)
      ? this.product.variants
      : [];
    if (!variants.length) {
      return `<p class="text-sm text-slate-500">No variants configured for this product.</p>`;
    }

    const grouped = variants.reduce((acc, v) => {
      const type = v.type_name || v.variant_options?.type || "Variant";
      if (!acc[type]) acc[type] = [];
      acc[type].push(v);
      return acc;
    }, {});

    return Object.entries(grouped)
      .map(([type, items]) => {
        const chips = items
          .map((item) => {
            const label = item.value || item.variant_options?.value || "N/A";
            const qty =
              item.quantity !== null && item.quantity !== undefined
                ? ` • ${item.quantity} in stock`
                : "";
            return `<span class="inline-flex items-center gap-2 px-3 py-1.5 rounded-full bg-slate-100 text-slate-700 text-xs font-semibold">${label}${qty}</span>`;
          })
          .join("");
        return `
          <div>
            <p class="text-xs font-semibold text-slate-500 mb-2">${type}</p>
            <div class="flex flex-wrap gap-2">${chips}</div>
          </div>
        `;
      })
      .join("");
  }

  renderDetails() {
    const details = this.product?.details;
    if (!details) return "";

    if (typeof details === "string") {
      const contentAttr = details.replace(/"/g, "&quot;");
      return `<content-display content="${contentAttr}" no-styles></content-display>`;
    }

    const entries = Array.isArray(details)
      ? details.map((item, idx) => ({
          label: item?.label || `Detail ${idx + 1}`,
          value: item?.value ?? item,
        }))
      : Object.entries(details).map(([key, value]) => ({
          label: key,
          value,
        }));

    return `
      <div class="space-y-3">
        ${entries
          .map(
            (entry) => `
              <div class="flex items-start justify-between gap-6 border-b border-slate-100 pb-3">
                <span class="text-xs font-semibold text-slate-500">${entry.label}</span>
                <span class="text-sm font-semibold text-slate-800 text-right break-words">${entry.value ?? ""}</span>
              </div>
            `,
          )
          .join("")}
      </div>
    `;
  }

  renderGallery() {
    const images = this.gallery || [];
    const active =
      images.length > 0 ? this.getImageUrl(images[this.activeImageIndex]) : "";
    const dots =
      images.length > 1
        ? `
          <div class="absolute bottom-5 left-1/2 -translate-x-1/2 flex items-center gap-2">
            ${images
              .map((_, idx) => {
                const activeDot =
                  idx === this.activeImageIndex
                    ? "bg-white w-6"
                    : "bg-white/50 w-2.5";
                return `<button data-gallery-dot data-index="${idx}" class="h-2.5 ${activeDot} rounded-full transition-all"></button>`;
              })
              .join("")}
          </div>
        `
        : "";

    return `
      <div class="relative rounded-3xl bg-slate-50 overflow-hidden aspect-[4/5]">
        ${
          active
            ? `<img src="${active}" alt="${this.product?.name || "Product"}" class="absolute inset-0 w-full h-full object-cover transition-opacity duration-700">`
            : `<div class="absolute inset-0 flex items-center justify-center text-slate-300 text-5xl"><i class="fas fa-image"></i></div>`
        }
        ${
          images.length > 1
            ? `
            <button data-gallery-prev class="absolute left-4 top-1/2 -translate-y-1/2 w-10 h-10 rounded-full bg-white/80 backdrop-blur text-slate-700 shadow hover:bg-white transition">
              <i class="fas fa-chevron-left text-xs"></i>
            </button>
            <button data-gallery-next class="absolute right-4 top-1/2 -translate-y-1/2 w-10 h-10 rounded-full bg-white/80 backdrop-blur text-slate-700 shadow hover:bg-white transition">
              <i class="fas fa-chevron-right text-xs"></i>
            </button>
          `
            : ""
        }
        ${dots}
      </div>
      ${
        images.length > 1
          ? `
        <div class="grid grid-cols-4 gap-3 mt-4">
          ${images
            .map((img, idx) => {
              const url = this.getImageUrl(img);
              const activeClass =
                idx === this.activeImageIndex
                  ? "ring-2 ring-slate-900"
                  : "ring-1 ring-transparent";
              return `
                <button data-gallery-thumb data-index="${idx}" class="relative aspect-square rounded-2xl overflow-hidden ${activeClass} transition">
                  <img src="${url}" alt="Thumbnail ${idx + 1}" class="w-full h-full object-cover">
                </button>
              `;
            })
            .join("")}
        </div>
      `
          : ""
      }
    `;
  }

  renderGuestCheckoutModal() {
    const orderTypes = this.allowedOrderTypes.length
      ? this.allowedOrderTypes
      : ["delivery", "service"];
    const paymentModes = this.allowedPaymentModes.length
      ? this.allowedPaymentModes
      : ["pay_on_delivery", "pay_before_delivery", "in_person"];
    return `
      <ui-modal id="guest-checkout-modal" ${this.guestCheckoutOpen ? "open" : ""} position="right" size="md">
        <div slot="title">Guest checkout</div>
        <div class="space-y-4">
          <p class="text-xs text-slate-500">Complete your order without signing in. A receipt will be emailed to you.</p>
          <div>
            <label class="block text-xs font-semibold text-slate-500 mb-1">Full name</label>
            <ui-input value="${this.guestForm.name}" placeholder="Jane Doe" oninput="this.closest('app-public-product-details-page').handleGuestInputChange('name', this.value)"></ui-input>
          </div>
          <div>
            <label class="block text-xs font-semibold text-slate-500 mb-1">Email</label>
            <ui-input type="email" value="${this.guestForm.email}" placeholder="you@email.com" oninput="this.closest('app-public-product-details-page').handleGuestInputChange('email', this.value)"></ui-input>
          </div>
          <div>
            <label class="block text-xs font-semibold text-slate-500 mb-1">Phone</label>
            <ui-input value="${this.guestForm.phone}" placeholder="+1 555 000 000" oninput="this.closest('app-public-product-details-page').handleGuestInputChange('phone', this.value)"></ui-input>
          </div>
          <div>
            <label class="block text-xs font-semibold text-slate-500 mb-1">Delivery address</label>
            <ui-textarea rows="3" value="${this.guestForm.address}" placeholder="Street, City, State" oninput="this.closest('app-public-product-details-page').handleGuestInputChange('address', this.value)"></ui-textarea>
          </div>
          <div class="grid grid-cols-2 gap-3">
            <div>
              <label class="block text-xs font-semibold text-slate-500 mb-1">Order type</label>
              <ui-dropdown value="${this.guestOrderType || orderTypes[0]}" onchange="this.closest('app-public-product-details-page').guestOrderType = event.detail.value">
                ${orderTypes.map((t) => `<ui-option value="${t}">${t}</ui-option>`).join("")}
              </ui-dropdown>
            </div>
            <div>
              <label class="block text-xs font-semibold text-slate-500 mb-1">Payment mode</label>
              <ui-dropdown value="${this.guestPaymentMode || paymentModes[0]}" onchange="this.closest('app-public-product-details-page').guestPaymentMode = event.detail.value">
                ${paymentModes.map((m) => `<ui-option value="${m}">${m}</ui-option>`).join("")}
              </ui-dropdown>
            </div>
          </div>
          <div>
            <label class="block text-xs font-semibold text-slate-500 mb-1">Notes (optional)</label>
            <ui-textarea rows="2" value="${this.guestForm.note}" placeholder="Add delivery instructions" oninput="this.closest('app-public-product-details-page').handleGuestInputChange('note', this.value)"></ui-textarea>
          </div>
        </div>
        <button slot="footer" class="secondary" data-guest-checkout-cancel>Cancel</button>
        <button slot="footer" class="primary" data-guest-checkout-submit ${this.guestCheckoutSubmitting ? "disabled" : ""}>
          ${this.guestCheckoutSubmitting ? "Placing..." : "Place order"}
        </button>
      </ui-modal>
    `;
  }

  render() {
    if (this.loading) {
      return `
        <section class="max-w-6xl mx-auto px-6 py-12">
          <div class="grid lg:grid-cols-[1.15fr_1fr] gap-10">
            <div class="rounded-3xl bg-slate-100 animate-pulse aspect-[4/5]"></div>
            <div class="space-y-6">
              <div class="h-4 w-32 bg-slate-100 rounded-full animate-pulse"></div>
              <div class="h-10 w-3/4 bg-slate-100 rounded-xl animate-pulse"></div>
              <div class="h-6 w-40 bg-slate-100 rounded-xl animate-pulse"></div>
              <div class="h-24 w-full bg-slate-100 rounded-2xl animate-pulse"></div>
            </div>
          </div>
        </section>
      `;
    }

    if (this.error || !this.product) {
      return `
        <section class="max-w-4xl mx-auto px-6 py-20 text-center">
          <p class="text-sm font-semibold text-slate-400 mb-3">Product details</p>
          <h1 class="text-3xl font-black text-slate-900 mb-4">We couldn't find that product.</h1>
          <p class="text-slate-500 mb-8">${this.error || "Product not found."}</p>
          <a href="/public/products" class="inline-flex items-center gap-2 px-6 py-3 rounded-xl bg-slate-900 text-white text-sm font-semibold hover:bg-slate-800 transition">
            <i class="fas fa-arrow-left text-xs"></i>
            Back to products
          </a>
        </section>
      `;
    }

    const product = this.product;
    const price = this.formatCurrency(product.discounted_price ?? product.base_price);
    const basePrice = this.formatCurrency(product.base_price);
    const showPromo = product.is_on_promotion && product.promotion_details;
    const status =
      product.stock_status === "in_stock"
        ? "In stock"
        : product.stock_status === "low_stock"
        ? "Low stock"
        : "Out of stock";
    const statusClass =
      product.stock_status === "in_stock"
        ? "bg-emerald-100 text-emerald-700"
        : product.stock_status === "low_stock"
        ? "bg-amber-100 text-amber-700"
        : "bg-rose-100 text-rose-700";

    const description = product.description || "";
    const descriptionAttr = description.replace(/"/g, "&quot;");

    return `
      <section class="max-w-6xl mx-auto px-6 py-10">
        <div class="text-xs text-slate-500 mb-6 flex flex-wrap gap-2">
          <a href="/" class="hover:text-slate-900">Home</a>
          <span>/</span>
          <a href="/public/products" class="hover:text-slate-900">Products</a>
          <span>/</span>
          <span class="text-slate-900 font-semibold">${product.name || "Product"}</span>
        </div>

        <div class="grid lg:grid-cols-[1.15fr_1fr] gap-12 items-start">
          <div>
            ${this.renderGallery()}
          </div>

          <div class="space-y-6">
            <div>
              <p class="text-xs font-semibold text-slate-500 mb-2">${product.category_name || "General"}</p>
              <h1 class="text-3xl sm:text-4xl font-black text-slate-900 leading-tight">${product.name || "Untitled Product"}</h1>
            </div>

            <div class="flex flex-wrap items-center gap-3">
              <span class="text-2xl font-black text-slate-900">${price}</span>
              ${
                showPromo
                  ? `<span class="text-sm font-semibold text-slate-400 line-through">${basePrice}</span>`
                  : ""
              }
              ${
                showPromo
                  ? `<span class="px-3 py-1.5 rounded-full bg-indigo-100 text-indigo-700 text-xs font-bold">${product.promotion_details.label || "Promo"}</span>`
                  : ""
              }
            </div>

            <div class="flex flex-wrap items-center gap-3">
              <span class="px-3 py-1.5 rounded-full text-xs font-semibold ${statusClass}">${status}</span>
              ${
                product.total_stock !== null && product.total_stock !== undefined
                  ? `<span class="text-xs font-semibold text-slate-500">${product.total_stock} total units</span>`
                  : ""
              }
            </div>

            <div class="grid grid-cols-2 gap-4 text-xs text-slate-600">
              <div class="p-3 rounded-2xl bg-white border border-slate-100">
                <p class="text-[10px] font-semibold text-slate-400 mb-1">SKU</p>
                <p class="font-semibold text-slate-900">${product.sku || "—"}</p>
              </div>
              <div class="p-3 rounded-2xl bg-white border border-slate-100">
                <p class="text-[10px] font-semibold text-slate-400 mb-1">Product code</p>
                <p class="font-semibold text-slate-900">${product.product_code || "—"}</p>
              </div>
            </div>

            <div class="grid grid-cols-2 gap-4 text-sm">
              <div class="p-4 rounded-2xl bg-slate-50 border border-slate-100">
                <p class="text-xs font-semibold text-slate-500 mb-1">Brand</p>
                <p class="font-semibold text-slate-900">${product.brand_name || "—"}</p>
              </div>
              <div class="p-4 rounded-2xl bg-slate-50 border border-slate-100">
                <p class="text-xs font-semibold text-slate-500 mb-1">Material</p>
                <p class="font-semibold text-slate-900">${product.material_name || "—"}</p>
              </div>
            </div>

            <div class="p-5 rounded-2xl border border-slate-100 bg-white shadow-sm">
              <p class="text-xs font-semibold text-slate-500 mb-3">Available variations</p>
              ${this.renderVariants()}
            </div>

            <div class="flex flex-wrap items-center gap-3">
              <button data-add-to-cart class="px-6 py-3 rounded-2xl bg-slate-900 text-white text-sm font-semibold hover:bg-slate-800 transition">Add to cart</button>
              <button data-buy-now class="px-5 py-3 rounded-2xl border border-slate-200 text-sm font-semibold text-slate-700 hover:border-slate-300 hover:text-slate-900 transition">Buy now</button>
              <button data-save-wishlist class="px-5 py-3 rounded-2xl border border-slate-200 text-sm font-semibold text-slate-700 hover:border-rose-300 hover:text-rose-500 transition">Save to wishlist</button>
            </div>
          </div>
        </div>

        <div class="grid lg:grid-cols-[1fr_320px] gap-10 mt-14">
          <div class="space-y-8">
            <div>
              <h2 class="text-xl font-black text-slate-900 mb-3">Product overview</h2>
              ${
                description
                  ? `<content-display content="${descriptionAttr}" no-styles></content-display>`
                  : `<p class="text-sm text-slate-500">No description has been provided for this product.</p>`
              }
            </div>

            ${
              this.product?.details
                ? `
              <div>
                <h3 class="text-lg font-black text-slate-900 mb-3">Details</h3>
                ${this.renderDetails()}
              </div>
            `
                : ""
            }
          </div>

          <div class="space-y-6">
            <div class="p-6 rounded-3xl bg-slate-900 text-white">
              <p class="text-xs font-semibold text-slate-300 mb-2">Need help?</p>
              <h3 class="text-lg font-black mb-3">Talk to our product team</h3>
              <p class="text-sm text-slate-300 mb-5">We can help you with sizing, custom orders, and delivery timelines.</p>
              <a href="/profile" class="inline-flex items-center gap-2 px-4 py-2.5 rounded-xl bg-white text-slate-900 text-xs font-semibold">
                Contact support
                <i class="fas fa-arrow-right text-[10px]"></i>
              </a>
            </div>

            <div class="p-6 rounded-3xl bg-slate-50 border border-slate-100">
              <p class="text-xs font-semibold text-slate-500 mb-2">Category</p>
              <h4 class="text-base font-black text-slate-900 mb-4">${product.category_name || "General"}</h4>
              <p class="text-sm text-slate-500">Explore more pieces curated under this collection.</p>
              <a href="/public/products?category=${encodeURIComponent(product.category_name || "")}" class="inline-flex items-center gap-2 mt-4 text-xs font-semibold text-slate-900 hover:text-indigo-600">
                View related products
                <i class="fas fa-chevron-right text-[10px]"></i>
              </a>
            </div>
          </div>
        </div>
      </section>
      ${this.renderGuestCheckoutModal()}
    `;
  }
}

customElements.define("app-public-product-details-page", PublicProductDetailsPage);
export default PublicProductDetailsPage;

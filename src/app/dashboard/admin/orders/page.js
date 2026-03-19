import App from "@/core/App.js";
import "@/components/ui/Button.js";
import "@/components/ui/Table.js";
import "@/components/ui/Modal.js";
import "@/components/ui/Dropdown.js";
import "@/components/ui/Toast.js";
import "@/components/ui/Skeleton.js";
import "@/components/layout/adminLayout/OrderViewModal.js";
import "@/components/layout/adminLayout/OrderUpdateModal.js";
import api from "@/services/api.js";
import Toast from "@/components/ui/Toast.js";

class OrdersPage extends App {
  constructor() {
    super();
    this.orders = [];
    this.loading = true;
    this.currencyCode = "USD";
    this.filters = { status: "", order_type: "", payment_mode: "" };
    this.allowedOrderTypes = [];
    this.allowedPaymentModes = [];
    this.selectedOrder = null;
    this._lastRendered = "";
    this._isInitialized = false;

    this._onTableRefresh = () => this.fetchData(true);
    this._onTableView = (e) => {
      const id = e?.detail?.row?.id;
      if (id != null) this.openViewModal(id);
    };
    this._onTableEdit = (e) => {
      const id = e?.detail?.row?.id;
      if (id != null) this.openEditModal(id);
    };
  }

  async connectedCallback() {
    super.connectedCallback();
    if (this._isInitialized) return;
    this._isInitialized = true;

    this.addEventListener("table-refresh", this._onTableRefresh);
    this.addEventListener("table-view", this._onTableView);
    this.addEventListener("table-edit", this._onTableEdit);

    await this.fetchData();
  }

  updateView() {
    const next = this.render();
    if (next === this._lastRendered) return;
    this._lastRendered = next;
    this.innerHTML = next;
  }

  async fetchData(force = false) {
    if (!this.loading || force) {
      this.loading = true;
      this.updateView();
    }
    try {
      const [ordersRes, currencyRes, typesRes, modesRes] = await Promise.all([
        api.get("/orders"),
        api.get("/settings/key/currency").catch(() => null),
        api.get("/settings/key/allowed_order_types").catch(() => null),
        api.get("/settings/key/allowed_payment_modes").catch(() => null),
      ]);
      this.orders = ordersRes?.data?.data || [];
      const currencyVal = currencyRes?.data?.data?.setting_value;
      if (currencyVal) this.currencyCode = String(currencyVal).toUpperCase();

      const typesRaw = typesRes?.data?.data?.setting_value;
      const modesRaw = modesRes?.data?.data?.setting_value;
      this.allowedOrderTypes = this.parseSettingList(typesRaw);
      this.allowedPaymentModes = this.parseSettingList(modesRaw);
    } catch (e) {
      Toast.show({ title: "Error", message: "Failed to load orders", variant: "error" });
    } finally {
      this.loading = false;
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

  getFilteredOrders() {
    let rows = Array.isArray(this.orders) ? [...this.orders] : [];
    const { status, order_type, payment_mode } = this.filters;
    if (status) rows = rows.filter((o) => String(o.status) === String(status));
    if (order_type) rows = rows.filter((o) => String(o.order_type || "delivery") === String(order_type));
    if (payment_mode) rows = rows.filter((o) => String(o.payment_mode || o.payment_method) === String(payment_mode));
    return rows;
  }

  handleFilterChange(e) {
    const target = e?.target;
    const value = e?.detail?.value ?? target?.value ?? "";
    if (!target?.id) return;

    if (target.id === "filter-status") this.filters.status = value;
    if (target.id === "filter-order-type") this.filters.order_type = value;
    if (target.id === "filter-payment-mode") this.filters.payment_mode = value;

    this.updateView();
  }

  resetFilters() {
    this.filters = { status: "", order_type: "", payment_mode: "" };
    this.updateView();
  }

  async openViewModal(id) {
    try {
      const res = await api.get(`/orders/${id}`);
      const order = res?.data?.data;
      if (!order) return;
      const viewModal = this.querySelector("order-view-modal");
      if (viewModal) {
        viewModal.setOrder(order);
        viewModal.open();
      }
    } catch (e) {
      Toast.show({ title: "Error", message: "Failed to load order details", variant: "error" });
    }
  }

  openEditModal(id) {
    const order = (this.orders || []).find((o) => o.id == id);
    if (!order) return;
    this.selectedOrder = order;
    const updateModal = this.querySelector("order-update-modal");
    if (updateModal) {
      updateModal.setOrder(order, {
        orderTypes: this.allowedOrderTypes,
        paymentModes: this.allowedPaymentModes,
      });
      updateModal.open();
    }
  }

  async submitOrderUpdate() {
    if (!this.selectedOrder) return;
    const modal = this.querySelector("order-update-modal");
    const statusEl = modal?.querySelector("#order-status");
    const typeEl = modal?.querySelector("#order-type");
    const modeEl = modal?.querySelector("#order-payment-mode");
    const payload = {
      status: statusEl?.value ?? this.selectedOrder.status,
      order_type: typeEl?.value ?? this.selectedOrder.order_type,
      payment_mode: modeEl?.value ?? this.selectedOrder.payment_mode,
    };

    try {
      await api.put(`/orders/${this.selectedOrder.id}`, payload);
      Toast.show({ title: "Updated", message: "Order updated successfully", variant: "success" });
      modal?.close();
      await this.fetchData(true);
    } catch (e) {
      Toast.show({ title: "Error", message: "Failed to update order", variant: "error" });
    }
  }

  getCounts() {
    const rows = Array.isArray(this.orders) ? this.orders : [];
    return {
      total: rows.length,
      pending: rows.filter((o) => o.status === "pending").length,
      completed: rows.filter((o) => o.status === "completed").length,
      cancelled: rows.filter((o) => o.status === "cancelled").length,
      delivery: rows.filter((o) => (o.order_type || "delivery") === "delivery").length,
    };
  }

  render() {
    const counts = this.getCounts();
    const data = this.getFilteredOrders();

    const rows = data.map((o, i) => {
      const statusBadge =
        o.status === "completed"
          ? "bg-emerald-100 text-emerald-700"
          : o.status === "cancelled"
            ? "bg-rose-100 text-rose-700"
            : o.status === "processing"
              ? "bg-blue-100 text-blue-700"
              : "bg-amber-100 text-amber-700";

      const customerType = o.user_id ? "Customer" : "Guest";
      const pickup = o.pickup_contact || {};
      const address =
        o.customer_address && typeof o.customer_address === "object"
          ? [o.customer_address.line1, o.customer_address.line2, o.customer_address.city, o.customer_address.state, o.customer_address.country, o.customer_address.postal]
              .filter(Boolean)
              .join(", ")
          : o.customer_address || "";

      return {
        id: o.id,
        no: i + 1,
        order: `
          <div class="flex flex-col gap-1">
            <div class="text-sm font-bold text-slate-800">#${o.id}</div>
            <div class="text-[10px] text-slate-400">${new Date(o.created_at).toLocaleString()}</div>
            <div class="text-[10px] text-slate-400 truncate">${o.customer_phone || "—"}</div>
          </div>
        `,
        customer: `
          <div class="min-w-0">
            <div class="text-sm font-semibold text-slate-800 truncate">${o.customer_name || "Guest"}</div>
            <div class="text-[10px] text-slate-400 truncate">${o.customer_email || "—"}</div>
            <div class="text-[10px] text-slate-400 truncate">${o.customer_phone || "—"}</div>
          </div>
        `,
        items: `<span class="text-sm font-semibold text-slate-700">${o.items_count || 0}</span>`,
        total: `<span class="text-sm font-bold text-slate-900">${this.fmt(o.total_amount)}</span>`,
        status: `<span class="inline-flex items-center px-2 py-0.5 rounded-full text-[10px] font-bold uppercase tracking-widest ${statusBadge}">${o.status || "pending"}</span>`,
        payment: `<span class="text-xs font-semibold text-slate-600">${o.payment_mode || o.payment_method || "—"}</span>`,
        type: `<span class="text-xs font-semibold text-slate-600 capitalize">${o.order_type || "delivery"}</span>`,
        customer_type: `<span class="text-[10px] font-bold uppercase tracking-widest ${o.user_id ? "text-emerald-700 bg-emerald-50" : "text-slate-600 bg-slate-100"} px-2 py-0.5 rounded-full">${customerType}</span>`,
        fulfillment: `
          <div class="text-[10px] text-slate-500">
            ${o.order_type === "pickup"
              ? `Pickup: ${pickup?.name || "—"} ${pickup?.phone ? `(${pickup.phone})` : ""}`
              : o.order_type === "service"
                ? "Service booking"
                : address || "Delivery"}
          </div>
        `,
      };
    });

    const columns = [
      { key: "no", label: "#", html: false },
      { key: "order", label: "Order", html: true },
      { key: "customer", label: "Customer", html: true },
      { key: "customer_type", label: "Type", html: true },
      { key: "items", label: "Items", html: true },
      { key: "total", label: "Total", html: true },
      { key: "status", label: "Status", html: true },
      { key: "payment", label: "Payment", html: true },
      { key: "type", label: "Type", html: true },
      { key: "fulfillment", label: "Fulfillment", html: true },
    ];

    const safeData = JSON.stringify(rows).replace(/"/g, "&quot;");
    const safeCols = JSON.stringify(columns).replace(/"/g, "&quot;");

    const orderTypeOptions = (this.allowedOrderTypes.length ? this.allowedOrderTypes : ["delivery", "service"])
      .map((t) => `<ui-option value="${t}">${t}</ui-option>`)
      .join("");
    const paymentModeOptions = (this.allowedPaymentModes.length ? this.allowedPaymentModes : ["whatsapp", "card", "mobile_money"])
      .map((t) => `<ui-option value="${t}">${t}</ui-option>`)
      .join("");

    return `
      <div>
        <div class="bg-slate-700 rounded-xl shadow-lg p-5 text-white mb-6">
          <div class="flex flex-col sm:flex-row sm:items-center sm:justify-between mb-5">
            <div class="flex items-center gap-3">
              <h1 class="text-2xl sm:text-3xl font-bold">Orders</h1>
              <button onclick="this.closest('app-orders-page').fetchData(true)"
                class="size-8 mt-1 flex items-center justify-center text-white/80 hover:text-white hover:bg-white/10 rounded-lg transition" title="Refresh">
                <i class="fas fa-sync-alt text-lg ${this.loading ? "animate-spin" : ""}"></i>
              </button>
            </div>
            <p class="text-slate-300 text-sm mt-1 sm:mt-0">Track and manage customer transactions</p>
          </div>
          <div class="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 gap-3">
            ${[
              { label: "Total", value: counts.total, icon: "fa-receipt", color: "bg-indigo-500" },
              { label: "Pending", value: counts.pending, icon: "fa-clock", color: "bg-amber-500" },
              { label: "Completed", value: counts.completed, icon: "fa-check-circle", color: "bg-emerald-500" },
              { label: "Cancelled", value: counts.cancelled, icon: "fa-times-circle", color: "bg-rose-500" },
              { label: "Delivery", value: counts.delivery, icon: "fa-truck", color: "bg-blue-500" },
            ].map(({ label, value, icon, color }) => `
              <div class="bg-white/10 backdrop-blur rounded-xl p-3 flex items-center gap-3">
                <div class="w-9 h-9 ${color} rounded-lg flex items-center justify-center flex-shrink-0">
                  <i class="fas ${icon} text-white text-sm"></i>
                </div>
                <div>
                  <div class="text-lg font-bold">${this.loading ? "—" : value}</div>
                  <div class="text-white/60 text-xs">${label}</div>
                </div>
              </div>
            `).join("")}
          </div>
        </div>

        <div class="bg-white rounded-xl shadow-sm border border-slate-100 p-4 mb-4">
          <div class="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3">
            <div>
              <label class="block text-xs font-semibold text-slate-500 mb-1">Status</label>
              <ui-dropdown id="filter-status" value="${this.filters.status}" placeholder="All statuses" class="w-full" onchange="this.closest('app-orders-page').handleFilterChange(event)">
                <ui-option value="">All Status</ui-option>
                <ui-option value="pending">pending</ui-option>
                <ui-option value="processing">processing</ui-option>
                <ui-option value="completed">completed</ui-option>
                <ui-option value="cancelled">cancelled</ui-option>
                <ui-option value="refunded">refunded</ui-option>
              </ui-dropdown>
            </div>
            <div>
              <label class="block text-xs font-semibold text-slate-500 mb-1">Order Type</label>
              <ui-dropdown id="filter-order-type" value="${this.filters.order_type}" placeholder="All types" class="w-full" onchange="this.closest('app-orders-page').handleFilterChange(event)">
                <ui-option value="">All Types</ui-option>
                ${orderTypeOptions}
              </ui-dropdown>
            </div>
            <div>
              <label class="block text-xs font-semibold text-slate-500 mb-1">Payment Mode</label>
              <ui-dropdown id="filter-payment-mode" value="${this.filters.payment_mode}" placeholder="All modes" class="w-full" onchange="this.closest('app-orders-page').handleFilterChange(event)">
                <ui-option value="">All Modes</ui-option>
                ${paymentModeOptions}
              </ui-dropdown>
            </div>
            <div class="flex items-end">
              <button onclick="this.closest('app-orders-page').resetFilters()" class="w-full px-3 py-2 rounded-md border border-slate-200 text-slate-600 font-semibold hover:bg-slate-50 transition text-sm">
                Clear Filters
              </button>
            </div>
          </div>
        </div>

        <div class="bg-white rounded-xl shadow-sm border border-slate-100 p-4">
          ${this.loading ? `
            <div class="space-y-3">
              ${Array(5).fill(`<div class="h-12 bg-slate-100 animate-pulse rounded-xl"></div>`).join("")}
            </div>
          ` : `
            <ui-table
              data="${safeData}" columns="${safeCols}"
              sortable searchable search-placeholder="Search orders..."
              pagination page-size="20"
              action actions="view,edit"
              refresh print bordered striped>
            </ui-table>
          `}
        </div>

        <order-view-modal></order-view-modal>
        <order-update-modal></order-update-modal>
      </div>
    `;
  }
}

customElements.define("app-orders-page", OrdersPage);
export default OrdersPage;










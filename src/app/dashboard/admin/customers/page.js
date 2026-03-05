import App from "@/core/App.js";
import "@/components/ui/Button.js";
import "@/components/ui/Table.js";
import "@/components/ui/Skeleton.js";
import "@/components/ui/Toast.js";
import "@/components/layout/adminLayout/CustomerViewModal.js";
import "@/components/layout/adminLayout/CustomerEditModal.js";
import api from "@/services/api.js";

class CustomersPage extends App {
  constructor() {
    super();
    this.customers = [];
    this.loading = true;
    this._lastRendered = "";

    // UI Table Handlers
    this._onTableRefresh = () => this.loadCustomers(true);
    this._onTableEdit = (e) => {
      if (e?.detail?.row?.id != null) this.handleEdit(e.detail.row);
    };
    this._onTableDelete = (e) => {
      if (e?.detail?.row?.id != null) this.handleDelete(e.detail.row.id);
    };
    this._onTableView = (e) => {
      if (e?.detail?.row?.id != null) this.handleView(e.detail.row);
    };

    // Modal Success Handler
    this._onCustomerUpdated = () => this.loadCustomers(true);
  }

  updateView() {
    const next = this.render();
    if (next === this._lastRendered) return;
    this._lastRendered = next;
    this.innerHTML = next;
  }

  async connectedCallback() {
    super.connectedCallback();
    document.title = "Customers Management";

    this.addEventListener("table-refresh", this._onTableRefresh);
    this.addEventListener("table-edit", this._onTableEdit);
    this.addEventListener("table-delete", this._onTableDelete);
    this.addEventListener("table-view", this._onTableView);
    this.addEventListener("customer-updated", this._onCustomerUpdated);

    await this.loadCustomers();
  }

  async loadCustomers(force = false) {
    this.loading = true;
    this.updateView();
    try {
      const res = await api.get("/users?type=customer");
      this.customers = res?.data?.data ?? [];
    } catch (e) {
      Toast.show({
        title: "Error",
        message: "Failed to load customers",
        variant: "error",
      });
    } finally {
      this.loading = false;
      this.updateView();
    }
  }

  handleView(row) {
    const originalData = this.customers.find((c) => c.id === row.id);
    const viewModal = this.querySelector("customer-view-modal");
    if (viewModal) {
      viewModal.setCustomerData(originalData || row);
      viewModal.open();
    }
  }

  handleEdit(row) {
    const originalData = this.customers.find((c) => c.id === row.id);
    const editModal = this.querySelector("customer-edit-modal");
    if (editModal) {
      editModal.setCustomerData(originalData || row);
      editModal.open();
    }
  }

  async handleDelete(id) {
    if (
      !confirm(
        "Are you sure you want to delete this customer? This action cannot be undone.",
      )
    )
      return;

    try {
      const token = localStorage.getItem("token");
      await api.withToken(token).delete(`/users/${id}`);
      Toast.show({
        title: "Deleted",
        message: "Customer account removed",
        variant: "success",
      });
      await this.loadCustomers(true);
    } catch (e) {
      Toast.show({
        title: "Error",
        message: "Failed to delete customer",
        variant: "error",
      });
    }
  }

  getHeaderCounts() {
    const c = this.customers || [];
    const total = c.length;
    const active = c.filter(
      (u) =>
        u.status === "active" ||
        u.status === "Active" ||
        Number(u.is_active) === 1,
    ).length;
    const inactive = total - active;
    return { total, active, inactive };
  }

  renderHeader() {
    const c = this.getHeaderCounts();
    return `
      <div class="space-y-8 mb-4">
        <div class="bg-slate-700 rounded-xl shadow-lg p-5 text-white">
          <div class="flex flex-col sm:flex-row sm:items-center sm:justify-between mb-4 sm:mb-6">
            <div>
              <div class="flex items-center gap-2">
                <h1 class="text-2xl sm:text-3xl font-bold font-brand tracking-tight">Customers</h1>
                <button
                  onclick="this.closest('app-customers-page').loadCustomers(true)"
                  class="size-8 mt-2 flex items-center justify-center text-white/90 hover:text-white transition-colors duration-200 hover:bg-white/10 rounded-lg group"
                  title="Refresh">
                  <i class="fas fa-sync-alt text-lg ${this.loading ? "animate-spin" : ""} group-hover:scale-110 transition-transform duration-200"></i>
                </button>
              </div>
              <p class="text-blue-100 text-base sm:text-lg opacity-80">Manage customer accounts and activity</p>
            </div>
            <div class="mt-4 sm:mt-0 text-right">
              <div class="text-xl sm:text-2xl font-bold">${c.total}</div>
              <div class="text-blue-100 text-xs sm:text-sm">Total Customers</div>
            </div>
          </div>
          <div class="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 sm:gap-6">
            <div class="bg-white bg-opacity-10 backdrop-blur-sm rounded-lg p-4 sm:p-5 border border-white border-opacity-10">
              <div class="flex items-center">
                <div class="size-10 flex items-center justify-center bg-emerald-500 rounded-lg mr-3 flex-shrink-0">
                  <i class="fas fa-user-check text-white text-lg"></i>
                </div>
                <div class="min-w-0 flex-1">
                  <div class="text-xl sm:text-2xl font-bold">${c.active}</div>
                  <div class="text-blue-100 text-xs sm:text-sm">Active Members</div>
                </div>
              </div>
            </div>
            <div class="bg-white bg-opacity-10 backdrop-blur-sm rounded-lg p-4 sm:p-5 border border-white border-opacity-10">
              <div class="flex items-center">
                <div class="size-10 flex items-center justify-center bg-amber-500 rounded-lg mr-3 flex-shrink-0">
                  <i class="fas fa-user-slash text-white text-lg"></i>
                </div>
                <div class="min-w-0 flex-1">
                  <div class="text-xl sm:text-2xl font-bold">${c.inactive}</div>
                  <div class="text-blue-100 text-xs sm:text-sm">Inactive</div>
                </div>
              </div>
            </div>
            <div class="bg-white bg-opacity-10 backdrop-blur-sm rounded-lg p-4 sm:p-5 border border-white border-opacity-10">
              <div class="flex items-center">
                <div class="size-10 flex items-center justify-center bg-indigo-500 rounded-lg mr-3 flex-shrink-0">
                  <i class="fas fa-users text-white text-lg"></i>
                </div>
                <div class="min-w-0 flex-1">
                  <div class="text-xl sm:text-2xl font-bold">${c.total}</div>
                  <div class="text-blue-100 text-xs sm:text-sm">Lifetime Total</div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    `;
  }

  render() {
    if (this.loading && this.customers.length === 0) {
      return `
        ${this.renderHeader()}
        <div class="bg-white rounded-2xl shadow-sm p-8 border border-slate-100">
          <div class="space-y-4">
            <ui-skeleton class="h-12 w-full rounded-xl"></ui-skeleton>
            <ui-skeleton class="h-64 w-full rounded-xl"></ui-skeleton>
          </div>
        </div>
      `;
    }

    const tableData = (this.customers || []).map((u, i) => {
      const email = u.email || "";
      const maskedEmail =
        email.length > 3
          ? email.substring(0, 3) +
            "***" +
            (email.includes("@") ? "@" + email.split("@")[1] : "")
          : "***";

      return {
        id: u.id,
        no: i + 1,
        name: u.name || "",
        email: maskedEmail,
        phone: u.phone || "—",
        status:
          u.status === "active" ||
          u.status === "Active" ||
          Number(u.is_active) === 1
            ? "Active"
            : "Inactive",
        created: u.created_at
          ? new Date(u.created_at).toLocaleDateString()
          : u.created || "",
      };
    });

    const columns = [
      { key: "no", label: "No.", html: false },
      { key: "name", label: "Name", html: false },
      { key: "email", label: "Email", html: false },
      { key: "phone", label: "Phone", html: false },
      { key: "status", label: "Status", html: false },
      { key: "created", label: "Joined", html: false },
    ];

    const safeData = JSON.stringify(tableData).replace(/"/g, "&quot;");
    const safeCols = JSON.stringify(columns).replace(/"/g, "&quot;");

    return `
      ${this.renderHeader()}
      <div class="bg-white rounded-2xl shadow-sm p-4 border border-slate-100">
        <div class="mt-2 overflow-x-auto">
          <ui-table
            title=""
            data="${safeData}"
            columns="${safeCols}"
            sortable
            searchable
            search-placeholder="Search customers..."
            pagination
            page-size="15"
            action
            actions="view,edit,delete"
            refresh
            print
            bordered
            striped
            class="w-full">
          </ui-table>
        </div>
      </div>
      
      <customer-view-modal></customer-view-modal>
      <customer-edit-modal></customer-edit-modal>
    `;
  }
}

customElements.define("app-customers-page", CustomersPage);
export default CustomersPage;

import "@/components/ui/Modal.js";
import "@/components/ui/Avatar.js";

class CustomerViewModal extends HTMLElement {
  constructor() {
    super();
    this.customerData = null;
    this._listenersBound = false;
  }

  static get observedAttributes() {
    return ["open"];
  }

  connectedCallback() {
    this.render();
    this.setupEventListeners();
  }

  attributeChangedCallback() {
    this.render();
    this.setupEventListeners();
  }

  setCustomerData(customer) {
    this.customerData = customer || null;
    this.render();
    this.setupEventListeners();
  }

  open() {
    this.setAttribute("open", "");
  }

  close() {
    this.removeAttribute("open");
  }

  setupEventListeners() {
    if (this._listenersBound) return;
    this._listenersBound = true;
    this.addEventListener("cancel", () => this.close());
  }

  getImageUrl(path) {
    if (!path) return "";
    if (
      path.startsWith("http://") ||
      path.startsWith("https://") ||
      path.startsWith("data:")
    ) {
      return path;
    }

    const baseUrl = window.location.origin;
    if (path.startsWith("/")) {
      return baseUrl + path;
    }

    return `${baseUrl}/api/${path}`;
  }

  render() {
    const user = this.customerData || {};
    const updatedDate = user.updated_at
      ? new Date(user.updated_at).toLocaleString()
      : user.updated || "-";
    const createdDate = user.created_at
      ? new Date(user.created_at).toLocaleString()
      : user.created || "-";

    this.innerHTML = `
      <ui-modal ${this.hasAttribute("open") ? "open" : ""} position="right" size="md" close-button="true">
        <div slot="title">Customer Details</div>
        <div class="space-y-6 text-sm">
          <!-- Profile Header -->
          <div class="flex flex-col items-center p-6 bg-slate-50 rounded-2xl border border-slate-100">
            <ui-avatar 
              name="${user.name || "Customer"}" 
              src="${user.profile_image ? this.getImageUrl(user.profile_image) : ""}" 
              size="xl" 
              class="shadow-md mb-4 ring-4 ring-white">
            </ui-avatar>
            <h2 class="text-xl font-bold text-slate-900">${user.name || "Unknown Customer"}</h2>
            <p class="text-slate-500 font-medium">${user.email || "No email provided"}</p>
            <div class="mt-4 inline-flex items-center px-3 py-1 rounded-full text-xs font-bold uppercase tracking-wider ${
              user.is_active || user.status?.toLowerCase() === "active"
                ? "bg-emerald-100 text-emerald-700"
                : "bg-slate-200 text-slate-600"
            }">
              ${user.is_active || user.status?.toLowerCase() === "active" ? "Active Account" : "Inactive"}
            </div>
          </div>

          <!-- Information Grid -->
          <div class="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div class="rounded-xl border border-slate-200 bg-white p-4 shadow-sm">
              <p class="text-[11px] font-bold text-slate-400 uppercase tracking-widest">Full Name</p>
              <p class="mt-1 text-slate-900 font-semibold">${user.name || "-"}</p>
            </div>
            <div class="rounded-xl border border-slate-200 bg-white p-4 shadow-sm">
              <p class="text-[11px] font-bold text-slate-400 uppercase tracking-widest">Email Address</p>
              <p class="mt-1 text-slate-900 font-semibold truncate" title="${user.email}">${user.email || "-"}</p>
            </div>
            <div class="rounded-xl border border-slate-200 bg-white p-4 shadow-sm">
              <p class="text-[11px] font-bold text-slate-400 uppercase tracking-widest">Phone Number</p>
              <p class="mt-1 text-slate-900 font-semibold">${user.phone || "-"}</p>
            </div>
            <div class="rounded-xl border border-slate-200 bg-white p-4 shadow-sm">
              <p class="text-[11px] font-bold text-slate-400 uppercase tracking-widest">User Type</p>
              <p class="mt-1 text-slate-900 font-semibold capitalize">${user.user_type || user.role || "Customer"}</p>
            </div>
            <div class="rounded-xl border border-slate-200 bg-white p-4 shadow-sm">
              <p class="text-[11px] font-bold text-slate-400 uppercase tracking-widest">Member Since</p>
              <p class="mt-1 text-slate-800 font-medium">${createdDate}</p>
            </div>
            <div class="rounded-xl border border-slate-200 bg-white p-4 shadow-sm">
              <p class="text-[11px] font-bold text-slate-400 uppercase tracking-widest">Last Activity</p>
              <p class="mt-1 text-slate-800 font-medium">${updatedDate}</p>
            </div>
          </div>

          <!-- Metadata/Preferences Placeholder -->
          <div class="rounded-2xl border border-slate-100 bg-slate-50 p-5 mt-2">
            <h3 class="text-xs font-black text-slate-400 uppercase tracking-widest mb-4">Account Metadata</h3>
            <div class="space-y-3">
              <div class="flex justify-between items-center text-xs">
                <span class="text-slate-500">Email Verified</span>
                <span class="font-bold text-slate-900 underline decoration-indigo-200 decoration-2 underline-offset-2">Yes</span>
              </div>
              <div class="flex justify-between items-center text-xs">
                <span class="text-slate-500">2FA Enabled</span>
                <span class="font-bold text-slate-900 underline decoration-rose-200 decoration-2 underline-offset-2">No</span>
              </div>
              <div class="flex justify-between items-center text-xs">
                <span class="text-slate-500">Marketing Opt-in</span>
                <span class="font-bold text-slate-900 underline decoration-emerald-200 decoration-2 underline-offset-2">Yes</span>
              </div>
            </div>
          </div>
        </div>
      </ui-modal>
    `;
  }
}

customElements.define("customer-view-modal", CustomerViewModal);
export default CustomerViewModal;

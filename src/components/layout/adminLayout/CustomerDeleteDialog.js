/**
 * CustomerDeleteDialog Component
 *
 * Confirmation dialog for deleting a customer.
 */
import "@/components/ui/Dialog.js";
import "@/components/ui/Avatar.js";
import Toast from "@/components/ui/Toast.js";
import api from "@/services/api.js";

class CustomerDeleteDialog extends HTMLElement {
  constructor() {
    super();
    this.customer = null;
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
    this.customer = customer || null;
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
    this.addEventListener("confirm", this.onConfirm);
    this.addEventListener("cancel", this.onCancel);
  }

  onCancel = () => {
    this.close();
  };

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
    if (path.startsWith("/")) return baseUrl + path;
    if (path.startsWith("uploads/")) return `${baseUrl}/${path}`;
    if (!path.includes("/")) return `${baseUrl}/api/uploads/profiles/${path}`;
    return `${baseUrl}/api/${path}`;
  }

  onConfirm = async () => {
    try {
      if (!this.customer?.id) return;

      await api.delete(`/users/${this.customer.id}`);

      Toast.show({
        title: "Deleted",
        message: "Customer account removed.",
        variant: "success",
      });

      this.dispatchEvent(new CustomEvent("customer-deleted", { bubbles: true }));
      this.close();
    } catch (error) {
      console.error(error);
      Toast.show({
        title: "Error",
        message: error.response?.data?.error || "Failed to delete customer",
        variant: "error",
      });
    }
  };

  render() {
    const user = this.customer || {};

    this.innerHTML = `
            <ui-dialog ${this.hasAttribute("open") ? "open" : ""} title="Delete Customer" variant="danger" confirm-label="Delete">
                <div slot="content" class="space-y-6 py-2">
                    <p class="text-sm text-slate-600 px-1">Are you sure you want to delete this customer account? All order history will be <span class="font-bold text-red-600 underline underline-offset-2 decoration-2">permanently removed</span>.</p>
                    
                    <div class="flex items-center p-4 bg-slate-50/50 rounded-2xl border border-slate-100 ring-1 ring-slate-200/50 shadow-sm transition-all duration-300">
                        <div class="flex-shrink-0">
                            <ui-avatar 
                                name="${user.name || "C"}" 
                                src="${user.profile_image ? this.getImageUrl(user.profile_image) : ""}" 
                                size="xl" 
                                class="shadow-md ring-4 ring-white">
                            </ui-avatar>
                        </div>
                        <div class="ml-5 min-w-0 flex-1">
                            <div class="flex items-center justify-between gap-3 overflow-hidden">
                                <h3 class="text-lg font-bold text-slate-900 truncate tracking-tight leading-none mb-1">${user.name || "Unknown Customer"}</h3>
                                <span class="px-2.5 py-0.5 rounded-full text-[10px] font-extrabold uppercase tracking-widest bg-slate-100 text-slate-700 border border-slate-200 shadow-sm flex-shrink-0">
                                    Customer
                                </span>
                            </div>
                            <p class="text-sm text-slate-500 truncate font-medium mb-1.5">${user.email || "No email available"}</p>
                            <div class="flex items-center text-[11px] text-slate-400 font-bold uppercase tracking-wide italic">
                                <i class="fas fa-user-slash mr-1.5 text-red-400 animate-pulse"></i>
                                DEACTIVATING ACCOUNT
                            </div>
                        </div>
                    </div>

                    <div class="p-3 bg-red-50/50 rounded-xl border border-red-100 text-[12px] text-red-700 flex items-start gap-3 shadow-sm">
                        <div class="size-6 rounded-full bg-red-100 flex items-center justify-center flex-shrink-0 mt-0.5">
                          <i class="fas fa-info-circle text-[10px]"></i>
                        </div>
                        <span class="leading-relaxed">This user will immediately lose access to their shopping cart, wishlists, and order tracking.</span>
                    </div>
                </div>
            </ui-dialog>
        `;
  }
}

customElements.define("customer-delete-dialog", CustomerDeleteDialog);

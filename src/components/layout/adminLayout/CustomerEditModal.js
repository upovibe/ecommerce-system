import "@/components/ui/Modal.js";
import "@/components/ui/Input.js";
import "@/components/ui/Switch.js";
import "@/components/ui/Toast.js";
import api from "@/services/api.js";

class CustomerEditModal extends HTMLElement {
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
    this.addEventListener("confirm", this.onConfirm);
    this.addEventListener("cancel", this.onCancel);
  }

  onCancel = () => {
    this.close();
  };

  onConfirm = async () => {
    try {
      if (!this.customerData?.id) return;

      const token = localStorage.getItem("token");
      if (!token) {
        window.Toast?.show?.({
          title: "Authentication Error",
          message: "Please log in again",
          variant: "error",
        });
        return;
      }

      const nameInput = this.querySelector('ui-input[data-field="name"]');
      const emailInput = this.querySelector('ui-input[data-field="email"]');
      const phoneInput = this.querySelector('ui-input[data-field="phone"]');
      const statusSwitch = this.querySelector('ui-switch[name="status"]');

      const payload = {
        name: (nameInput?.value || "").trim(),
        email: (emailInput?.value || "").trim(),
        phone: (phoneInput?.value || "").trim(),
        status: statusSwitch?.checked ? "active" : "inactive",
      };

      if (!payload.name || !payload.email) {
        window.Toast?.show?.({
          title: "Validation Error",
          message: "Name and Email are required",
          variant: "error",
        });
        return;
      }

      await api.withToken(token).put(`/users/${this.customerData.id}`, payload);

      window.Toast?.show?.({
        title: "Success",
        message: "Customer profile updated successfully",
        variant: "success",
      });

      this.close();
      this.dispatchEvent(
        new CustomEvent("customer-updated", {
          bubbles: true,
          composed: true,
        }),
      );
    } catch (error) {
      window.Toast?.show?.({
        title: "Error",
        message:
          error.response?.data?.error ||
          error.response?.data?.message ||
          "Failed to update customer",
        variant: "error",
      });
    }
  };

  render() {
    const user = this.customerData || {};
    const isActive =
      user.status === "active" ||
      user.status === "Active" ||
      Number(user.status) === 1 ||
      Number(user.is_active) === 1;

    this.innerHTML = `
      <ui-modal ${this.hasAttribute("open") ? "open" : ""} position="right" size="md" close-button="true">
        <div slot="title">Edit Customer Profile</div>
        <div class="space-y-4 py-2">
          <div>
            <label class="block text-sm font-medium text-slate-700 mb-1">Full Name</label>
            <ui-input data-field="name" value="${user.name || ""}" placeholder="Enter full name" class="w-full"></ui-input>
          </div>
          
          <div>
            <label class="block text-sm font-medium text-slate-700 mb-1">Email Address</label>
            <ui-input data-field="email" type="email" value="${user.email || ""}" placeholder="name@example.com" class="w-full" disabled></ui-input>
            <p class="text-[10px] text-slate-400 mt-1 ml-1 text-right">Email cannot be changed</p>
          </div>
          
          <div>
            <label class="block text-sm font-medium text-slate-700 mb-1">Phone Number</label>
            <ui-input data-field="phone" type="tel" value="${user.phone || ""}" placeholder="+1 (555) 000-0000" class="w-full"></ui-input>
          </div>
          
          <div class="pt-2">
            <ui-switch name="status" ${isActive ? "checked" : ""} label="Active">
              <span slot="label">Active Status</span>
            </ui-switch>
            <p class="text-[11px] text-slate-500 mt-1 ml-1">Toggle account access for this customer</p>
          </div>
        </div>
      </ui-modal>
    `;
  }
}

customElements.define("customer-edit-modal", CustomerEditModal);
export default CustomerEditModal;

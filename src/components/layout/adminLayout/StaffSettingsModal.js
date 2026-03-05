import "@/components/ui/Modal.js";
import "@/components/ui/Input.js";
import "@/components/ui/Switch.js";
import "@/components/ui/Dropdown.js";
import api from "@/services/api.js";
import Toast from "@/components/ui/Toast.js";

/**
 * StaffSettingsModal Component
 *
 * Logic for creating a new staff member.
 */
class StaffSettingsModal extends HTMLElement {
  constructor() {
    super();
    this.staffData = {
      name: "",
      email: "",
      password: "",
      role_id: "3", // Default to staff
      status: "active",
    };
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
      // Create user as staff/admin
      const res = await api.post("/users", {
        ...this.staffData,
        user_type: "admin",
      });

      if (res.data) {
        Toast.show({
          title: "Success",
          message: "Staff member created.",
          variant: "success",
        });
        this.dispatchEvent(new CustomEvent("staff-created", { bubbles: true }));
        this.close();
      }
    } catch (error) {
      console.error(error);
      Toast.show({
        title: "Error",
        message: error.response?.data?.error || "Failed to create staff member",
        variant: "error",
      });
    }
  };

  render() {
    this.innerHTML = `
            <ui-modal ${this.hasAttribute("open") ? "open" : ""} position="right" size="md" close-button="true">
                <div slot="title">Add Staff Member</div>
                <div class="space-y-6">
                    <ui-input 
                        label="Full Name" 
                        placeholder="Enter full name"
                        id="staff-name-input"
                        value="${this.staffData.name}">
                    </ui-input>

                    <ui-input 
                        label="Email Address" 
                        type="email"
                        placeholder="email@example.com"
                        id="staff-email-input"
                        value="${this.staffData.email}">
                    </ui-input>

                    <ui-input 
                        label="Password" 
                        type="password"
                        placeholder="••••••••"
                        id="staff-password-input"
                        value="${this.staffData.password}">
                    </ui-input>

                    <ui-dropdown 
                        label="Role" 
                        id="staff-role-dropdown"
                        placeholder="Select Role"
                        options='[{"value": "1", "label": "Super Admin"}, {"value": "2", "label": "Manager"}, {"value": "3", "label": "Staff"}]'
                        value="${this.staffData.role_id}">
                    </ui-dropdown>

                    <div class="flex items-center justify-between p-4 bg-gray-50 dark:bg-gray-800/50 rounded-xl border border-gray-100 dark:border-gray-700">
                        <div class="space-y-1">
                            <span class="text-sm font-medium text-gray-900 dark:text-gray-100">Staff Account Status</span>
                            <p class="text-xs text-gray-500 dark:text-gray-400">Enable or disable this staff account</p>
                        </div>
                        <ui-switch 
                            id="staff-status-switch" 
                            ${this.staffData.status === "active" ? "checked" : ""}
                            label="Active">
                        </ui-switch>
                    </div>
                </div>
            </ui-modal>
        `;

    this.querySelector("#staff-name-input").addEventListener(
      "input",
      (e) => (this.staffData.name = e.target.value),
    );
    this.querySelector("#staff-email-input").addEventListener(
      "input",
      (e) => (this.staffData.email = e.target.value),
    );
    this.querySelector("#staff-password-input").addEventListener(
      "input",
      (e) => (this.staffData.password = e.target.value),
    );
    this.querySelector("#staff-role-dropdown").addEventListener(
      "change",
      (e) => (this.staffData.role_id = e.detail.value),
    );
    this.querySelector("#staff-status-switch").addEventListener(
      "change",
      (e) => {
        this.staffData.status = e.detail.checked ? "active" : "inactive";
      },
    );
  }
}

customElements.define("staff-settings-modal", StaffSettingsModal);
export default StaffSettingsModal;

import App from "@/core/App.js";
import "@/components/ui/Avatar.js";
import "@/components/ui/ProfileImageUploader.js";
import "@/components/ui/Dialog.js";
import "@/components/ui/Modal.js";
import "@/components/ui/Toast.js";
import "@/components/ui/Card.js";
import "@/components/ui/Button.js";
import "@/components/ui/Input.js";
import { fetchColorSettings } from "@/utils/colorSettings.js";
import api from "@/services/api.js";

class AdminProfilePage extends App {
  constructor() {
    super();
    this.userData = JSON.parse(localStorage.getItem("userData")) || {};
    this.brandName = "VastCommerce";
  }

  async connectedCallback() {
    super.connectedCallback();
    this.setupEventListeners();
    await this.loadUserProfile();
    await this.loadTheme();
    document.title = "Admin Profile | " + this.brandName;
  }

  async loadUserProfile() {
    const storedUserData = JSON.parse(localStorage.getItem("userData") || "{}");
    const userId = storedUserData?.id;
    const token = localStorage.getItem("token");

    if (!userId || !token) {
      return;
    }

    try {
      const response = await api.withToken(token).get(`/users/${userId}/profile`);
      this.userData = { ...storedUserData, ...(response.data || {}) };
      localStorage.setItem("userData", JSON.stringify(this.userData));
      this.render();
    } catch (error) {
      console.warn("Failed to load latest profile data", error);
    }
  }

  async loadTheme() {
    try {
      const nameResp = await api.get("/settings/key/site_name");
      if (nameResp.data?.success) {
        this.brandName = nameResp.data.data.setting_value;
      }

      const colors = await fetchColorSettings();
      Object.entries(colors).forEach(([key, value]) => {
        this.set(key, value);
      });

      this.render();
    } catch (e) {
      console.warn("Theme loading failed in Profile", e);
    }
  }

  showEditProfileDialog() {
    const dialog = document.createElement("ui-modal");
    dialog.setAttribute("title", "Edit Profile");
    dialog.setAttribute("position", "right");
    dialog.setAttribute("size", "md");
    dialog.setAttribute("open", "");
    dialog.setAttribute("confirm-label", "Save changes");

    dialog.innerHTML = `
      <form id="edit-profile-form" class="space-y-6">
        <div class="space-y-4">
          <div>
            <label class="block text-[11px] font-bold text-slate-500 mb-1.5 ml-1">full legal name</label>
            <ui-input id="edit-name" value="${this.userData.name || ""}" placeholder="Enter full name" class="w-full"></ui-input>
          </div>
          <div>
            <label class="block text-[11px] font-bold text-slate-500 mb-1.5 ml-1">email address</label>
            <ui-input id="edit-email" type="email" value="${this.userData.email || ""}" placeholder="Enter email" class="w-full"></ui-input>
          </div>
        </div>
      </form>
    `;

    document.body.appendChild(dialog);

    const nameInput = dialog.querySelector("#edit-name");
    const emailInput = dialog.querySelector("#edit-email");

    const validateForm = () => {
      const isInvalid = !nameInput.value.trim() || !emailInput.value.trim();
      dialog.setAttribute("confirm-disabled", isInvalid ? "true" : "false");
    };

    nameInput.addEventListener("input", validateForm);
    emailInput.addEventListener("input", validateForm);
    validateForm();

    dialog.addEventListener("confirm", async () => {
      if (dialog.getAttribute("confirm-disabled") === "true") return;
      dialog.setAttribute("confirm-loading", "true");

      try {
        const response = await api.put(`/users/${this.userData.id}/profile`, {
          name: nameInput.value,
          email: emailInput.value,
        });

        if (response.data.success) {
          this.userData.name = nameInput.value;
          this.userData.email = emailInput.value;
          localStorage.setItem("userData", JSON.stringify(this.userData));
          this.render();
          dialog.remove();
          Toast.show({
            title: "Success",
            message: "Profile updated",
            variant: "success",
          });
        } else {
          dialog.setAttribute("confirm-loading", "false");
          validateForm();
          Toast.show({
            title: "Update failed",
            message: response.data.error || "Could not update profile",
            variant: "error",
          });
        }
      } catch (error) {
        dialog.setAttribute("confirm-loading", "false");
        validateForm();
        Toast.show({
          title: "Update failed",
          message: error.response?.data?.error || "Connection error",
          variant: "error",
        });
      }
    });

    dialog.addEventListener("cancel", () => dialog.remove());
  }

  showUpdatePasswordDialog() {
    const dialog = document.createElement("ui-dialog");
    dialog.setAttribute("title", "Update Password");
    dialog.setAttribute("open", "");
    dialog.setAttribute("confirm-label", "Update password");

    dialog.innerHTML = `
      <form slot="content" class="space-y-4">
          <p class="text-xs text-slate-500 font-medium px-1">ensure your account stays secure by using a strong password.</p>
          <div>
              <label class="block text-[11px] font-bold text-slate-500 mb-1 ml-1">current password</label>
              <ui-input id="curr-password" type="password" placeholder="â€¢â€¢â€¢â€¢â€¢â€¢â€¢â€¢" class="w-full"></ui-input>
          </div>
          <div>
              <label class="block text-[11px] font-bold text-slate-500 mb-1 ml-1">new password</label>
              <ui-input id="new-password" type="password" placeholder="Enter new password" class="w-full"></ui-input>
          </div>
          <div>
              <label class="block text-[11px] font-bold text-slate-500 mb-1 ml-1">confirm password</label>
              <ui-input id="confirm-password" type="password" placeholder="Confirm new password" class="w-full"></ui-input>
          </div>
      </form>
    `;

    document.body.appendChild(dialog);

    const currPass = dialog.querySelector("#curr-password");
    const newPass = dialog.querySelector("#new-password");
    const confirmPass = dialog.querySelector("#confirm-password");

    const validatePass = () => {
      const isInvalid =
        !currPass.value.trim() ||
        !newPass.value.trim() ||
        newPass.value !== confirmPass.value;
      dialog.setAttribute("confirm-disabled", isInvalid ? "true" : "false");
    };

    currPass.addEventListener("input", validatePass);
    newPass.addEventListener("input", validatePass);
    confirmPass.addEventListener("input", validatePass);
    validatePass();

    dialog.addEventListener("confirm", async () => {
      if (dialog.getAttribute("confirm-disabled") === "true") return;
      dialog.setAttribute("confirm-loading", "true");

      try {
        await api.put(`/users/${this.userData.id}/password`, {
          current_password: currPass.value,
          new_password: newPass.value,
          confirm_password: confirmPass.value,
        });

        dialog.remove();
        Toast.show({
          title: "Success",
          message: "Password updated",
          variant: "success",
        });
      } catch (e) {
        dialog.setAttribute("confirm-loading", "false");
        validatePass();
        Toast.show({
          title: "Error",
          message: e.response?.data?.error || "Failed to update password",
          variant: "error",
        });
      }
    });

    dialog.addEventListener("cancel", () => dialog.remove());
  }

  showAccessLogsDialog() {
    const dialog = document.createElement("ui-dialog");
    dialog.setAttribute("title", "Recent Access Logs");
    dialog.setAttribute("open", "");

    dialog.innerHTML = `
      <div slot="content" class="space-y-3 font-brand max-h-[400px] overflow-y-auto pr-2">
          ${[
            {
              event: "Login Successful",
              device: "Chrome / Windows 11",
              ip: "192.168.1.1",
              date: "Today, 10:45 AM",
            },
            {
              event: "Profile Updated",
              device: "Safari / iPhone 15",
              ip: "172.16.0.45",
              date: "Yesterday, 4:20 PM",
            },
            {
              event: "Login Successful",
              device: "Chrome / macOS",
              ip: "10.0.0.12",
              date: "Mar 1, 2026, 9:12 AM",
            },
          ]
            .map(
              (log) => `
            <div class="p-3 bg-slate-50 border border-slate-100 rounded-xl flex justify-between items-center">
                <div>
                    <p class="text-xs font-bold text-slate-800">${log.event}</p>
                    <p class="text-[10px] text-slate-400">${log.device} â€¢ ${log.ip}</p>
                </div>
                <span class="text-[9px] text-slate-400 font-medium">${log.date}</span>
            </div>
          `,
            )
            .join("")}
      </div>
    `;

    document.body.appendChild(dialog);
  }

  getImageUrl(path) {
    if (!path) return "";
    if (path.startsWith("http")) return path;
    return (
      window.location.origin + (path.startsWith("/") ? "" : "/api/") + path
    );
  }

  setupEventListeners() {
    this.addEventListener("upload-success", (e) => {
      if (e.target.tagName === "UI-PROFILE-IMAGE-UPLOADER") {
        this.handleProfileImageUploadSuccess(e);
      }
    });

    this.addEventListener("upload-error", (e) => {
      if (e.target.tagName === "UI-PROFILE-IMAGE-UPLOADER") {
        Toast.show({
          title: "Upload Error",
          message: e.detail?.error || "Failed to upload profile image",
          variant: "error",
        });
      }
    });
  }

  handleProfileImageUploadSuccess(event) {
    const imagePath = event?.detail?.result?.image_url || "";
    this.userData.profile_image = imagePath;

    const storedUserData = JSON.parse(localStorage.getItem("userData") || "{}");
    localStorage.setItem(
      "userData",
      JSON.stringify({ ...storedUserData, ...this.userData, profile_image: imagePath }),
    );
    window.dispatchEvent(new CustomEvent("user-data-updated"));

    this.render();
    Toast.show({
      title: "Success",
      message: "Profile image updated",
      variant: "success",
    });
  }

  render() {
    const primaryColor = this.get("primary_color") || "#4f46e5";

    return `
      <div class="p-6 md:p-10 space-y-8 max-w-7xl mx-auto font-brand text-slate-600">
        <!-- Dashboard Header -->
        <div class="flex flex-col md:flex-row md:items-center justify-between gap-6 pb-2">
          <div>
            <h1 class="text-3xl font-black text-slate-900 tracking-tight mb-2">My Profile</h1>
            <p class="text-slate-500 font-medium text-sm capitalize">manage your administrative account and security.</p>
          </div>
          <ui-button variant="outline" size="sm" color="primary" onclick="this.closest('app-admin-profile-page').showEditProfileDialog()">
            <i class="fas fa-edit mr-1"></i> edit profile
          </ui-button>
        </div>

        <div class="grid grid-cols-1 lg:grid-cols-12 gap-8">
          <!-- sidebar: profile card -->
          <div class="lg:col-span-4 space-y-6">
            <div class="bg-white border border-slate-100 rounded-3xl shadow-sm p-8 text-center relative overflow-hidden group">
               <div class="relative w-32 h-32 mx-auto mb-6">
                <ui-profile-image-uploader 
                   src="${this.getImageUrl(this.userData.profile_image)}" 
                    name="${this.userData.name || "Admin"}" 
                    size="xl"
                    class="rounded-full overflow-hidden shadow-lg border-2 border-slate-50"
                ></ui-profile-image-uploader>
              </div>
              <h2 class="text-xl font-black text-slate-900 mb-1">${this.userData.name || "Vast Admin"}</h2>
              <p class="text-[10px] font-black tracking-widest text-indigo-500 mb-6">Master access</p>
              
              <div class="inline-flex items-center gap-2 px-4 py-1.5 bg-emerald-50 border border-emerald-100 rounded-full">
                  <i class="fas fa-check-circle text-emerald-500 text-[10px]"></i>
                  <span class="text-[9px] font-bold uppercase tracking-wider text-emerald-600">verified</span>
              </div>
            </div>

            <!-- quick stats -->
            <div class="bg-slate-900 rounded-3xl p-8 text-white relative overflow-hidden">
                <h4 class="text-[9px] font-bold tracking-[0.2em] text-slate-500 mb-6">Quick stats</h4>
                <div class="space-y-4">
                    <div class="flex items-center justify-between border-b border-white/5 pb-3">
                        <span class="text-xs text-slate-400">Total Logins</span>
                        <span class="text-lg font-black">42</span>
                    </div>
                    <div class="flex items-center justify-between">
                        <span class="text-xs text-slate-400">Last Active</span>
                        <span class="text-xs font-bold uppercase text-slate-300">Today</span>
                    </div>
                </div>
            </div>
          </div>

          <!-- main content -->
          <div class="lg:col-span-8 space-y-8">
            <div class="bg-white border border-slate-100 rounded-3xl shadow-sm p-8">
              <div class="flex items-center justify-between mb-8">
                <h3 class="text-sm font-black text-slate-900 tracking-widest flex items-center gap-3">
                  <span class="w-1.5 h-1.5 bg-indigo-500 rounded-full"></span>
                  account information
                </h3>
                <div class="flex gap-2">
                  <ui-button variant="outline" size="sm" color="primary" onclick="this.closest('app-admin-profile-page').showUpdatePasswordDialog()">
                    password
                  </ui-button>
                  <ui-button variant="outline" size="sm" color="primary" onclick="this.closest('app-admin-profile-page').showAccessLogsDialog()">
                    history
                  </ui-button>
                </div>
              </div>

              <div class="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div class="p-5 bg-slate-50 border border-slate-100 rounded-2xl flex items-center gap-4">
                  <div class="w-10 h-10 bg-white rounded-xl shadow-sm flex items-center justify-center text-indigo-500">
                    <i class="fas fa-user text-xs"></i>
                  </div>
                  <div>
                    <label class="text-[9px] font-bold text-slate-400 block mb-0.5">name</label>
                    <p class="font-bold text-slate-800 text-sm capitalize">${this.userData.name || "N/A"}</p>
                  </div>
                </div>

                <div class="p-5 bg-slate-50 border border-slate-100 rounded-2xl flex items-center gap-4">
                  <div class="w-10 h-10 bg-white rounded-xl shadow-sm flex items-center justify-center text-emerald-500">
                    <i class="fas fa-envelope text-xs"></i>
                  </div>
                  <div class="overflow-hidden">
                    <label class="text-[9px] font-bold text-slate-400 block mb-0.5">email</label>
                    <p class="font-bold text-slate-800 text-sm truncate">${this.userData.email || "N/A"}</p>
                  </div>
                </div>

                <div class="p-5 bg-slate-50 border border-slate-100 rounded-2xl flex items-center gap-4">
                  <div class="w-10 h-10 bg-white rounded-xl shadow-sm flex items-center justify-center text-amber-500">
                    <i class="fas fa-shield-alt text-xs"></i>
                  </div>
                  <div>
                    <label class="text-[9px] font-bold text-slate-400 block mb-0.5">role</label>
                    <p class="font-bold text-slate-800 text-sm uppercase">administrator</p>
                  </div>
                </div>

                <div class="p-5 bg-slate-50 border border-slate-100 rounded-2xl flex items-center gap-4">
                  <div class="w-10 h-10 bg-white rounded-xl shadow-sm flex items-center justify-center text-purple-500">
                    <i class="fas fa-clock text-xs"></i>
                  </div>
                  <div>
                    <label class="text-[9px] font-bold text-slate-400 block mb-0.5">status</label>
                    <p class="font-bold text-slate-800 text-sm uppercase text-emerald-600">active</p>
                  </div>
                </div>
              </div>
            </div>

            <!-- security info -->
            <div class="bg-indigo-50/50 border border-indigo-100 rounded-3xl p-8 flex items-start gap-4">
              <div class="w-10 h-10 bg-white rounded-full flex items-center justify-center text-indigo-500 shadow-sm shrink-0">
                <i class="fas fa-lock text-sm"></i>
              </div>
              <div>
                <h4 class="text-sm font-bold text-slate-900 mb-1">security & privacy</h4>
                <p class="text-xs text-slate-500 leading-relaxed">your account is protected with 128-bit encryption. ensure you regularly update your password and monitor access logs for suspicious activity.</p>
              </div>
            </div>
          </div>
        </div>
      </div>
    `;
  }
}

customElements.define("app-admin-profile-page", AdminProfilePage);
export default AdminProfilePage;


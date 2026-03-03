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
      const response = await api
        .withToken(token)
        .get(`/users/${userId}/profile`);
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
    dialog.setAttribute("confirm-label", "Save Changes");

    dialog.innerHTML = `
      <form id="edit-profile-form" class="space-y-6">
        <div class="space-y-4">
          <div>
            <label class="block text-xs font-bold text-slate-500 mb-1.5 ml-1">Full Legal Name</label>
            <ui-input id="edit-name" value="${this.userData.name || ""}" placeholder="Enter full name" class="w-full"></ui-input>
          </div>
          <div>
            <label class="block text-xs font-bold text-slate-500 mb-1.5 ml-1">Phone</label>
            <ui-input id="edit-phone" value="${this.userData.phone || ""}" placeholder="Enter phone number" class="w-full"></ui-input>
          </div>
          <div>
            <label class="block text-xs font-bold text-slate-500 mb-1.5 ml-1">Gender</label>
            <select id="edit-gender" class="w-full border border-slate-300 rounded-xl px-3 py-2 text-sm text-slate-700 focus:outline-none focus:ring-2 focus:ring-indigo-200">
              <option value="">Select gender</option>
              <option value="male" ${this.userData.gender === "male" ? "selected" : ""}>Male</option>
              <option value="female" ${this.userData.gender === "female" ? "selected" : ""}>Female</option>
              <option value="other" ${this.userData.gender === "other" ? "selected" : ""}>Other</option>
              <option value="prefer_not_to_say" ${this.userData.gender === "prefer_not_to_say" ? "selected" : ""}>Prefer not to say</option>
            </select>
          </div>
          <div>
            <label class="block text-xs font-bold text-slate-500 mb-1.5 ml-1">Date of Birth</label>
            <ui-input id="edit-date-of-birth" type="date" value="${this.userData.date_of_birth || ""}" class="w-full"></ui-input>
          </div>
          <div>
            <label class="block text-xs font-bold text-slate-500 mb-1.5 ml-1">Address</label>
            <ui-input id="edit-address" value="${this.userData.address || ""}" placeholder="Enter address" class="w-full"></ui-input>
          </div>
        </div>
      </form>
    `;

    document.body.appendChild(dialog);

    const nameInput = dialog.querySelector("#edit-name");
    const phoneInput = dialog.querySelector("#edit-phone");
    const genderInput = dialog.querySelector("#edit-gender");
    const dobInput = dialog.querySelector("#edit-date-of-birth");
    const addressInput = dialog.querySelector("#edit-address");

    const validateForm = () => {
      const isInvalid = !nameInput.value.trim();
      dialog.setAttribute("confirm-disabled", isInvalid ? "true" : "false");
    };

    nameInput.addEventListener("input", validateForm);
    validateForm();

    dialog.addEventListener("confirm", async () => {
      if (dialog.getAttribute("confirm-disabled") === "true") return;
      dialog.setAttribute("confirm-loading", "true");

      try {
        const response = await api.put(`/users/${this.userData.id}/profile`, {
          name: nameInput.value,
          phone: phoneInput.value,
          gender: genderInput.value || null,
          date_of_birth: dobInput.value || null,
          address: addressInput.value,
        });

        if (response.data.success) {
          this.userData.name = nameInput.value;
          this.userData.phone = phoneInput.value;
          this.userData.gender = genderInput.value || null;
          this.userData.date_of_birth = dobInput.value || null;
          this.userData.address = addressInput.value;
          localStorage.setItem("userData", JSON.stringify(this.userData));
          // Dispatch so the layout header also updates in real-time
          window.dispatchEvent(new CustomEvent("user-data-updated"));
          this.render();
          dialog.remove();
          Toast.show({
            title: "Success",
            message: "Profile updated successfully.",
            variant: "success",
          });
        } else {
          dialog.setAttribute("confirm-loading", "false");
          validateForm();
          Toast.show({
            title: "Update Failed",
            message: response.data.error || "Could not update profile",
            variant: "error",
          });
        }
      } catch (error) {
        dialog.setAttribute("confirm-loading", "false");
        validateForm();
        Toast.show({
          title: "Update Failed",
          message: error.response?.data?.error || "Connection error",
          variant: "error",
        });
      }
    });

    dialog.addEventListener("cancel", () => dialog.remove());
  }

  showEditEmailDialog() {
    // Step 1: Enter new email and request the verification code
    const dialog = document.createElement("ui-dialog");
    dialog.setAttribute("title", "Change Email Address");
    dialog.setAttribute("open", "");
    dialog.setAttribute("confirm-label", "Send Verification Code");

    dialog.innerHTML = `
      <form slot="content" class="space-y-4">
          <div class="p-3 bg-amber-50 border border-amber-100 rounded-xl">
            <p class="text-xs text-amber-700 font-medium">A 6-digit verification code will be sent to your <strong>current</strong> email address for security.</p>
          </div>
          <div>
              <label class="block text-xs font-bold text-slate-500 mb-1 ml-1">New Email Address</label>
              <ui-input id="edit-email" type="email" placeholder="Enter new email" class="w-full"></ui-input>
          </div>
      </form>
    `;

    document.body.appendChild(dialog);

    const emailInput = dialog.querySelector("#edit-email");

    const validateForm = () => {
      const isInvalid =
        !emailInput.value.trim() || !emailInput.value.includes("@");
      dialog.setAttribute("confirm-disabled", isInvalid ? "true" : "false");
    };

    emailInput.addEventListener("input", validateForm);
    validateForm();

    dialog.addEventListener("confirm", async () => {
      if (dialog.getAttribute("confirm-disabled") === "true") return;
      dialog.setAttribute("confirm-loading", "true");

      try {
        const response = await api.post(
          `/users/${this.userData.id}/request-email-change`,
          {
            new_email: emailInput.value,
          },
        );

        if (response.data.success) {
          dialog.remove();
          // Step 2: Enter the verification code
          this.showEmailVerificationDialog(emailInput.value);
        } else {
          dialog.setAttribute("confirm-loading", "false");
          validateForm();
          Toast.show({
            title: "Error",
            message: response.data.error || "Could not send verification code",
            variant: "error",
          });
        }
      } catch (error) {
        dialog.setAttribute("confirm-loading", "false");
        validateForm();
        Toast.show({
          title: "Error",
          message: error.response?.data?.error || "Connection error",
          variant: "error",
        });
      }
    });

    dialog.addEventListener("cancel", () => dialog.remove());
  }

  showEmailVerificationDialog(newEmail) {
    const dialog = document.createElement("ui-dialog");
    dialog.setAttribute("title", "Enter Verification Code");
    dialog.setAttribute("open", "");
    dialog.setAttribute("confirm-label", "Confirm Change");

    dialog.innerHTML = `
      <form slot="content" class="space-y-4">
          <div class="p-3 bg-emerald-50 border border-emerald-100 rounded-xl">
            <p class="text-xs text-emerald-700 font-medium">A 6-digit code has been sent to your current email. It expires in 15 minutes.</p>
          </div>
          <div>
              <label class="block text-xs font-bold text-slate-500 mb-1 ml-1">Verification Code</label>
              <ui-input id="verify-code" type="text" placeholder="Enter 6-digit code" class="w-full"></ui-input>
          </div>
          <p class="text-[10px] text-slate-400 px-1">Changing to: <strong>${newEmail}</strong></p>
      </form>
    `;

    document.body.appendChild(dialog);

    const codeInput = dialog.querySelector("#verify-code");

    const validateCode = () => {
      const isInvalid = codeInput.value.trim().length !== 6;
      dialog.setAttribute("confirm-disabled", isInvalid ? "true" : "false");
    };

    codeInput.addEventListener("input", validateCode);
    validateCode();

    dialog.addEventListener("confirm", async () => {
      if (dialog.getAttribute("confirm-disabled") === "true") return;
      dialog.setAttribute("confirm-loading", "true");

      try {
        const response = await api.post(
          `/users/${this.userData.id}/verify-email-change`,
          {
            code: codeInput.value.trim(),
            new_email: newEmail,
          },
        );

        if (response.data.success) {
          this.userData.email = newEmail;
          localStorage.setItem("userData", JSON.stringify(this.userData));
          window.dispatchEvent(new CustomEvent("user-data-updated"));
          this.render();
          dialog.remove();
          Toast.show({
            title: "Email Changed",
            message: "Your email address has been updated successfully.",
            variant: "success",
          });
        } else {
          dialog.setAttribute("confirm-loading", "false");
          validateCode();
          Toast.show({
            title: "Verification Failed",
            message: response.data.error || "Invalid code",
            variant: "error",
          });
        }
      } catch (error) {
        dialog.setAttribute("confirm-loading", "false");
        validateCode();
        Toast.show({
          title: "Verification Failed",
          message: error.response?.data?.error || "Invalid or expired code",
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
    dialog.setAttribute("confirm-label", "Update Password");

    dialog.innerHTML = `
      <form slot="content" class="space-y-4">
          <p class="text-xs text-slate-500 font-medium px-1">Ensure your account stays secure by using a strong password.</p>
          <div>
              <label class="block text-xs font-bold text-slate-500 mb-1 ml-1">Current Password</label>
              <ui-input id="curr-password" type="password" placeholder="••••••••" class="w-full"></ui-input>
          </div>
          <div>
              <label class="block text-xs font-bold text-slate-500 mb-1 ml-1">New Password</label>
              <ui-input id="new-password" type="password" placeholder="Enter new password" class="w-full"></ui-input>
          </div>
          <div>
              <label class="block text-xs font-bold text-slate-500 mb-1 ml-1">Confirm Password</label>
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

        // Show toast then log out for security
        Toast.show({
          title: "Password Changed",
          message:
            "Your password was updated. You will be logged out for security.",
          variant: "success",
        });

        setTimeout(() => {
          localStorage.removeItem("token");
          localStorage.removeItem("userData");
          window.location.href = "/auth/login";
        }, 2500);
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
                    <p class="text-[10px] text-slate-400">${log.device} • ${log.ip}</p>
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

  maskEmail(email) {
    if (!email) return "N/A";
    const [local, domain] = email.split("@");
    if (!domain) return email;
    const visible = local.slice(0, 2);
    return `${visible}***@${domain}`;
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
      JSON.stringify({
        ...storedUserData,
        ...this.userData,
        profile_image: imagePath,
      }),
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
    const isSuperAdmin = this.userData.role_id == 1;

    return `
      <div class="p-6 md:p-10 space-y-8 max-w-7xl mx-auto font-brand text-slate-600">
        <!-- Dashboard Header -->
        <div class="flex flex-col md:flex-row md:items-center justify-between gap-6 pb-2">
          <div>
            <h1 class="text-3xl font-black text-slate-900 tracking-tight mb-2">My Profile</h1>
            <p class="text-slate-500 font-medium text-sm capitalize">Manage your administrative account and security.</p>
          </div>
          <ui-button variant="outline" size="sm" color="primary" onclick="this.closest('app-admin-profile-page').showEditProfileDialog()">
            <i class="fas fa-edit mr-1"></i> Edit Profile
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
              <p class="text-[10px] font-black tracking-widest text-indigo-500 mb-6">${isSuperAdmin ? "Master Access" : "Management Access"}</p>
              
              <div class="inline-flex items-center gap-2 px-4 py-1.5 bg-emerald-50 border border-emerald-100 rounded-full">
                  <i class="fas fa-check-circle text-emerald-500 text-[10px]"></i>
                  <span class="text-[9px] font-bold uppercase tracking-wider text-emerald-600">Verified</span>
              </div>
            </div>

            <!-- quick stats -->
            <div class="bg-slate-900 rounded-3xl p-8 text-white relative overflow-hidden">
                <h4 class="text-[9px] font-bold tracking-[0.2em] text-slate-500 mb-6">Quick Stats</h4>
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
                  Account Information
                </h3>
                <div class="flex gap-2">
                  ${
                    isSuperAdmin
                      ? `
                  <ui-button variant="outline" size="sm" color="primary" onclick="this.closest('app-admin-profile-page').showEditEmailDialog()">
                    Email
                  </ui-button>
                  `
                      : ""
                  }
                  <ui-button variant="outline" size="sm" color="primary" onclick="this.closest('app-admin-profile-page').showUpdatePasswordDialog()">
                    Password
                  </ui-button>
                  <ui-button variant="outline" size="sm" color="primary" onclick="this.closest('app-admin-profile-page').showAccessLogsDialog()">
                    History
                  </ui-button>
                </div>
              </div>

              <div class="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div class="p-5 bg-slate-50 border border-slate-100 rounded-2xl flex items-center gap-4">
                  <div class="w-10 h-10 bg-white rounded-xl shadow-sm flex items-center justify-center text-indigo-500">
                    <i class="fas fa-user text-xs"></i>
                  </div>
                  <div>
                    <label class="text-xs font-bold text-slate-400 block mb-0.5">Name</label>
                    <p class="font-bold text-slate-800 text-sm capitalize">${this.userData.name || "N/A"}</p>
                  </div>
                </div>

                <div class="p-5 bg-slate-50 border border-slate-100 rounded-2xl flex items-center gap-4">
                  <div class="w-10 h-10 bg-white rounded-xl shadow-sm flex items-center justify-center text-emerald-500">
                    <i class="fas fa-envelope text-xs"></i>
                  </div>
                  <div class="overflow-hidden">
                    <label class="text-xs font-bold text-slate-400 block mb-0.5">Email</label>
                    <p class="font-bold text-slate-800 text-sm truncate">${this.maskEmail(this.userData.email)}</p>
                  </div>
                </div>

                <div class="p-5 bg-slate-50 border border-slate-100 rounded-2xl flex items-center gap-4">
                  <div class="w-10 h-10 bg-white rounded-xl shadow-sm flex items-center justify-center text-cyan-500">
                    <i class="fas fa-phone text-xs"></i>
                  </div>
                  <div>
                    <label class="text-xs font-bold text-slate-400 block mb-0.5">Phone</label>
                    <p class="font-bold text-slate-800 text-sm">${this.userData.phone || "N/A"}</p>
                  </div>
                </div>

                <div class="p-5 bg-slate-50 border border-slate-100 rounded-2xl flex items-center gap-4">
                  <div class="w-10 h-10 bg-white rounded-xl shadow-sm flex items-center justify-center text-fuchsia-500">
                    <i class="fas fa-venus-mars text-xs"></i>
                  </div>
                  <div>
                    <label class="text-xs font-bold text-slate-400 block mb-0.5">Gender</label>
                    <p class="font-bold text-slate-800 text-sm capitalize">${(this.userData.gender || "N/A").replaceAll("_", " ")}</p>
                  </div>
                </div>

                <div class="p-5 bg-slate-50 border border-slate-100 rounded-2xl flex items-center gap-4">
                  <div class="w-10 h-10 bg-white rounded-xl shadow-sm flex items-center justify-center text-rose-500">
                    <i class="fas fa-birthday-cake text-xs"></i>
                  </div>
                  <div>
                    <label class="text-xs font-bold text-slate-400 block mb-0.5">Date of Birth</label>
                    <p class="font-bold text-slate-800 text-sm">${this.userData.date_of_birth ? new Date(this.userData.date_of_birth).toLocaleDateString() : "N/A"}</p>
                  </div>
                </div>

                <div class="p-5 bg-slate-50 border border-slate-100 rounded-2xl flex items-center gap-4 md:col-span-2">
                  <div class="w-10 h-10 bg-white rounded-xl shadow-sm flex items-center justify-center text-slate-500">
                    <i class="fas fa-map-marker-alt text-xs"></i>
                  </div>
                  <div>
                    <label class="text-xs font-bold text-slate-400 block mb-0.5">Address</label>
                    <p class="font-bold text-slate-800 text-sm">${this.userData.address || "N/A"}</p>
                  </div>
                </div>

                <div class="p-5 bg-slate-50 border border-slate-100 rounded-2xl flex items-center gap-4">
                  <div class="w-10 h-10 bg-white rounded-xl shadow-sm flex items-center justify-center text-amber-500">
                    <i class="fas fa-shield-alt text-xs"></i>
                  </div>
                  <div>
                    <label class="text-xs font-bold text-slate-400 block mb-0.5">Role</label>
                    <p class="font-bold text-slate-800 text-sm uppercase">${this.userData.role || "Administrator"}</p>
                  </div>
                </div>

                <div class="p-5 bg-slate-50 border border-slate-100 rounded-2xl flex items-center gap-4">
                  <div class="w-10 h-10 bg-white rounded-xl shadow-sm flex items-center justify-center text-purple-500">
                    <i class="fas fa-clock text-xs"></i>
                  </div>
                  <div>
                    <label class="text-xs font-bold text-slate-400 block mb-0.5">Status</label>
                    <p class="font-bold text-slate-800 text-sm uppercase text-emerald-600">${this.userData.status || "Active"}</p>
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
                <h4 class="text-sm font-bold text-slate-900 mb-1">Security & Privacy</h4>
                <p class="text-xs text-slate-500 leading-relaxed">Keep your profile details up to date, use a strong password, and review account activity regularly.</p>
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

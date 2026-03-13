import App from "@/core/App.js";
import "@/components/ui/Card.js";
import "@/components/ui/Input.js";
import "@/components/ui/Button.js";
import "@/components/ui/Checkbox.js";
import "@/components/ui/Toast.js";
import api from "@/services/api.js";

class LoginPage extends App {
  constructor() {
    super();
    this.formData = {
      email: "",
      password: "",
      remember: false,
    };
    this.settings = {
      site_name: "VastCommerce",
      site_logo: null,
    };
  }

  async connectedCallback() {
    super.connectedCallback();
    document.title = "Sign In | Vast Admin";
    await this.loadSettings();
  }

  async loadSettings() {
    try {
      const resp = await api.get("/settings");
      console.log("📥 Branding settings fetched:", resp.data);
      if (resp.data.success) {
        const settingsArr = resp.data.data;
        const nameSetting = settingsArr.find(
          (s) => s.setting_key === "site_name",
        );
        const logoSetting = settingsArr.find(
          (s) => s.setting_key === "site_logo",
        );

        if (nameSetting) this.settings.site_name = nameSetting.setting_value;
        if (logoSetting) this.settings.site_logo = logoSetting.setting_value;
      }
      this.render();
    } catch (e) {
      console.error("❌ Branding fetch failed:", e.response?.data || e.message);
      console.warn("Could not load settings for branding, using defaults.");
    }
  }

  handleInputChange(field, value) {
    this.formData[field] = value;
  }

  async handleSubmit() {
    const { email, password } = this.formData;

    if (!email || !password) {
      window.Toast.show({
        title: "Validation Error",
        message: "Please enter your administrative credentials.",
        variant: "error",
      });
      return;
    }

    try {
      const response = await api.post("/auth/login", { email, password });
      const { user } = response.data;

      localStorage.setItem("userData", JSON.stringify(user));
      localStorage.setItem("token", user.token);

      window.Toast.show({
        title: "Success",
        message: `Authenticated as ${user.name}`,
        variant: "success",
      });

      setTimeout(() => {
        window.location.href =
          user.user_type === "admin" ? "/dashboard/admin" : "/profile";
      }, 1000);
    } catch (error) {
      window.Toast.show({
        title: "Access Denied",
        message: error.response?.data?.error || "Invalid credentials provided.",
        variant: "error",
      });
    }
  }

  render() {
    // Determine Brand Display
    const nameParts = this.settings.site_name.split(" ");
    const brandPrimary = nameParts[0].toUpperCase();
    const brandSecondary = (
      nameParts.slice(1).join(" ") || "ADMIN"
    ).toUpperCase();

    const logoHtml = this.settings.site_logo
      ? `<img src="${this.settings.site_logo}" alt="Logo" class="w-full h-full object-contain p-1">`
      : `<i class="fas fa-shopping-bag text-lg"></i>`;

    const mobileLogoHtml = this.settings.site_logo
      ? `<img src="${this.settings.site_logo}" alt="Logo" class="w-full h-full object-contain p-1.5">`
      : `<i class="fas fa-shopping-bag text-xl"></i>`;

    return `
      <div class="flex min-h-screen bg-white font-sans overflow-hidden">
        <!-- Left Pane: Brand & Impact -->
        <div class="hidden lg:flex w-[45%] bg-[#0a0f18] text-white p-12 xl:p-20 flex-col justify-between relative overflow-hidden">
          <!-- Ambient Mesh Gradient -->
          <div class="absolute top-0 left-0 w-full h-full opacity-30">
            <div class="absolute top-[-20%] left-[-10%] w-[80%] h-[80%] bg-indigo-600/20 rounded-full blur-[100px]"></div>
            <div class="absolute bottom-[-10%] right-[-10%] w-[60%] h-[60%] bg-blue-600/10 rounded-full blur-[80px]"></div>
          </div>

          <div class="relative z-10">
            <!-- Brand Logo -->
            <div class="flex items-center gap-3 mb-24 xl:mb-32">
              <div class="w-10 h-10 bg-indigo-600 rounded-xl flex items-center justify-center shadow-lg shadow-indigo-500/20 overflow-hidden">
                ${logoHtml}
              </div>
              <span class="text-xl font-bold tracking-tighter tabular-nums font-brand">
                ${brandPrimary}<span class="text-indigo-500">${brandSecondary}</span>
              </span>
            </div>

            <h1 class="text-4xl xl:text-5xl font-bold leading-tight mb-6 max-w-sm tracking-tighter font-brand">
              Manage your global marketplace in one place.
            </h1>
            <p class="text-slate-400 text-lg font-medium max-w-sm leading-relaxed mb-16">
              Control products, track analytics, and manage customer experiences across all categories.
            </p>

            <!-- Highlight Cards -->
            <div class="space-y-4 max-w-sm">
              <div class="bg-white/5 border border-white/10 p-6 rounded-2xl flex items-center gap-5 backdrop-blur-sm hover:bg-white/10 transition-all cursor-default group">
                <div class="w-10 h-10 bg-indigo-600/20 rounded-lg flex items-center justify-center text-indigo-400 group-hover:bg-indigo-600 group-hover:text-white transition-all">
                  <i class="fas fa-layer-group text-lg"></i>
                </div>
                <div>
                  <h4 class="font-bold text-base font-brand">Multi-Category Support</h4>
                  <p class="text-slate-500 font-medium text-xs">Handle diverse product lines seamlessly.</p>
                </div>
              </div>
              <div class="bg-white/5 border border-white/10 p-6 rounded-2xl flex items-center gap-5 backdrop-blur-sm hover:bg-white/10 transition-all cursor-default group">
                <div class="w-10 h-10 bg-blue-600/20 rounded-lg flex items-center justify-center text-blue-400 group-hover:bg-blue-600 group-hover:text-white transition-all">
                  <i class="fas fa-globe text-lg"></i>
                </div>
                <div>
                  <h4 class="font-bold text-base font-brand">Global Operations</h4>
                  <p class="text-slate-500 font-medium text-xs">Scale your business internationally.</p>
                </div>
              </div>
            </div>
          </div>

          <div class="relative z-10 text-slate-500 text-[10px] font-bold uppercase tracking-widest">
            &copy; 2026 ${this.settings.site_name} Inc.
          </div>
        </div>

        <!-- Right Pane: Form -->
        <div class="w-full lg:w-[55%] flex items-center justify-center p-6 sm:p-12 lg:p-16 bg-white overflow-y-auto">
          <div class="w-full max-w-[400px]">
            <!-- Mobile/Small Logo -->
            <div class="lg:hidden flex justify-center mb-10">
               <div class="w-12 h-12 bg-indigo-600 rounded-xl flex items-center justify-center text-white shadow-xl shadow-indigo-100 overflow-hidden">
                ${mobileLogoHtml}
              </div>
            </div>

            <header class="mb-12 text-center lg:text-left transition-all">
              <h2 class="text-4xl font-bold text-slate-900 tracking-tighter mb-4 font-brand">Admin Sign In</h2>
              <p class="text-slate-500 text-base font-medium">Enter your administrative credentials to continue.</p>
            </header>

            <form class="space-y-6" onsubmit="event.preventDefault(); this.closest('app-login-page').handleSubmit();">
              <div class="space-y-2">
                <label class="block text-sm font-semibold text-slate-700 ml-1">Work Email</label>
                <ui-input 
                  type="email" 
                  placeholder="name@company.com"
                  leading-icon='<i class="fas fa-envelope text-sm"></i>'
                  value="${this.formData.email}"
                  oninput="this.closest('app-login-page').handleInputChange('email', this.value)"
                  class="h-14 bg-slate-50 border-2 border-transparent rounded-xl focus:bg-white focus:border-indigo-600/20 focus:ring-4 focus:ring-indigo-600/5 transition-all placeholder:font-medium placeholder:text-slate-300"
                ></ui-input>
              </div>

              <div class="space-y-2">
                <div class="flex justify-between items-center ml-1">
                  <label class="block text-sm font-semibold text-slate-700">Password</label>
                </div>
                <ui-input 
                  type="password" 
                  placeholder="••••••••"
                  leading-icon='<i class="fas fa-lock text-sm"></i>'
                  value="${this.formData.password}"
                  oninput="this.closest('app-login-page').handleInputChange('password', this.value)"
                  class="h-14 bg-slate-50 border-2 border-transparent rounded-xl focus:bg-white focus:border-indigo-600/20 focus:ring-4 focus:ring-indigo-600/5 transition-all placeholder:font-medium placeholder:text-slate-300"
                ></ui-input>
                <div class="flex justify-start">
                  <a href="/auth/forgot-password" class="text-sm font-semibold text-indigo-600 hover:text-indigo-700 transition-colors">Forgot Password?</a>
                </div>
              </div>

              <div class="flex items-center gap-3 ml-1 pt-2">
                <ui-checkbox 
                  label="Remember me" 
                  color="indigo"
                  onchange="this.closest('app-login-page').handleInputChange('remember', event.detail.checked)"
                  class="text-slate-500 font-medium"
                ></ui-checkbox>
                <style>
                  ui-checkbox::part(label) { font-size: 0.875rem; color: #64748b; font-weight: 500; }
                  .upo-checkbox-label { font-size: 0.875rem !important; color: #64748b !important; font-weight: 500 !important; }
                  .upo-checkbox-input:checked { background-color: #4f46e5 !important; border-color: #4f46e5 !important; }
                  .upo-checkbox-wrapper:hover { background-color: transparent !important; }
                </style>
              </div>

              <div class="pt-4">
                <ui-button 
                  type="submit" 
                  class="w-full h-16 bg-[#0a0f18] text-white rounded-xl font-bold text-base hover:bg-slate-900 transition-all active:scale-[0.98] shadow-xl shadow-slate-100 flex items-center justify-center gap-3 group"
                >
                    Sign In
                </ui-button>
              </div>
            </form>

            <div class="mt-20 text-center">
               <p class="text-sm font-medium text-slate-400 mb-6">Unauthorized access is strictly prohibited and monitored.</p>
               <div class="flex items-center justify-center gap-3">
                  <span class="text-[10px] font-bold uppercase tracking-widest text-slate-400">System Status</span>
               </div>
            </div>
          </div>
        </div>
      </div>
    `;
  }
}

customElements.define("app-login-page", LoginPage);
export default LoginPage;

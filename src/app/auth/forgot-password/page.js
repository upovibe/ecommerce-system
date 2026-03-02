import App from "@/core/App.js";
import "@/components/ui/Card.js";
import "@/components/ui/Input.js";
import "@/components/ui/Button.js";
import "@/components/ui/Toast.js";
import api from "@/services/api.js";

class ForgotPasswordPage extends App {
  constructor() {
    super();
    this.email = "";
    this.settings = {
      site_name: "VastCommerce",
      site_logo: null,
    };
  }

  async connectedCallback() {
    super.connectedCallback();
    document.title = "Reset Password | Vast Admin";
    await this.loadSettings();
  }

  async loadSettings() {
    try {
      const resp = await api.get("/settings");
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
      console.warn("Could not load settings for branding.");
    }
  }

  async handleSubmit() {
    if (!this.email) {
      window.Toast.show({
        title: "Input Required",
        message: "Please enter your email address to receive a reset link.",
        variant: "error",
      });
      return;
    }

    try {
      window.Toast.show({
        title: "Link Sent",
        message:
          "If an account exists for this email, you will receive a reset link shortly.",
        variant: "success",
      });

      setTimeout(() => {
        window.location.href = "/auth/login";
      }, 2000);
    } catch (error) {
      window.Toast.show({
        title: "Service Busy",
        message:
          "Could not process request at this time. Please try again later.",
        variant: "error",
      });
    }
  }

  render() {
    const logoHtml = this.settings.site_logo
      ? `<img src="${this.settings.site_logo}" alt="Logo" class="w-full h-full object-contain p-1">`
      : `<i class="fas fa-shopping-bag text-[10px]"></i>`;

    const headerLogoHtml = this.settings.site_logo
      ? `<img src="${this.settings.site_logo}" alt="Logo" class="w-full h-full object-contain p-2">`
      : `<i class="fas fa-history text-xl"></i>`;

    return `
      <div class="flex flex-col items-center justify-center min-h-screen bg-slate-50 p-4 sm:p-6 lg:p-8 relative overflow-hidden font-sans">
        <!-- Floating Background Elements -->
        <div class="absolute top-[20%] right-[-10%] sm:right-[-5%] w-72 h-72 bg-indigo-500/5 rounded-full blur-[80px]"></div>
        <div class="absolute bottom-[10%] left-[-10%] sm:left-[-5%] w-60 h-60 bg-blue-500/5 rounded-full blur-[60px]"></div>

        <!-- Navigation Header -->
        <div class="absolute top-0 left-0 w-full p-4 sm:p-6 flex items-center justify-between z-20">
            <div class="flex items-center gap-2">
                <div class="w-7 h-7 sm:w-8 sm:h-8 bg-indigo-600 rounded-lg flex items-center justify-center text-white shadow-lg overflow-hidden">
                    ${logoHtml}
                </div>
                <span class="text-sm sm:text-base font-bold text-slate-900 tracking-tight font-brand">${this.settings.site_name}</span>
            </div>
            <div class="hidden sm:flex items-center gap-4">
                <a href="#" class="text-xs font-semibold text-slate-400 hover:text-indigo-600 transition-colors">Support</a>
                <a href="#" class="text-xs font-semibold text-slate-400 hover:text-indigo-600 transition-colors">System Status</a>
            </div>
        </div>

        <ui-card class="w-full max-w-[440px] bg-white rounded-[1.5rem] sm:rounded-[2rem] shadow-xl shadow-indigo-900/5 border border-slate-100 overflow-hidden relative z-10 mx-auto">
          <!-- Header Gradient Section -->
          <div class="h-32 sm:h-44 bg-gradient-to-br from-indigo-600 via-indigo-500 to-indigo-700 p-6 sm:p-8 flex flex-col items-center justify-center relative overflow-hidden">
            <!-- Decorative Pattern -->
            <div class="absolute inset-0 opacity-10 pointer-events-none">
                <i class="fas fa-undo-alt text-[10rem] sm:text-[15rem] absolute -top-5 -right-5 rotate-12"></i>
            </div>
            
            <div class="w-12 h-12 sm:w-16 sm:h-16 bg-white/20 backdrop-blur-xl rounded-xl sm:rounded-2xl flex items-center justify-center text-white border border-white/30 shadow-xl relative z-10 overflow-hidden">
                ${headerLogoHtml}
            </div>
          </div>

          <!-- Form Content -->
          <div class="p-6 sm:p-12 text-center">
            <h2 class="text-2xl sm:text-3xl font-bold text-slate-900 mb-2 sm:mb-3 tracking-tight font-brand">Forgot Password</h2>
            <p class="text-slate-500 font-medium mb-6 sm:mb-8 leading-relaxed max-w-[280px] mx-auto text-xs sm:text-sm">
                Enter the email address associated with your account and we will send you a link to reset your password.
            </p>

            <form class="space-y-4 sm:space-y-6 text-left" onsubmit="event.preventDefault(); this.closest('app-forgot-password-page').handleSubmit();">
                <div class="space-y-2">
                    <label class="block text-sm font-semibold text-slate-700 ml-1">Email Address</label>
                    <ui-input 
                        type="email" 
                        placeholder="e.g. admin@vastcommerce.com"
                        leading-icon='<i class="fas fa-envelope text-xs"></i>'
                        value="${this.email}"
                        oninput="this.closest('app-forgot-password-page').email = this.value"
                        class="h-12 sm:h-14 bg-slate-50 border-2 border-transparent rounded-xl focus:bg-white focus:border-indigo-600/20 focus:ring-4 focus:ring-indigo-600/5 transition-all text-sm placeholder:font-medium placeholder:text-slate-300"
                    ></ui-input>
                </div>

                <div class="space-y-3 sm:space-y-4 pt-2">
                    <ui-button 
                      type="submit" 
                      class="w-full h-12 sm:h-14 bg-[#0a0f18] text-white rounded-xl font-bold text-sm transition-all active:scale-[0.98] flex items-center justify-center gap-2 group shadow-lg shadow-slate-100"
                    >
                        <span>Send Reset Link</span>
                        <i class="fas fa-arrow-right text-[10px] group-hover:translate-x-1 transition-transform"></i>
                    </ui-button>

                    <a href="/auth/login" class="flex items-center justify-center gap-2 text-sm font-semibold text-slate-400 hover:text-indigo-600 transition-all group">
                        <i class="fas fa-chevron-left text-[10px] group-hover:-translate-x-1 transition-transform"></i>
                        Back to Login
                    </a>
                </div>
            </form>
          </div>
        </ui-card>

        <footer class="mt-6 sm:mt-8 text-center relative z-10 w-full px-4">
            <p class="text-[9px] sm:text-[10px] font-medium text-slate-400">&copy; 2026 ${this.settings.site_name} Platform Architecture. All rights reserved.</p>
        </footer>
      </div>
    `;
  }
}

customElements.define("app-forgot-password-page", ForgotPasswordPage);
export default ForgotPasswordPage;

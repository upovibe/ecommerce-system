import App from "@/core/App.js";
import "@/components/ui/Input.js";
import "@/components/ui/Button.js";
import "@/components/ui/Toast.js";
import api from "@/services/api.js";

class CustomerLoginPage extends App {
  constructor() {
    super();
    this.formData = { email: "", password: "" };
    this.loginEnabled = true;
  }

  async connectedCallback() {
    super.connectedCallback();
    document.title = "Customer Sign In";
    await this.loadLoginSetting();
  }

  async loadLoginSetting() {
    try {
      const res = await api.get("/settings/key/enable_user_login");
      const raw = String(res?.data?.data?.setting_value ?? "1").toLowerCase();
      this.loginEnabled = !(raw === "0" || raw === "false" || raw === "no");
      this.render();
    } catch (_) {
      this.loginEnabled = true;
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
        message: "Please enter your email and password.",
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
        title: "Welcome back",
        message: `Signed in as ${user.name}`,
        variant: "success",
      });

      setTimeout(() => {
        const redirect = localStorage.getItem("post_login_redirect");
        if (redirect) {
          localStorage.removeItem("post_login_redirect");
          window.location.href = redirect;
          return;
        }
        window.location.href = "/profile";
      }, 600);
    } catch (error) {
      window.Toast.show({
        title: "Access Denied",
        message: error.response?.data?.error || "Invalid credentials provided.",
        variant: "error",
      });
    }
  }

  render() {
    if (!this.loginEnabled) {
      return `
        <div class="min-h-screen bg-white flex items-center justify-center px-6 py-12">
          <div class="max-w-md text-center">
            <h1 class="text-3xl font-black text-slate-900 mb-3">Customer login disabled</h1>
            <p class="text-slate-500 mb-6">Customer access is currently disabled by the store administrator.</p>
            <a href="/" class="inline-flex items-center gap-2 px-6 py-3 rounded-xl bg-slate-900 text-white text-sm font-semibold hover:bg-slate-800 transition">
              Return home
            </a>
          </div>
        </div>
      `;
    }
    return `
      <div class="min-h-screen bg-white flex items-center justify-center px-6 py-12">
        <div class="w-full max-w-md">
          <div class="text-center mb-10">
            <h1 class="text-3xl font-black text-slate-900 mb-2">Customer Sign In</h1>
            <p class="text-slate-500">Access your profile, cart, and orders.</p>
          </div>

          <form class="space-y-5" onsubmit="event.preventDefault(); this.closest('app-customer-login-page').handleSubmit();">
            <div class="space-y-2">
              <label class="block text-sm font-semibold text-slate-700">Email</label>
              <ui-input type="email" placeholder="you@email.com" value="${this.formData.email}" oninput="this.closest('app-customer-login-page').handleInputChange('email', this.value)"></ui-input>
            </div>
            <div class="space-y-2">
              <label class="block text-sm font-semibold text-slate-700">Password</label>
              <ui-input type="password" placeholder="••••••••" value="${this.formData.password}" oninput="this.closest('app-customer-login-page').handleInputChange('password', this.value)"></ui-input>
            </div>
            <button class="w-full px-4 py-3 rounded-xl bg-slate-900 text-white text-sm font-semibold hover:bg-slate-800 transition">Sign in</button>
          </form>

          <div class="mt-6 text-center text-sm text-slate-500">
            New here?
            <a href="/auth/customer-signup" class="font-semibold text-slate-900 hover:text-indigo-600">Create an account</a>
          </div>
        </div>
      </div>
    `;
  }
}

customElements.define("app-customer-login-page", CustomerLoginPage);
export default CustomerLoginPage;

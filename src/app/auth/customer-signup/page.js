import App from "@/core/App.js";
import "@/components/ui/Input.js";
import "@/components/ui/Dropdown.js";
import "@/components/ui/Toast.js";
import api from "@/services/api.js";

class CustomerSignupPage extends App {
  constructor() {
    super();
    this.step = "form";
    this.loginEnabled = true;
    this.formData = {
      first_name: "",
      last_name: "",
      email: "",
      gender: "",
      date_of_birth: "",
      password: "",
      confirm_password: "",
    };
    this.verify = { email: "", code: "" };
  }

  async connectedCallback() {
    super.connectedCallback();
    document.title = "Customer Sign Up";
    await this.loadLoginSetting();
    const pending = localStorage.getItem("pending_signup_email");
    if (pending) {
      this.step = "verify";
      this.verify.email = pending;
      this.innerHTML = this.render();
    }
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

  handleVerifyChange(field, value) {
    this.verify[field] = value;
  }

  async submitSignup() {
    const {
      first_name,
      last_name,
      email,
      gender,
      date_of_birth,
      password,
      confirm_password,
    } = this.formData;

    if (!first_name || !last_name || !email || !password) {
      window.Toast.show({
        title: "Validation Error",
        message: "Please fill in all required fields.",
        variant: "error",
      });
      return;
    }
    if (password !== confirm_password) {
      window.Toast.show({
        title: "Password mismatch",
        message: "Passwords do not match.",
        variant: "error",
      });
      return;
    }

    try {
      await api.post("/auth/register", {
        first_name,
        last_name,
        email,
        gender,
        date_of_birth,
        password,
      });
        localStorage.setItem("pending_signup_email", email);
        this.step = "verify";
        this.verify.email = email;
        this.innerHTML = this.render();
      window.Toast.show({
        title: "Verification sent",
        message: "A verification code has been sent to your email.",
        variant: "success",
      });
    } catch (error) {
      window.Toast.show({
        title: "Signup failed",
        message: error.response?.data?.error || "Unable to create account.",
        variant: "error",
      });
    }
  }

  async submitVerify() {
    if (!this.verify.email || !this.verify.code) {
      window.Toast.show({
        title: "Validation Error",
        message: "Email and verification code are required.",
        variant: "error",
      });
      return;
    }
      try {
        const res = await api.post("/auth/verify-registration", {
          email: this.verify.email,
          code: this.verify.code,
        });
        const user = res?.data?.user || null;
        const token = res?.data?.token || user?.token;
          if (user && token) {
            localStorage.setItem("userData", JSON.stringify(user));
            localStorage.setItem("token", token);
          }
          localStorage.removeItem("pending_signup_email");
          window.Toast.show({
            title: "Verified",
            message: "Your email has been verified. Welcome!",
            variant: "success",
          });
          setTimeout(() => {
          window.location.href = "/profile";
          }, 700);
      } catch (error) {
      window.Toast.show({
        title: "Verification failed",
        message: error.response?.data?.error || "Invalid or expired code.",
        variant: "error",
      });
    }
  }

  renderForm() {
    return `
      <div class="space-y-4">
        <div class="grid grid-cols-2 gap-3">
          <div>
            <label class="block text-sm font-semibold text-slate-700 mb-1">First name</label>
            <ui-input value="${this.formData.first_name}" oninput="this.closest('app-customer-signup-page').handleInputChange('first_name', this.value)"></ui-input>
          </div>
          <div>
            <label class="block text-sm font-semibold text-slate-700 mb-1">Last name</label>
            <ui-input value="${this.formData.last_name}" oninput="this.closest('app-customer-signup-page').handleInputChange('last_name', this.value)"></ui-input>
          </div>
        </div>

        <div>
          <label class="block text-sm font-semibold text-slate-700 mb-1">Email</label>
          <ui-input type="email" value="${this.formData.email}" oninput="this.closest('app-customer-signup-page').handleInputChange('email', this.value)"></ui-input>
        </div>

        <div class="grid grid-cols-2 gap-3">
          <div>
            <label class="block text-sm font-semibold text-slate-700 mb-1">Gender</label>
            <ui-dropdown value="${this.formData.gender}" onchange="this.closest('app-customer-signup-page').handleInputChange('gender', event.detail.value)">
              <ui-option value="">Select</ui-option>
              <ui-option value="male">Male</ui-option>
              <ui-option value="female">Female</ui-option>
              <ui-option value="other">Other</ui-option>
            </ui-dropdown>
          </div>
          <div>
            <label class="block text-sm font-semibold text-slate-700 mb-1">Date of birth</label>
            <ui-input type="date" value="${this.formData.date_of_birth}" oninput="this.closest('app-customer-signup-page').handleInputChange('date_of_birth', this.value)"></ui-input>
          </div>
        </div>

        <div>
          <label class="block text-sm font-semibold text-slate-700 mb-1">Password</label>
          <ui-input type="password" value="${this.formData.password}" oninput="this.closest('app-customer-signup-page').handleInputChange('password', this.value)"></ui-input>
        </div>
        <div>
          <label class="block text-sm font-semibold text-slate-700 mb-1">Confirm password</label>
          <ui-input type="password" value="${this.formData.confirm_password}" oninput="this.closest('app-customer-signup-page').handleInputChange('confirm_password', this.value)"></ui-input>
        </div>

        <button class="w-full px-4 py-3 rounded-xl bg-slate-900 text-white text-sm font-semibold hover:bg-slate-800 transition" onclick="this.closest('app-customer-signup-page').submitSignup()">Create account</button>
      </div>
    `;
  }

  renderVerify() {
    return `
      <div class="space-y-4">
        <div>
          <label class="block text-sm font-semibold text-slate-700 mb-1">Email</label>
          <ui-input type="email" value="${this.verify.email}" oninput="this.closest('app-customer-signup-page').handleVerifyChange('email', this.value)"></ui-input>
        </div>
        <div>
          <label class="block text-sm font-semibold text-slate-700 mb-1">Verification code</label>
          <ui-input value="${this.verify.code}" oninput="this.closest('app-customer-signup-page').handleVerifyChange('code', this.value)"></ui-input>
        </div>
        <button class="w-full px-4 py-3 rounded-xl bg-slate-900 text-white text-sm font-semibold hover:bg-slate-800 transition" onclick="this.closest('app-customer-signup-page').submitVerify()">Verify email</button>
      </div>
    `;
  }

  render() {
    if (!this.loginEnabled) {
      return `
        <div class="min-h-screen bg-white flex items-center justify-center px-6 py-12">
          <div class="max-w-md text-center">
            <h1 class="text-3xl font-black text-slate-900 mb-3">Sign up disabled</h1>
            <p class="text-slate-500 mb-6">Customer registration is currently disabled by the store administrator.</p>
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
            <h1 class="text-3xl font-black text-slate-900 mb-2">Create your account</h1>
            <p class="text-slate-500">Sign up to manage orders and wishlist.</p>
          </div>

          <div class="bg-white border border-slate-100 rounded-2xl p-6 shadow-sm">
            ${this.step === "verify" ? this.renderVerify() : this.renderForm()}
          </div>

          <div class="mt-6 text-center text-sm text-slate-500">
            Already have an account?
            <a href="/auth/customer-login" class="font-semibold text-slate-900 hover:text-indigo-600">Sign in</a>
          </div>
        </div>
      </div>
    `;
  }
}

customElements.define("app-customer-signup-page", CustomerSignupPage);
export default CustomerSignupPage;

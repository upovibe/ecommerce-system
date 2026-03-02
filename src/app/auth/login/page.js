import App from "@/core/App.js";
import "@/components/ui/Card.js";
import "@/components/ui/Input.js";
import "@/components/ui/Button.js";
import "@/components/ui/Toast.js";
import api from "@/services/api.js";

class LoginPage extends App {
  constructor() {
    super();
    this.formData = {
      email: "",
      password: "",
    };
  }

  connectedCallback() {
    super.connectedCallback();
    document.title = "Login | VastCommerce";
  }

  handleInputChange(field, value) {
    this.formData[field] = value;
  }

  async handleSubmit() {
    const { email, password } = this.formData;

    if (!email || !password) {
      window.Toast.show({
        title: "Validation Error",
        message: "Please fill in all fields",
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
        title: "Login Successful",
        message: `Welcome back, ${user.name}!`,
        variant: "success",
      });

      setTimeout(() => {
        if (user.user_type === "admin") {
          window.location.href = "/dashboard/admin";
        } else {
          window.location.href = "/profile";
        }
      }, 1500);
    } catch (error) {
      window.Toast.show({
        title: "Login Failed",
        message: error.response?.data?.error || "Invalid credentials",
        variant: "error",
      });
    }
  }

  render() {
    return `
            <div class="flex items-center justify-center min-h-screen bg-slate-50 p-6 relative overflow-hidden">
                <!-- Background Decoration -->
                <div class="absolute top-[-10%] left-[-10%] w-[40%] h-[40%] bg-indigo-500/5 rounded-full blur-[120px]"></div>
                <div class="absolute bottom-[-10%] right-[-10%] w-[40%] h-[40%] bg-indigo-600/5 rounded-full blur-[120px]"></div>

                <ui-card class="w-full max-w-md p-10 shadow-[0_20px_50px_rgba(79,70,229,0.1)] bg-white rounded-[2.5rem] relative z-10 border border-slate-100">
                    <div class="text-center mb-10">
                        <div class="inline-flex items-center justify-center w-20 h-20 bg-gradient-to-br from-indigo-600 to-indigo-700 rounded-[2rem] shadow-xl shadow-indigo-200 mb-6 text-white transform rotate-3 hover:rotate-0 transition-transform duration-500">
                            <i class="fas fa-shopping-bag text-4xl"></i>
                        </div>
                        <h1 class="text-4xl font-black text-slate-900 mb-2 tracking-tight">VastCommerce</h1>
                        <p class="text-slate-500 font-medium">Elevating commerce through universal design</p>
                    </div>

                    <form class="space-y-6" onsubmit="event.preventDefault(); this.closest('app-login-page').handleSubmit();">
                        <div>
                            <label class="block text-sm font-bold text-slate-700 mb-2 px-1">Email Address</label>
                            <ui-input 
                                type="email" 
                                placeholder="name@vastcommerce.com"
                                oninput="this.closest('app-login-page').handleInputChange('email', this.value)"
                                class="rounded-2xl border-slate-200 focus:border-indigo-500 focus:ring-4 focus:ring-indigo-500/10">
                            </ui-input>
                        </div>

                        <div>
                            <label class="block text-sm font-bold text-slate-700 mb-2 px-1">Password</label>
                            <ui-input 
                                type="password" 
                                placeholder="••••••••"
                                oninput="this.closest('app-login-page').handleInputChange('password', this.value)"
                                class="rounded-2xl border-slate-200 focus:border-indigo-500 focus:ring-4 focus:ring-indigo-500/10">
                            </ui-input>
                        </div>

                        <div class="flex items-center justify-between px-1 mb-2">
                            <label class="flex items-center gap-2 text-sm text-slate-500 font-medium cursor-pointer">
                                <input type="checkbox" class="w-4 h-4 rounded-md border-slate-300 text-indigo-600 focus:ring-indigo-500">
                                Remember me
                            </label>
                            <a href="#" class="text-sm font-bold text-indigo-600 hover:text-indigo-700">Forgot?</a>
                        </div>

                        <ui-button type="submit" color="primary" class="w-full h-14 text-lg font-black rounded-2xl shadow-lg shadow-indigo-100 bg-indigo-600 hover:bg-indigo-700 transition-all hover:scale-[1.02] active:scale-[0.98]">
                            Sign In to Portal
                        </ui-button>
                    </form>

                    <div class="mt-10 pt-8 border-t border-slate-50 text-center">
                        <div class="flex items-center justify-center gap-2 text-slate-400 font-bold tracking-widest text-[10px] uppercase opacity-50">
                            <i class="fas fa-shield-alt"></i> Secure Enterprise Access
                        </div>
                    </div>
                </ui-card>
            </div>
        `;
  }
}

customElements.define("app-login-page", LoginPage);
export default LoginPage;

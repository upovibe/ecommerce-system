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
        window.location.href = "/admin";
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
            <div class="flex items-center justify-center min-h-screen bg-slate-50 p-6">
                <ui-card class="w-full max-w-md p-8 shadow-xl bg-white rounded-2xl">
                    <div class="text-center mb-8">
                        <div class="inline-flex items-center justify-center w-16 h-16 bg-blue-600 rounded-2xl shadow-lg mb-4 text-white">
                            <i class="fas fa-shopping-bag text-3xl"></i>
                        </div>
                        <h1 class="text-3xl font-extrabold text-slate-900 mb-2">VastCommerce</h1>
                        <p class="text-slate-500">Sign in to manage your universal shop</p>
                    </div>

                    <form class="space-y-6" onsubmit="event.preventDefault(); this.closest('app-login-page').handleSubmit();">
                        <div>
                            <label class="block text-sm font-semibold text-slate-700 mb-2">Email Address</label>
                            <ui-input 
                                type="email" 
                                placeholder="admin@vastcommerce.com"
                                oninput="this.closest('app-login-page').handleInputChange('email', this.value)">
                            </ui-input>
                        </div>

                        <div>
                            <label class="block text-sm font-semibold text-slate-700 mb-2">Password</label>
                            <ui-input 
                                type="password" 
                                placeholder="••••••••"
                                oninput="this.closest('app-login-page').handleInputChange('password', this.value)">
                            </ui-input>
                        </div>

                        <ui-button type="submit" color="primary" class="w-full h-12 text-lg font-bold rounded-xl shadow-md transition-all hover:scale-[1.02]">
                            Sign In
                        </ui-button>
                    </form>

                    <div class="mt-8 pt-6 border-t border-slate-100 text-center">
                        <p class="text-sm text-slate-400 font-medium">Secured by VastCommerce API</p>
                    </div>
                </ui-card>
            </div>
        `;
  }
}

customElements.define("app-login-page", LoginPage);
export default LoginPage;

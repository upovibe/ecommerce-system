import App from "@/core/App.js";

/**
 * Root Layout for Universal E-commerce System
 */
class RootLayout extends App {
  constructor() {
    super();
  }

  render() {
    return `
            <div class="min-h-screen bg-gray-50 flex flex-col">
                <nav class="bg-white border-b border-gray-200 px-6 py-4 flex items-center justify-between sticky top-0 z-50">
                    <div class="flex items-center gap-8">
                        <a href="/" class="text-2xl font-bold text-indigo-600 tracking-tight">VastCommerce</a>
                        <div class="hidden md:flex items-center gap-6 text-sm font-medium text-gray-600">
                            <a href="/categories" class="hover:text-indigo-600 transition-colors">Categories</a>
                            <a href="/deals" class="hover:text-indigo-600 transition-colors">Today's Deals</a>
                        </div>
                    </div>
                    <div class="flex items-center gap-4">
                        <div class="relative hidden sm:block">
                            <input type="text" placeholder="Search products..." class="bg-gray-100 border-none rounded-full px-4 py-2 text-sm w-64 focus:ring-2 focus:ring-indigo-500 transition-all outline-none">
                        </div>
                        <button class="text-gray-600 hover:text-indigo-600 p-2"><i class="fas fa-shopping-cart text-lg"></i></button>
                        <button class="bg-indigo-600 text-white px-4 py-2 rounded-lg text-sm font-semibold hover:bg-indigo-700 transition-colors">Login</button>
                    </div>
                </nav>
                <main id="page-content" class="flex-grow"></main>
                <footer class="bg-white border-t border-gray-200 py-12 px-6">
                    <div class="max-w-7xl mx-auto text-center text-gray-500 text-sm">
                        &copy; 2026 VastCommerce. Universal E-commerce Architecture.
                    </div>
                </footer>
            </div>
        `;
  }

  setPageContent(content) {
    const container = this.querySelector("#page-content");
    if (container) {
      container.innerHTML = content;
    }
  }
}

customElements.define("root-layout", RootLayout);
export default RootLayout;

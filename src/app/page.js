import App from "@/core/App.js";

/**
 * Home Page (Landing)
 */
class Page extends App {
  constructor() {
    super();
  }

  render() {
    return `
            <div class="py-12 px-6 max-w-7xl mx-auto">
                <section class="bg-indigo-600 rounded-2xl p-12 text-center text-white mb-12 shadow-xl overflow-hidden relative">
                    <div class="absolute top-0 right-0 p-6 z-20 flex gap-4">
                        <a href="/login" class="text-white bg-indigo-500 hover:bg-indigo-400 px-6 py-2 rounded-full font-bold transition-all shadow-lg border border-indigo-400">Admin Login</a>
                        <a href="/login" class="text-white bg-slate-800 hover:bg-slate-700 px-6 py-2 rounded-full font-bold transition-all shadow-lg border border-slate-700">Customer Login</a>
                    </div>
                    <div class="relative z-10">
                        <h1 class="text-5xl font-extrabold mb-4">One Store, Infinite Possibilities</h1>
                        <p class="text-indigo-100 text-xl mb-8 max-w-2xl mx-auto">From real estate to fast food, cars to fashion. Our universal architecture handles it all.</p>
                        <button class="bg-white text-indigo-600 px-8 py-4 rounded-full font-bold hover:bg-indigo-50 transition-transform hover:scale-105">Explore Categories</button>
                    </div>
                    <div class="absolute top-0 left-0 w-full h-full opacity-10 pointer-events-none">
                        <i class="fas fa-shopping-bag text-[20rem] absolute -top-10 -left-10 rotate-12"></i>
                        <i class="fas fa-home text-[15rem] absolute -bottom-10 -right-10 -rotate-12"></i>
                    </div>
                </section>

                <div class="grid grid-cols-1 md:grid-cols-3 gap-8">
                    <div class="bg-white p-8 rounded-xl border border-gray-100 shadow-sm hover:shadow-md transition-shadow">
                        <div class="w-12 h-12 bg-blue-100 rounded-lg flex items-center justify-center text-blue-600 mb-6 font-bold text-xl"><i class="fas fa-bolt"></i></div>
                        <h3 class="text-xl font-bold mb-2">Fast Food</h3>
                        <p class="text-gray-500 mb-6">Real-time orders, dynamic variants, and instant delivery tracking.</p>
                        <a href="/food" class="text-blue-600 font-semibold flex items-center gap-2 hover:underline">View Demo <i class="fas fa-arrow-right text-xs"></i></a>
                    </div>
                    <div class="bg-white p-8 rounded-xl border border-gray-100 shadow-sm hover:shadow-md transition-shadow">
                        <div class="w-12 h-12 bg-emerald-100 rounded-lg flex items-center justify-center text-emerald-600 mb-6 font-bold text-xl"><i class="fas fa-key"></i></div>
                        <h3 class="text-xl font-bold mb-2">Real Estate</h3>
                        <p class="text-gray-500 mb-6">Advanced metadata for properties, map integration, and lead management.</p>
                        <a href="/properties" class="text-emerald-600 font-semibold flex items-center gap-2 hover:underline">View Demo <i class="fas fa-arrow-right text-xs"></i></a>
                    </div>
                    <div class="bg-white p-8 rounded-xl border border-gray-100 shadow-sm hover:shadow-md transition-shadow">
                        <div class="w-12 h-12 bg-amber-100 rounded-lg flex items-center justify-center text-amber-600 mb-6 font-bold text-xl"><i class="fas fa-car"></i></div>
                        <h3 class="text-xl font-bold mb-2">Automotive</h3>
                        <p class="text-gray-500 mb-6">Detailed vehicle specs, variant options, and service scheduling.</p>
                        <a href="/cars" class="text-amber-600 font-semibold flex items-center gap-2 hover:underline">View Demo <i class="fas fa-arrow-right text-xs"></i></a>
                    </div>
                </div>
            </div>
        `;
  }
}

customElements.define("app-page", Page);
export default Page;

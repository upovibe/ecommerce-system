import App from "@/core/App.js";

/**
 * Home Page (Landing)
 */
class PublicHomePage extends App {
  constructor() {
    super();
  }

  render() {
    return `
            <div class="py-12 px-6 max-w-7xl mx-auto">
                <section class="bg-indigo-600 rounded-[3rem] p-20 text-center text-white mb-16 shadow-2xl overflow-hidden relative border border-indigo-500/50">
                    <div class="relative z-10 max-w-3xl mx-auto">
                         <div class="inline-block px-4 py-1.5 bg-indigo-500/30 rounded-full text-[10px] font-black uppercase tracking-widest mb-6 border border-white/10 backdrop-blur-sm">
                            VastCommerce Ecosystem Ready
                        </div>
                        <h1 class="text-7xl font-black mb-6 tracking-tighter leading-none">One Store, <span class="text-indigo-200">Infinite</span> Possibilities</h1>
                        <p class="text-indigo-100/80 text-xl mb-12 font-medium">From real estate to luxury fashion, vehicles to fast food. Our universal architecture powers every industry with premium precision.</p>
                        <div class="flex flex-wrap justify-center gap-6">
                          <button class="bg-white text-indigo-600 px-10 py-5 rounded-2xl font-black text-xs uppercase tracking-widest hover:bg-indigo-50 transition-all hover:scale-105 active:scale-95 shadow-xl shadow-indigo-900/20">Explore All Collections</button>
                          <button class="bg-indigo-500/20 text-white border border-white/20 px-10 py-5 rounded-2xl font-black text-xs uppercase tracking-widest hover:bg-white/10 transition-all backdrop-blur-md">View Integration Docs</button>
                        </div>
                    </div>
                    <div class="absolute top-0 left-0 w-full h-full opacity-10 pointer-events-none">
                        <i class="fas fa-shopping-bag text-[30rem] absolute -top-20 -left-20 rotate-12"></i>
                        <i class="fas fa-rocket text-[20rem] absolute -bottom-20 -right-20 -rotate-12"></i>
                    </div>
                </section>

                <div class="grid grid-cols-1 md:grid-cols-3 gap-10">
                    <div class="bg-white p-10 rounded-[2.5rem] border border-slate-100 shadow-sm hover:shadow-xl transition-all hover:-translate-y-2 group">
                        <div class="w-16 h-16 bg-blue-50 rounded-2xl flex items-center justify-center text-blue-600 mb-8 font-black text-2xl shadow-sm group-hover:bg-blue-600 group-hover:text-white transition-all"><i class="fas fa-utensils"></i></div>
                        <h3 class="text-2xl font-black text-slate-900 mb-3 tracking-tight">Fast Food</h3>
                        <p class="text-slate-500 font-medium mb-8 leading-relaxed">Real-time orders, dynamic variants, and instant delivery tracking with millisecond precision.</p>
                        <a href="/public/products" class="text-blue-600 font-black text-[10px] uppercase tracking-widest flex items-center gap-3 hover:gap-5 transition-all">Launch Demo <i class="fas fa-arrow-right"></i></a>
                    </div>
                    <div class="bg-white p-10 rounded-[2.5rem] border border-slate-100 shadow-sm hover:shadow-xl transition-all hover:-translate-y-2 group">
                        <div class="w-16 h-16 bg-emerald-50 rounded-2xl flex items-center justify-center text-emerald-600 mb-8 font-black text-2xl shadow-sm group-hover:bg-emerald-600 group-hover:text-white transition-all"><i class="fas fa-home"></i></div>
                        <h3 class="text-2xl font-black text-slate-900 mb-3 tracking-tight">Real Estate</h3>
                        <p class="text-slate-500 font-medium mb-8 leading-relaxed">Advanced metadata for properties, full map integration, and automated lead management workflows.</p>
                        <a href="/public/products" class="text-emerald-600 font-black text-[10px] uppercase tracking-widest flex items-center gap-3 hover:gap-5 transition-all">Launch Demo <i class="fas fa-arrow-right"></i></a>
                    </div>
                    <div class="bg-white p-10 rounded-[2.5rem] border border-slate-100 shadow-sm hover:shadow-xl transition-all hover:-translate-y-2 group">
                        <div class="w-16 h-16 bg-amber-50 rounded-2xl flex items-center justify-center text-amber-600 mb-8 font-black text-2xl shadow-sm group-hover:bg-amber-600 group-hover:text-white transition-all"><i class="fas fa-car-side"></i></div>
                        <h3 class="text-2xl font-black text-slate-900 mb-3 tracking-tight">Automotive</h3>
                        <p class="text-slate-500 font-medium mb-8 leading-relaxed">Detailed specs, complex service scheduling, and deep variant customization for enterprise fleets.</p>
                        <a href="/public/products" class="text-amber-600 font-black text-[10px] uppercase tracking-widest flex items-center gap-3 hover:gap-5 transition-all">Launch Demo <i class="fas fa-arrow-right"></i></a>
                    </div>
                </div>
            </div>
        `;
  }
}

customElements.define("app-public-home-page", PublicHomePage);
export default PublicHomePage;

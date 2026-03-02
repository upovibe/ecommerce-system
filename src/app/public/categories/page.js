import App from "@/core/App.js";

class CategoriesPage extends App {
  render() {
    return `
      <div class="py-20 px-8 max-w-7xl mx-auto">
        <header class="mb-16 text-center">
          <p class="text-indigo-600 font-black uppercase tracking-[0.3em] text-[10px] mb-4">Store Collections</p>
          <h1 class="text-6xl font-black text-slate-900 tracking-tighter">Shop by <span class="text-indigo-600">Category</span></h1>
          <p class="text-slate-500 mt-4 text-lg font-medium max-w-xl mx-auto">Discover our diverse range of premium collections, each curated to bring you the best in quality and style.</p>
        </header>

        <div class="grid grid-cols-1 md:grid-cols-2 gap-10">
          ${this.renderCategoryBanner("Luxury Fashion", "250+ Products", "https://images.unsplash.com/photo-1445205170230-053b830c6050?auto=format&fit=crop&q=80&w=800", "indigo")}
          ${this.renderCategoryBanner("Smart Electronics", "120+ Products", "https://images.unsplash.com/photo-1498049794561-7780e7231661?auto=format&fit=crop&q=80&w=800", "slate")}
          ${this.renderCategoryBanner("Modern Home", "380+ Products", "https://images.unsplash.com/photo-1513519245088-0e12902e5a38?auto=format&fit=crop&q=80&w=800", "emerald")}
          ${this.renderCategoryBanner("Automotive Gear", "95+ Products", "https://images.unsplash.com/photo-1503376780353-7edb65ce8cda?auto=format&fit=crop&q=80&w=800", "amber")}
        </div>
      </div>
    `;
  }

  renderCategoryBanner(name, count, image, color) {
    const overlays = {
      indigo: "from-indigo-900/80",
      slate: "from-slate-900/80",
      emerald: "from-emerald-900/80",
      amber: "from-amber-900/80",
    };
    return `
      <div class="group relative h-96 rounded-[3rem] overflow-hidden cursor-pointer shadow-xl shadow-slate-100 transition-all hover:-translate-y-2">
        <img src="${image}" alt="${name}" class="w-full h-full object-cover group-hover:scale-110 transition-transform duration-700">
        <div class="absolute inset-0 bg-gradient-to-t ${overlays[color]} to-transparent flex flex-col justify-end p-12">
          <p class="text-white/70 font-black uppercase tracking-widest text-[10px] mb-2">${count}</p>
          <h3 class="text-4xl font-black text-white mb-6">${name}</h3>
          <button class="w-fit px-8 py-3 bg-white text-slate-900 rounded-2xl font-black text-xs uppercase tracking-widest hover:bg-indigo-600 hover:text-white transition-colors">Explore Collection</button>
        </div>
      </div>
    `;
  }
}

customElements.define("app-categories-page", CategoriesPage);
export default CategoriesPage;

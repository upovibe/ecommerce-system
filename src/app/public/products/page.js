import App from "@/core/App.js";

class ProductsPage extends App {
  render() {
    return `
      <div class="py-20 px-8 max-w-7xl mx-auto">
        <header class="mb-16">
          <div class="flex items-center gap-3 text-indigo-600 font-black uppercase tracking-widest text-[10px] mb-2">
            <span class="w-8 h-px bg-indigo-600"></span> Vast Catalog
          </div>
          <h1 class="text-6xl font-black text-slate-900 tracking-tighter">Premium <span class="text-indigo-600">Collection</span></h1>
          <p class="text-slate-500 mt-4 text-lg font-medium max-w-2xl">Browse our curated selection of high-quality products across all categories. Designed for excellence, built for you.</p>
        </header>

        <!-- Filters Bar -->
        <div class="flex items-center justify-between mb-12 py-6 border-y border-slate-100">
          <div class="flex items-center gap-4">
            <span class="text-[10px] font-black uppercase tracking-widest text-slate-400">Sort By:</span>
            <select class="bg-transparent border-none font-bold text-sm text-slate-900 focus:ring-0 cursor-pointer">
              <option>Newest First</option>
              <option>Price: Low to High</option>
              <option>Price: High to Low</option>
              <option>Popularity</option>
            </select>
          </div>
          <p class="text-[10px] font-black uppercase tracking-widest text-slate-400">Showing 24 of 1,280 Products</p>
        </div>

        <!-- Products Grid -->
        <div class="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-10">
          ${this.renderProductCard("Classic Urban Hoodie", "Fashion", "$89.00", "https://images.unsplash.com/photo-1556821840-3a63f95609a7?auto=format&fit=crop&q=80&w=400")}
          ${this.renderProductCard("Vast Tech Watch v2", "Electronics", "$249.00", "https://images.unsplash.com/photo-1523275335684-37898b6baf30?auto=format&fit=crop&q=80&w=400")}
          ${this.renderProductCard("Minimalist Desk Lamp", "Home", "$120.00", "https://images.unsplash.com/photo-1507473885765-e6ed057f782c?auto=format&fit=crop&q=80&w=400")}
          ${this.renderProductCard("Premium Leather Bag", "Accessories", "$180.00", "https://images.unsplash.com/photo-1548036328-c9fa89d128fa?auto=format&fit=crop&q=80&w=400")}
        </div>
      </div>
    `;
  }

  renderProductCard(name, category, price, image) {
    return `
      <div class="group cursor-pointer">
        <div class="relative aspect-[4/5] bg-slate-50 rounded-[2.5rem] overflow-hidden mb-6 group-hover:shadow-2xl group-hover:shadow-indigo-100 transition-all duration-500">
          <img src="${image}" alt="${name}" class="w-full h-full object-cover group-hover:scale-110 transition-transform duration-700">
          <div class="absolute inset-0 bg-gradient-to-t from-slate-900/60 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-500 flex items-end p-8">
            <button class="w-full py-4 bg-white text-slate-900 rounded-2xl font-black text-xs uppercase tracking-widest hover:bg-indigo-600 hover:text-white transition-colors">Quick View</button>
          </div>
          <div class="absolute top-6 right-6">
            <button class="w-10 h-10 bg-white/90 backdrop-blur-sm rounded-xl flex items-center justify-center text-slate-400 hover:text-rose-500 transition-colors shadow-sm">
              <i class="far fa-heart"></i>
            </button>
          </div>
        </div>
        <div class="px-2">
          <p class="text-[10px] font-black uppercase tracking-widest text-indigo-600 mb-1">${category}</p>
          <h3 class="text-lg font-black text-slate-900 mb-2 leading-tight">${name}</h3>
          <p class="text-xl font-black text-slate-900">${price}</p>
        </div>
      </div>
    `;
  }
}

customElements.define("app-products-page", ProductsPage);
export default ProductsPage;

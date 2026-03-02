/**
 * Pagination Component
 * 
 * A flexible pagination component with page numbers, navigation buttons, and various display options.
 * 
 * Attributes:
 * - current-page: number (default: 1) - current active page
 * - total-pages: number (default: 1) - total number of pages
 * - show-prev-next: boolean (default: true) - show previous/next buttons
 * - show-first-last: boolean (default: false) - show first/last buttons
 * - max-visible: number (default: 5) - maximum visible page numbers
 * - variant: string (default: "default") - style variant: "default", "primary", "secondary"
 * 
 * Events:
 * - page-change: Fired when page changes (detail: { page: number })
 * 
 * Usage:
 * <ui-pagination current-page="3" total-pages="10" max-visible="5"></ui-pagination>
 */
class Pagination extends HTMLElement {
    constructor() {
        super();
        this.attachShadow({ mode: 'open' });
        this.currentPage = parseInt(this.getAttribute('current-page')) || 1;
        this.totalPages = parseInt(this.getAttribute('total-pages')) || 1;
    }

    static get observedAttributes() {
        return ['current-page', 'total-pages', 'show-prev-next', 'show-first-last', 'max-visible', 'variant'];
    }

    connectedCallback() {
        this.render();
        this.setupEventListeners();
    }

    attributeChangedCallback(name, oldValue, newValue) {
        if (oldValue !== newValue) {
            this.currentPage = parseInt(this.getAttribute('current-page')) || 1;
            this.totalPages = parseInt(this.getAttribute('total-pages')) || 1;
            this.render();
            this.setupEventListeners();
        }
    }

    setupEventListeners() {
        this.shadowRoot.addEventListener('click', (e) => {
            if (e.target.classList.contains('pagination-item')) {
                e.preventDefault();
                const page = parseInt(e.target.dataset.page);
                if (page && page !== this.currentPage) {
                    this.goToPage(page);
                }
            }
        });
    }

    goToPage(page) {
        if (page < 1 || page > this.totalPages) return;
        
        this.currentPage = page;
        this.setAttribute('current-page', page.toString());
        
        // Dispatch page change event
        this.dispatchEvent(new CustomEvent('page-change', {
            detail: { page: page }
        }));
    }

    getVisiblePages() {
        const maxVisible = parseInt(this.getAttribute('max-visible')) || 5;
        const current = this.currentPage;
        const total = this.totalPages;
        
        if (total <= maxVisible) {
            return Array.from({ length: total }, (_, i) => i + 1);
        }
        
        const half = Math.floor(maxVisible / 2);
        let start = Math.max(1, current - half);
        let end = Math.min(total, start + maxVisible - 1);
        
        if (end - start + 1 < maxVisible) {
            start = Math.max(1, end - maxVisible + 1);
        }
        
        return Array.from({ length: end - start + 1 }, (_, i) => start + i);
    }

    render() {
        const currentPage = this.currentPage;
        const totalPages = this.totalPages;
        const showPrevNext = this.getAttribute('show-prev-next') !== 'false';
        const showFirstLast = this.getAttribute('show-first-last') === 'true';
        const variant = this.getAttribute('variant') || 'default';
        const visiblePages = this.getVisiblePages();

        this.shadowRoot.innerHTML = `
            <style>
                :host {
                    display: inline-flex;
                    align-items: center;
                    font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif;
                }

                .pagination {
                    display: flex;
                    align-items: center;
                    gap: 0.25rem;
                    list-style: none;
                    margin: 0;
                    padding: 0;
                }

                .pagination-item {
                    display: inline-flex;
                    align-items: center;
                    justify-content: center;
                    min-width: 2rem;
                    height: 2rem;
                    padding: 0 0.5rem;
                    border: 1px solid #d1d5db;
                    background: white;
                    color: #374151;
                    text-decoration: none;
                    border-radius: 0.375rem;
                    font-size: 0.75rem;
                    font-weight: 500;
                    cursor: pointer;
                    transition: all 0.15s ease-in-out;
                    user-select: none;
                }

                .pagination-item:hover:not(.disabled) {
                    background-color: #f9fafb;
                    border-color: #9ca3af;
                    color: #111827;
                }

                .pagination-item.active {
                    background-color: #3b82f6;
                    border-color: #3b82f6;
                    color: white;
                }

                .pagination-item.active:hover {
                    background-color: #2563eb;
                    border-color: #2563eb;
                }

                .pagination-item.disabled {
                    opacity: 0.5;
                    cursor: not-allowed;
                    background-color: #f3f4f6;
                    color: #9ca3af;
                }

                .pagination-item.disabled:hover {
                    background-color: #f3f4f6;
                    border-color: #d1d5db;
                    color: #9ca3af;
                }

                /* Variant styles */
                .pagination-item.variant-primary {
                    border-color: #3b82f6;
                    color: #3b82f6;
                }

                .pagination-item.variant-primary:hover:not(.disabled) {
                    background-color: #3b82f6;
                    color: white;
                }

                .pagination-item.variant-primary.active {
                    background-color: #3b82f6;
                    color: white;
                }

                .pagination-item.variant-secondary {
                    border-color: #6b7280;
                    color: #6b7280;
                }

                .pagination-item.variant-secondary:hover:not(.disabled) {
                    background-color: #6b7280;
                    color: white;
                }

                .pagination-item.variant-secondary.active {
                    background-color: #6b7280;
                    color: white;
                }

                /* Ellipsis styling */
                .pagination-ellipsis {
                    display: inline-flex;
                    align-items: center;
                    justify-content: center;
                    min-width: 2rem;
                    height: 2rem;
                    padding: 0 0.5rem;
                    color: #6b7280;
                    font-size: 0.75rem;
                    user-select: none;
                }

                /* Responsive */
                @media (max-width: 640px) {
                    .pagination-item {
                        min-width: 1.75rem;
                        height: 1.75rem;
                        padding: 0 0.375rem;
                        font-size: 0.7rem;
                    }
                    
                    .pagination-ellipsis {
                        min-width: 1.75rem;
                        height: 1.75rem;
                        padding: 0 0.375rem;
                        font-size: 0.7rem;
                    }
                }
            </style>

            <nav aria-label="Pagination">
                <ul class="pagination">
                    ${showFirstLast && currentPage > 1 ? `
                        <li>
                            <button class="pagination-item variant-${variant}" data-page="1" aria-label="Go to first page">
                                <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                                    <polyline points="11,17 6,12 11,7"></polyline>
                                    <polyline points="17,17 12,12 17,7"></polyline>
                                </svg>
                            </button>
                        </li>
                    ` : ''}
                    
                    ${showPrevNext ? `
                        <li>
                            <button class="pagination-item variant-${variant} ${currentPage <= 1 ? 'disabled' : ''}" 
                                    data-page="${currentPage - 1}" 
                                    aria-label="Go to previous page"
                                    ${currentPage <= 1 ? 'disabled' : ''}>
                                <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                                    <polyline points="15,18 9,12 15,6"></polyline>
                                </svg>
                            </button>
                        </li>
                    ` : ''}
                    
                    ${visiblePages[0] > 1 ? `
                        <li>
                            <span class="pagination-ellipsis">...</span>
                        </li>
                    ` : ''}
                    
                    ${visiblePages.map(page => `
                        <li>
                            <button class="pagination-item variant-${variant} ${page === currentPage ? 'active' : ''}" 
                                    data-page="${page}" 
                                    aria-label="Go to page ${page}"
                                    ${page === currentPage ? 'aria-current="page"' : ''}>
                                ${page}
                            </button>
                        </li>
                    `).join('')}
                    
                    ${visiblePages[visiblePages.length - 1] < totalPages ? `
                        <li>
                            <span class="pagination-ellipsis">...</span>
                        </li>
                    ` : ''}
                    
                    ${showPrevNext ? `
                        <li>
                            <button class="pagination-item variant-${variant} ${currentPage >= totalPages ? 'disabled' : ''}" 
                                    data-page="${currentPage + 1}" 
                                    aria-label="Go to next page"
                                    ${currentPage >= totalPages ? 'disabled' : ''}>
                                <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                                    <polyline points="9,18 15,12 9,6"></polyline>
                                </svg>
                            </button>
                        </li>
                    ` : ''}
                    
                    ${showFirstLast && currentPage < totalPages ? `
                        <li>
                            <button class="pagination-item variant-${variant}" data-page="${totalPages}" aria-label="Go to last page">
                                <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                                    <polyline points="13,17 18,12 13,7"></polyline>
                                    <polyline points="7,17 12,12 7,7"></polyline>
                                </svg>
                            </button>
                        </li>
                    ` : ''}
                </ul>
            </nav>
        `;
    }
}

customElements.define('ui-pagination', Pagination);
export default Pagination; 
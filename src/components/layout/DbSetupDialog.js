import App from '@/core/App.js';
import api from '@/services/api.js';
import Toast from '@/components/ui/Toast.js';

/**
 * DbSetupDialog Component
 *
 * This component displays a dialog to initialize the database when a connection
 * is not established. It prevents closing until the setup is successful.
 */
class DbSetupDialog extends App {
    connectedCallback() {
        super.connectedCallback();
        this.render();

        // Component state and properties
        this.outputDiv = this.querySelector('#db-setup-output');
        this.initBtn = this.querySelector('#initialize-db');
        this.isConfirming = false; // Flag to prevent cancel event during confirm

        // Show default message in output area
        if (this.outputDiv) {
            this.outputDiv.innerHTML = `
                <pre class="text-xs overflow-x-auto my-auto">php api/index.php --fresh</pre>
            `;
        }

        this.setupEventListeners();
    }

    setupEventListeners() {
        const testBtn = this.querySelector('#test-connection');
        const initBtn = this.querySelector('#initialize-db');
        const closeBtn = this.querySelector('#close-dialog');
        
        if (testBtn) {
            testBtn.addEventListener('click', () => this.handleTestConnection());
        }
        
        if (initBtn) {
            initBtn.addEventListener('click', () => this.handleConfirm());
        }

        if (closeBtn) {
            closeBtn.addEventListener('click', () => this.handleCancel());
        }

        // Close on overlay click
        const overlay = this.querySelector('#dialog-overlay');
        if (overlay) {
            overlay.addEventListener('click', (e) => {
                if (e.target === overlay) {
                    this.handleCancel();
                }
            });
        }
    }

    handleCancel(e) {
        if (e) e.preventDefault();
        if (this.isConfirming) {
            return;
        }
        Toast.show({
            message: 'Please initialize the database to continue.',
            variant: 'warning',
            duration: 3000,
        });
    }

    async handleTestConnection() {
        if (this.outputDiv) this.outputDiv.innerHTML = '<pre class="bg-blue-200 rounded p-2 text-xs overflow-x-auto w-full">Testing database connection...</pre>';
        
        try {
            const response = await api.get('/db/test');
            const { success, message, error, config } = response.data;

            if (success) {
                const configInfo = config ? `\nHost: ${config.host}\nDatabase: ${config.database}\nUser: ${config.user}` : '';
                if (this.outputDiv) this.outputDiv.innerHTML = `<pre class="bg-green-200 rounded p-2 text-xs overflow-x-auto w-full">✅ ${message}${configInfo}</pre>`;
                Toast.show({ message: 'Database connection successful!', variant: 'success', duration: 3000 });
            } else {
                const configInfo = config ? `\nHost: ${config.host}\nDatabase: ${config.database}\nUser: ${config.user}` : '';
                if (this.outputDiv) this.outputDiv.innerHTML = `<pre class="bg-red-200 rounded p-2 text-xs overflow-x-auto w-full">❌ ${error}${configInfo}</pre>`;
                Toast.show({ message: 'Database connection failed!', variant: 'error', duration: 4000 });
            }
        } catch (error) {
            const errorMessage = error.message || 'An unknown error occurred.';
            if (this.outputDiv) this.outputDiv.innerHTML = `<pre class="bg-red-200 rounded p-2 text-xs overflow-x-auto w-full">❌ ${errorMessage}</pre>`;
            Toast.show({ message: 'Connection test failed!', variant: 'error', duration: 4000 });
        }
    }

    async handleConfirm(e) {
        if (e) e.preventDefault();
        this.isConfirming = true;
        this.setLoadingState(true);
        Toast.show({ message: 'Initializing database...', variant: 'info' });
        if (this.outputDiv) this.outputDiv.innerHTML = '<pre class="bg-gray-200 rounded p-2 text-xs overflow-x-auto w-full">Initializing...</pre>';

        try {
            const response = await api.post('/db/fresh', {});
            const { success, message, error, output } = response.data;

            if (success) {
                this.setLoadingState(false);
                if (this.outputDiv) this.outputDiv.innerHTML = '<pre class="bg-green-200 rounded p-2 text-xs overflow-x-auto w-full">Database initialized successfully!</pre>';
                const initBtn = this.querySelector('#initialize-db');
                if (initBtn) {
                    initBtn.disabled = true;
                    initBtn.textContent = 'Success!';
                }
                Toast.show({ message: 'Database initialized successfully!', variant: 'success', duration: 3000 });
                setTimeout(() => {
                    location.reload();
                }, 2000);
            } else {
                const errorDetails = error || message || 'Failed to initialize database.';
                const outputDetails = output ? `\n\nOutput:\n${output}` : '';
                throw new Error(`${errorDetails}${outputDetails}`);
            }
        } catch (error) {
            const errorMessage = error.message || 'An unknown error occurred.';
            if (this.outputDiv) this.outputDiv.innerHTML = `<pre class="bg-red-200 rounded p-2 mt-2 text-xs overflow-x-auto">${errorMessage}</pre>`;
            Toast.show({ message: errorMessage, variant: 'error', duration: 4000 });
            this.setLoadingState(false);
            this.isConfirming = false;
        }
    }

    setLoadingState(isLoading) {
        const initBtn = this.querySelector('#initialize-db');
        if (isLoading) {
            if (initBtn) {
                initBtn.disabled = true;
                initBtn.textContent = 'Initializing...';
            }
        } else {
            if (initBtn) {
                initBtn.disabled = false;
                initBtn.textContent = 'Initialize Database';
            }
        }
    }

    render() {
        return `
            <div id="dialog-overlay" class="fixed inset-0 bg-black/30 backdrop-blur-sm flex items-center justify-center z-50">
                <div class="bg-white/90 backdrop-blur-md rounded-lg shadow-2xl max-w-md w-11/12 max-h-[90vh] overflow-y-auto border border-gray-200/50">
                    <div class="flex justify-between items-center p-3 border-b border-gray-200/50">
                        <h2 class="text-xl font-semibold text-gray-900 m-0">Database Setup</h2>
                        <button id="close-dialog" class="bg-transparent border-none text-2xl cursor-pointer text-gray-400 size-8 rounded transition-colors hover:text-gray-600 hover:bg-gray-100/50" type="button">
                            <i class="fas fa-times size-4"></i>
                        </button>
                    </div>
                    
                    <div class="p-6">
                        <p class="mb-4 font-semibold text-red-600">Database initialization required.</p>
                        <p class="mb-4 text-gray-700">First, test your database connection status. Then initialize the database to set up all required tables and data. Note: Initialization will reset any existing data.</p>
                        
                        <div class="flex gap-2 mb-4 justify-center w-full">
                            <button id="test-connection" class="px-4 py-2 bg-blue-500/90 backdrop-blur-sm text-white rounded hover:bg-blue-600 transition-colors w-full">
                                Test
                            </button>
                            <button id="initialize-db" class="px-4 py-2 bg-green-500/90 backdrop-blur-sm text-white rounded hover:bg-green-600 transition-colors w-full">
                                Initialize
                            </button>
                        </div>
                        
                        <div id="db-setup-output" class="mt-4 p-2 text-sm text-gray-700 bg-gray-100/80 backdrop-blur-sm rounded border min-h-[25px] flex items-center justify-center max-h-48 overflow-y-auto"></div>
                    </div>
                </div>
            </div>
        `;
    }
}

customElements.define('db-setup-dialog', DbSetupDialog);
export default DbSetupDialog;
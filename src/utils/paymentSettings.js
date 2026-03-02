import api from '@/services/api.js';
import store from '@/core/store.js';

/**
 * Fetches payment settings from the API and caches them.
 * @returns {Promise<Object>} A promise that resolves to the payment settings.
 */
export async function fetchPaymentSettings() {
    const cachedSettings = store.getState().paymentSettings;
    if (cachedSettings) {
        return cachedSettings;
    }

    try {
        const response = await api.get('/settings/category/payment');
        if (response.data.success) {
            const settings = response.data.data.reduce((acc, setting) => {
                acc[setting.setting_key] = setting.setting_value;
                return acc;
            }, {});
            store.setState({ paymentSettings: settings });
            return settings;
        }
        return {};
    } catch (error) {
        console.error('Error fetching payment settings:', error);
        return {};
    }
}

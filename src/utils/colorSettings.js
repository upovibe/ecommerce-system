import api from '@/services/api.js';

/**
 * Fetches all color settings from the API
 * @returns {Promise<Object>} Object containing all color settings
 */
export async function fetchColorSettings() {
  try {
    // Define all color settings to fetch
    const colorSettings = [
      'primary_color',
      'secondary_color',
      'accent_color',
      'hover_primary',
      'hover_secondary',
      'hover_accent',
      'text_color',
      'dark_color',
      'background_color',
      'success_color',
      'error_color',
      'warning_color'
    ];

    // Fetch all color settings in parallel
    const colorPromises = colorSettings.map(async (settingKey) => {
      try {
        const response = await api.get(`/settings/key/${settingKey}`);
        if (response.data.success && response.data.data.setting_value) {
          return { key: settingKey, value: response.data.data.setting_value };
        }
      } catch (error) {
        console.error(`Error fetching ${settingKey}:`, error);
      }
      return null;
    });

    const colorResults = await Promise.all(colorPromises);
    
    // Convert results to an object
    const colorObject = {};
    colorResults.forEach(result => {
      if (result) {
        colorObject[result.key] = result.value;
      }
    });

    return colorObject;

  } catch (error) {
    console.error('Error fetching color settings:', error);
    return {};
  }
}

/**
 * Fetches a single color setting from the API
 * @param {string} settingKey - The key of the color setting to fetch
 * @returns {Promise<string|null>} The color value or null if not found
 */
export async function fetchColorSetting(settingKey) {
  try {
    const response = await api.get(`/settings/key/${settingKey}`);
    if (response.data.success && response.data.data.setting_value) {
      return response.data.data.setting_value;
    }
    return null;
  } catch (error) {
    console.error(`Error fetching ${settingKey}:`, error);
    return null;
  }
}

 
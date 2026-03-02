import App from '@/core/App.js';

/**
 * Activity Content Component
 * 
 * This component shows user activity and recent actions.
 * It's designed to be used within a tab panel in the profile page.
 */
class ActivityContent extends App {
    constructor() {
        super();
        this.activities = [
            {
                id: 1,
                type: 'login',
                description: 'Logged into the system',
                timestamp: new Date(Date.now() - 1000 * 60 * 30), // 30 minutes ago
                icon: 'fas fa-sign-in-alt',
                color: 'text-green-600'
            },
            {
                id: 2,
                type: 'profile_update',
                description: 'Updated profile information',
                timestamp: new Date(Date.now() - 1000 * 60 * 60 * 2), // 2 hours ago
                icon: 'fas fa-user-edit',
                color: 'text-blue-600'
            },
            {
                id: 3,
                type: 'password_change',
                description: 'Changed account password',
                timestamp: new Date(Date.now() - 1000 * 60 * 60 * 24), // 1 day ago
                icon: 'fas fa-key',
                color: 'text-orange-600'
            }
        ];
    }

    connectedCallback() {
        super.connectedCallback();
    }

    formatTimestamp(timestamp) {
        const now = new Date();
        const diff = now - timestamp;
        const minutes = Math.floor(diff / (1000 * 60));
        const hours = Math.floor(diff / (1000 * 60 * 60));
        const days = Math.floor(diff / (1000 * 60 * 60 * 24));

        if (minutes < 60) {
            return `${minutes} minute${minutes !== 1 ? 's' : ''} ago`;
        } else if (hours < 24) {
            return `${hours} hour${hours !== 1 ? 's' : ''} ago`;
        } else {
            return `${days} day${days !== 1 ? 's' : ''} ago`;
        }
    }

    render() {
        return `
            <div class="space-y-6">
                <!-- Activity Overview -->
                <div class="bg-white shadow rounded-lg p-6">
                    <h2 class="text-xl font-semibold text-gray-900 mb-4">Recent Activity</h2>
                    <p class="text-gray-600 mb-6">Here's what you've been up to recently.</p>
                    
                    <div class="space-y-4">
                        ${this.activities.map(activity => `
                            <div class="flex items-start space-x-4 p-4 bg-gray-50 rounded-lg">
                                <div class="flex-shrink-0">
                                    <div class="w-10 h-10 bg-white rounded-full flex items-center justify-center shadow-sm">
                                        <i class="${activity.icon} ${activity.color} text-lg"></i>
                                    </div>
                                </div>
                                <div class="flex-1 min-w-0">
                                    <p class="text-sm font-medium text-gray-900">${activity.description}</p>
                                    <p class="text-sm text-gray-500">${this.formatTimestamp(activity.timestamp)}</p>
                                </div>
                            </div>
                        `).join('')}
                    </div>
                </div>

                <!-- Statistics -->
                <div class="grid grid-cols-1 md:grid-cols-3 gap-6">
                    <div class="bg-white shadow rounded-lg p-6">
                        <div class="flex items-center">
                            <div class="flex-shrink-0">
                                <div class="w-8 h-8 bg-blue-100 rounded-full flex items-center justify-center">
                                    <i class="fas fa-calendar-check text-blue-600"></i>
                                </div>
                            </div>
                            <div class="ml-4">
                                <p class="text-sm font-medium text-gray-500">Days Active</p>
                                <p class="text-2xl font-semibold text-gray-900">15</p>
                            </div>
                        </div>
                    </div>

                    <div class="bg-white shadow rounded-lg p-6">
                        <div class="flex items-center">
                            <div class="flex-shrink-0">
                                <div class="w-8 h-8 bg-green-100 rounded-full flex items-center justify-center">
                                    <i class="fas fa-clock text-green-600"></i>
                                </div>
                            </div>
                            <div class="ml-4">
                                <p class="text-sm font-medium text-gray-500">Last Login</p>
                                <p class="text-2xl font-semibold text-gray-900">Today</p>
                            </div>
                        </div>
                    </div>

                    <div class="bg-white shadow rounded-lg p-6">
                        <div class="flex items-center">
                            <div class="flex-shrink-0">
                                <div class="w-8 h-8 bg-purple-100 rounded-full flex items-center justify-center">
                                    <i class="fas fa-chart-line text-purple-600"></i>
                                </div>
                            </div>
                            <div class="ml-4">
                                <p class="text-sm font-medium text-gray-500">Profile Views</p>
                                <p class="text-2xl font-semibold text-gray-900">3</p>
                            </div>
                        </div>
                    </div>
                </div>

                <!-- Coming Soon -->
                <div class="bg-gradient-to-r from-blue-50 to-indigo-50 border border-blue-200 rounded-lg p-6">
                    <div class="flex items-center">
                        <div class="flex-shrink-0">
                            <div class="w-10 h-10 bg-blue-100 rounded-full flex items-center justify-center">
                                <i class="fas fa-lightbulb text-blue-600"></i>
                            </div>
                        </div>
                        <div class="ml-4">
                            <h3 class="text-lg font-medium text-blue-900">More Features Coming Soon</h3>
                            <p class="text-blue-700 mt-1">We're working on adding more activity tracking and analytics features to help you better understand your account usage.</p>
                        </div>
                    </div>
                </div>
            </div>
        `;
    }
}

customElements.define('activity-content', ActivityContent);
export default ActivityContent; 
import '@/components/ui/Skeleton.js';

/**
 * Profile Content Skeleton Loader Component
 * 
 * A skeleton loader that replicates the exact design of the ProfileContent component.
 * Used to show loading state while profile data is being fetched.
 */
class ProfileContentSkeleton extends HTMLElement {
    constructor() {
        super();
    }

    connectedCallback() {
        this.render();
    }

    render() {
        this.innerHTML = `
            <div class="space-y-6">
                <!-- Profile Picture and Basic Info Skeleton -->
                <div class="bg-white shadow rounded-lg p-6">
                    <div class="flex items-center justify-between mb-6">
                        <ui-skeleton class="h-6 w-48"></ui-skeleton>
                        <ui-skeleton class="h-8 w-20"></ui-skeleton>
                    </div>

                    <div class="flex flex-col lg:flex-row items-center justify-center lg:items-start gap-8 space-x-8 mb-8">
                        <!-- Profile Picture Skeleton (Left) -->
                        <div class="flex-shrink-0 w-2/6" style="aspect-ratio: 1; min-width: 8rem;">
                            <ui-skeleton class="w-full h-full rounded-full"></ui-skeleton>
                        </div>
                        
                        <!-- Information Fields Skeleton (Right) -->
                        <div class="flex-1 border border-gray-200 rounded-lg p-6 w-full">
                            <div class="space-y-6">
                                <!-- Name Skeleton -->
                                <div>
                                    <ui-skeleton class="h-4 w-20 mb-2"></ui-skeleton>
                                    <div class="flex items-center space-x-3 p-3 bg-gradient-to-r from-amber-50 to-orange-50 border border-amber-200 rounded-lg">
                                        <ui-skeleton class="w-8 h-8 rounded-lg"></ui-skeleton>
                                        <div class="flex-1">
                                            <ui-skeleton class="h-5 w-32 mb-1"></ui-skeleton>
                                            <ui-skeleton class="h-3 w-24"></ui-skeleton>
                                        </div>
                                    </div>
                                </div>

                                <!-- Email Skeleton -->
                                <div>
                                    <ui-skeleton class="h-4 w-24 mb-2"></ui-skeleton>
                                    <div class="flex items-center space-x-3 p-3 bg-gradient-to-r from-teal-50 to-cyan-50 border border-teal-200 rounded-lg">
                                        <ui-skeleton class="w-8 h-8 rounded-lg"></ui-skeleton>
                                        <div class="flex-1">
                                            <ui-skeleton class="h-5 w-40 mb-1"></ui-skeleton>
                                            <ui-skeleton class="h-3 w-28"></ui-skeleton>
                                        </div>
                                    </div>
                                </div>

                                <!-- Role Skeleton -->
                                <div>
                                    <ui-skeleton class="h-4 w-12 mb-2"></ui-skeleton>
                                    <div class="flex items-center space-x-3 p-3 bg-gradient-to-r from-blue-50 to-indigo-50 border border-blue-200 rounded-lg">
                                        <ui-skeleton class="w-8 h-8 rounded-lg"></ui-skeleton>
                                        <div class="flex-1">
                                            <ui-skeleton class="h-5 w-20 mb-1"></ui-skeleton>
                                            <ui-skeleton class="h-3 w-32"></ui-skeleton>
                                        </div>
                                    </div>
                                </div>

                                <!-- Status Skeleton -->
                                <div>
                                    <ui-skeleton class="h-4 w-16 mb-2"></ui-skeleton>
                                    <div class="flex items-center space-x-3 p-3 bg-gradient-to-r from-green-50 to-emerald-50 border border-green-200 rounded-lg">
                                        <ui-skeleton class="w-8 h-8 rounded-lg"></ui-skeleton>
                                        <div class="flex-1">
                                            <ui-skeleton class="h-5 w-16 mb-1"></ui-skeleton>
                                            <ui-skeleton class="h-3 w-24"></ui-skeleton>
                                        </div>
                                    </div>
                                </div>

                                <!-- Created Date Skeleton -->
                                <div>
                                    <ui-skeleton class="h-4 w-28 mb-2"></ui-skeleton>
                                    <div class="flex items-center space-x-3 p-3 bg-gradient-to-r from-purple-50 to-violet-50 border border-purple-200 rounded-lg">
                                        <ui-skeleton class="w-8 h-8 rounded-lg"></ui-skeleton>
                                        <div class="flex-1">
                                            <ui-skeleton class="h-5 w-36 mb-1"></ui-skeleton>
                                            <ui-skeleton class="h-3 w-32"></ui-skeleton>
                                        </div>
                                    </div>
                                </div>
                            </div>
                        </div>
                    </div>
                </div>
            </div>
        `;
    }
}

customElements.define('profile-content-skeleton', ProfileContentSkeleton);
export default ProfileContentSkeleton; 
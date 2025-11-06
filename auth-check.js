/**
 * Authentication Check and Session Management
 * Prevents unauthorized access and browser back button after logout
 */

const AuthCheck = {
    /**
     * Check if user is logged in
     */
    isAuthenticated() {
        const loggedInUser = sessionStorage.getItem('loggedInUser');
        return loggedInUser !== null && loggedInUser !== undefined && loggedInUser !== '';
    },

    /**
     * Check if user is admin
     */
    isAdmin() {
        const loggedInUser = sessionStorage.getItem('loggedInUser');
        return loggedInUser === 'admin';
    },

    /**
     * Require authentication - redirect to login if not authenticated
     */
    requireAuth() {
        if (!this.isAuthenticated()) {
            // Clear any leftover session data
            sessionStorage.clear();
            localStorage.removeItem('loggedInUser');
            
            // Redirect to login
            alert('Please login to access this page');
            window.location.replace('../login/login_page.html');
            return false;
        }
        return true;
    },

    /**
     * Require admin authentication
     */
    requireAdmin() {
        if (!this.isAdmin()) {
            alert('Admin access required');
            window.location.replace('../login/login_page.html');
            return false;
        }
        return true;
    },

    /**
     * Logout function - clears session and prevents back navigation
     */
    logout() {
        // Clear all session data
        sessionStorage.clear();
        localStorage.removeItem('loggedInUser');
        localStorage.removeItem('userProfile');
        
        // Replace current history entry to prevent back button
        window.location.replace('../index.html');
    },

    /**
     * Prevent browser back button after logout
     */
    preventBackButton() {
        window.history.pushState(null, null, window.location.href);
        window.onpopstate = function() {
            if (!AuthCheck.isAuthenticated()) {
                window.history.pushState(null, null, window.location.href);
                window.location.replace('../login/login_page.html');
            }
        };
    },

    /**
     * Initialize authentication check
     */
    init() {
        this.preventBackButton();
        
        // Add event listener for page visibility
        document.addEventListener('visibilitychange', () => {
            if (document.visibilityState === 'visible') {
                if (!this.isAuthenticated()) {
                    window.location.replace('../login/login_page.html');
                }
            }
        });

        // Prevent caching of authenticated pages
        window.addEventListener('pageshow', (event) => {
            if (event.persisted) {
                // Page was loaded from cache
                if (!this.isAuthenticated()) {
                    window.location.replace('../login/login_page.html');
                }
            }
        });
    }
};

// Prevent page caching
if (window.performance && window.performance.navigation.type === window.performance.navigation.TYPE_BACK_FORWARD) {
    // Page was accessed via back/forward button
    if (!AuthCheck.isAuthenticated()) {
        window.location.replace('../login/login_page.html');
    }
}

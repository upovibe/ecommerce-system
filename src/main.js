import Router from './core/Router.js';
import './app/setFavicon.js';
import './app/middleware.js';
// import './utils/session.js'; // Import to initialize session management

// Create a new router instance.
const router = new Router();

// Start the router.
router.start('#app');

// Make the router globally available.
window.router = router;
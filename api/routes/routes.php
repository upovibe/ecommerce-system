<?php
// api/routes/routes.php - Define all API routes here

require_once __DIR__ . '/../core/Router.php';

// Authentication routes (public - no middleware needed)
Router::post('/auth/login', 'AuthController@login');
Router::post('/auth/logout', 'AuthController@logout');
Router::post('/auth/register', 'AuthController@register');
Router::post('/auth/verify-registration', 'AuthController@verifyRegistration');
Router::post('/auth/refresh', 'AuthController@refresh');
Router::post('/auth/forgot-password', 'AuthController@forgotPassword');
Router::post('/auth/reset-password', 'AuthController@resetPassword');

// Contact form routes (public - no middleware needed)
Router::post('/contact/submit', 'ContactController@submit');

// Category routes (public GET, protected POST/PUT/DELETE)
Router::get('/categories', 'CategoryController@index');
Router::post('/categories', 'CategoryController@store');
Router::get('/categories/{id}', 'CategoryController@show');
Router::put('/categories/{id}', 'CategoryController@update');
Router::delete('/categories/{id}', 'CategoryController@destroy');
Router::post('/categories/{id}/upload-image', 'CategoryController@uploadImage');
Router::put('/categories/{id}/toggle-active', 'CategoryController@toggleActive');

// Brand routes (public GET, protected POST/PUT/DELETE)
Router::get('/brands', 'BrandController@index');
Router::post('/brands', 'BrandController@store');
Router::get('/brands/{id}', 'BrandController@show');
Router::put('/brands/{id}', 'BrandController@update');
Router::delete('/brands/{id}', 'BrandController@destroy');
Router::post('/brands/{id}/upload-image', 'BrandController@uploadImage');
Router::put('/brands/{id}/toggle-active', 'BrandController@toggleActive');

// Material routes (public GET, protected POST/PUT/DELETE)
Router::get('/materials', 'MaterialController@index');
Router::post('/materials', 'MaterialController@store');
Router::get('/materials/{id}', 'MaterialController@show');
Router::put('/materials/{id}', 'MaterialController@update');
Router::delete('/materials/{id}', 'MaterialController@destroy');
Router::post('/materials/{id}/upload-image', 'MaterialController@uploadImage');
Router::put('/materials/{id}/toggle-active', 'MaterialController@toggleActive');

// User management routes (protected - require authentication)
// Note: Middleware will be called inside controllers using:
// AuthMiddleware::requireAuth($pdo);
// RoleMiddleware::requireAdmin($pdo);
Router::get('/users', 'UserController@index');
Router::post('/users', 'UserController@store');
Router::get('/users/{id}', 'UserController@show');
Router::put('/users/{id}', 'UserController@update');
Router::delete('/users/{id}', 'UserController@destroy');
Router::get('/users/{id}/profile', 'UserController@profile');
Router::put('/users/{id}/profile', 'UserController@updateProfile');
Router::post('/users/{id}/change-password', 'UserController@changePassword');
Router::put('/users/{id}/password', 'UserController@changePassword');
Router::post('/users/{id}/request-email-change', 'UserController@requestEmailChange');
Router::post('/users/{id}/verify-email-change', 'UserController@verifyEmailChange');
Router::post('/users/{id}/upload-profile-image', 'UserController@uploadProfileImage');

// Role management routes (admin only)
// Note: Controllers will use RoleMiddleware::requireAdmin($pdo);
Router::get('/roles', 'RoleController@index');
Router::post('/roles', 'RoleController@store');
Router::get('/roles/{id}', 'RoleController@show');
Router::put('/roles/{id}', 'RoleController@update');
Router::delete('/roles/{id}', 'RoleController@destroy');

// Audit logs (admin only)
// Note: Controllers will use RoleMiddleware::requireAdmin($pdo);
Router::get('/logs', 'LogController@index');
Router::get('/logs/{id}', 'LogController@show');

// Page Management Routes (admin only for create/update/delete, public for view)
Router::get('/pages', 'PageController@index');
Router::post('/pages', 'PageController@store');
Router::get('/pages/active', 'PageController@getActive');
Router::get('/pages/slug/{slug}', 'PageController@showBySlug');
Router::get('/pages/{id}', 'PageController@show');
Router::put('/pages/{id}', 'PageController@update');
Router::delete('/pages/{id}', 'PageController@destroy');

// Inventory Management Routes (admin only)

// Attribute Management Routes (admin only)
Router::get('/attributes', 'AttributeController@index');
Router::post('/attributes', 'AttributeController@store');
Router::get('/product-attribute-types', 'ProductAttributeTypeController@index');
Router::post('/product-attribute-types', 'ProductAttributeTypeController@store');

// Product Management Routes (admin only)
Router::get('/products', 'ProductController@index');
Router::get('/products/public', 'ProductController@publicIndex');
Router::get('/products/public/{slug}', 'ProductController@publicShow');
Router::post('/products', 'ProductController@store');
Router::get('/products/{id}', 'ProductController@show');
Router::put('/products/{id}', 'ProductController@update');
Router::delete('/products/{id}', 'ProductController@destroy');
Router::post('/products/{id}/upload-image', 'ProductController@uploadImage');
Router::post('/products/{id}/upload-gallery', 'ProductController@uploadGallery');
Router::put('/products/{id}/toggle-active', 'ProductController@toggleActive');

// Cart & Wishlist (user)
Router::get('/cart', 'CartController@index');
Router::post('/cart/items', 'CartController@addItem');
Router::put('/cart/items/{id}', 'CartController@updateItem');
Router::delete('/cart/items/{id}', 'CartController@removeItem');
Router::delete('/cart/clear', 'CartController@clear');

Router::get('/wishlist', 'WishlistController@index');
Router::post('/wishlist/items', 'WishlistController@addItem');
Router::delete('/wishlist/items/{id}', 'WishlistController@removeItem');

// Orders (user)
Router::post('/orders', 'OrderController@createFromCart');
Router::get('/orders', 'OrderController@index');
Router::get('/orders/{id}', 'OrderController@show');
Router::put('/orders/{id}', 'OrderController@update');
Router::post('/orders/guest', 'OrderController@createGuestOrder');

// Settings Management Routes (admin only for create/update/delete, public for view)
Router::get('/settings', 'SettingController@index');
Router::post('/settings', 'SettingController@store');
Router::get('/settings/theme', 'SettingController@getThemeSettings');
Router::get('/settings/contact', 'SettingController@getContactSettings');
Router::get('/settings/social', 'SettingController@getSocialSettings');
Router::get('/settings/map', 'SettingController@getMapSettings');
Router::get('/settings/all', 'SettingController@getAllAsArray');
Router::get('/settings/upload-stats', 'SettingController@getUploadStats');
Router::get('/settings/key/{key}', 'SettingController@showByKey');
Router::get('/settings/category/{category}', 'SettingController@getByCategory');
Router::get('/settings/{id}', 'SettingController@show');
Router::put('/settings/{id}', 'SettingController@update');
Router::delete('/settings/{id}', 'SettingController@destroy');

// Event Management Routes (admin only for create/update/delete, public for view)
Router::get('/events', 'EventController@index');
Router::post('/events', 'EventController@store');
Router::get('/events/active', 'EventController@getActive');
Router::get('/events/upcoming', 'EventController@getUpcoming');
Router::get('/events/category', 'EventController@getByCategory');
Router::get('/events/search', 'EventController@search');
Router::get('/events/slug/{slug}', 'EventController@showBySlug');
Router::get('/events/{id}', 'EventController@show');
Router::put('/events/{id}', 'EventController@update');
Router::delete('/events/{id}', 'EventController@destroy');
Router::put('/events/{id}/toggle-active', 'EventController@toggleActive');
Router::put('/events/{id}/status', 'EventController@updateStatus');

// News Management Routes (admin only for create/update/delete, public for view)
Router::get('/news', 'NewsController@index');
Router::post('/news', 'NewsController@store');
Router::get('/news/active', 'NewsController@getActive');
Router::get('/news/recent', 'NewsController@getRecent');
Router::get('/news/search', 'NewsController@search');
Router::get('/news/slug/{slug}', 'NewsController@showBySlug');
Router::get('/news/{id}', 'NewsController@show');
Router::put('/news/{id}', 'NewsController@update');
Router::delete('/news/{id}', 'NewsController@destroy');


// Gallery Management Routes (admin only for create/update/delete, public for view)
Router::get('/galleries', 'GalleryController@index');
Router::post('/galleries', 'GalleryController@store');
Router::get('/galleries/active', 'GalleryController@getActive');
Router::get('/galleries/recent', 'GalleryController@getRecent');
Router::get('/galleries/search', 'GalleryController@search');
Router::get('/galleries/slug/{slug}', 'GalleryController@showBySlug');
Router::get('/galleries/{id}', 'GalleryController@show');
Router::put('/galleries/{id}', 'GalleryController@update');
Router::delete('/galleries/{id}', 'GalleryController@destroy');
Router::delete('/galleries/{id}/images/{imageIndex}', 'GalleryController@removeImage');

// Video Gallery Management Routes (admin only for create/update/delete, public for view)
Router::get('/video-galleries', 'VideoGalleryController@index');
Router::post('/video-galleries', 'VideoGalleryController@store');
Router::get('/video-galleries/active', 'VideoGalleryController@getActive');
Router::get('/video-galleries/recent', 'VideoGalleryController@getRecent');
Router::get('/video-galleries/search', 'VideoGalleryController@search');
Router::get('/video-galleries/slug/{slug}', 'VideoGalleryController@showBySlug');
Router::get('/video-galleries/{id}', 'VideoGalleryController@show');
Router::put('/video-galleries/{id}', 'VideoGalleryController@update');
Router::delete('/video-galleries/{id}', 'VideoGalleryController@destroy');
Router::delete('/video-galleries/{id}/videos/{videoIndex}', 'VideoGalleryController@removeVideoLink');

// Team Management Routes (admin only for create/update/delete, public for view)
Router::get('/teams', 'TeamController@index');
Router::get('/teams/public', 'TeamController@getPublic');
Router::post('/teams', 'TeamController@store');
Router::get('/teams/department/{department}', 'TeamController@getByDepartment');
Router::get('/teams/{id}', 'TeamController@show');
Router::put('/teams/{id}', 'TeamController@update');
Router::delete('/teams/{id}', 'TeamController@destroy');

// Life Group Management Routes (admin only for create/update/delete, public for view)
Router::get('/life-groups', 'LifeGroupController@index');
Router::post('/life-groups', 'LifeGroupController@store');
Router::get('/life-groups/active', 'LifeGroupController@getActive');
Router::get('/life-groups/search', 'LifeGroupController@search');
Router::get('/life-groups/slug/{slug}', 'LifeGroupController@showBySlug');
Router::get('/life-groups/{id}', 'LifeGroupController@show');
Router::put('/life-groups/{id}', 'LifeGroupController@update');
Router::delete('/life-groups/{id}', 'LifeGroupController@destroy');

// Sermon Management Routes (admin only for create/update/delete, public for view)
Router::get('/sermons', 'SermonController@index');
Router::post('/sermons', 'SermonController@store');
Router::get('/sermons/active', 'SermonController@getActive');
Router::get('/sermons/recent', 'SermonController@getRecent');
Router::get('/sermons/search', 'SermonController@search');
Router::get('/sermons/slug/{slug}', 'SermonController@showBySlug');
Router::get('/sermons/{id}', 'SermonController@show');
Router::put('/sermons/{id}', 'SermonController@update');
Router::delete('/sermons/{id}', 'SermonController@destroy');
Router::delete('/sermons/{id}/images/{imageIndex}', 'SermonController@removeImage');
Router::delete('/sermons/{id}/audio/{audioIndex}', 'SermonController@removeAudio');
Router::delete('/sermons/{id}/videos/{videoIndex}', 'SermonController@removeVideoLink');

// Testimonials
Router::get('/testimonials', 'TestimonialController@index'); // admin only
Router::post('/testimonials', 'TestimonialController@store'); // admin only

// Settings Management Routes (admin only for create/update/delete, public for view)
Router::get('/settings', 'SettingController@index');
Router::post('/settings', 'SettingController@store');
Router::get('/settings/theme', 'SettingController@getThemeSettings');
Router::get('/settings/contact', 'SettingController@getContactSettings');
Router::get('/settings/social', 'SettingController@getSocialSettings');
Router::get('/settings/map', 'SettingController@getMapSettings');
Router::get('/settings/all', 'SettingController@getAllAsArray');
Router::get('/settings/upload-stats', 'SettingController@getUploadStats');
Router::get('/settings/key/{key}', 'SettingController@showByKey');
Router::get('/settings/category/{category}', 'SettingController@getByCategory');
Router::get('/settings/{id}', 'SettingController@show');
Router::put('/settings/{id}', 'SettingController@update');
Router::delete('/settings/{id}', 'SettingController@destroy');

// Event Management Routes (admin only for create/update/delete, public for view)
Router::get('/events', 'EventController@index');
Router::post('/events', 'EventController@store');
Router::get('/events/active', 'EventController@getActive');
Router::get('/events/upcoming', 'EventController@getUpcoming');
Router::get('/events/category', 'EventController@getByCategory');
Router::get('/events/search', 'EventController@search');
Router::get('/events/slug/{slug}', 'EventController@showBySlug');
Router::get('/events/{id}', 'EventController@show');
Router::put('/events/{id}', 'EventController@update');
Router::delete('/events/{id}', 'EventController@destroy');
Router::put('/events/{id}/toggle-active', 'EventController@toggleActive');
Router::put('/events/{id}/status', 'EventController@updateStatus');

// News Management Routes (admin only for create/update/delete, public for view)
Router::get('/news', 'NewsController@index');
Router::post('/news', 'NewsController@store');
Router::get('/news/active', 'NewsController@getActive');
Router::get('/news/recent', 'NewsController@getRecent');
Router::get('/news/search', 'NewsController@search');
Router::get('/news/slug/{slug}', 'NewsController@showBySlug');
Router::get('/news/{id}', 'NewsController@show');
Router::put('/news/{id}', 'NewsController@update');
Router::delete('/news/{id}', 'NewsController@destroy');


// Gallery Management Routes (admin only for create/update/delete, public for view)
Router::get('/galleries', 'GalleryController@index');
Router::post('/galleries', 'GalleryController@store');
Router::get('/galleries/active', 'GalleryController@getActive');
Router::get('/galleries/recent', 'GalleryController@getRecent');
Router::get('/galleries/search', 'GalleryController@search');
Router::get('/galleries/slug/{slug}', 'GalleryController@showBySlug');
Router::get('/galleries/{id}', 'GalleryController@show');
Router::put('/galleries/{id}', 'GalleryController@update');
Router::delete('/galleries/{id}', 'GalleryController@destroy');
Router::delete('/galleries/{id}/images/{imageIndex}', 'GalleryController@removeImage');

// Video Gallery Management Routes (admin only for create/update/delete, public for view)
Router::get('/video-galleries', 'VideoGalleryController@index');
Router::post('/video-galleries', 'VideoGalleryController@store');
Router::get('/video-galleries/active', 'VideoGalleryController@getActive');
Router::get('/video-galleries/recent', 'VideoGalleryController@getRecent');
Router::get('/video-galleries/search', 'VideoGalleryController@search');
Router::get('/video-galleries/slug/{slug}', 'VideoGalleryController@showBySlug');
Router::get('/video-galleries/{id}', 'VideoGalleryController@show');
Router::put('/video-galleries/{id}', 'VideoGalleryController@update');
Router::delete('/video-galleries/{id}', 'VideoGalleryController@destroy');
Router::delete('/video-galleries/{id}/videos/{videoIndex}', 'VideoGalleryController@removeVideoLink');

// Team Management Routes (admin only for create/update/delete, public for view)
Router::get('/teams', 'TeamController@index');
Router::get('/teams/public', 'TeamController@getPublic');
Router::post('/teams', 'TeamController@store');
Router::get('/teams/department/{department}', 'TeamController@getByDepartment');
Router::get('/teams/{id}', 'TeamController@show');
Router::put('/teams/{id}', 'TeamController@update');
Router::delete('/teams/{id}', 'TeamController@destroy');

// Life Group Management Routes (admin only for create/update/delete, public for view)
Router::get('/life-groups', 'LifeGroupController@index');
Router::post('/life-groups', 'LifeGroupController@store');
Router::get('/life-groups/active', 'LifeGroupController@getActive');
Router::get('/life-groups/search', 'LifeGroupController@search');
Router::get('/life-groups/slug/{slug}', 'LifeGroupController@showBySlug');
Router::get('/life-groups/{id}', 'LifeGroupController@show');
Router::put('/life-groups/{id}', 'LifeGroupController@update');
Router::delete('/life-groups/{id}', 'LifeGroupController@destroy');

// Sermon Management Routes (admin only for create/update/delete, public for view)
Router::get('/sermons', 'SermonController@index');
Router::post('/sermons', 'SermonController@store');
Router::get('/sermons/active', 'SermonController@getActive');
Router::get('/sermons/recent', 'SermonController@getRecent');
Router::get('/sermons/search', 'SermonController@search');
Router::get('/sermons/slug/{slug}', 'SermonController@showBySlug');
Router::get('/sermons/{id}', 'SermonController@show');
Router::put('/sermons/{id}', 'SermonController@update');
Router::delete('/sermons/{id}', 'SermonController@destroy');
Router::delete('/sermons/{id}/images/{imageIndex}', 'SermonController@removeImage');
Router::delete('/sermons/{id}/audio/{audioIndex}', 'SermonController@removeAudio');
Router::delete('/sermons/{id}/videos/{videoIndex}', 'SermonController@removeVideoLink');

// Testimonials
Router::get('/testimonials', 'TestimonialController@index'); // admin only
Router::post('/testimonials', 'TestimonialController@store'); // admin only
Router::get('/testimonials/{id}', 'TestimonialController@show'); // public
Router::put('/testimonials/{id}', 'TestimonialController@update'); // admin only
Router::delete('/testimonials/{id}', 'TestimonialController@destroy'); // admin only
Router::get('/public/testimonials', 'TestimonialController@getPublic'); // public

// Give Management Routes (admin only for create/update/delete, public for view)
Router::get('/give', 'GiveController@index'); // admin only
Router::post('/give', 'GiveController@store'); // admin only
Router::get('/give/active', 'GiveController@getActive'); // public
Router::get('/give/{id}', 'GiveController@show'); // public
Router::put('/give/{id}', 'GiveController@update'); // admin only
Router::delete('/give/{id}', 'GiveController@destroy'); // admin only

// Promotion Management Routes (admin only)
Router::get('/promotions', 'PromotionController@index');
Router::post('/promotions', 'PromotionController@store');
Router::get('/promotions/{id}', 'PromotionController@show');
Router::put('/promotions/{id}', 'PromotionController@update');
Router::delete('/promotions/{id}', 'PromotionController@destroy');
Router::post('/promotions/{id}/products', 'PromotionController@attachProducts');
Router::delete('/promotions/{id}/products/{product_id}', 'PromotionController@detachProduct');


// DB setup endpoints
Router::get('/db/test', 'DbController@test');
Router::get('/db/check', 'DbController@check');
Router::post('/db/fresh', 'DbController@fresh');

// Mobile Detection and Redirect Script
(function() {
    'use strict';
    
    // Check if device is mobile
    function isMobile() {
        return /Android|webOS|iPhone|iPad|iPod|BlackBerry|IEMobile|Opera Mini/i.test(navigator.userAgent) ||
               (window.innerWidth <= 768) ||
               ('ontouchstart' in window);
    }
    
    // Check if we're already on mobile page
    function isMobilePage() {
        return window.location.pathname.includes('mobile') || 
               window.location.pathname.includes('tetrohash_mobile');
    }
    
    // Redirect to mobile version if needed
    function redirectToMobile() {
        if (isMobile() && !isMobilePage()) {
            console.log('📱 Mobile device detected, redirecting to mobile version...');
            window.location.href = './tetrohash_mobile.html';
        }
    }
    
    // Run on page load
    if (document.readyState === 'loading') {
        document.addEventListener('DOMContentLoaded', redirectToMobile);
    } else {
        redirectToMobile();
    }
    
    // Also run on resize (in case of orientation change)
    window.addEventListener('resize', function() {
        if (isMobile() && !isMobilePage()) {
            redirectToMobile();
        }
    });
})();

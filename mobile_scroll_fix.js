// Mobile Scroll Enhancement Script
(function() {
    'use strict';
    
    // Allow scrolling but prevent context menu and text selection
    function enhanceMobileExperience() {
        // Prevent context menu on long press
        document.addEventListener('contextmenu', function(e) {
            e.preventDefault();
        }, { passive: false });
        
        // Prevent text selection
        document.addEventListener('selectstart', function(e) {
            e.preventDefault();
        }, { passive: false });
    }
    
    // Add CSS to enhance mobile experience while allowing scrolling
    function addMobileEnhancementCSS() {
        const style = document.createElement('style');
        style.textContent = `
            html, body {
                -webkit-overflow-scrolling: touch !important;
                overscroll-behavior: auto !important;
            }
            
            * {
                -webkit-user-select: none !important;
                -moz-user-select: none !important;
                -ms-user-select: none !important;
                user-select: none !important;
                -webkit-touch-callout: none !important;
                -webkit-tap-highlight-color: transparent !important;
            }
        `;
        document.head.appendChild(style);
    }
    
    // Initialize mobile enhancements
    function init() {
        if (document.readyState === 'loading') {
            document.addEventListener('DOMContentLoaded', function() {
                addMobileEnhancementCSS();
                enhanceMobileExperience();
            });
        } else {
            addMobileEnhancementCSS();
            enhanceMobileExperience();
        }
    }
    
    // Run immediately
    init();
    
    // Also run on window load as backup
    window.addEventListener('load', function() {
        addMobileEnhancementCSS();
        enhanceMobileExperience();
    });
})();

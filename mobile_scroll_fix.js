// Mobile Scroll Prevention Script
(function() {
    'use strict';
    
    // Prevent all scrolling on mobile devices
    function preventScrolling() {
        // Prevent touch scrolling
        document.addEventListener('touchmove', function(e) {
            e.preventDefault();
        }, { passive: false });
        
        // Prevent wheel scrolling
        document.addEventListener('wheel', function(e) {
            e.preventDefault();
        }, { passive: false });
        
        // Prevent keyboard scrolling
        document.addEventListener('keydown', function(e) {
            // Prevent arrow keys, space, page up/down from scrolling
            if ([32, 33, 34, 35, 36, 37, 38, 39, 40].indexOf(e.keyCode) > -1) {
                e.preventDefault();
            }
        }, { passive: false });
        
        // Prevent context menu on long press
        document.addEventListener('contextmenu', function(e) {
            e.preventDefault();
        }, { passive: false });
        
        // Prevent text selection
        document.addEventListener('selectstart', function(e) {
            e.preventDefault();
        }, { passive: false });
    }
    
    // Add CSS to prevent scrolling
    function addScrollPreventionCSS() {
        const style = document.createElement('style');
        style.textContent = `
            html, body {
                overflow: hidden !important;
                height: 100% !important;
                position: fixed !important;
                width: 100% !important;
                -webkit-overflow-scrolling: touch !important;
                overscroll-behavior: none !important;
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
    
    // Initialize scroll prevention
    function init() {
        if (document.readyState === 'loading') {
            document.addEventListener('DOMContentLoaded', function() {
                addScrollPreventionCSS();
                preventScrolling();
            });
        } else {
            addScrollPreventionCSS();
            preventScrolling();
        }
    }
    
    // Run immediately
    init();
    
    // Also run on window load as backup
    window.addEventListener('load', function() {
        addScrollPreventionCSS();
        preventScrolling();
    });
})();

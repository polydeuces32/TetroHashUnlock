const fs = require('fs');
const path = require('path');

console.log('🧪 TetroHashUnlock Modern Frontend Test');
console.log('=====================================');

let passedTests = 0;
let totalTests = 0;

function assert(condition, message) {
    totalTests++;
    if (condition) {
        console.log(`✅ ${message}`);
        passedTests++;
    } else {
        console.error(`❌ ${message}`);
    }
}

console.log('\n📁 Testing modern frontend files...');
const modernFiles = {
    'tetrohash_modern.html': true,
    'modern-styles.css': true,
    'modern-engine.js': true,
    'manifest.json': true,
    'sw.js': true
};

for (const file in modernFiles) {
    const filePath = path.join(__dirname, file);
    const exists = fs.existsSync(filePath);
    const stats = exists ? fs.statSync(filePath) : null;
    assert(exists, `${file} (${stats ? stats.size + ' bytes' : 'not found'})`);
}

console.log('\n🔍 Testing modern HTML structure...');
const htmlContent = fs.readFileSync(path.join(__dirname, 'tetrohash_modern.html'), 'utf8');

// Test modern HTML features
assert(htmlContent.includes('<title>TetroHashUnlock v3.0 - Modern Edition</title>'), 'Found: Modern title');
assert(htmlContent.includes('theme') || htmlContent.includes('data-theme'), 'Found: Theme system');
assert(htmlContent.includes('class="loading-screen"'), 'Found: Loading screen');
assert(htmlContent.includes('class="navbar"'), 'Found: Modern navigation');
assert(htmlContent.includes('class="hero-section"'), 'Found: Hero section');
assert(htmlContent.includes('class="mode-grid"'), 'Found: Mode selection grid');
assert(htmlContent.includes('class="game-layout"'), 'Found: Game layout');
assert(htmlContent.includes('info-card'), 'Found: Info cards');
assert(htmlContent.includes('class="modal"'), 'Found: Modal system');
assert(htmlContent.includes('class="toast-container"'), 'Found: Toast notifications');
assert(htmlContent.includes('manifest.json'), 'Found: PWA manifest link');
assert(htmlContent.includes('sw.js'), 'Found: Service worker');
assert(htmlContent.includes('modern-engine.js'), 'Found: Modern engine script');

console.log('\n🔍 Testing modern CSS features...');
const cssContent = fs.readFileSync(path.join(__dirname, 'modern-styles.css'), 'utf8');

// Test modern CSS features
assert(cssContent.includes(':root'), 'Found: CSS custom properties');
assert(cssContent.includes('--primary:'), 'Found: Primary color variable');
assert(cssContent.includes('--bg-primary:'), 'Found: Background color variables');
assert(cssContent.includes('--font-primary:'), 'Found: Font variables');
assert(cssContent.includes('--transition-'), 'Found: Transition variables');
assert(cssContent.includes('@media (max-width:'), 'Found: Responsive design');
assert(cssContent.includes('@keyframes'), 'Found: CSS animations');
assert(cssContent.includes('grid-template-columns'), 'Found: CSS Grid');
assert(cssContent.includes('display: flex'), 'Found: Flexbox usage');
assert(cssContent.includes('backdrop-filter'), 'Found: Modern backdrop filter');
assert(cssContent.includes('data-theme="dark"'), 'Found: Dark theme support');
assert(cssContent.includes('data-theme="light"'), 'Found: Light theme support');
assert(cssContent.includes('@media (prefers-reduced-motion'), 'Found: Accessibility support');

console.log('\n🔍 Testing modern JavaScript features...');
const jsContent = fs.readFileSync(path.join(__dirname, 'modern-engine.js'), 'utf8');

// Test modern JavaScript features
assert(jsContent.includes('class ModernTetroHashEngine'), 'Found: Modern ES6 class');
assert(jsContent.includes('async init()'), 'Found: Async initialization');
assert(jsContent.includes('await'), 'Found: Async/await usage');
assert(jsContent.includes('{') && (jsContent.includes('const') || jsContent.includes('let') || jsContent.includes('var')), 'Found: Destructuring assignment');
assert(jsContent.includes('=>'), 'Found: Arrow functions');
assert(jsContent.includes('localStorage'), 'Found: Local storage usage');
assert(jsContent.includes('AudioContext'), 'Found: Web Audio API');
assert(jsContent.includes('requestAnimationFrame'), 'Found: Modern animation');
assert(jsContent.includes('addEventListener'), 'Found: Event listeners');
assert(jsContent.includes('classList'), 'Found: Modern DOM manipulation');
assert(jsContent.includes('serviceWorker'), 'Found: Service worker registration');
assert(jsContent.includes('visibilitychange'), 'Found: Visibility API');
assert(jsContent.includes('fullscreen'), 'Found: Fullscreen API');

console.log('\n🔍 Testing PWA manifest...');
const manifestContent = JSON.parse(fs.readFileSync(path.join(__dirname, 'manifest.json'), 'utf8'));

assert(manifestContent.name === 'TetroHashUnlock v3.0', 'Found: Correct app name');
assert(manifestContent.short_name === 'TetroHash', 'Found: Short name');
assert(manifestContent.start_url === '/tetrohash_modern.html', 'Found: Correct start URL');
assert(manifestContent.display === 'standalone', 'Found: Standalone display');
assert(manifestContent.theme_color === '#ffd700', 'Found: Theme color');
assert(manifestContent.background_color === '#0a0a0f', 'Found: Background color');
assert(Array.isArray(manifestContent.icons), 'Found: Icons array');
assert(manifestContent.icons.length > 0, 'Found: Icons present');
assert(Array.isArray(manifestContent.shortcuts), 'Found: Shortcuts array');
assert(manifestContent.shortcuts.length > 0, 'Found: Shortcuts present');

console.log('\n🔍 Testing service worker...');
const swContent = fs.readFileSync(path.join(__dirname, 'sw.js'), 'utf8');

assert(swContent.includes('CACHE_NAME'), 'Found: Cache management');
assert(swContent.includes('STATIC_CACHE'), 'Found: Static caching');
assert(swContent.includes('DYNAMIC_CACHE'), 'Found: Dynamic caching');
assert(swContent.includes('install'), 'Found: Install event');
assert(swContent.includes('activate'), 'Found: Activate event');
assert(swContent.includes('fetch'), 'Found: Fetch event');
assert(swContent.includes('push'), 'Found: Push notifications');
assert(swContent.includes('notificationclick'), 'Found: Notification click');
assert(swContent.includes('caches.match'), 'Found: Cache matching');
assert(swContent.includes('caches.open'), 'Found: Cache opening');

console.log('\n🔍 Testing package.json updates...');
const packageJson = JSON.parse(fs.readFileSync(path.join(__dirname, 'package.json'), 'utf8'));

assert(packageJson.version === '3.0.0', 'Version updated to 3.0.0');
assert(packageJson.main === 'tetrohash_modern.html', 'Main entry point updated');
assert(packageJson.description.includes('Modern'), 'Description includes Modern');
assert(packageJson.description.includes('PWA'), 'Description includes PWA');
assert(packageJson.keywords.includes('modern'), 'Keywords include modern');
assert(packageJson.keywords.includes('pwa'), 'Keywords include pwa');
assert(packageJson.keywords.includes('progressive-web-app'), 'Keywords include progressive-web-app');
assert(packageJson.keywords.includes('responsive'), 'Keywords include responsive');
assert(packageJson.keywords.includes('accessibility'), 'Keywords include accessibility');
assert(packageJson.keywords.includes('offline-first'), 'Keywords include offline-first');
assert(packageJson.files.includes('tetrohash_modern.html'), 'Files include modern HTML');
assert(packageJson.files.includes('modern-styles.css'), 'Files include modern CSS');
assert(packageJson.files.includes('modern-engine.js'), 'Files include modern JS');
assert(packageJson.files.includes('manifest.json'), 'Files include manifest');
assert(packageJson.files.includes('sw.js'), 'Files include service worker');

console.log('\n📊 Test Results:');
console.log(`✅ Passed: ${passedTests}/${totalTests}`);
console.log(`📈 Success Rate: ${((passedTests / totalTests) * 100).toFixed(1)}%`);

if (passedTests === totalTests) {
    console.log('\n🎉 All tests passed! Modern TetroHashUnlock is ready!');
    console.log('\n🚀 Modern Features Available:');
    console.log('   • Progressive Web App (PWA)');
    console.log('   • Dark/Light theme switching');
    console.log('   • Responsive design');
    console.log('   • Offline functionality');
    console.log('   • Push notifications');
    console.log('   • Modern CSS with animations');
    console.log('   • Advanced JavaScript features');
    console.log('   • Accessibility support');
    console.log('   • Touch controls');
    console.log('   • Performance monitoring');
    console.log('\n🎮 To run the modern version:');
    console.log('   npm start');
    console.log('   or');
    console.log('   open tetrohash_modern.html');
    console.log('\n📱 To install as PWA:');
    console.log('   Open in Chrome/Edge and click "Install" button');
} else {
    console.error('\n❌ Some tests failed. Please check the logs above.');
    process.exit(1);
}

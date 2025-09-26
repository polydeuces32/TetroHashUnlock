#!/usr/bin/env node

// TetroHashUnlock Unified Test Script
// Tests the consolidated functionality

const fs = require('fs');
const path = require('path');

console.log('🧪 TetroHashUnlock Unified Test');
console.log('================================');

// Test file existence
const essentialFiles = [
    'tetrohash_unified.html',
    'tetrohash_unified.js',
    'styles.css',
    'bitcoin_logic.py',
    'reward.py',
    'package.json',
    'README.md',
    'LICENSE'
];

let passedTests = 0;
let totalTests = essentialFiles.length;

console.log('\n📁 Testing file existence...');

essentialFiles.forEach(file => {
    const filePath = path.join(__dirname, file);
    
    if (fs.existsSync(filePath)) {
        const stats = fs.statSync(filePath);
        console.log(`✅ ${file} (${stats.size} bytes)`);
        passedTests++;
    } else {
        console.log(`❌ ${file} - MISSING`);
    }
});

// Test HTML structure
console.log('\n🔍 Testing HTML structure...');
try {
    const htmlContent = fs.readFileSync(path.join(__dirname, 'tetrohash_unified.html'), 'utf8');
    
    const requiredElements = [
        '<title>TetroHashUnlock v2.0 - Unified Edition</title>',
        'class="game-container"',
        'id="game-board"',
        'id="mode-selection"',
        'id="game-area"',
        'class="control-panel ai-panel"',
        'class="control-panel sound-panel"',
        'UnifiedTetroHash'
    ];
    
    requiredElements.forEach(element => {
        if (htmlContent.includes(element)) {
            console.log(`✅ Found: ${element}`);
            passedTests++;
        } else {
            console.log(`❌ Missing: ${element}`);
        }
    });
    
    totalTests += requiredElements.length;
} catch (error) {
    console.log(`❌ Error reading HTML file: ${error.message}`);
}

// Test JavaScript structure
console.log('\n🔍 Testing JavaScript structure...');
try {
    const jsContent = fs.readFileSync(path.join(__dirname, 'tetrohash_unified.js'), 'utf8');
    
    const requiredClasses = [
        'class TetroHashUnifiedEngine',
        'initAudio()',
        'initML()',
        'playSound(',
        'playCoinSound()',
        'generatePuzzle()',
        'checkPuzzleSolution()',
        'calculateFinalSATs()',
        'showSATReward('
    ];
    
    requiredClasses.forEach(cls => {
        if (jsContent.includes(cls)) {
            console.log(`✅ Found: ${cls}`);
            passedTests++;
        } else {
            console.log(`❌ Missing: ${cls}`);
        }
    });
    
    totalTests += requiredClasses.length;
} catch (error) {
    console.log(`❌ Error reading JavaScript file: ${error.message}`);
}

// Test package.json
console.log('\n🔍 Testing package.json...');
try {
    const packageContent = JSON.parse(fs.readFileSync(path.join(__dirname, 'package.json'), 'utf8'));
    
    if (packageContent.main === 'tetrohash_unified.html') {
        console.log('✅ Main entry point correct');
        passedTests++;
    } else {
        console.log('❌ Main entry point incorrect');
    }
    
    if (packageContent.version === '2.1.0') {
        console.log('✅ Version updated to 2.1.0');
        passedTests++;
    } else {
        console.log('❌ Version not updated');
    }
    
    totalTests += 2;
} catch (error) {
    console.log(`❌ Error reading package.json: ${error.message}`);
}

// Final results
console.log('\n📊 Test Results:');
console.log(`✅ Passed: ${passedTests}/${totalTests}`);
console.log(`📈 Success Rate: ${((passedTests / totalTests) * 100).toFixed(1)}%`);

if (passedTests === totalTests) {
    console.log('\n🎉 All tests passed! Unified TetroHashUnlock is ready!');
    console.log('\n🚀 To run the game:');
    console.log('   npm start');
    console.log('   or');
    console.log('   open tetrohash_unified.html');
} else {
    console.log('\n⚠️  Some tests failed. Check the output above.');
    process.exit(1);
}

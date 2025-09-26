#!/usr/bin/env node

// TetroHashUnlock Cleanup Script
// Removes redundant files after consolidation

const fs = require('fs');
const path = require('path');

console.log('🧹 TetroHashUnlock Cleanup Script');
console.log('=====================================');

// Files to remove (redundant after consolidation)
const filesToRemove = [
    'working.html',
    'working_with_sound.html', 
    'tetrohash_ml.html',
    'ml_dashboard.html',
    'app.js',
    'game.js',
    'ui.js',
    'ml_ai_system.js',
    'ml_training_collector.js',
    'sound_system.js',
    'deploy.sh',
    'DEPLOYMENT.md',
    'ML_README.md',
    'working.html',
    'working_with_sound.html',
    'working.html'
];

// Directories to remove if empty
const dirsToCheck = [
    'assets'
];

let removedCount = 0;
let errorCount = 0;

console.log('\n📁 Removing redundant files...');

filesToRemove.forEach(file => {
    const filePath = path.join(__dirname, file);
    
    if (fs.existsSync(filePath)) {
        try {
            fs.unlinkSync(filePath);
            console.log(`✅ Removed: ${file}`);
            removedCount++;
        } catch (error) {
            console.error(`❌ Error removing ${file}:`, error.message);
            errorCount++;
        }
    } else {
        console.log(`⚠️  File not found: ${file}`);
    }
});

console.log('\n📂 Checking directories...');

dirsToCheck.forEach(dir => {
    const dirPath = path.join(__dirname, dir);
    
    if (fs.existsSync(dirPath)) {
        try {
            const files = fs.readdirSync(dirPath);
            if (files.length === 0) {
                fs.rmdirSync(dirPath);
                console.log(`✅ Removed empty directory: ${dir}`);
                removedCount++;
            } else {
                console.log(`⚠️  Directory not empty, keeping: ${dir} (${files.length} files)`);
            }
        } catch (error) {
            console.error(`❌ Error checking directory ${dir}:`, error.message);
            errorCount++;
        }
    }
});

console.log('\n📊 Cleanup Summary:');
console.log(`✅ Files removed: ${removedCount}`);
console.log(`❌ Errors: ${errorCount}`);

if (errorCount === 0) {
    console.log('\n🎉 Cleanup completed successfully!');
    console.log('\n📋 Remaining essential files:');
    console.log('   • tetrohash_unified.html (main game)');
    console.log('   • tetrohash_unified.js (unified engine)');
    console.log('   • styles.css (styling)');
    console.log('   • bitcoin_logic.py (Bitcoin puzzles)');
    console.log('   • reward.py (SAT rewards)');
    console.log('   • package.json (project config)');
    console.log('   • README.md (documentation)');
    console.log('   • LICENSE (license)');
    console.log('\n🚀 Run "npm start" to launch the unified game!');
} else {
    console.log('\n⚠️  Cleanup completed with some errors. Check the output above.');
    process.exit(1);
}

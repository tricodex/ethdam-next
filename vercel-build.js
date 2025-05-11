const { execSync } = require('child_process');
const os = require('os');

// Log platform information
console.log('Building on platform:', process.platform, os.release());
console.log('Architecture:', process.arch);

try {
  // Try to load lightningcss to see if it's properly installed
  require.resolve('lightningcss');
  console.log('✅ lightningcss is already installed correctly');
} catch (e) {
  console.log('⚠️ lightningcss is missing or not installed correctly');
  console.log('📦 Installing lightningcss with platform-specific binaries...');
  
  try {
    // Force reinstall with all optional dependencies
    execSync('npm install lightningcss@latest --no-save --force', {
      stdio: 'inherit'
    });
    console.log('✅ lightningcss installed successfully');
  } catch (installError) {
    console.error('❌ Failed to install lightningcss:', installError.message);
    process.exit(1);
  }
}

// Continue with the normal build process
console.log('🚀 Starting Next.js build...');
execSync('next build', { stdio: 'inherit' }); 
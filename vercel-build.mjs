import { execSync } from 'child_process';
import os from 'os';
import { createRequire } from 'module';

const require = createRequire(import.meta.url);

// Log platform information
console.log('Building on platform:', process.platform, os.release());
console.log('Architecture:', process.arch);

try {
  // Try to load lightningcss to see if it's properly installed
  require.resolve('lightningcss');
  console.log('✅ lightningcss is already installed correctly');
} catch (error) {
  console.log('⚠️ lightningcss is missing or not installed correctly:', error.message);
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
execSync('npm run next-build', { stdio: 'inherit' }); 
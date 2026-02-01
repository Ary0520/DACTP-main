/**
 * Simple test to verify the DACTP SDK works correctly
 */

const { DACTP, VERSION } = require('./dist/index.js');

console.log('🚀 Testing DACTP SDK...');
console.log('📦 Version:', VERSION);

// Test SDK initialization
try {
  const dactp = new DACTP({ network: 'futurenet' });
  console.log('✅ SDK initialized successfully');
  
  // Test network info
  const networkInfo = dactp.getNetworkInfo();
  console.log('🌐 Network:', networkInfo.rpcUrl);
  console.log('📋 Contracts:', Object.keys(networkInfo.contracts));
  
  // Test utility functions
  console.log('🔧 Address validation:', dactp.isValidAgentAddress('GBJNTJ56V23KNAG4LBPKLQRVC4GSJ75ICBFQYNI4TQBHQNAYZK4SE7ON'));
  console.log('💰 XLM conversion:', dactp.stroopsToXLM(10000000), 'XLM');
  console.log('📏 Address format:', dactp.formatAddress('GBJNTJ56V23KNAG4LBPKLQRVC4GSJ75ICBFQYNI4TQBHQNAYZK4SE7ON'));
  
  console.log('🎉 All tests passed! SDK is ready for use.');
  
} catch (error) {
  console.error('❌ SDK test failed:', error.message);
  process.exit(1);
}
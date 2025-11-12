/**
 * Debug script to check vault ID usage
 * Add this to your plugin's console to debug vault ID issues
 */

export function debugVaultId(plugin: any) {
  console.log('='.repeat(60));
  console.log('VAULT ID DEBUG INFO');
  console.log('='.repeat(60));
  
  console.log('\n📋 Settings:');
  console.log('  vaultId:', plugin.settings.vaultId);
  console.log('  selectedVaultId:', plugin.settings.selectedVaultId);
  console.log('  apiKey:', plugin.settings.apiKey ? `${plugin.settings.apiKey.substring(0, 10)}...` : 'NOT SET');
  console.log('  apiUrl:', plugin.settings.apiUrl);
  
  console.log('\n🔧 Services:');
  console.log('  syncService.vaultId:', plugin.syncService?.vaultId || 'NOT INITIALIZED');
  console.log('  conflictService.vaultId:', plugin.conflictService?.vaultId || 'NOT INITIALIZED');
  console.log('  apiClient:', plugin.apiClient ? 'INITIALIZED' : 'NOT INITIALIZED');
  
  console.log('\n🔌 Connection:');
  console.log('  isConnected:', plugin.isConnected);
  console.log('  socket:', plugin.socket ? 'CONNECTED' : 'NOT CONNECTED');
  
  console.log('\n💾 Storage:');
  const data = plugin.loadData();
  data.then((d: any) => {
    console.log('  Saved vaultId:', d?.vaultId);
    console.log('  Saved selectedVaultId:', d?.selectedVaultId);
  });
  
  console.log('\n' + '='.repeat(60));
  console.log('To use: Copy this script and run debugVaultId(app.plugins.plugins["vaultbridge"])');
  console.log('='.repeat(60));
}

// Make it available globally for console debugging
if (typeof window !== 'undefined') {
  (window as any).debugVaultId = debugVaultId;
}

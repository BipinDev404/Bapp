export function createBridgeScript(shellJson: string): string {
  const safeConfig = JSON.stringify(shellJson);
  return `(function(){
    var config = JSON.parse(${safeConfig});
    var nativeCall = function(method, args) {
      if (window.BappNative && typeof window.BappNative.call === 'function') {
        var result = window.BappNative.call(method, JSON.stringify(args || {}));
        return Promise.resolve(typeof result === 'string' ? JSON.parse(result) : result);
      }
      if (window.webkit && window.webkit.messageHandlers && window.webkit.messageHandlers.bapp) {
        return new Promise(function(resolve, reject) {
          var id = 'bapp_' + Date.now() + '_' + Math.random();
          window.__bappCallbacks = window.__bappCallbacks || {};
          window.__bappCallbacks[id] = { resolve: resolve, reject: reject };
          window.webkit.messageHandlers.bapp.postMessage({ id: id, method: method, args: args || {} });
        });
      }
      return Promise.reject(new Error(method + ' is unavailable outside the Bapp app'));
    };
    window.BappPlatform = window.BappPlatform || (window.BappNative ? 'android' : 'ios');
    window.BappVersion = '1.0.0';
    window.bapp = {
      isApp: function(){ return Boolean(window.BappNative || (window.webkit && window.webkit.messageHandlers && window.webkit.messageHandlers.bapp)); },
      isAvailable: function(){ return this.isApp(); },
      platform: function(){ return this.isApp() ? window.BappPlatform : 'browser'; },
      version: function(){ return window.BappVersion; },
      device: { getInfo: function(){ return nativeCall('device.getInfo'); } },
      navigation: { back: function(){ return nativeCall('navigation.back'); }, close: function(){ return nativeCall('navigation.close'); }, open: function(url){ return nativeCall('navigation.open', {url:url}); } },
      share: { sharePage: function(url){ return nativeCall('share.sharePage', {url:url}); } },
      files: { download: function(url, fileName){ return nativeCall('files.download', {url:url, fileName:fileName}); }, pick: function(multiple){ return nativeCall('files.pick', {multiple:Boolean(multiple)}); } },
      camera: { open: function(){ return nativeCall('camera.open'); } },
      location: { getCurrentPosition: function(){ return nativeCall('location.getCurrentPosition'); } },
      notifications: { requestPermission: function(){ return nativeCall('notifications.requestPermission'); } },
      haptics: { trigger: function(style){ return nativeCall('haptics.trigger', {style:style || 'light'}); } },
      storage: { get: function(key){ return nativeCall('storage.get', {key:key}); }, set: function(key,value){ return nativeCall('storage.set', {key:key,value:value}); } },
      biometric: { authenticate: function(reason){ return nativeCall('biometric.authenticate', {reason:reason}); } },
      config: config
    };
    if (config.customJavaScript) { try { (new Function(config.customJavaScript)).call(window); } catch (error) { console.error('Bapp custom JavaScript failed', error); } }
  })();`;
}

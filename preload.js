const { contextBridge, ipcRenderer } = require('electron');

contextBridge.exposeInMainWorld('imageApp', {
  resizeImage: (payload) => ipcRenderer.invoke('resize-image', payload)
});

const { contextBridge, ipcRenderer } = require('electron');

contextBridge.exposeInMainWorld('marginFS', {
  save: (data) => ipcRenderer.invoke('margin-save', data),
  load: ()     => ipcRenderer.invoke('margin-load'),
});

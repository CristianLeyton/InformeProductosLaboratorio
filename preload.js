const { contextBridge, ipcRenderer } = require('electron');

contextBridge.exposeInMainWorld('api', {
  obtenerLaboratorios: () => ipcRenderer.invoke('obtener-laboratorios'),
  getPreferencias: () => ipcRenderer.invoke('get-preferencias'),
  setPreferencias: (prefs) => ipcRenderer.invoke('set-preferencias', prefs),
  generarInforme: (labIds) => ipcRenderer.invoke('generar-informe', labIds),
  exportarExcel: (payload) => ipcRenderer.invoke('exportar-excel', payload),
});
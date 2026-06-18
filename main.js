const { app, BrowserWindow, ipcMain } = require('electron');
const path = require('path');
const fs   = require('fs');

const dataFile = () => path.join(app.getPath('userData'), 'margin-data.json');

ipcMain.handle('margin-save', (_e, data) => {
  // data is already a JSON string from the renderer — write it directly
  fs.writeFileSync(dataFile(), data, 'utf8');
});

ipcMain.handle('margin-load', () => {
  try {
    const raw = fs.readFileSync(dataFile(), 'utf8');
    return raw;
  } catch {
    return null;
  }
});

function createWindow() {
  const win = new BrowserWindow({
    width: 1400,
    height: 900,
    title: 'Margin',
    webPreferences: {
      contextIsolation: true,
      preload: path.join(__dirname, 'preload.js'),
    },
  });

  win.loadFile(path.join(__dirname, 'index.html'));
}

app.whenReady().then(() => {
  createWindow();
  app.on('activate', () => {
    if (BrowserWindow.getAllWindows().length === 0) createWindow();
  });
});

app.on('window-all-closed', () => {
  if (process.platform !== 'darwin') app.quit();
});

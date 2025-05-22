const { app, BrowserWindow } = require('electron');
const path = require('path');

const startServer = require('./server'); // Import the startServer function

async function createWindow() {
  const win = new BrowserWindow({
    width: 1200,
    height: 800,
    webPreferences: {
      nodeIntegration: false,
      contextIsolation: true,
    },
  });

  // Load your Angular app dev server URL
  win.loadURL('http://localhost:4200');

  // Open dev tools for debugging (optional)
  win.webContents.openDevTools();
}

app.whenReady().then(async () => {
  try {
    await startServer();  // Wait for backend server to start
    createWindow();
  } catch (err) {
    console.error('Failed to start backend server:', err);
    app.quit();
  }

  app.on('activate', () => {
    if (BrowserWindow.getAllWindows().length === 0) createWindow();
  });
});

app.on('window-all-closed', () => {
  if (process.platform !== 'darwin') app.quit();
});

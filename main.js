const { app, BrowserWindow, ipcMain, dialog } = require('electron');
const path = require('path');
const fs = require('fs/promises');
const sharp = require('sharp');

function createWindow() {
  const win = new BrowserWindow({
    width: 920,
    height: 720,
    minWidth: 800,
    minHeight: 620,
    webPreferences: {
      preload: path.join(__dirname, 'preload.js'),
      contextIsolation: true,
      nodeIntegration: false,
      sandbox: true
    }
  });

  win.loadFile(path.join(__dirname, 'renderer', 'index.html'));
}

app.whenReady().then(() => {
  createWindow();

  app.on('activate', () => {
    if (BrowserWindow.getAllWindows().length === 0) {
      createWindow();
    }
  });
});

app.on('window-all-closed', () => {
  if (process.platform !== 'darwin') {
    app.quit();
  }
});

ipcMain.handle('resize-image', async (_event, payload) => {
  const { inputPath, width, height, format } = payload;

  if (!inputPath) {
    throw new Error('이미지 경로가 없습니다.');
  }

  if (!Number.isInteger(width) || width <= 0 || !Number.isInteger(height) || height <= 0) {
    throw new Error('너비와 높이는 1 이상의 정수여야 합니다.');
  }

  const parsedPath = path.parse(inputPath);
  const defaultName = `${parsedPath.name}_${width}x${height}.${format}`;

  const saveResult = await dialog.showSaveDialog({
    title: '변환된 이미지 저장',
    defaultPath: path.join(parsedPath.dir, defaultName),
    filters: [
      { name: 'JPEG', extensions: ['jpg', 'jpeg'] },
      { name: 'PNG', extensions: ['png'] },
      { name: 'WebP', extensions: ['webp'] }
    ]
  });

  if (saveResult.canceled || !saveResult.filePath) {
    return { canceled: true };
  }

  const outputPath = saveResult.filePath;

  let pipeline = sharp(inputPath).resize(width, height, {
    fit: 'cover'
  });

  if (format === 'png') {
    pipeline = pipeline.png({ compressionLevel: 9 });
  } else if (format === 'webp') {
    pipeline = pipeline.webp({ quality: 90 });
  } else {
    pipeline = pipeline.jpeg({ quality: 90, mozjpeg: true });
  }

  await pipeline.toFile(outputPath);

  const stat = await fs.stat(outputPath);

  return {
    canceled: false,
    outputPath,
    size: stat.size
  };
});

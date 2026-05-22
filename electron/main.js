const { app, BrowserWindow, Menu, shell } = require("electron");
const path = require("path");

const VERCEL_URL = "https://party-games-api-server.vercel.app";

function createWindow() {
  const win = new BrowserWindow({
    width: 1280,
    height: 800,
    minWidth: 900,
    minHeight: 600,
    backgroundColor: "#000000",
    title: "Glo's Party Games",
    icon: path.join(__dirname, "build", process.platform === "win32" ? "icon.ico" : process.platform === "darwin" ? "icon.icns" : "icon.png"),
    webPreferences: {
      nodeIntegration: false,
      contextIsolation: true,
      sandbox: true,
    },
    show: false,
    frame: true,
    autoHideMenuBar: true,
  });

  win.once("ready-to-show", () => {
    win.show();
  });

  win.loadURL(VERCEL_URL);

  // Open external links in the system browser, not in the app
  win.webContents.setWindowOpenHandler(({ url }) => {
    if (!url.startsWith(VERCEL_URL)) {
      shell.openExternal(url);
      return { action: "deny" };
    }
    return { action: "allow" };
  });

  // Show loading state while page loads
  win.webContents.on("did-start-loading", () => {
    win.setTitle("Glo's Party Games — Loading...");
  });

  win.webContents.on("did-finish-load", () => {
    win.setTitle("Glo's Party Games");
  });

  win.webContents.on("did-fail-load", (_event, _code, desc) => {
    win.loadFile(path.join(__dirname, "offline.html"));
    console.error("Failed to load:", desc);
  });
}

// Remove default menu
Menu.setApplicationMenu(null);

app.whenReady().then(() => {
  createWindow();

  app.on("activate", () => {
    if (BrowserWindow.getAllWindows().length === 0) {
      createWindow();
    }
  });
});

app.on("window-all-closed", () => {
  if (process.platform !== "darwin") {
    app.quit();
  }
});

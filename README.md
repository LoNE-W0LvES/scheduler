# HR Task Planner — Portable USB Edition

## Quick Start

1. Double-click **Start_Planner.bat**
2. Your browser will open automatically to http://localhost:3000
3. Use the app as normal — data saves **automatically** to `data.json` on this USB drive
4. To stop: press any key in the black terminal window, or just close it

---

## USB Folder Structure

```
📁 HR_Planner\
  ├── ⚙️ node.exe             — Standalone Node.js (no install needed)
  ├── 🚀 Start_Planner.bat    — Double-click to launch
  ├── 💾 data.json            — Your saved data (auto-created)
  ├── 📁 server\
  │   └── server.js           — Tiny local web server
  └── 📁 client\
      └── dist\               — Built React app (served by server.js)
```

---

## Getting node.exe

**You don't need to do anything manually anymore.** The first time `Start_Planner.bat` runs and doesn't find `node.exe` next to it, it will automatically download the official Node.js binary and set itself up. This needs an internet connection just for that first run.

If the auto-download fails (no internet, or the office network blocks it), the script will show manual instructions:

1. Go to: https://nodejs.org/en/download/
2. Choose **Windows Binary (.zip)** (not the installer)
3. Extract → copy **node.exe** into this folder next to Start_Planner.bat
4. Run Start_Planner.bat again

Either way, once `node.exe` is in the folder, every future launch is instant and needs zero internet.

---

## Troubleshooting

**Windows SmartScreen warning:** Click "More info" → "Run anyway"

**Firewall popup:** Click "Cancel" or "No" — localhost still works without public network access

**Corporate USB policy:** Ask IT if .bat and .exe files can run from USB. If blocked, you can run `node.exe server\server.js` from Command Prompt manually, then open http://localhost:3000 in your browser.

**Port 3000 already in use:** Edit `server\server.js` line 5 and change `3000` to another port (e.g. `3001`), then edit `Start_Planner.bat` to match.

---

## Data Backup

Your data lives in `data.json`. To back it up, just copy that file somewhere safe. To restore, paste it back.

---

Built with React + Vite + Tailwind CSS + Node.js (zero external npm dependencies at runtime)

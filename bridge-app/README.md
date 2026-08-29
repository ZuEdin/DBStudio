# 🚀 DB Studio Local Bridge (Desktop & Tauri Suite)

**Das fehlende Bindeglied zwischen Browser & Betriebssystem.**  
DB Studio Local Bridge ist die native Begleit-Software zu DB Studio PRO, die alles erledigt, was ein Browser aus Sicherheits- und Sandbox-Gründen **nicht** kann:

---

## ⚡ Kernaufgaben der Bridge (Was DB Studio im Browser NICHT kann)

1. **Direct OLEDB & Microsoft Access Migration:**
   - Direktes Auslesen von binären `.accdb` und alten `.mdb` Datenbankdateien über 64-Bit Microsoft ACE / OLEDB Treiber.
   - Automatische Transpilierung von Access-VBA-Funktionen (`NZ()`, `IIF()`, `Format()`, `DateAdd()`) in ANSI-SQL.
   - Direkte Generierung von nativen SQLite `.db` Dateien auf der Festplatte sowie von Multi-Row Batch SQL Dumps.

2. **Lokaler Compiler & Runtime Host:**
   - Ausführen von `dotnet run`, `dotnet watch` und `dotnet publish -c Release --self-contained`.
   - Ausführen von `npm install`, `npm run dev` und `npm run build`.
   - Automatische Erkennung installierter Compiler (.NET 10, .NET 9, Node.js, Rust, Docker).

3. **Zentraler Shared Dependencies Store:**
   - Verwaltet einen globalen `Shared_Dependencies` Pool mit Windows-Junctions / Symlinks (`node_modules`), um Gigabytes an Festplattenspeicher zu sparen.

4. **Port- & Prozessverwaltung:**
   - PID-gebundenes Starten, Stoppen und automatisiertes Befreien blockierter Ports (`:5000`, `:3000`, `:5050`).
   - Live-Log Streaming über WebSockets (`ws://127.0.0.1:5050/logs`).

5. **Desktop Packaging & DevOps:**
   - Bauen von eigenständigen Windows Setup-Installern (MSI / EXE) via Tauri.
   - Lokale Git-Steuerung (`git init`, `git commit`, `git push` zu GitHub / GitLab).
   - FTP / SFTP Bereitstellung & Docker Compose Multi-Container Orchestrierung.

---

## 💻 Schnellstart

### 1. Entwicklungsserver starten
```bash
npm install
npm run dev
```

### 2. Als natives Desktop-Programm mit Tauri starten
```bash
npm run tauri dev
```

### 3. Produktions-Installer bauen (MSI / EXE)
```bash
npm run tauri build
```

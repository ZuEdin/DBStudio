# 🗺️ Roadmap & Spezifikation: Pakete 2, 3 und 4 (Phase 2 Vorbereitung)

Dieses Dokument enthält die vollständige Spezifikation, Architekturvorgaben und Umsetzungspläne für die **Pakete 2, 3 und 4** im Rahmen der **Local-First & Single-Developer-Autonomie** von DB Studio Pro.

---

## 📋 Übersicht der Pakete

```
┌────────────────────────────────────────────────────────────────────────────────────────┐
│  PAKET 2: Entkoppelte BaaS Plug-in Architektur (Supabase & PocketBase)                  │
├────────────────────────────────────────────────────────────────────────────────────────┤
│  PAKET 3: Multi-User Live-Kollaboration via CRDTs (P2P / LAN / WebRTC)                 │
├────────────────────────────────────────────────────────────────────────────────────────┤
│  PAKET 4: Native Mobile Companion Wrapper (Capacitor & Tauri Scaffolding)              │
└────────────────────────────────────────────────────────────────────────────────────────┘
```

---

## 📦 PAKET 2: Entkoppelte BaaS Plug-in Architektur (Supabase & PocketBase)

### 🎯 Ziel
Vollständige Entkopplung von Backend-as-a-Service (BaaS) Anbietern. Der Entwickler kann mit 1 Klick DDL-Migrationen, Schemas und Row Level Security (RLS) Richtlinien für **Supabase** (PostgreSQL) und **PocketBase** (Self-Hosted SQLite) exportieren, **ohne dass das Kernsystem jemals eine feste Cloud-Abhängigkeit hat**.

### 🧩 Geplante Module & Dateien
1. **Interface Definition:** `/types/cloudProvider.ts`
   ```typescript
   export interface ICloudSyncProvider {
     id: 'supabase' | 'pocketbase';
     name: string;
     generateSchemaMigration(tables: Table[], relations: Relationship[]): string;
     exportSchemaConfig(tables: Table[]): Record<string, any>;
     generateRlsPolicies(tables: Table[]): string;
   }
   ```
2. **Supabase DDL & RLS Plugin:** `/features/backend/plugins/supabasePlugin.ts`
   - Generierung von `CREATE TABLE`, `ALTER TABLE ... ADD CONSTRAINT FOREIGN KEY`, Enums und PostgreSQL-Indizes.
   - Automatische Erstellung von Standard-RLS-Policies:
     ```sql
     ALTER TABLE projekte ENABLE ROW LEVEL SECURITY;
     CREATE POLICY "Eigene Projekte lesen" ON projekte FOR SELECT USING (auth.uid() = ersteller_id);
     ```
3. **PocketBase Schema JSON Exporter:** `/features/backend/plugins/pocketbasePlugin.ts`
   - Erzeugt konformes `pb_schema.json` zur direkten Wiederherstellung in lokalen Self-Hosted PocketBase-Instanzen via `./pocketbase migrate`.
4. **UI-Dialog:** `/features/backend/plugins/BaaSExportModal.tsx`
   - Export-Dialog mit Syntax-Highlighting und 1-Klick-Download von `schema.sql` und `pb_schema.json`.

---

## 📦 PAKET 3: Multi-User Live-Kollaboration via CRDTs (P2P / LAN)

### 🎯 Ziel
Ermöglicht mehreren Entwicklern oder Bauleitern im selben lokalen Netzwerk (LAN / Baustellen-WLAN) ohne zentralen Cloud-Server gemeinsam an Formularen, Daten-Grids und Schemas zu arbeiten. Konflikte werden mathematisch über CRDTs (Conflict-free Replicated Data Types) aufgelöst.

### 🧩 Geplante Module & Dateien
1. **CRDT Datenmodell & Verträge:** `/types/crdtContracts.ts`
   - Definition von kollaborativen Yjs-Datenstrukturen (`Y.Doc`, `Y.Map` für Formulareigenschaften, `Y.Array` für Grid-Zeilen).
   - Awareness-Protokoll für Remote-Cursor und aktive Bearbeitungs-Markierungen.
2. **P2P WebRTC / BroadcastChannel Signal-Adapter:** `/services/crdtLocalPeerSimulator.ts`
   - Lokaler Peer-to-Peer Kanal (unterstützt Multi-Tab-Sync via `BroadcastChannel` und lokales LAN via WebRTC Data Channels).
3. **Kollaboratives Locking & Cursor-Rendering:** `/features/collaboration/components/CollaborativeCanvasOverlay.tsx`
   - Visuelle Anzeige von Remote-Nutzern im Formular-Designer (farbige Rahmen bei aktuell bearbeiteten Feldern).

---

## 📦 PAKET 4: Native Mobile Companion Wrapper (Capacitor & Tauri)

### 🎯 Ziel
1-Klick Scaffolding für mobile Begleit-Apps (Tablets und Smartphones für Baustellen-Dokumentation, Mängelverfolgung und Bautagebücher) mit vollem Offline-Support, Zugriff auf Gerätekamera und lokaler SQLite-Persistenz.

### 🧩 Geplante Module & Dateien
1. **Scaffold Generator Service:** `/features/generators/mobileScaffoldGenerator.ts`
   - Erzeugt ein vollständiges, kompilierbares Projektverzeichnis als `.zip`:
     - `capacitor.config.json` mit App-ID, Permissions (Kamera, Geolocation, Storage).
     - `tauri.conf.json` für schlanke Desktop-/Mobile-Cross-Platform-Builds mit Rust.
     - `package.json` mit `@capacitor/core`, `@capacitor/camera`, `@capacitor-community/sqlite`.
     - Vorkonfigurierte `src/index.html` und Service Worker für echten PWA- & Offline-Betrieb.
2. **Mobile Export & Build Guide Modal:** `/features/generators/MobileWrapperExportModal.tsx`
   - Schritt-für-Schritt-Anleitung für `npx cap sync android` und `npx cap run ios`.
   - Download des fertigen Mobile-Projekts.

---

## 📊 Status-Übersicht

| Paket | Name | Kernfokus | Umsetzungs-Reihenfolge |
| :--- | :--- | :--- | :--- |
| **Paket 1** | SQLite WASM Binary I/O Engine | 100% Offline SQLite `.sqlite` Direct I/O | ✅ **Fertiggestellt & Integriert** |
| **Paket 5** | AST Plugin Hub & Lokaler Ollama Copilot | Go, Python, Rust, C# & Lokale KI | ✅ **Fertiggestellt & Integriert** |
| **Paket 2** | Entkoppelte BaaS Plug-in Architektur | Supabase DDL + RLS & PocketBase Export | ⏳ **Nächster Schritt (Phase 2)** |
| **Paket 3** | Multi-User Live-Kollaboration (CRDTs) | P2P / LAN Yjs & WebRTC Sync | ⏳ **Phase 2** |
| **Paket 4** | Native Mobile Companion Scaffolding | Capacitor & Tauri Mobile Wrapper | ⏳ **Phase 2** |

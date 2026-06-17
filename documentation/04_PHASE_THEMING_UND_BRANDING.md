# Phase 4: Theming & Branding Engine (White-Labeling Pro)

Bisher haben wir die strukturelle und sicherheitsrelevante Basis der generierten Applikationen mit Navigation und Rollen ausgestattet. Für den Enterprise-Einsatz fehlt noch eine tiefe, anpassbare Branding-Schicht, damit die Software zu 100% nach dem Corporate Design des Kunden aussieht.

## 4.1 Visual Theme Builder (Design System Management)
*   **Die Idee**: Ein grafischer Editor im DB Studio Pro, um das Design-System der App zu definieren.
*   **Features**:
    *   **Farbschemata**: Definition von Primary, Secondary, Accent, Success, Warning, Error Colors.
    *   **Typografie**: Auswahl aus Google Fonts oder Upload custom Fonts, Schriftgrößen-Hierarchien (H1-H6, Body, Small).
    *   **Formensprache**: Border-Radius (Eckig, Leicht abgerundet, Pill-Shape), Schatten-Tiefen (Elevation).
*   **Die Generierung**: Der Generator erzeugt vollautomatisch die passenden `tailwind.config.js` (React) oder globalen CSS-Variablen (`:root`), sodass die gesamte App konsistent im neuen Glanz erstrahlt.

## 4.2 Dark Mode & Light Mode Management
*   **Die Idee**: Präzise Kontrolle darüber, wie die App im Dark Mode aussieht.
*   **Features**: Eigene Farb-Mappings für den Dark Mode (z.B. Primary = Neon-Blau im Dark Mode, Dunkelblau im Light Mode).
*   **Die Generierung**: Das System verankert das Dark-Mode Switching nahtlos im Generat-Code mit nativem OS-Detection-Support und manuellem Toggle.

## 4.3 Branded Email Templates (Kommunikation)
*   **Die Idee**: Wenn die generierte Software Mails verschickt (Workflow-Alerts, Passwort vergessen), müssen diese gebrandet sein.
*   **Features**: Ein rudimentärer E-Mail-Template Editor im Studio, der Logo, Firmenname und Hausfarben verwendet.
*   **Die Generierung**: Die Backend-Generatoren (`.NET`, `NodeJS`) integrieren vorgefertigte, responsive HTML/Mjml-Templates, die das definierte Theming nutzen.

## 4.4 App-Icon & Splash-Screen Generator (PWA / Mobile Ready)
*   **Die Idee**: Progressive Web Apps (PWA) benötigen Manifest-Dateien und Icons in hunderten verschiedenen Größen.
*   **Die Generierung**: Der User lädt EIN hochauflösendes Logo hoch. DB Studio Pro erstellt beim Build otomatisierte `manifest.json` und skaliert die Favicons, Apple Touch Icons und Splash Screens auf alle benötigten Auflösungen.

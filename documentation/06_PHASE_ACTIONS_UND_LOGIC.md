# Phase 6: Low-Code Action & Flow Builder

Nachdem das Layout und die Datenstruktur perfekt generiert werden, rückt die **Geschäftslogik auf Client-Seite** in den Fokus. Was passiert, wenn ich auf einen Knopf drücke? Dies löst der Action Builder.

## 6.1 Frontend Action Flows (Event-Triggered Logic)
*   **Die Idee**: Ein visuelles Mapping von Events auf Aktionen ohne eine Zeile JavaScript.
*   **Features**: Definition von Triggern (z.B. `OnClick`, `OnChange`, `OnPageLoad`).
*   **Mögliche Actions**:
    *   `Show Toast/Alert` (Benachrichtigung im Screen unten rechts).
    *   `Open Modal/Form` (Ein Popup-Modalfenster mit einem Formular öffnen).
    *   `Navigate to Route` (Weiterleitung auf eine Query-Ansicht oder andere Seite).
    *   `Execute API Call` (Sende eine payload an einen REST-Endpunkt).
*   **Die Generierung**: Transpilierung in native EventHandler (`onClick`, `useEffect`) im generierten Single Page Application Code.

## 6.2 Global State & App Context Variablen
*   **Die Idee**: Die App muss sich Zustände sitzungsübergreifend merken können.
*   **Features**: Im DB Studio Pro können Entwickler State-Variablen anlegen (z.B. `selectedYear`, `activeCustomerID`). Diese können in Queries als Filter gebunden werden.
*   **Die Generierung**: Generierung von Global Context Providern (z.B. React Context, Zustand oder Vuex/Pinia), die durch Dropdowns & Buttons im Layout aktualisiert werden können.

## 6.3 Interaktives Onboarding & Produkt-Guided-Tours
*   **Die Idee**: Neue Benutzer in generierten Enterprise-Apps kennen sich oft nicht aus.
*   **Features**: Ein Feature im Designer, um "Tour-Steps" an Elemente anzuhängen (z.B. Schritt 1: "Hier legen Sie neue Kunden an").
*   **Die Generierung**: Die generierte App enthält Integrationen für Tour-Bibliotheken (React Joyride o.ä.), welche beim Erstlogin den User mit Popovers quer durch das Interface führen.

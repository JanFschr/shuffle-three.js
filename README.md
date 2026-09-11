# SHARD//PUCK

Ein spielbarer Browser-Prototyp eines Cyberpunk-Shufflepuck-Duells. Die aktuelle
v0.3-Iteration konzentriert sich auf das unmittelbare Tischgefühl: deterministische
120-Hz-Simulation, Full-Width-Goals, direkte Maus-/Touch-Steuerung, defensive
Schlägerzonen, geschwindigkeitsabhängige Torschäden, Barrierenglas und eine
physischere Three.js-Präsentation.

Der Vertical Slice enthält ein vollständiges BREAK-Duell gegen Old Saint. Der
Puck startet beim Spieler und wird nicht automatisch abgeschossen: der erste
Ballwechsel beginnt erst durch einen echten Kontakt mit dem eigenen Schläger.
Eine Kinetic-Charge-Leiste lädt sich durch eigene Puckkontakte, Bank-Shots sowie
Tore und Gegentore. Ist sie voll, kann ein kurzer `SURGE` ausgelöst werden, der
nur den eigenen Schläger beschleunigt und dessen Kontaktwirkung erhöht; ohne
Kollision wirkt der Effekt nicht auf den Puck.

## Betrieb über GitHub Pages

Die Anwendung hat **kein Backend, keinen Build-Schritt und keine npm-Abhängigkeiten**.
Sie wird nach jedem Push auf den Branch `main` automatisch durch den enthaltenen
GitHub-Actions-Workflow auf GitHub Pages veröffentlicht. Three.js lädt der Browser
als fest versioniertes ES-Modul über die Import-Map.

Der Workflow aktiviert GitHub Pages beim ersten Lauf automatisch und verwendet
GitHub Actions als Veröffentlichungsquelle. Danach ist das Spiel unter
`https://<account>.github.io/<repository>/` erreichbar. Alle internen Pfade sind
relativ, damit die Anwendung auch unter dem Repository-Unterpfad einer Project
Page funktioniert. Falls die Organisation das automatische Aktivieren von Pages
verbietet, muss ein Repository-Administrator Pages einmalig unter
**Settings → Pages** freigeben und anschließend den Workflow erneut starten.

Pull Requests aus internen Branches mit dem Präfix `codex/` oder dem von Codex
verwendeten Branch `work` werden nach erfolgreicher Syntax- und Testprüfung
automatisch per Squash-Merge übernommen. Forks, Entwürfe und anders benannte
Branches sind davon ausdrücklich ausgeschlossen. Damit der Workflow mergen darf,
muss unter **Settings → Actions → General → Workflow permissions** die Option
**Read and write permissions** aktiviert sein. Nach dem automatischen Merge stößt
die Action zusätzlich das GitHub-Pages-Deployment für `main` an. Die
Pull-Request-Änderung, welche diese Action erstmals einführt, muss einmalig
manuell gemergt werden; erst danach kann der Workflow neue Codex-PRs erkennen.

Ein eigener Server, ein lokaler Python-Prozess oder ein Node.js-Prozess zur
Laufzeit ist nicht erforderlich. Node.js wird ausschließlich für die optionalen
Tests verwendet und ist kein Bestandteil des Deployments.

Die Steuerung erfolgt direkt mit Maus oder Touch-Drag auf dem Tisch. `WASD` bleibt
als Desktop-Fallback erhalten. Es gibt kein D-Pad und keinen separaten
Schlag-Button. Die Kinetic-Charge-Anzeige unten rechts kann angetippt werden,
sobald sie `READY` zeigt. `P` oder `Escape` pausiert und `R` startet das Duell
neu. Der Audio-Schalter im HUD schaltet Musik und Effekte gemeinsam stumm.

## Qualitätssicherung

```bash
node --test
```

Die Simulation liegt getrennt vom Renderer unter `src/game/simulation.js` und
kann ohne Browser reproduzierbar getestet werden. Zusätzliche statische Tests
prüfen die Mobile-UI auf direkte Pointer-Steuerung, Dynamic-Viewport-Sizing und
das Fehlen der alten Richtungs-/Schlag-Buttons.

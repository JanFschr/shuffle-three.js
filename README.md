# SHARD//PUCK

Ein spielbarer Browser-Prototyp eines Cyberpunk-Shufflepuck-Duells. Die v0.2
setzt den Kern des GDD als eigenständigen Vertical Slice um: deterministische
120-Hz-Simulation, Maus-/Tastatursteuerung, Gegner-KI, geschwindigkeitsabhängige
Torschäden, Barrierenglas, synthetisches Audio und eine reduzierte Three.js-
Präsentation.

Der Vertical Slice enthält ein vollständiges BREAK-Duell, Maus- und
Tastatursteuerung, eine Impulsaktion, sichtbare Barriererisse und -splitter,
Pause- und Audio-Bedienung sowie einen prozeduralen Industrial-Electro-Loop.

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
verwendeten Branch `work` werden nach
erfolgreicher Syntax- und Testprüfung automatisch per Squash-Merge übernommen.
Forks, Entwürfe und anders benannte Branches sind davon ausdrücklich
ausgeschlossen. Damit der Workflow mergen darf, muss unter
**Settings → Actions → General → Workflow permissions** die Option
**Read and write permissions** aktiviert sein.
Nach dem automatischen Merge stößt die Action zusätzlich das GitHub-Pages-
Deployment für `main` an.
Die Pull-Request-Änderung, welche diese Action erstmals einführt, muss einmalig
manuell gemergt werden; erst danach kann der Workflow neue Codex-PRs erkennen.

Ein eigener Server, ein lokaler Python-Prozess oder ein Node.js-Prozess zur
Laufzeit ist nicht erforderlich. Node.js wird ausschließlich für den optionalen
Simulationstest verwendet und ist kein Bestandteil des Deployments.

Die Steuerung erfolgt mit der Maus über dem Tisch oder alternativ mit
`WASD`/Pfeiltasten. Linksklick oder `Leertaste` aktiviert einen kurzen
Impuls-Schlag, `P` oder `Escape` pausiert und `R` startet das Duell neu. Der
Audio-Schalter im HUD schaltet Musik und Effekte gemeinsam stumm.
Auf Smartphones im Hochformat erscheinen zusätzlich ein Touch-Steuerkreuz für
den Schläger und ein großer `SCHLAG`-Button für den Impuls.

## Qualitätssicherung

```bash
node --test
```

Die Simulation liegt getrennt vom Renderer unter `src/game/simulation.js` und
kann ohne Browser reproduzierbar getestet werden.

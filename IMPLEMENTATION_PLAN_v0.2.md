# v0.2 — Vertical-Slice-Implementierungsplan

## Ziel

v0.2 überführt den isolierten Duel-Kern aus dem GDD in einen unmittelbar
spielbaren Cinder-Row-Vertical-Slice. Renderer und Simulation bleiben strikt
getrennt, damit Spielgefühl und Kollisionsverhalten unabhängig von der
Bildrate geprüft werden können.

## Umgesetzter Umfang

- **Spielkern:** 120-Hz-Fixed-Step, begrenzte Striker-Beschleunigung,
  Puck-Dämpfung, Geschwindigkeitslimit, Rail- und Striker-Kollisionen.
- **Match:** BREAK-Regel, 100 Integrität pro Seite, geschwindigkeitsabhängiger
  Schaden, Serve-Cue, Sieg/Niederlage und sofortiger Neustart.
- **Gegner:** Old-Saint-Prototyp mit vorausberechneter Interception,
  begrenzter Geschwindigkeit und bewusstem periodischem Zielfehler.
- **Interaktion:** Maussteuerung, Tastatur-Fallback, Hochkant-Touchsteuerung mit
  Steuerkreuz und Schlagbutton, Pause, Reset und Impuls-Aktivmodul mit Cooldown.
- **Präsentation:** perspektivischer Three.js-Tisch, Cinder-Row-Lichtstimmung,
  diegetische Barrieren, Gegner-Silhouette, Retro-HUD und Telemetrie.
- **Audio:** prozedural erzeugte, mehrschichtige Web-Audio-Signale für Rail,
  Striker, Tor und Matchende sowie ein Industrial-Electro-Loop mit Audio-Schalter;
  der Prototyp benötigt keine externen Audio-Assets.
- **Auslieferung:** statische HTML-, CSS- und JavaScript-Dateien ohne Build-Schritt;
  ein GitHub-Actions-Workflow veröffentlicht sie auf GitHub Pages und Three.js
  wird im Browser als versioniertes CDN-Modul geladen.
- **Qualität:** deterministische Tests auf Basis des integrierten Node-Test-Runners
  für Serve, Rail-Kollision, Damage-Kurve, Eingabegrenzen und identische Läufe.

## Abnahmekriterien

1. Ein Duell ist vom Start bis zum Barrierbruch ohne Menübruch spielbar.
2. Schnelle Tore verursachen nachweisbar mehr Schaden als langsame Tore.
3. Der Puck verlässt bei seitlichem Railkontakt den Tisch nicht.
4. Maus und Tastatur können den Player-Striker ausschließlich in der eigenen
   Tischhälfte bewegen.
5. Identische Ausgangszustände ergeben identische Simulationszustände.
6. Die Anwendung wird ohne npm-Installation oder Build-Schritt auf GitHub Pages
   veröffentlicht und funktioniert unter dem Project-Page-Unterpfad.

## Bewusst nach v0.2 verschoben

Branching Map, Reward-Pool, permanente Freischaltungen, zusätzliche Gegner,
Multi-Puck und weitere Distrikte gehören nicht in diesen Vertical Slice. Sie
werden erst ergänzt, wenn das Basiskampfgefühl anhand dieser Version
abgenommen wurde.

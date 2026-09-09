SHARD//PUCK

A CYBERPUNK SHUFFLEPUCK ROGUELITE

GAME DESIGN DOCUMENT · v0.1

Working title. Original IP. Design target: preserve the immediate feel
and readable table duel of the Amiga classic, then layer a compact
15-minute roguelite structure, cyberpunk characters, destructible tables
and build synergies on top.

|**TARGET** |**DECISION**                                                     |
|-----------|-----------------------------------------------------------------|
|Platform   |Browser / desktop first                                          |
|Stack      |Three.js + TypeScript + custom fixed-step 2D simulation          |
|Input      |Mouse + keyboard                                                 |
|Run length |~15 minutes                                                      |
|Camera     |Classic end-of-table view                                        |
|Difficulty |Accessible start, strong mastery curve                           |
|Development|Solo AI-assisted development; v0.1 = isolated puck duel prototype|

Design north star

“One more run” arcade energy. The player should understand the physical
duel immediately, then discover that opponent reads, shot geometry, puck
evolution and arena manipulation create radically different runs without
burying the table under systems.

Prepared from the current design brief · September 2026

DOCUMENT ORIENTATION

02 Executive Summary

SHARD//PUCK is a browser-first cyberpunk roguelite built around a
faithful-feeling shufflepuck duel: a low table, a puck with strong
physical presence, one opponent at the far end, direct mouse control and
an immediately readable objective. The modern layer does not replace
that duel. It changes what the duel can become over a run.

A successful run lasts roughly fifteen minutes and crosses one district
of a larger city. The route is a small visible branching map: the player
chooses between two opponent nodes, sees the boss at the end, accepts
higher-risk tables for stronger rewards, and never stops for shops,
currencies or filler events. Every win grants a concise build choice.
The run culminates in a boss who alters the rules in a limited, legible
way.

Damage is represented through a physical barrier screen behind each
goal. Goals and special table interactions crack the screen; its visual
state communicates health. At zero integrity it shatters and the duel
ends. Shot velocity matters, so clean angle control and powerful returns
remain meaningful even after upgrades enter the picture.

Meta-progression is breadth-first rather than stat-first: new striker
frames, puck kernels, modules, districts, opponents and story records
enter the future reward pool. This keeps player skill more important
than permanent grind.

Core product promise: “The old-school duel is the game. Roguelite
systems make each duel ask a different question.”

Document map

|**PAGES**|**SUBJECT**                                            |
|---------|-------------------------------------------------------|
|03–05    |Vision, world, districts                               |
|06–09    |Run loop, match rules, input, physics                  |
|10–13    |Puck, striker, build and arena systems                 |
|14–17    |AI, opponents, bosses, branching map                   |
|18–22    |Meta, narrative, art, UI and audio                     |
|23–24    |Technical architecture, scope and quality budgets      |
|25       |Risks, success criteria, assumptions and open decisions|

PLAYER FANTASY

03 Vision & Design Pillars

The intended first impression is “this feels like Shufflepuck Café”
rather than “this is a deckbuilder with an air-hockey minigame.” The
table, puck, opponent posture, return timing and sound must carry the
experience before any progression layer is visible.

The four pillars

|**PILLAR**            |**DESIGN RULE**                                                                                                             |
|----------------------|----------------------------------------------------------------------------------------------------------------------------|
|1 · Physical immediacy|The puck must feel fast, weighty and predictable. A miss should read as the player’s miss, not the simulation’s.            |
|2 · Read the rival    |Each opponent has habits, tells and a limited toolkit. Learning them is a real source of power.                             |
|3 · Evolving geometry |Builds modify puck, striker and table. Strong runs create new bank-shot and space-control problems, not just larger numbers.|
|4 · One-more-run pace |No economy screens or long hub traversal between matches. Failure should return to a meaningful new run quickly.            |

Emotional target

• Opening minutes: tactile, nostalgic, easy to parse.
• Mid-run: “I see what this build wants me to do.”
• Boss: pressure rises because the opponent and table demand execution,
not because the screen fills with effects.
• After failure: clear memory of the mistake plus immediate curiosity
about a different route or reward.

Tone

The city is dark, industrial and exploitative, but not monotonously
grim. Classic cyberpunk absurdity is welcome: theatrical hustlers,
over-branded corporate athletes, obsolete service robots with ego,
cult-like optimization coaches and impossible nightlife etiquette. Humor
should expose the world rather than undercut stakes. Short dialogue can
be funny in one line and unsettling in the next.

Rule of restraint: if a new mechanic makes the player stop watching the
puck, it must earn that cost.

ORIGINAL CYBERPUNK UNIVERSE

04 World, Tone & IP Boundary

The game should use Cyberpunk 2077 as a mood and scene-composition
reference, not as publishable world content. Night City, Afterlife,
Arasaka, Militech and their visual identifiers are third-party IP. For a
private prototype they can remain shorthand in notes; the production
game should replace them with original names, factions, logos, dialogue
and locations.

Provisional setting: Vesper City

Vesper City is a vertical port megacity where corporate districts, old
transit infrastructure and illegal nightlife overlap. Competitive puck
duels began as a bar game, then became a low-cost corporate spectator
sport and finally an underground reputation economy. The same table
format now appears everywhere: clubs, executive lounges, training cages
and virtual arenas. That gives the game a coherent reason to move
between radically different aesthetics without changing the core
interaction.

|**REFERENCE ENERGY**          |**ORIGINAL DIRECTION**                                                |
|------------------------------|----------------------------------------------------------------------|
|Outlaw after-hours club       |The Null Lantern — basement venue for mercenaries, runners and fixers.|
|Corporate tower / clean luxury|Axiom Spire — polished glass, biometric access, branded sport labs.   |
|Militarized contractor zone   |Bastion Yard — logistics hangars, security ranges, armored spectators.|
|Cyberspace / netrunning       |Ghostline — abstract signal spaces rendered as impossible tables.     |
|Colorful vice district        |Aurora Strip — noisy signage, arcades, clubs, street tournaments.     |

Narrative premise

The player enters a citywide informal circuit. Each run is one story: a
chain of duels through a district ending at its gatekeeper. Losing does
not trigger a lore-heavy resurrection mechanic; that night is simply
over. Persistent unlocks represent reputation, contacts, recordings,
hardware access and learned techniques rather than supernatural
continuity.

PLACE AS GAMEPLAY

05 Districts & Arena Identity

Districts are not only backgrounds. Each one owns a table language:
material response, geometry, opponent culture, music palette and a small
set of arena modifiers. A player should identify the district from a
screenshot even if the HUD is hidden.

|**DISTRICT**|**LOOK / SOUND**                                  |**TABLE LANGUAGE**                        |**BOSS FANTASY**                                     |
|------------|--------------------------------------------------|------------------------------------------|-----------------------------------------------------|
|Cinder Row  |dark bars, amber worklights, distorted electro    |wood/metal hybrid rails, breakable bumpers|veteran hustler who controls tempo                   |
|Axiom Spire |clean glass, white light, restrained synth        |precision rails, moving partitions        |corporate champion with calibrated “legal cheats”    |
|Bastion Yard|industrial hangar, red beacons, percussion        |heavy rails, armored shutters             |security operator who weaponizes the table           |
|Ghostline   |black voids, emissive vector forms, granular audio|phase walls, topology changes             |avatar that rewrites one rule per phase              |
|Aurora Strip|saturated signage, club bleed, fast breakbeat     |lightweight bumpers, flashy ricochet lanes|showboat rival built around feints and crowd pressure|

Arena composition rules

• The opponent silhouette and puck remain the highest-contrast moving
objects.
• Every table modifier must be visible before it changes physics.
• Background NPC animation can sell place but cannot cross the active
puck silhouette.
• Each district begins with a “clean” table and escalates to one or two
signature modifiers.
• Boss tables may transform once or twice; they should not become
bullet-hell stages.

Recommended launch scope

For v1, target four fully realized districts and hold Aurora Strip as a
stretch district. Four districts are enough to establish breadth without
asking a solo developer to produce five complete art, audio and AI
ecosystems before the underlying duel has proven itself.

15-MINUTE RUN

06 Core Loop & Run Structure

<img src="media/image1.png" style="width:6.77165in;height:2.70866in" />

A standard run uses four pre-boss tiers plus the district boss. Each
tier shows two opponent nodes. The node communicates opponent identity,
table modifier, reward category and a simple risk rating. The player
chooses one; the other path closes. This yields real routing decisions
without requiring a full Slay-the-Spire-scale map.

|**BEAT**    |**TARGET TIME**|**PURPOSE**                               |
|------------|---------------|------------------------------------------|
|Route choice|5–10 s         |Read risk, opponent and reward.           |
|Duel        |90–150 s       |Primary skill expression.                 |
|Reward      |10–20 s        |Pick one of three concise modifications.  |
|Transition  |5–8 s          |Character line + load next venue.         |
|Boss        |2–3 min        |Test build plus learned district language.|

Pacing budget: most of the fifteen minutes must be spent with the puck
in motion. Menus are connective tissue, not the activity.

WIN CONDITION

07 Match Rules & Barrier Glass

The default match is a BREAK duel. Each side owns a goal and a
transparent barrier panel behind it. A goal transfers impact into
barrier integrity. Cracks accumulate across the panel, individual
fragments loosen, and the final damaging goal shatters it. The screen is
both health bar and spectacle.

Baseline rule set

|**PARAMETER**             |**BASELINE**                                                        |
|--------------------------|--------------------------------------------------------------------|
|Player barrier integrity  |100                                                                 |
|Opponent barrier integrity|80–140 by tier / identity                                           |
|Base goal damage          |20 before velocity and build modifiers                              |
|Typical goals to win      |4–6                                                                 |
|Puck cap                  |1 normally; up to 3 through builds / specific bosses                |
|Round reset               |Puck returns to neutral center with short 0.8 s serve cue           |
|Match timer               |None by default; anti-stall acceleration after long inactive rallies|

Velocity-sensitive damage

The speed of the puck when it crosses the goal line contributes to
damage. This rewards deep returns, clean angle control and deliberate
setup. It should not turn every fast shot into a one-hit kill. A
recommended launch curve is roughly 0.75× damage for slow dribblers,
1.0× near the intended rally speed, and up to 1.5× for exceptional shots
before build modifiers.

Rare match variant: SURVIVE

A small minority of route nodes replace the break objective with a timed
survival contract. The opponent enters with a temporarily unfair
offensive pattern; the player wins by keeping their barrier intact for
60–90 seconds. This adds variety while preserving the same controls and
visual language. Do not add capture points, collection tasks or
unrelated minigames in v1.

The glass replaces abstract death inside a duel. When it breaks, the
story of that run ends cleanly.

CLASSIC FIRST

08 Controls, Camera & Game Feel

The player sees the table from the near end, close to the original
composition. The view remains readable and mostly fixed.
Three-dimensionality is used for parallax, opponent animation, lighting
and table depth rather than for free camera movement.

|**INPUT**                  |**BEHAVIOR**                                                     |
|---------------------------|-----------------------------------------------------------------|
|Mouse position             |Sets target position of the striker on the player side.          |
|Left mouse / primary action|Contextual active module or charged strike, depending on loadout.|
|Space / secondary action   |Second active module or defensive utility.                       |
|Escape                     |Pause.                                                           |
|Keyboard movement          |Optional accessibility fallback; not primary competitive input.  |

Striker motion

The striker should not teleport to the cursor. It chases the cursor
target with a high but finite maximum speed and acceleration. That
preserves the tactile “hand behind the paddle” feeling and allows
meaningful collision velocity. The cursor itself can remain hidden over
the table and be represented by a subtle target reticle when needed.

Camera rules

• No orbit, free-look or camera steering during normal play.
• Very small hit impulse, field-of-view kick or table vibration only on
exceptional impacts.
• Boss transformations can use a short authored camera beat, then return
control immediately.
• Never let screen shake reduce the ability to estimate a rebound angle.

Skill ceiling

Mastery comes from interception timing, deliberately meeting the puck
with striker velocity, bank-shot geometry, controlling rebound depth,
reading opponent recovery windows and manipulating the table with build
effects. A new player can return the puck instantly; a strong player
chooses the return they want.

DETERMINISTIC 2D SIMULATION

09 Physics & Damage Model

Use a custom fixed-step 2D simulation for puck, striker and table
collision, rendered in 3D by Three.js. General rigid-body physics is
unnecessary for the core duel and makes precision tuning harder. Debris
and background objects can be visual-only or use simplified secondary
motion.

Recommended simulation

|**SYSTEM** |**CHOICE**                                                              |**REASON**                                                                |
|-----------|------------------------------------------------------------------------|--------------------------------------------------------------------------|
|Tick       |120 Hz fixed step                                                       |Stable fast puck collision and input feel at a 60 Hz render target.       |
|Puck       |Swept circle                                                            |Prevents tunneling through thin rails at high speed.                      |
|Striker    |Kinematic circle with capped acceleration                               |Direct control while preserving contact velocity.                         |
|Rails      |Line / arc primitives                                                   |Cheap, explicit and easy to author per table.                             |
|Drag       |Very low exponential damping                                            |Long rallies stay alive without infinite speed growth.                    |
|Determinism|Seeded gameplay RNG; simulation deterministic enough per browser session|Supports run seeds / debugging without promising lockstep multiplayer yet.|

Collision intent

On striker contact, resolve penetration, compute the surface normal,
then apply restitution using relative velocity between puck and striker.
Add a strict maximum puck speed and a softer “comfort band” so repeated
heavy impacts cannot destabilize the match. Side rails should retain
more energy than soft bumpers; material is a gameplay variable.

Damage function

A simple first model is: damage = baseGoalDamage × speedFactor ×
puckModifier × strikerModifier × arenaModifier. Clamp speedFactor before
build multiplication, then apply a final per-goal cap. This keeps
balance readable and ensures build effects do not bypass the physical
game.

QA invariant: identical collision conditions should produce nearly
identical rebound angles regardless of render frame rate.

NEUTRAL OBJECT, EVOLVING WEAPON

10 Puck System

The puck begins neutral. Neither side “owns” it in the rules. Builds can
temporarily mark or transform it, but possession should remain a
physical concept: whoever controls the next contact controls the rally.

Puck properties

|**PROPERTY**|**BASE ROLE**                       |**EXAMPLE MOD**                                    |
|------------|------------------------------------|---------------------------------------------------|
|Mass        |Changes impulse exchange            |Heavy core carries more through soft bumpers.      |
|Restitution |Controls liveliness                 |Hot core rebounds harder off side rails.           |
|Drag        |Controls carry / settling           |Ghost core glides longer.                          |
|Size        |Changes interception and lane access|Wide disc is safer but easier to read.             |
|Charge state|Temporary effect channel            |After two bank hits, next goal duplicates the puck.|

Puck evolution rules

• Visual evolution must be obvious but compact: rim emissive, core
pattern, trail length, small orbiting fragments.
• One puck can carry multiple effects if their triggers are distinct and
readable.
• Multi-puck is a build payoff, not a baseline mechanic. Standard cap:
three active pucks.
• If a puck splits, duplicated pucks deal reduced barrier damage unless
a dedicated synergy restores it.
• No status ailments in v1; effects should alter geometry, impact,
duplication, charge or timing.

Example puck modules

|**MODULE**  |**EFFECT**                                                                              |
|------------|----------------------------------------------------------------------------------------|
|Fork Kernel |Every third rail hit spawns a low-damage duplicate.                                     |
|Anchor Core |Higher mass; less deflection from bumpers; slightly slower max speed.                   |
|Glass Needle|High-speed goals deal bonus damage but low-speed goals deal less.                       |
|Echo Ring   |A clean bank shot stores one echo; next striker hit releases a short-lived phantom puck.|

HANDS, NOT SPELLS

11 Striker & Active Ability System

The striker is the player’s most direct build surface. It can change
contact behavior and provide limited active tools, but active abilities
must still point back to the puck or table. There are no direct attacks
on opponents.

Recommended loadout budget

|**SLOT**      |**COUNT**|**ROLE**                                           |
|--------------|---------|---------------------------------------------------|
|Striker frame |1        |Defines base radius, max speed and contact profile.|
|Puck kernel   |1        |Defines puck baseline / core build direction.      |
|Active modules|2 max    |Short tactical actions mapped to mouse/keyboard.   |
|Passive chips |4 max    |Triggers and synergies; no button press.           |
|Arena override|1 max    |Large table interaction, usually rare.             |

This is intentionally smaller than a typical action roguelite inventory.
A fifteen-minute run needs enough decisions to feel different without
requiring the player to inspect ten cooldown icons while tracking a fast
puck.

Active ability families

|**FAMILY**|**EXAMPLE**                                                        |**BOUNDARY**                   |
|----------|-------------------------------------------------------------------|-------------------------------|
|Contact   |Overdrive: 0.5 s higher striker acceleration.                      |Does not auto-aim.             |
|Defense   |Brace: briefly increases your goal-mouth collision radius.         |Cannot fully block the goal.   |
|Puck      |Recall Tap: nudges a slow puck toward center if it is on your half.|No use above a speed threshold.|
|Arena     |Rail Pulse: activates your next powered bumper hit.                |Telegraphed; one lane only.    |

Abilities should create windows for skill, not replace the shot. “Press
button, deal 30 damage” is outside the design.

IMPACT · INTEGRITY · ARENA

12 Circuit Matrix: Run Build System

<img src="media/image2.png" style="width:6.77165in;height:2.99887in" />

Each post-match reward offers three modules drawn from a weighted pool.
The pool is organized into three axes. A build can stay focused or cross
axes to create synergies. The system is presented as a compact circuit
board rather than a long inventory list.

|**AXIS** |**WHAT IT CHANGES**                                        |**DESIGN EXAMPLE**                                    |
|---------|-----------------------------------------------------------|------------------------------------------------------|
|Impact   |puck speed, shot conditions, duplication, bank-shot bonuses|“Second rail before goal” becomes a damage plan.      |
|Integrity|barrier durability, repair, comeback windows               |Cracked glass can power a risky low-HP build.         |
|Arena    |bumper states, temporary rails, destructible geometry      |Break your own side bumper to open a lethal bank lane.|

Reward quality

Use four qualities—Standard, Tuned, Prototype, Illegal—rather than
Common/Rare/Epic/Legendary. Quality controls complexity and power budget
but should not mean “higher number only.” Illegal modules may carry a
meaningful downside or require a demanding trigger.

Synergy rule

Every powerful synergy must be explainable as two or three simple
sentences about puck behavior. Example: Breakable rail → bank hit
charges puck → charged goal creates duplicate → duplicate inherits only
bank-hit modifiers. This keeps buildcraft inspectable and debuggable.

DESTRUCTION WITH PURPOSE

13 Arena & Table System

Tables can change, but destruction should expose new geometry rather
than produce physics debris chaos. A table element has authored states:
intact, damaged and broken/disabled. Visual shards are cosmetic and may
be GPU-instanced or pooled.

|**ELEMENT**   |**STATE CHANGE**           |**GAMEPLAY RESULT**                                  |
|--------------|---------------------------|-----------------------------------------------------|
|Side bumper   |intact → cracked → disabled|Opens a flatter bank angle and removes energy return.|
|Goal shutter  |closed/open cycle          |Temporarily narrows or widens scoring lane.          |
|Center divider|raised → broken            |Creates a new rebound surface, then removes it.      |
|Power rail    |off → armed for one contact|Adds impulse or redirects along a marked normal.     |
|Floor plate   |neutral → shifted          |Moves a rail segment between two authored positions. |

Rules for change

• At most two dynamic table systems in a normal match.
• At most three in a boss match, introduced sequentially.
• Every state has a distinct silhouette and sound cue.
• Geometry transitions occur only at safe moments or use continuous
swept collision.
• Permanent build-driven table edits survive until the end of the run
only if their module says so.

Why this matters

Arena manipulation creates the “more features than the original” layer
without moving the game away from shufflepuck. Instead of adding ranged
weapons or character combat, the build changes the surface on which the
same physical duel happens.

READABLE PERSONALITIES

14 Opponent Framework & AI

Opponent AI should be authored from behavior parameters and small state
machines, not machine learning. The goal is believable personality,
reproducible difficulty and learnable patterns. Each rival is a
combination of physical limits, decision biases, signature shots and one
or two special rules.

|**PARAMETER**      |**EFFECT**                                              |
|-------------------|--------------------------------------------------------|
|Reaction delay     |How long before the AI commits to a predicted intercept.|
|Prediction horizon |How far ahead it estimates puck path and rail bounces.  |
|Aim error          |Angular / positional variance on returns.               |
|Aggression         |How often it meets the puck early vs. waits deep.       |
|Risk bias          |Preference for extreme bank angles and fast contacts.   |
|Recovery discipline|How quickly it returns to goal coverage after attacking.|
|Tell duration      |How long special behavior is telegraphed.               |

Core states

Neutral → Intercept → Strike → Recover forms the base loop. Opponents
add conditional states such as Feint, Charge, Ability or Panic. Panic is
especially useful for personality: one rival becomes reckless at low
glass integrity while another becomes defensive and precise.

Fairness

• The AI may know exact puck state internally, but reaction time and
striker limits must still constrain it.
• Special “cheats” are explicit character abilities with tells and
cooldowns, not hidden input reading.
• Difficulty increases first by better anticipation and shot selection,
then by rule-bending abilities.
• Never let an opponent return physically impossible shots merely
because the difficulty value is high.

MORE RIVALS PER ARENA

15 Opponent Roster & Archetypes

Each district should contain multiple rivals so the place develops a
social identity. Opponents can share the same underlying AI framework
while feeling distinct through parameters, animation, dialogue, table
preference and one signature behavior.

|**RIVAL**         |**DISTRICT**|**PLAY STYLE**        |**SIGNATURE**                              |
|------------------|------------|----------------------|-------------------------------------------|
|Mara “Latch” Venn |Cinder Row  |patient hustler       |waits deep, punishes rushed center shots   |
|Kilo-7            |Cinder Row  |obsolete service bot  |predictable cadence, sudden max-speed burst|
|Sable Quay        |Cinder Row  |show-off courier      |loves double banks and open angles         |
|Iris Vale         |Axiom Spire |clinical champion     |low error, conservative geometry           |
|Compliance Unit 12|Axiom Spire |corporate trainer AI  |adapts between two declared modes          |
|Dr. Kest          |Axiom Spire |biomech researcher    |uses a temporary goal shutter              |
|Rook Harker       |Bastion Yard|heavy operator        |slow striker, huge contact velocity        |
|Picket            |Bastion Yard|security drone        |fast recovery, weak offense                |
|Hexa              |Ghostline   |stylized avatar       |short phase-wall feints                    |
|Murmur            |Ghostline   |fragmented net persona|uses delayed echo puck once per rally      |

Character readability

A rival’s portrait, idle pose and first line should hint at play style.
The player should eventually recognize “she overcommits on the left
rail” as strongly as they recognize a named ability. This is the modern
continuation of the original game’s personality-first opponents.

Roster principle: one memorable rule is better than five tiny stat
differences.

RULE BREAKERS, NOT GENRE CHANGERS

16 Boss Design

Every district ends with a boss. A boss may bend one or two core rules,
but the player still wins through puck control, interception and
exploiting readable patterns. Phase changes are tied to barrier crack
thresholds so the visual health state and encounter structure reinforce
each other.

|**BOSS**         |**DISTRICT**|**PHASE IDEA**                                                                                   |
|-----------------|------------|-------------------------------------------------------------------------------------------------|
|Old Saint        |Cinder Row  |At 60% integrity, drops one side bumper; at 30%, starts a telegraphed “dead-hand” delayed strike.|
|Director Nera Sol|Axiom Spire |Switches between precision and compliance modes; a moving glass partition changes one bank lane. |
|Marshal Brakk    |Bastion Yard|Armored shutters narrow goals in alternating windows; his striker hits hard but recovers slowly. |
|The Pale Index   |Ghostline   |Rewrites one table rule per phase: phase wall → mirrored rail → one echo puck.                   |

Boss constraints

• 2–3 minute target duration in an average successful run.
• Maximum two phase transitions in v1.
• Phase change never occurs during an unresolved high-speed goal
approach.
• Boss powers have distinct anticipation poses / UI glyphs / audio
stingers.
• No screen-filling projectile attacks or direct avatar damage.

Glass as climax

Boss glass should be visually richer than standard panels: larger crack
propagation, embedded signage that flickers as it fails, and a final
shatter with a brief audio vacuum before debris sound returns. The
spectacle belongs at the end of the table, where the player is already
looking.

MINIMAL ROUTE STRATEGY

17 Branching Map & Reward Choice

The run map is deliberately small. It should take one glance to
understand. Each tier presents two opponent nodes connected from the
current node. The boss is always visible at the far end so the player
can route toward a build that may answer that boss.

|**NODE DATA** |**VISIBLE BEFORE CHOICE**                        |
|--------------|-------------------------------------------------|
|Opponent      |Portrait / silhouette + name.                    |
|Threat        |1–3 bars based on AI and table modifier.         |
|Table modifier|One icon with a short plain-language description.|
|Reward focus  |Impact / Integrity / Arena / wildcard.           |
|Contract type |BREAK or rare SURVIVE.                           |

Risk and reward

A harder node guarantees a better reward roll rather than an abstract
currency bonus. Example: normal node offers Standard/Tuned-heavy
choices; high-risk node guarantees at least one Prototype candidate.
This makes risk immediately relevant to the current build and avoids
adding an economy.

Procedural generation

Randomize district, opponent order, node pairings and reward offerings
under authored constraints. Do not procedurally generate arbitrary table
geometry in v1. Tables and modifier combinations should be tested
objects; procedural recombination is enough to create variety while
preserving physical fairness.

The map is a decision surface, not a content layer. If route choice
takes longer than the reward screen, it is too complicated.

PERMANENT BREADTH, NOT GRIND

18 Meta-Progression & Hub

Between runs the player returns to a stylized hub interface representing
a back room / terminal in the underground circuit. There is no
free-roaming 3D hub in v1. This protects scope and keeps the arcade
rhythm intact.

Permanent unlocks

|**TYPE**         |**PERSISTS**               |**POWER PHILOSOPHY**                                |
|-----------------|---------------------------|----------------------------------------------------|
|Striker frames   |Yes                        |Sidegrades with different feel.                     |
|Puck kernels     |Yes                        |Open new build directions.                          |
|Run modules      |Yes, as reward-pool unlocks|Increase possibility space, not guaranteed strength.|
|District access  |Yes                        |Content progression.                                |
|Opponent records |Yes                        |Lore, stats, best results, learned tells.           |
|Story fragments  |Yes                        |Character / world depth.                            |
|Raw +damage / +HP|No by default              |Avoid making grind stronger than execution.         |

Unlock cadence

Early runs should unlock something frequently enough to promise
discovery, but after the initial onboarding the game should shift toward
mastery and route choice rather than a constant shower of content. A
clean rule is one meaningful unlock after a new opponent, boss threshold
or achievement—not after every generic loss.

One playable character

v1 uses one protagonist / player identity. Build differentiation comes
from equipment and modules. Additional playable characters are a later
expansion lever only if they justify different input or core physics
rather than merely another passive bonus.

SHORT LINES, REAL DEPTH

19 Narrative & Dialogue Structure

Story appears around duels rather than as long cutscenes. Opponents
speak before a match, at a crack threshold, after an unusual rally and
after the result. Most exchanges are one or two lines. The long-term
story is assembled from recurring rivals, district politics and unlocked
records.

|**MOMENT**    |**TARGET**             |**RULE**                                          |
|--------------|-----------------------|--------------------------------------------------|
|First meeting |2–4 lines              |Establish person + stake + one hint of play style.|
|Rematch       |1–2 lines              |Acknowledge history or prior defeat.              |
|Mid-match bark|≤ 1 short line         |Never blocks control or covers important sound.   |
|Boss intro    |10–20 s max            |Can use authored camera beat.                     |
|Run end       |1–3 lines + result card|Immediate restart remains available.              |

Tone model

Dialogue can oscillate between absurdist cyberpunk detail and genuine
human stakes. A corporate champion may quote wellness compliance
language while visibly exhausted; a broken service robot may treat
league statistics as sacred memory; a fixer can be funny about
sponsorship contracts and deadly serious about who disappears from the
circuit.

Run ending

A loss does not need a resurrection explanation. The result card says
the night, contract or story ended here. The hub remembers discovered
information and permanent unlocks. The next run is another attempt
through the city, not necessarily a literal canonical retry of every
event.

AMIGA SOUL, MODERN EXECUTION

20 Art Direction

<img src="media/image3.jpg" style="width:3.66142in;height:2.54121in" />

User-provided visual reference: classic end-of-table composition.
Reference only; production art remains original.

The target is not modern realistic 3D and not a literal pixel-perfect
remake. Think of a lost Amiga-era visual grammar reconstructed with
modern rendering: strong silhouettes, sparse geometry, flat or quantized
materials, low-resolution character animation and selective lighting
depth.

|**LAYER**   |**DIRECTION**                                                                                                       |
|------------|--------------------------------------------------------------------------------------------------------------------|
|Table / room|Simple 3D geometry, authored materials, limited dynamic lighting.                                                   |
|Opponents   |2D sprite / billboard characters with high-quality frame animation and expressive poses.                            |
|Resolution  |Render the playfield to a modest internal resolution, nearest-neighbor upscale; keep UI crisp at display resolution.|
|Post FX     |Subtle palette quantization / dithering; optional faint scanline. Avoid heavy chromatic aberration.                 |
|Color       |District-specific: dark/dirty, clean corporate, colorful nightlife, abstract cyberspace.                            |
|Effects     |Short, functional impact sparks, crack propagation, controlled trails.                                              |

Character animation

Opponents should visibly react: lean into a shot, recoil, tap the table,
laugh, freeze after a close miss, or show a signature tell before
abilities. These animations are more valuable than polygon count because
the rival is the emotional center of the far end of the table.

RETRO-CLEAN, MINIMAL HUD

21 UI / UX

The interface should feel like a future interpretation of an old
computer game: compact typography, clear borders, limited ornament and
no permanent wall of stats. The player’s eyes belong on the puck.

In-match HUD

|**ELEMENT**      |**PRESENTATION**                                                            |
|-----------------|----------------------------------------------------------------------------|
|Barrier integrity|Primarily diegetic cracks; small numeric value optional near goal frame.    |
|Opponent name    |Upper-left / upper-center compact label with one personality icon.          |
|Active modules   |Two small cooldown glyphs at lower edge.                                    |
|Puck state       |One compact icon cluster only when the puck has a non-obvious charged state.|
|Score / goals    |Not necessary if barrier integrity is the win condition.                    |
|Boss phase       |No phase bar; glass and table transformation communicate it.                |

Reward screen

Three cards, each readable in under five seconds: name, one-line effect,
axis icon, quality and one highlighted synergy tag if relevant. Avoid
lore paragraphs on the decision screen; details can live in the archive.

Accessibility

• Adjustable striker sensitivity and max cursor capture behavior.
• High-contrast puck option and reduced screen-shake toggle.
• No essential information conveyed only by color; crack stage and icons
carry shape differences.
• Pause-safe single-player play; dialogue can be advanced manually.
• Optional keyboard movement fallback and aim reticle visibility.

THE PUCK MUST SOUND EXPENSIVE

22 Audio Direction

Audio can borrow the density and material confidence of modern cyberpunk
games while remaining original. Each district gets its own musical
palette, but the table transient is the most important recurring sound
in the game.

|**LAYER**     |**DIRECTION**                                                                                 |
|--------------|----------------------------------------------------------------------------------------------|
|Puck ↔ striker|Sharp, layered “clack” with body, transient and material tail; variation by impact speed.     |
|Puck ↔ rail   |Different material sets for wood, polymer, metal, glass-like energy surfaces.                 |
|Barrier cracks|Progressively lower, larger fracture events as integrity falls.                               |
|Final shatter |Strong transient → brief ducking / near-silence → debris tail.                                |
|Music         |District-specific: industrial electro, restrained synth, breakbeat, granular digital ambience.|
|Opponent voice|Text-first in v1; optional short vocalizations / filtered barks, no full VO requirement.      |

Mix priorities

1. Puck contact and goal feedback.
2. Boss / table mechanic telegraphs.
3. Barrier crack stage.
4. Music and ambience.
5. Background crowd and decorative world audio.

No dynamic music system is required for v1. Simple authored loops plus a
boss layer and result stingers are enough. Reserve more complex
rally-reactive music for a later pass after physical audio is
satisfying.

THREE.JS BROWSER BUILD

23 Technical Architecture

<img src="media/image4.png" style="width:6.77165in;height:3.48256in" />

|**AREA**        |**CHOICE**                                                                                             |
|----------------|-------------------------------------------------------------------------------------------------------|
|Language / build|TypeScript + Vite.                                                                                     |
|Rendering       |Three.js WebGL2 baseline.                                                                              |
|Core physics    |Custom 2D fixed-step simulation; do not use Rapier for puck gameplay.                                  |
|State           |Small explicit stores / state machines; Zustand is reasonable for app/meta state, not per-tick physics.|
|Audio           |Native Web Audio API first; Howler only if asset management needs justify it.                          |
|Persistence     |LocalStorage / IndexedDB for prototype; versioned save schema.                                         |
|Tests           |Vitest for deterministic math, collision and reward generation; Playwright later for smoke flows.      |

Scene split

Keep simulation coordinates in a flat gameplay plane independent from
Three.js world transforms. Rendering reads a snapshot/interpolated
state; it does not own truth. This makes collision tests fast, AI
prediction straightforward and future replay/seed work practical.

Libraries intentionally not required

An ECS, general physics engine, animation framework and shader stack are
not necessary for v0.1. Add a dependency only when it deletes meaningful
code or solves a proven performance/content problem. The game has few
high-value entities; explicit systems are easier to debug.

PROTOTYPE FIRST

24 Scope, Performance & Quality Gates

v0.1 — isolated puck prototype

|**MUST HAVE**         |**ACCEPTANCE GATE**                                  |
|----------------------|-----------------------------------------------------|
|One playable table    |Correct wall / goal geometry; no visible tunneling.  |
|Mouse striker         |Responsive, capped acceleration; stable at 60 FPS.   |
|One opponent AI       |Can defend, attack and intentionally miss sometimes. |
|Barrier glass         |Crack stages + final shatter tied to integrity.      |
|Velocity damage       |Fast clean goals are measurably stronger.            |
|Basic audio           |Distinct striker, rail, goal and glass sounds.       |
|One visual style slice|Enough to prove classic perspective + cyberpunk mood.|

v1 target content envelope

Target four districts, about twelve regular rivals, four bosses, one
playable character, roughly thirty run modules, four striker frames,
four puck kernels, a minimal branching run map, permanent unlock pool,
local run history, achievements and leaderboards. These are design
targets, not a schedule commitment.

Performance budgets

|**BUDGET**           |**TARGET**                                               |
|---------------------|---------------------------------------------------------|
|Frame rate           |60 FPS on low-end integrated-GPU desktop browsers.       |
|Simulation           |120 Hz fixed step; < 2 ms average on target hardware.    |
|Draw calls           |Prefer < 150 in normal duel; instance decorative repeats.|
|Active dynamic lights|0–3 important lights; bake / fake the rest.              |
|Puck count           |≤ 3 standard gameplay.                                   |
|Particles            |Pooled, short-lived; no CPU-heavy debris rigid bodies.   |

Quality assurance

Automate collision regression tests for canonical bank angles, striker
impacts at multiple velocities, goal crossings and rail-state changes.
Record seeded bot-vs-bot matches to catch physics changes. Manual QA
should focus on “did I understand why that goal happened?” more than raw
bug counts; readability is a product quality metric.

DECISION REGISTER

25 Risks, Success Criteria & Assumptions

Primary design risks

|**RISK**                               |**MITIGATION**                                                         |
|---------------------------------------|-----------------------------------------------------------------------|
|Roguelite layer overwhelms classic feel|Do not build run systems until v0.1 duel is fun without upgrades.      |
|Physics feels inconsistent             |Fixed-step 2D, swept collisions, automated rebound tests.              |
|Multi-puck becomes noise               |Cap at three; reduce duplicate damage; strong visual identity per puck.|
|Opponent AI feels unfair               |Visible reaction limits, tells, authored “cheats.”                     |
|Solo content scope explodes            |Four districts for v1; sprite rivals; reused system primitives.        |
|Cyberpunk influence becomes derivative |Original city, factions, silhouettes, names, logos, music and dialogue.|

Success criteria

• A first-time player can return the puck within seconds without
tutorial text.
• After ten minutes, a skilled player can deliberately create bank shots
and pace changes.
• Two opponents with the same table still feel meaningfully different.
• A build can change preferred shot geometry without making manual skill
irrelevant.
• The barrier’s visual condition communicates danger before the HUD is
read.
• On target low-end hardware, frame pacing remains stable during glass
shatter and multi-puck moments.
• After a loss, restart-to-first-route-choice is fast enough to support
“one more run.”

Decisions intentionally deferred

Final game title; exact four launch districts; final protagonist
identity; online leaderboard provider; whether replay ghosts or daily
seeded runs arrive in v1 or later. None of these block v0.1 physics and
feel work.

Working assumptions

• Browser desktop is the primary target; mobile is not a v1 requirement.
• Mouse + keyboard is primary; gamepad can be evaluated after core feel
is proven.
• The game is an original IP; third-party cyberpunk names are reference
shorthand only.
• No economy, shop layer, full roaming hub or status-effect system in
v1.
• Skill remains the dominant long-term power source; meta unlocks expand
options rather than raw stats.
• Multiplayer is not in scope, but deterministic-ish simulation keeps
the door open for future exploration.

Next document after this GDD: a vertical-slice development plan that
turns v0.1 into ordered technical milestones, test gates and
implementation tasks. It should be derived only after the isolated duel
has a signed-off feel target.
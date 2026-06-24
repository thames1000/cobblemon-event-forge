# Safari Catch Boost

A tiny **Fabric** companion mod for **Cobblemon (Minecraft 1.21.1)**. It boosts the
Poké Ball catch rate inside your Safari Zone arena dimension(s).

## Why this exists
Cobblemon defines the Safari Ball's catch multiplier in **code** (a Kotlin lambda
referenced by object), not as datapack data — so the Event Forge Safari datapack
*can't* change it, and KubeJS has no Fabric build for 1.21.1. This mod is the only
clean way to get a real in-zone catch boost on Fabric 1.21.1.

It works by subscribing to Cobblemon's own `POKEMON_CATCH_RATE` event and multiplying
`catchRate` when the target Pokémon is standing in one of your configured zone
dimensions. No Mixins, no reflection — just the public Cobblemon event API.

## How it stacks
The boost multiplies the catch rate **on top of** the Safari Ball's native modifier
and the normal out-of-battle factors. So `multiplier: 3.0` with a Safari Ball ≈ a
strong, noticeable bump even after the out-of-battle penalty you were seeing.

---

## Build

You need the JDK 21 and Gradle (or just open the folder in IntelliJ IDEA with the
**Minecraft Development** plugin, which handles Gradle for you).

1. **Copy your server's Cobblemon jar** from `mods/` into this project's `libs/`
   folder (e.g. `libs/cobblemon-fabric-1.6.1.jar`).
2. **Edit `gradle.properties`** and confirm these match your server (check the
   startup log or the `mods/` folder):
   - `cobblemon_jar` — the exact filename you just copied into `libs/`
   - `loader_version` — your Fabric **Loader** version
   - `fabric_version` — your **Fabric API** version (jar is `fabric-api-<this>.jar`)
   - `fabric_kotlin_version` — your **fabric-language-kotlin** version
3. **Build:**
   ```bash
   # if you have the gradle wrapper jar:
   ./gradlew build
   # otherwise, with a system Gradle 8.10+:
   gradle wrapper && ./gradlew build
   ```
4. The mod jar lands in `build/libs/safari-catch-boost-1.0.0.jar`.

## Install (server)

Drop these into the server's `mods/` folder (Cobblemon is already there):
- `safari-catch-boost-<version>.jar` (this mod)
- `fabric-language-kotlin-<version>.jar` — **required**, download from Modrinth/CurseForge
  if it isn't already installed.

Restart the server. On first launch the mod writes `config/safari_catch_boost.json`.

## Configure

Edit `config/safari_catch_boost.json` and restart (or it's read on each server start):

```json
{
  "multiplier": 3.0,
  "onlySafariBall": true,
  "dimensions": ["safari_zone:zone"],
  "debug": false
}
```

- **`multiplier`** — how much to scale the catch rate inside a zone.
- **`onlySafariBall`** — `true` boosts only Safari Balls (recommended; stops players
  cheesing the zone with Master Balls). `false` boosts every ball.
- **`dimensions`** — the arena dimension id(s) to boost in. The Event Forge Safari
  generator uses a **fixed identity** for every theme, so this is **always
  `"safari_zone:zone"`** — set it once and never touch it again, regardless of which
  Safari theme you generate. (Every Safari pack is named `safari_zone.zip` and shares
  the `safari_zone` namespace, so you run one at a time, swapping the zip to change
  themes; the default above already targets it.)
- **`debug`** — log each boosted throw (`catchRate before -> after`) to verify it's firing.

## Verify it's working

1. With `debug: true`, enter the zone, throw a Safari Ball, and watch the server
   console for a `[SafariCatchBoost] ... catchRate X -> Y` line.
2. Throw the same ball at the same species **outside** the zone — no log line, normal rate.

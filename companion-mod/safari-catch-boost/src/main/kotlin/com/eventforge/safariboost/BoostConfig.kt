package com.eventforge.safariboost

import com.google.gson.GsonBuilder
import net.fabricmc.loader.api.FabricLoader
import org.slf4j.LoggerFactory
import java.nio.file.Files

/**
 * config/safari_catch_boost.json — written with defaults on first run.
 *
 *   multiplier      how much to scale the catch rate inside a zone (stacks on top
 *                   of the Safari Ball's native modifier). 3.0 ≈ a strong boost.
 *   onlySafariBall  when true, only Safari Balls get the boost; other balls are
 *                   left alone (keeps Master Balls etc. from trivialising the zone).
 *   dimensions      the arena dimension ids to boost in, e.g. "haunted_safari:zone".
 *                   This must match the datapack namespace the Safari Forge used.
 *   debug           log every boosted throw (rate before -> after).
 */
data class BoostConfig(
    val multiplier: Float = 3.0f,
    val onlySafariBall: Boolean = true,
    val dimensions: List<String> = listOf("safari:zone"),
    val debug: Boolean = false,
) {
    companion object {
        private val LOGGER = LoggerFactory.getLogger("SafariCatchBoost")
        private val GSON = GsonBuilder().setPrettyPrinting().create()
        private const val FILE_NAME = "safari_catch_boost.json"

        fun load(): BoostConfig {
            val path = FabricLoader.getInstance().configDir.resolve(FILE_NAME)
            return try {
                if (Files.exists(path)) {
                    val raw = Files.newBufferedReader(path).use { GSON.fromJson(it, BoostConfig::class.java) }
                        ?: BoostConfig()
                    raw.normalized()
                } else {
                    val def = BoostConfig()
                    Files.writeString(path, GSON.toJson(def))
                    LOGGER.info("[SafariCatchBoost] wrote default config to {}", path)
                    def
                }
            } catch (e: Exception) {
                LOGGER.error("[SafariCatchBoost] failed to read {} — using defaults", FILE_NAME, e)
                BoostConfig()
            }
        }

        /** Gson can leave fields null/zero if a user deletes a key — guard against that. */
        @Suppress("SENSELESS_COMPARISON") // dimensions can be null when Gson omits the key
        private fun BoostConfig.normalized(): BoostConfig = copy(
            multiplier = if (multiplier > 0f) multiplier else 3.0f,
            dimensions = dimensions ?: emptyList(),
        )
    }
}

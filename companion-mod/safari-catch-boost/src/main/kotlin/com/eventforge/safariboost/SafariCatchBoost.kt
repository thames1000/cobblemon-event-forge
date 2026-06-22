package com.eventforge.safariboost

import com.cobblemon.mod.common.api.events.CobblemonEvents
import net.fabricmc.api.ModInitializer
import org.slf4j.LoggerFactory

/**
 * Safari Catch Boost — a tiny Cobblemon companion mod.
 *
 * Cobblemon defines the Safari Ball's catch multiplier in code (a Kotlin lambda,
 * not a datapack value), so the Event Forge datapack can't change it. This mod
 * fills that gap: it subscribes to Cobblemon's POKEMON_CATCH_RATE event and
 * multiplies the catch rate whenever a Poké Ball is thrown at a Pokémon standing
 * in one of the Safari Zone arena dimensions (e.g. "<namespace>:zone").
 *
 * Everything is data-driven via config/safari_catch_boost.json — no recompiling
 * to change the multiplier, the dimensions, or the Safari-Ball-only restriction.
 */
object SafariCatchBoost : ModInitializer {
    const val MOD_ID = "safari_catch_boost"
    private val LOGGER = LoggerFactory.getLogger("SafariCatchBoost")

    /** The native Cobblemon Safari Ball id (cobblemon:safari_ball). */
    private const val SAFARI_BALL_NAMESPACE = "cobblemon"
    private const val SAFARI_BALL_PATH = "safari_ball"

    override fun onInitialize() {
        val config = BoostConfig.load()
        LOGGER.info(
            "[SafariCatchBoost] active — x{} in {} (safariBallOnly={})",
            config.multiplier, config.dimensions, config.onlySafariBall
        )
        if (config.dimensions.isEmpty()) {
            LOGGER.warn("[SafariCatchBoost] no dimensions configured — the boost will never trigger. Edit config/safari_catch_boost.json.")
        }

        // EventObservable.subscribe uses Priority.NORMAL by default; the trailing
        // lambda gets the event. catchRate is a mutable var on the event.
        CobblemonEvents.POKEMON_CATCH_RATE.subscribe { event ->
            val dimId = event.pokemonEntity.level().dimension().location().toString()
            if (dimId !in config.dimensions) return@subscribe

            if (config.onlySafariBall) {
                val ball = event.pokeBallEntity.pokeBall.name
                if (ball.namespace != SAFARI_BALL_NAMESPACE || ball.path != SAFARI_BALL_PATH) return@subscribe
            }

            val before = event.catchRate
            event.catchRate = before * config.multiplier
            if (config.debug) {
                LOGGER.info("[SafariCatchBoost] {}: catchRate {} -> {}", dimId, before, event.catchRate)
            }
        }
    }
}

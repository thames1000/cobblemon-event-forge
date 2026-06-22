// AUTO-SOURCED from vanilla 1.21.1 biome definitions (misode/mcmeta, 1.21.1-data).
// Each value is the vanilla biome JSON with `spawners`/`spawn_costs` removed. The
// safari generator copies this "look" (effects, features, carvers, climate) into the
// exclusive arena biome and adds EMPTY spawners, so the arena looks like the vanilla
// biome (trees, fog, grass colour) but spawns no vanilla mobs — only the selected
// Pokemon, conditioned to that biome. Regenerate by re-fetching from mcmeta.
// NOTE: ground/surface blocks come from the dimension's noise-settings surface rules
// (keyed to vanilla biome ids), so a custom biome keeps a grass/dirt floor even for
// badlands/peaks — colours + vegetation match, the surface does not.

export const BIOME_LOOKS: Record<string, Record<string, unknown>> = {
  "minecraft:dark_forest": {
    "carvers": {
      "air": [
        "minecraft:cave",
        "minecraft:cave_extra_underground",
        "minecraft:canyon"
      ]
    },
    "downfall": 0.8,
    "effects": {
      "fog_color": 12638463,
      "grass_color_modifier": "dark_forest",
      "mood_sound": {
        "block_search_extent": 8,
        "offset": 2.0,
        "sound": "minecraft:ambient.cave",
        "tick_delay": 6000
      },
      "music": {
        "max_delay": 24000,
        "min_delay": 12000,
        "replace_current_music": false,
        "sound": "minecraft:music.overworld.forest"
      },
      "sky_color": 7972607,
      "water_color": 4159204,
      "water_fog_color": 329011
    },
    "features": [
      [],
      [
        "minecraft:lake_lava_underground",
        "minecraft:lake_lava_surface"
      ],
      [
        "minecraft:amethyst_geode"
      ],
      [
        "minecraft:monster_room",
        "minecraft:monster_room_deep"
      ],
      [],
      [],
      [
        "minecraft:ore_dirt",
        "minecraft:ore_gravel",
        "minecraft:ore_granite_upper",
        "minecraft:ore_granite_lower",
        "minecraft:ore_diorite_upper",
        "minecraft:ore_diorite_lower",
        "minecraft:ore_andesite_upper",
        "minecraft:ore_andesite_lower",
        "minecraft:ore_tuff",
        "minecraft:ore_coal_upper",
        "minecraft:ore_coal_lower",
        "minecraft:ore_iron_upper",
        "minecraft:ore_iron_middle",
        "minecraft:ore_iron_small",
        "minecraft:ore_gold",
        "minecraft:ore_gold_lower",
        "minecraft:ore_redstone",
        "minecraft:ore_redstone_lower",
        "minecraft:ore_diamond",
        "minecraft:ore_diamond_medium",
        "minecraft:ore_diamond_large",
        "minecraft:ore_diamond_buried",
        "minecraft:ore_lapis",
        "minecraft:ore_lapis_buried",
        "minecraft:ore_copper",
        "minecraft:underwater_magma",
        "minecraft:disk_sand",
        "minecraft:disk_clay",
        "minecraft:disk_gravel"
      ],
      [],
      [
        "minecraft:spring_water",
        "minecraft:spring_lava"
      ],
      [
        "minecraft:glow_lichen",
        "minecraft:dark_forest_vegetation",
        "minecraft:forest_flowers",
        "minecraft:flower_default",
        "minecraft:patch_grass_forest",
        "minecraft:brown_mushroom_normal",
        "minecraft:red_mushroom_normal",
        "minecraft:patch_sugar_cane",
        "minecraft:patch_pumpkin"
      ],
      [
        "minecraft:freeze_top_layer"
      ]
    ],
    "has_precipitation": true,
    "temperature": 0.7
  },
  "minecraft:plains": {
    "carvers": {
      "air": [
        "minecraft:cave",
        "minecraft:cave_extra_underground",
        "minecraft:canyon"
      ]
    },
    "downfall": 0.4,
    "effects": {
      "fog_color": 12638463,
      "mood_sound": {
        "block_search_extent": 8,
        "offset": 2.0,
        "sound": "minecraft:ambient.cave",
        "tick_delay": 6000
      },
      "sky_color": 7907327,
      "water_color": 4159204,
      "water_fog_color": 329011
    },
    "features": [
      [],
      [
        "minecraft:lake_lava_underground",
        "minecraft:lake_lava_surface"
      ],
      [
        "minecraft:amethyst_geode"
      ],
      [
        "minecraft:monster_room",
        "minecraft:monster_room_deep"
      ],
      [],
      [],
      [
        "minecraft:ore_dirt",
        "minecraft:ore_gravel",
        "minecraft:ore_granite_upper",
        "minecraft:ore_granite_lower",
        "minecraft:ore_diorite_upper",
        "minecraft:ore_diorite_lower",
        "minecraft:ore_andesite_upper",
        "minecraft:ore_andesite_lower",
        "minecraft:ore_tuff",
        "minecraft:ore_coal_upper",
        "minecraft:ore_coal_lower",
        "minecraft:ore_iron_upper",
        "minecraft:ore_iron_middle",
        "minecraft:ore_iron_small",
        "minecraft:ore_gold",
        "minecraft:ore_gold_lower",
        "minecraft:ore_redstone",
        "minecraft:ore_redstone_lower",
        "minecraft:ore_diamond",
        "minecraft:ore_diamond_medium",
        "minecraft:ore_diamond_large",
        "minecraft:ore_diamond_buried",
        "minecraft:ore_lapis",
        "minecraft:ore_lapis_buried",
        "minecraft:ore_copper",
        "minecraft:underwater_magma",
        "minecraft:disk_sand",
        "minecraft:disk_clay",
        "minecraft:disk_gravel"
      ],
      [],
      [
        "minecraft:spring_water",
        "minecraft:spring_lava"
      ],
      [
        "minecraft:glow_lichen",
        "minecraft:patch_tall_grass_2",
        "minecraft:trees_plains",
        "minecraft:flower_plains",
        "minecraft:patch_grass_plain",
        "minecraft:brown_mushroom_normal",
        "minecraft:red_mushroom_normal",
        "minecraft:patch_sugar_cane",
        "minecraft:patch_pumpkin"
      ],
      [
        "minecraft:freeze_top_layer"
      ]
    ],
    "has_precipitation": true,
    "temperature": 0.8
  },
  "minecraft:jungle": {
    "carvers": {
      "air": [
        "minecraft:cave",
        "minecraft:cave_extra_underground",
        "minecraft:canyon"
      ]
    },
    "downfall": 0.9,
    "effects": {
      "fog_color": 12638463,
      "mood_sound": {
        "block_search_extent": 8,
        "offset": 2.0,
        "sound": "minecraft:ambient.cave",
        "tick_delay": 6000
      },
      "music": {
        "max_delay": 24000,
        "min_delay": 12000,
        "replace_current_music": false,
        "sound": "minecraft:music.overworld.jungle"
      },
      "sky_color": 7842047,
      "water_color": 4159204,
      "water_fog_color": 329011
    },
    "features": [
      [],
      [
        "minecraft:lake_lava_underground",
        "minecraft:lake_lava_surface"
      ],
      [
        "minecraft:amethyst_geode"
      ],
      [
        "minecraft:monster_room",
        "minecraft:monster_room_deep"
      ],
      [],
      [],
      [
        "minecraft:ore_dirt",
        "minecraft:ore_gravel",
        "minecraft:ore_granite_upper",
        "minecraft:ore_granite_lower",
        "minecraft:ore_diorite_upper",
        "minecraft:ore_diorite_lower",
        "minecraft:ore_andesite_upper",
        "minecraft:ore_andesite_lower",
        "minecraft:ore_tuff",
        "minecraft:ore_coal_upper",
        "minecraft:ore_coal_lower",
        "minecraft:ore_iron_upper",
        "minecraft:ore_iron_middle",
        "minecraft:ore_iron_small",
        "minecraft:ore_gold",
        "minecraft:ore_gold_lower",
        "minecraft:ore_redstone",
        "minecraft:ore_redstone_lower",
        "minecraft:ore_diamond",
        "minecraft:ore_diamond_medium",
        "minecraft:ore_diamond_large",
        "minecraft:ore_diamond_buried",
        "minecraft:ore_lapis",
        "minecraft:ore_lapis_buried",
        "minecraft:ore_copper",
        "minecraft:underwater_magma",
        "minecraft:disk_sand",
        "minecraft:disk_clay",
        "minecraft:disk_gravel"
      ],
      [],
      [
        "minecraft:spring_water",
        "minecraft:spring_lava"
      ],
      [
        "minecraft:glow_lichen",
        "minecraft:bamboo_light",
        "minecraft:trees_jungle",
        "minecraft:flower_warm",
        "minecraft:patch_grass_jungle",
        "minecraft:brown_mushroom_normal",
        "minecraft:red_mushroom_normal",
        "minecraft:patch_sugar_cane",
        "minecraft:patch_pumpkin",
        "minecraft:vines",
        "minecraft:patch_melon"
      ],
      [
        "minecraft:freeze_top_layer"
      ]
    ],
    "has_precipitation": true,
    "temperature": 0.95
  },
  "minecraft:badlands": {
    "carvers": {
      "air": [
        "minecraft:cave",
        "minecraft:cave_extra_underground",
        "minecraft:canyon"
      ]
    },
    "creature_spawn_probability": 0.03,
    "downfall": 0.0,
    "effects": {
      "fog_color": 12638463,
      "foliage_color": 10387789,
      "grass_color": 9470285,
      "mood_sound": {
        "block_search_extent": 8,
        "offset": 2.0,
        "sound": "minecraft:ambient.cave",
        "tick_delay": 6000
      },
      "music": {
        "max_delay": 24000,
        "min_delay": 12000,
        "replace_current_music": false,
        "sound": "minecraft:music.overworld.badlands"
      },
      "sky_color": 7254527,
      "water_color": 4159204,
      "water_fog_color": 329011
    },
    "features": [
      [],
      [
        "minecraft:lake_lava_underground",
        "minecraft:lake_lava_surface"
      ],
      [
        "minecraft:amethyst_geode"
      ],
      [
        "minecraft:monster_room",
        "minecraft:monster_room_deep"
      ],
      [],
      [],
      [
        "minecraft:ore_dirt",
        "minecraft:ore_gravel",
        "minecraft:ore_granite_upper",
        "minecraft:ore_granite_lower",
        "minecraft:ore_diorite_upper",
        "minecraft:ore_diorite_lower",
        "minecraft:ore_andesite_upper",
        "minecraft:ore_andesite_lower",
        "minecraft:ore_tuff",
        "minecraft:ore_coal_upper",
        "minecraft:ore_coal_lower",
        "minecraft:ore_iron_upper",
        "minecraft:ore_iron_middle",
        "minecraft:ore_iron_small",
        "minecraft:ore_gold",
        "minecraft:ore_gold_lower",
        "minecraft:ore_redstone",
        "minecraft:ore_redstone_lower",
        "minecraft:ore_diamond",
        "minecraft:ore_diamond_medium",
        "minecraft:ore_diamond_large",
        "minecraft:ore_diamond_buried",
        "minecraft:ore_lapis",
        "minecraft:ore_lapis_buried",
        "minecraft:ore_copper",
        "minecraft:underwater_magma",
        "minecraft:ore_gold_extra",
        "minecraft:disk_sand",
        "minecraft:disk_clay",
        "minecraft:disk_gravel"
      ],
      [],
      [
        "minecraft:spring_water",
        "minecraft:spring_lava"
      ],
      [
        "minecraft:glow_lichen",
        "minecraft:patch_grass_badlands",
        "minecraft:patch_dead_bush_badlands",
        "minecraft:brown_mushroom_normal",
        "minecraft:red_mushroom_normal",
        "minecraft:patch_sugar_cane_badlands",
        "minecraft:patch_pumpkin",
        "minecraft:patch_cactus_decorated"
      ],
      [
        "minecraft:freeze_top_layer"
      ]
    ],
    "has_precipitation": false,
    "temperature": 2.0
  },
  "minecraft:eroded_badlands": {
    "carvers": {
      "air": [
        "minecraft:cave",
        "minecraft:cave_extra_underground",
        "minecraft:canyon"
      ]
    },
    "creature_spawn_probability": 0.03,
    "downfall": 0.0,
    "effects": {
      "fog_color": 12638463,
      "foliage_color": 10387789,
      "grass_color": 9470285,
      "mood_sound": {
        "block_search_extent": 8,
        "offset": 2.0,
        "sound": "minecraft:ambient.cave",
        "tick_delay": 6000
      },
      "music": {
        "max_delay": 24000,
        "min_delay": 12000,
        "replace_current_music": false,
        "sound": "minecraft:music.overworld.badlands"
      },
      "sky_color": 7254527,
      "water_color": 4159204,
      "water_fog_color": 329011
    },
    "features": [
      [],
      [
        "minecraft:lake_lava_underground",
        "minecraft:lake_lava_surface"
      ],
      [
        "minecraft:amethyst_geode"
      ],
      [
        "minecraft:monster_room",
        "minecraft:monster_room_deep"
      ],
      [],
      [],
      [
        "minecraft:ore_dirt",
        "minecraft:ore_gravel",
        "minecraft:ore_granite_upper",
        "minecraft:ore_granite_lower",
        "minecraft:ore_diorite_upper",
        "minecraft:ore_diorite_lower",
        "minecraft:ore_andesite_upper",
        "minecraft:ore_andesite_lower",
        "minecraft:ore_tuff",
        "minecraft:ore_coal_upper",
        "minecraft:ore_coal_lower",
        "minecraft:ore_iron_upper",
        "minecraft:ore_iron_middle",
        "minecraft:ore_iron_small",
        "minecraft:ore_gold",
        "minecraft:ore_gold_lower",
        "minecraft:ore_redstone",
        "minecraft:ore_redstone_lower",
        "minecraft:ore_diamond",
        "minecraft:ore_diamond_medium",
        "minecraft:ore_diamond_large",
        "minecraft:ore_diamond_buried",
        "minecraft:ore_lapis",
        "minecraft:ore_lapis_buried",
        "minecraft:ore_copper",
        "minecraft:underwater_magma",
        "minecraft:ore_gold_extra",
        "minecraft:disk_sand",
        "minecraft:disk_clay",
        "minecraft:disk_gravel"
      ],
      [],
      [
        "minecraft:spring_water",
        "minecraft:spring_lava"
      ],
      [
        "minecraft:glow_lichen",
        "minecraft:patch_grass_badlands",
        "minecraft:patch_dead_bush_badlands",
        "minecraft:brown_mushroom_normal",
        "minecraft:red_mushroom_normal",
        "minecraft:patch_sugar_cane_badlands",
        "minecraft:patch_pumpkin",
        "minecraft:patch_cactus_decorated"
      ],
      [
        "minecraft:freeze_top_layer"
      ]
    ],
    "has_precipitation": false,
    "temperature": 2.0
  },
  "minecraft:frozen_river": {
    "carvers": {
      "air": [
        "minecraft:cave",
        "minecraft:cave_extra_underground",
        "minecraft:canyon"
      ]
    },
    "downfall": 0.5,
    "effects": {
      "fog_color": 12638463,
      "mood_sound": {
        "block_search_extent": 8,
        "offset": 2.0,
        "sound": "minecraft:ambient.cave",
        "tick_delay": 6000
      },
      "sky_color": 8364543,
      "water_color": 3750089,
      "water_fog_color": 329011
    },
    "features": [
      [],
      [
        "minecraft:lake_lava_underground",
        "minecraft:lake_lava_surface"
      ],
      [
        "minecraft:amethyst_geode"
      ],
      [
        "minecraft:monster_room",
        "minecraft:monster_room_deep"
      ],
      [],
      [],
      [
        "minecraft:ore_dirt",
        "minecraft:ore_gravel",
        "minecraft:ore_granite_upper",
        "minecraft:ore_granite_lower",
        "minecraft:ore_diorite_upper",
        "minecraft:ore_diorite_lower",
        "minecraft:ore_andesite_upper",
        "minecraft:ore_andesite_lower",
        "minecraft:ore_tuff",
        "minecraft:ore_coal_upper",
        "minecraft:ore_coal_lower",
        "minecraft:ore_iron_upper",
        "minecraft:ore_iron_middle",
        "minecraft:ore_iron_small",
        "minecraft:ore_gold",
        "minecraft:ore_gold_lower",
        "minecraft:ore_redstone",
        "minecraft:ore_redstone_lower",
        "minecraft:ore_diamond",
        "minecraft:ore_diamond_medium",
        "minecraft:ore_diamond_large",
        "minecraft:ore_diamond_buried",
        "minecraft:ore_lapis",
        "minecraft:ore_lapis_buried",
        "minecraft:ore_copper",
        "minecraft:underwater_magma",
        "minecraft:disk_sand",
        "minecraft:disk_clay",
        "minecraft:disk_gravel"
      ],
      [],
      [
        "minecraft:spring_water",
        "minecraft:spring_lava"
      ],
      [
        "minecraft:glow_lichen",
        "minecraft:trees_water",
        "minecraft:flower_default",
        "minecraft:patch_grass_badlands",
        "minecraft:brown_mushroom_normal",
        "minecraft:red_mushroom_normal",
        "minecraft:patch_sugar_cane",
        "minecraft:patch_pumpkin"
      ],
      [
        "minecraft:freeze_top_layer"
      ]
    ],
    "has_precipitation": true,
    "temperature": 0.0
  },
  "minecraft:jagged_peaks": {
    "carvers": {
      "air": [
        "minecraft:cave",
        "minecraft:cave_extra_underground",
        "minecraft:canyon"
      ]
    },
    "downfall": 0.9,
    "effects": {
      "fog_color": 12638463,
      "mood_sound": {
        "block_search_extent": 8,
        "offset": 2.0,
        "sound": "minecraft:ambient.cave",
        "tick_delay": 6000
      },
      "music": {
        "max_delay": 24000,
        "min_delay": 12000,
        "replace_current_music": false,
        "sound": "minecraft:music.overworld.jagged_peaks"
      },
      "sky_color": 8756735,
      "water_color": 4159204,
      "water_fog_color": 329011
    },
    "features": [
      [],
      [
        "minecraft:lake_lava_underground",
        "minecraft:lake_lava_surface"
      ],
      [
        "minecraft:amethyst_geode"
      ],
      [
        "minecraft:monster_room",
        "minecraft:monster_room_deep"
      ],
      [],
      [],
      [
        "minecraft:ore_dirt",
        "minecraft:ore_gravel",
        "minecraft:ore_granite_upper",
        "minecraft:ore_granite_lower",
        "minecraft:ore_diorite_upper",
        "minecraft:ore_diorite_lower",
        "minecraft:ore_andesite_upper",
        "minecraft:ore_andesite_lower",
        "minecraft:ore_tuff",
        "minecraft:ore_coal_upper",
        "minecraft:ore_coal_lower",
        "minecraft:ore_iron_upper",
        "minecraft:ore_iron_middle",
        "minecraft:ore_iron_small",
        "minecraft:ore_gold",
        "minecraft:ore_gold_lower",
        "minecraft:ore_redstone",
        "minecraft:ore_redstone_lower",
        "minecraft:ore_diamond",
        "minecraft:ore_diamond_medium",
        "minecraft:ore_diamond_large",
        "minecraft:ore_diamond_buried",
        "minecraft:ore_lapis",
        "minecraft:ore_lapis_buried",
        "minecraft:ore_copper",
        "minecraft:underwater_magma",
        "minecraft:disk_sand",
        "minecraft:disk_clay",
        "minecraft:disk_gravel",
        "minecraft:ore_emerald"
      ],
      [
        "minecraft:ore_infested"
      ],
      [
        "minecraft:spring_water",
        "minecraft:spring_lava",
        "minecraft:spring_lava_frozen"
      ],
      [
        "minecraft:glow_lichen"
      ],
      [
        "minecraft:freeze_top_layer"
      ]
    ],
    "has_precipitation": true,
    "temperature": -0.7
  }
};

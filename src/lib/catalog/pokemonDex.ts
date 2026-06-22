import type { Species } from "./pokemon";

// AUTO-GENERATED from Pokémon Showdown's pokedex.json (base species, National Dex
// #1–1025). Showdown ids match Cobblemon species ids (lowercase, alphanumeric — e.g.
// nidoranf, mrmime, farfetchd, hooh), verified against the Cobblemon species data, so
// each `id` is usable directly in /spawnpokemon and spawn_pool_world files. `legendary`
// is set from Showdown's Legendary/Sub-Legendary/Restricted/Mythical tags.
// Regenerate from https://play.pokemonshowdown.com/data/pokedex.json if a new gen ships.
export const POKEDEX: Species[] = [
  { id: "bulbasaur", name: "Bulbasaur", types: ["grass", "poison"] },  // #1
  { id: "ivysaur", name: "Ivysaur", types: ["grass", "poison"] },  // #2
  { id: "venusaur", name: "Venusaur", types: ["grass", "poison"] },  // #3
  { id: "charmander", name: "Charmander", types: ["fire"] },  // #4
  { id: "charmeleon", name: "Charmeleon", types: ["fire"] },  // #5
  { id: "charizard", name: "Charizard", types: ["fire", "flying"] },  // #6
  { id: "squirtle", name: "Squirtle", types: ["water"] },  // #7
  { id: "wartortle", name: "Wartortle", types: ["water"] },  // #8
  { id: "blastoise", name: "Blastoise", types: ["water"] },  // #9
  { id: "caterpie", name: "Caterpie", types: ["bug"] },  // #10
  { id: "metapod", name: "Metapod", types: ["bug"] },  // #11
  { id: "butterfree", name: "Butterfree", types: ["bug", "flying"] },  // #12
  { id: "weedle", name: "Weedle", types: ["bug", "poison"] },  // #13
  { id: "kakuna", name: "Kakuna", types: ["bug", "poison"] },  // #14
  { id: "beedrill", name: "Beedrill", types: ["bug", "poison"] },  // #15
  { id: "pidgey", name: "Pidgey", types: ["normal", "flying"] },  // #16
  { id: "pidgeotto", name: "Pidgeotto", types: ["normal", "flying"] },  // #17
  { id: "pidgeot", name: "Pidgeot", types: ["normal", "flying"] },  // #18
  { id: "rattata", name: "Rattata", types: ["normal"] },  // #19
  { id: "raticate", name: "Raticate", types: ["normal"] },  // #20
  { id: "spearow", name: "Spearow", types: ["normal", "flying"] },  // #21
  { id: "fearow", name: "Fearow", types: ["normal", "flying"] },  // #22
  { id: "ekans", name: "Ekans", types: ["poison"] },  // #23
  { id: "arbok", name: "Arbok", types: ["poison"] },  // #24
  { id: "pikachu", name: "Pikachu", types: ["electric"] },  // #25
  { id: "raichu", name: "Raichu", types: ["electric"] },  // #26
  { id: "sandshrew", name: "Sandshrew", types: ["ground"] },  // #27
  { id: "sandslash", name: "Sandslash", types: ["ground"] },  // #28
  { id: "nidoranf", name: "Nidoran-F", types: ["poison"] },  // #29
  { id: "nidorina", name: "Nidorina", types: ["poison"] },  // #30
  { id: "nidoqueen", name: "Nidoqueen", types: ["poison", "ground"] },  // #31
  { id: "nidoranm", name: "Nidoran-M", types: ["poison"] },  // #32
  { id: "nidorino", name: "Nidorino", types: ["poison"] },  // #33
  { id: "nidoking", name: "Nidoking", types: ["poison", "ground"] },  // #34
  { id: "clefairy", name: "Clefairy", types: ["fairy"] },  // #35
  { id: "clefable", name: "Clefable", types: ["fairy"] },  // #36
  { id: "vulpix", name: "Vulpix", types: ["fire"] },  // #37
  { id: "ninetales", name: "Ninetales", types: ["fire"] },  // #38
  { id: "jigglypuff", name: "Jigglypuff", types: ["normal", "fairy"] },  // #39
  { id: "wigglytuff", name: "Wigglytuff", types: ["normal", "fairy"] },  // #40
  { id: "zubat", name: "Zubat", types: ["poison", "flying"] },  // #41
  { id: "golbat", name: "Golbat", types: ["poison", "flying"] },  // #42
  { id: "oddish", name: "Oddish", types: ["grass", "poison"] },  // #43
  { id: "gloom", name: "Gloom", types: ["grass", "poison"] },  // #44
  { id: "vileplume", name: "Vileplume", types: ["grass", "poison"] },  // #45
  { id: "paras", name: "Paras", types: ["bug", "grass"] },  // #46
  { id: "parasect", name: "Parasect", types: ["bug", "grass"] },  // #47
  { id: "venonat", name: "Venonat", types: ["bug", "poison"] },  // #48
  { id: "venomoth", name: "Venomoth", types: ["bug", "poison"] },  // #49
  { id: "diglett", name: "Diglett", types: ["ground"] },  // #50
  { id: "dugtrio", name: "Dugtrio", types: ["ground"] },  // #51
  { id: "meowth", name: "Meowth", types: ["normal"] },  // #52
  { id: "persian", name: "Persian", types: ["normal"] },  // #53
  { id: "psyduck", name: "Psyduck", types: ["water"] },  // #54
  { id: "golduck", name: "Golduck", types: ["water"] },  // #55
  { id: "mankey", name: "Mankey", types: ["fighting"] },  // #56
  { id: "primeape", name: "Primeape", types: ["fighting"] },  // #57
  { id: "growlithe", name: "Growlithe", types: ["fire"] },  // #58
  { id: "arcanine", name: "Arcanine", types: ["fire"] },  // #59
  { id: "poliwag", name: "Poliwag", types: ["water"] },  // #60
  { id: "poliwhirl", name: "Poliwhirl", types: ["water"] },  // #61
  { id: "poliwrath", name: "Poliwrath", types: ["water", "fighting"] },  // #62
  { id: "abra", name: "Abra", types: ["psychic"] },  // #63
  { id: "kadabra", name: "Kadabra", types: ["psychic"] },  // #64
  { id: "alakazam", name: "Alakazam", types: ["psychic"] },  // #65
  { id: "machop", name: "Machop", types: ["fighting"] },  // #66
  { id: "machoke", name: "Machoke", types: ["fighting"] },  // #67
  { id: "machamp", name: "Machamp", types: ["fighting"] },  // #68
  { id: "bellsprout", name: "Bellsprout", types: ["grass", "poison"] },  // #69
  { id: "weepinbell", name: "Weepinbell", types: ["grass", "poison"] },  // #70
  { id: "victreebel", name: "Victreebel", types: ["grass", "poison"] },  // #71
  { id: "tentacool", name: "Tentacool", types: ["water", "poison"] },  // #72
  { id: "tentacruel", name: "Tentacruel", types: ["water", "poison"] },  // #73
  { id: "geodude", name: "Geodude", types: ["rock", "ground"] },  // #74
  { id: "graveler", name: "Graveler", types: ["rock", "ground"] },  // #75
  { id: "golem", name: "Golem", types: ["rock", "ground"] },  // #76
  { id: "ponyta", name: "Ponyta", types: ["fire"] },  // #77
  { id: "rapidash", name: "Rapidash", types: ["fire"] },  // #78
  { id: "slowpoke", name: "Slowpoke", types: ["water", "psychic"] },  // #79
  { id: "slowbro", name: "Slowbro", types: ["water", "psychic"] },  // #80
  { id: "magnemite", name: "Magnemite", types: ["electric", "steel"] },  // #81
  { id: "magneton", name: "Magneton", types: ["electric", "steel"] },  // #82
  { id: "farfetchd", name: "Farfetch\u2019d", types: ["normal", "flying"] },  // #83
  { id: "doduo", name: "Doduo", types: ["normal", "flying"] },  // #84
  { id: "dodrio", name: "Dodrio", types: ["normal", "flying"] },  // #85
  { id: "seel", name: "Seel", types: ["water"] },  // #86
  { id: "dewgong", name: "Dewgong", types: ["water", "ice"] },  // #87
  { id: "grimer", name: "Grimer", types: ["poison"] },  // #88
  { id: "muk", name: "Muk", types: ["poison"] },  // #89
  { id: "shellder", name: "Shellder", types: ["water"] },  // #90
  { id: "cloyster", name: "Cloyster", types: ["water", "ice"] },  // #91
  { id: "gastly", name: "Gastly", types: ["ghost", "poison"] },  // #92
  { id: "haunter", name: "Haunter", types: ["ghost", "poison"] },  // #93
  { id: "gengar", name: "Gengar", types: ["ghost", "poison"] },  // #94
  { id: "onix", name: "Onix", types: ["rock", "ground"] },  // #95
  { id: "drowzee", name: "Drowzee", types: ["psychic"] },  // #96
  { id: "hypno", name: "Hypno", types: ["psychic"] },  // #97
  { id: "krabby", name: "Krabby", types: ["water"] },  // #98
  { id: "kingler", name: "Kingler", types: ["water"] },  // #99
  { id: "voltorb", name: "Voltorb", types: ["electric"] },  // #100
  { id: "electrode", name: "Electrode", types: ["electric"] },  // #101
  { id: "exeggcute", name: "Exeggcute", types: ["grass", "psychic"] },  // #102
  { id: "exeggutor", name: "Exeggutor", types: ["grass", "psychic"] },  // #103
  { id: "cubone", name: "Cubone", types: ["ground"] },  // #104
  { id: "marowak", name: "Marowak", types: ["ground"] },  // #105
  { id: "hitmonlee", name: "Hitmonlee", types: ["fighting"] },  // #106
  { id: "hitmonchan", name: "Hitmonchan", types: ["fighting"] },  // #107
  { id: "lickitung", name: "Lickitung", types: ["normal"] },  // #108
  { id: "koffing", name: "Koffing", types: ["poison"] },  // #109
  { id: "weezing", name: "Weezing", types: ["poison"] },  // #110
  { id: "rhyhorn", name: "Rhyhorn", types: ["ground", "rock"] },  // #111
  { id: "rhydon", name: "Rhydon", types: ["ground", "rock"] },  // #112
  { id: "chansey", name: "Chansey", types: ["normal"] },  // #113
  { id: "tangela", name: "Tangela", types: ["grass"] },  // #114
  { id: "kangaskhan", name: "Kangaskhan", types: ["normal"] },  // #115
  { id: "horsea", name: "Horsea", types: ["water"] },  // #116
  { id: "seadra", name: "Seadra", types: ["water"] },  // #117
  { id: "goldeen", name: "Goldeen", types: ["water"] },  // #118
  { id: "seaking", name: "Seaking", types: ["water"] },  // #119
  { id: "staryu", name: "Staryu", types: ["water"] },  // #120
  { id: "starmie", name: "Starmie", types: ["water", "psychic"] },  // #121
  { id: "mrmime", name: "Mr. Mime", types: ["psychic", "fairy"] },  // #122
  { id: "scyther", name: "Scyther", types: ["bug", "flying"] },  // #123
  { id: "jynx", name: "Jynx", types: ["ice", "psychic"] },  // #124
  { id: "electabuzz", name: "Electabuzz", types: ["electric"] },  // #125
  { id: "magmar", name: "Magmar", types: ["fire"] },  // #126
  { id: "pinsir", name: "Pinsir", types: ["bug"] },  // #127
  { id: "tauros", name: "Tauros", types: ["normal"] },  // #128
  { id: "magikarp", name: "Magikarp", types: ["water"] },  // #129
  { id: "gyarados", name: "Gyarados", types: ["water", "flying"] },  // #130
  { id: "lapras", name: "Lapras", types: ["water", "ice"] },  // #131
  { id: "ditto", name: "Ditto", types: ["normal"] },  // #132
  { id: "eevee", name: "Eevee", types: ["normal"] },  // #133
  { id: "vaporeon", name: "Vaporeon", types: ["water"] },  // #134
  { id: "jolteon", name: "Jolteon", types: ["electric"] },  // #135
  { id: "flareon", name: "Flareon", types: ["fire"] },  // #136
  { id: "porygon", name: "Porygon", types: ["normal"] },  // #137
  { id: "omanyte", name: "Omanyte", types: ["rock", "water"] },  // #138
  { id: "omastar", name: "Omastar", types: ["rock", "water"] },  // #139
  { id: "kabuto", name: "Kabuto", types: ["rock", "water"] },  // #140
  { id: "kabutops", name: "Kabutops", types: ["rock", "water"] },  // #141
  { id: "aerodactyl", name: "Aerodactyl", types: ["rock", "flying"] },  // #142
  { id: "snorlax", name: "Snorlax", types: ["normal"] },  // #143
  { id: "articuno", name: "Articuno", types: ["ice", "flying"], legendary: true },  // #144
  { id: "zapdos", name: "Zapdos", types: ["electric", "flying"], legendary: true },  // #145
  { id: "moltres", name: "Moltres", types: ["fire", "flying"], legendary: true },  // #146
  { id: "dratini", name: "Dratini", types: ["dragon"] },  // #147
  { id: "dragonair", name: "Dragonair", types: ["dragon"] },  // #148
  { id: "dragonite", name: "Dragonite", types: ["dragon", "flying"] },  // #149
  { id: "mewtwo", name: "Mewtwo", types: ["psychic"], legendary: true },  // #150
  { id: "mew", name: "Mew", types: ["psychic"], legendary: true },  // #151
  { id: "chikorita", name: "Chikorita", types: ["grass"] },  // #152
  { id: "bayleef", name: "Bayleef", types: ["grass"] },  // #153
  { id: "meganium", name: "Meganium", types: ["grass"] },  // #154
  { id: "cyndaquil", name: "Cyndaquil", types: ["fire"] },  // #155
  { id: "quilava", name: "Quilava", types: ["fire"] },  // #156
  { id: "typhlosion", name: "Typhlosion", types: ["fire"] },  // #157
  { id: "totodile", name: "Totodile", types: ["water"] },  // #158
  { id: "croconaw", name: "Croconaw", types: ["water"] },  // #159
  { id: "feraligatr", name: "Feraligatr", types: ["water"] },  // #160
  { id: "sentret", name: "Sentret", types: ["normal"] },  // #161
  { id: "furret", name: "Furret", types: ["normal"] },  // #162
  { id: "hoothoot", name: "Hoothoot", types: ["normal", "flying"] },  // #163
  { id: "noctowl", name: "Noctowl", types: ["normal", "flying"] },  // #164
  { id: "ledyba", name: "Ledyba", types: ["bug", "flying"] },  // #165
  { id: "ledian", name: "Ledian", types: ["bug", "flying"] },  // #166
  { id: "spinarak", name: "Spinarak", types: ["bug", "poison"] },  // #167
  { id: "ariados", name: "Ariados", types: ["bug", "poison"] },  // #168
  { id: "crobat", name: "Crobat", types: ["poison", "flying"] },  // #169
  { id: "chinchou", name: "Chinchou", types: ["water", "electric"] },  // #170
  { id: "lanturn", name: "Lanturn", types: ["water", "electric"] },  // #171
  { id: "pichu", name: "Pichu", types: ["electric"] },  // #172
  { id: "cleffa", name: "Cleffa", types: ["fairy"] },  // #173
  { id: "igglybuff", name: "Igglybuff", types: ["normal", "fairy"] },  // #174
  { id: "togepi", name: "Togepi", types: ["fairy"] },  // #175
  { id: "togetic", name: "Togetic", types: ["fairy", "flying"] },  // #176
  { id: "natu", name: "Natu", types: ["psychic", "flying"] },  // #177
  { id: "xatu", name: "Xatu", types: ["psychic", "flying"] },  // #178
  { id: "mareep", name: "Mareep", types: ["electric"] },  // #179
  { id: "flaaffy", name: "Flaaffy", types: ["electric"] },  // #180
  { id: "ampharos", name: "Ampharos", types: ["electric"] },  // #181
  { id: "bellossom", name: "Bellossom", types: ["grass"] },  // #182
  { id: "marill", name: "Marill", types: ["water", "fairy"] },  // #183
  { id: "azumarill", name: "Azumarill", types: ["water", "fairy"] },  // #184
  { id: "sudowoodo", name: "Sudowoodo", types: ["rock"] },  // #185
  { id: "politoed", name: "Politoed", types: ["water"] },  // #186
  { id: "hoppip", name: "Hoppip", types: ["grass", "flying"] },  // #187
  { id: "skiploom", name: "Skiploom", types: ["grass", "flying"] },  // #188
  { id: "jumpluff", name: "Jumpluff", types: ["grass", "flying"] },  // #189
  { id: "aipom", name: "Aipom", types: ["normal"] },  // #190
  { id: "sunkern", name: "Sunkern", types: ["grass"] },  // #191
  { id: "sunflora", name: "Sunflora", types: ["grass"] },  // #192
  { id: "yanma", name: "Yanma", types: ["bug", "flying"] },  // #193
  { id: "wooper", name: "Wooper", types: ["water", "ground"] },  // #194
  { id: "quagsire", name: "Quagsire", types: ["water", "ground"] },  // #195
  { id: "espeon", name: "Espeon", types: ["psychic"] },  // #196
  { id: "umbreon", name: "Umbreon", types: ["dark"] },  // #197
  { id: "murkrow", name: "Murkrow", types: ["dark", "flying"] },  // #198
  { id: "slowking", name: "Slowking", types: ["water", "psychic"] },  // #199
  { id: "misdreavus", name: "Misdreavus", types: ["ghost"] },  // #200
  { id: "unown", name: "Unown", types: ["psychic"] },  // #201
  { id: "wobbuffet", name: "Wobbuffet", types: ["psychic"] },  // #202
  { id: "girafarig", name: "Girafarig", types: ["normal", "psychic"] },  // #203
  { id: "pineco", name: "Pineco", types: ["bug"] },  // #204
  { id: "forretress", name: "Forretress", types: ["bug", "steel"] },  // #205
  { id: "dunsparce", name: "Dunsparce", types: ["normal"] },  // #206
  { id: "gligar", name: "Gligar", types: ["ground", "flying"] },  // #207
  { id: "steelix", name: "Steelix", types: ["steel", "ground"] },  // #208
  { id: "snubbull", name: "Snubbull", types: ["fairy"] },  // #209
  { id: "granbull", name: "Granbull", types: ["fairy"] },  // #210
  { id: "qwilfish", name: "Qwilfish", types: ["water", "poison"] },  // #211
  { id: "scizor", name: "Scizor", types: ["bug", "steel"] },  // #212
  { id: "shuckle", name: "Shuckle", types: ["bug", "rock"] },  // #213
  { id: "heracross", name: "Heracross", types: ["bug", "fighting"] },  // #214
  { id: "sneasel", name: "Sneasel", types: ["dark", "ice"] },  // #215
  { id: "teddiursa", name: "Teddiursa", types: ["normal"] },  // #216
  { id: "ursaring", name: "Ursaring", types: ["normal"] },  // #217
  { id: "slugma", name: "Slugma", types: ["fire"] },  // #218
  { id: "magcargo", name: "Magcargo", types: ["fire", "rock"] },  // #219
  { id: "swinub", name: "Swinub", types: ["ice", "ground"] },  // #220
  { id: "piloswine", name: "Piloswine", types: ["ice", "ground"] },  // #221
  { id: "corsola", name: "Corsola", types: ["water", "rock"] },  // #222
  { id: "remoraid", name: "Remoraid", types: ["water"] },  // #223
  { id: "octillery", name: "Octillery", types: ["water"] },  // #224
  { id: "delibird", name: "Delibird", types: ["ice", "flying"] },  // #225
  { id: "mantine", name: "Mantine", types: ["water", "flying"] },  // #226
  { id: "skarmory", name: "Skarmory", types: ["steel", "flying"] },  // #227
  { id: "houndour", name: "Houndour", types: ["dark", "fire"] },  // #228
  { id: "houndoom", name: "Houndoom", types: ["dark", "fire"] },  // #229
  { id: "kingdra", name: "Kingdra", types: ["water", "dragon"] },  // #230
  { id: "phanpy", name: "Phanpy", types: ["ground"] },  // #231
  { id: "donphan", name: "Donphan", types: ["ground"] },  // #232
  { id: "porygon2", name: "Porygon2", types: ["normal"] },  // #233
  { id: "stantler", name: "Stantler", types: ["normal"] },  // #234
  { id: "smeargle", name: "Smeargle", types: ["normal"] },  // #235
  { id: "tyrogue", name: "Tyrogue", types: ["fighting"] },  // #236
  { id: "hitmontop", name: "Hitmontop", types: ["fighting"] },  // #237
  { id: "smoochum", name: "Smoochum", types: ["ice", "psychic"] },  // #238
  { id: "elekid", name: "Elekid", types: ["electric"] },  // #239
  { id: "magby", name: "Magby", types: ["fire"] },  // #240
  { id: "miltank", name: "Miltank", types: ["normal"] },  // #241
  { id: "blissey", name: "Blissey", types: ["normal"] },  // #242
  { id: "raikou", name: "Raikou", types: ["electric"], legendary: true },  // #243
  { id: "entei", name: "Entei", types: ["fire"], legendary: true },  // #244
  { id: "suicune", name: "Suicune", types: ["water"], legendary: true },  // #245
  { id: "larvitar", name: "Larvitar", types: ["rock", "ground"] },  // #246
  { id: "pupitar", name: "Pupitar", types: ["rock", "ground"] },  // #247
  { id: "tyranitar", name: "Tyranitar", types: ["rock", "dark"] },  // #248
  { id: "lugia", name: "Lugia", types: ["psychic", "flying"], legendary: true },  // #249
  { id: "hooh", name: "Ho-Oh", types: ["fire", "flying"], legendary: true },  // #250
  { id: "celebi", name: "Celebi", types: ["psychic", "grass"], legendary: true },  // #251
  { id: "treecko", name: "Treecko", types: ["grass"] },  // #252
  { id: "grovyle", name: "Grovyle", types: ["grass"] },  // #253
  { id: "sceptile", name: "Sceptile", types: ["grass"] },  // #254
  { id: "torchic", name: "Torchic", types: ["fire"] },  // #255
  { id: "combusken", name: "Combusken", types: ["fire", "fighting"] },  // #256
  { id: "blaziken", name: "Blaziken", types: ["fire", "fighting"] },  // #257
  { id: "mudkip", name: "Mudkip", types: ["water"] },  // #258
  { id: "marshtomp", name: "Marshtomp", types: ["water", "ground"] },  // #259
  { id: "swampert", name: "Swampert", types: ["water", "ground"] },  // #260
  { id: "poochyena", name: "Poochyena", types: ["dark"] },  // #261
  { id: "mightyena", name: "Mightyena", types: ["dark"] },  // #262
  { id: "zigzagoon", name: "Zigzagoon", types: ["normal"] },  // #263
  { id: "linoone", name: "Linoone", types: ["normal"] },  // #264
  { id: "wurmple", name: "Wurmple", types: ["bug"] },  // #265
  { id: "silcoon", name: "Silcoon", types: ["bug"] },  // #266
  { id: "beautifly", name: "Beautifly", types: ["bug", "flying"] },  // #267
  { id: "cascoon", name: "Cascoon", types: ["bug"] },  // #268
  { id: "dustox", name: "Dustox", types: ["bug", "poison"] },  // #269
  { id: "lotad", name: "Lotad", types: ["water", "grass"] },  // #270
  { id: "lombre", name: "Lombre", types: ["water", "grass"] },  // #271
  { id: "ludicolo", name: "Ludicolo", types: ["water", "grass"] },  // #272
  { id: "seedot", name: "Seedot", types: ["grass"] },  // #273
  { id: "nuzleaf", name: "Nuzleaf", types: ["grass", "dark"] },  // #274
  { id: "shiftry", name: "Shiftry", types: ["grass", "dark"] },  // #275
  { id: "taillow", name: "Taillow", types: ["normal", "flying"] },  // #276
  { id: "swellow", name: "Swellow", types: ["normal", "flying"] },  // #277
  { id: "wingull", name: "Wingull", types: ["water", "flying"] },  // #278
  { id: "pelipper", name: "Pelipper", types: ["water", "flying"] },  // #279
  { id: "ralts", name: "Ralts", types: ["psychic", "fairy"] },  // #280
  { id: "kirlia", name: "Kirlia", types: ["psychic", "fairy"] },  // #281
  { id: "gardevoir", name: "Gardevoir", types: ["psychic", "fairy"] },  // #282
  { id: "surskit", name: "Surskit", types: ["bug", "water"] },  // #283
  { id: "masquerain", name: "Masquerain", types: ["bug", "flying"] },  // #284
  { id: "shroomish", name: "Shroomish", types: ["grass"] },  // #285
  { id: "breloom", name: "Breloom", types: ["grass", "fighting"] },  // #286
  { id: "slakoth", name: "Slakoth", types: ["normal"] },  // #287
  { id: "vigoroth", name: "Vigoroth", types: ["normal"] },  // #288
  { id: "slaking", name: "Slaking", types: ["normal"] },  // #289
  { id: "nincada", name: "Nincada", types: ["bug", "ground"] },  // #290
  { id: "ninjask", name: "Ninjask", types: ["bug", "flying"] },  // #291
  { id: "shedinja", name: "Shedinja", types: ["bug", "ghost"] },  // #292
  { id: "whismur", name: "Whismur", types: ["normal"] },  // #293
  { id: "loudred", name: "Loudred", types: ["normal"] },  // #294
  { id: "exploud", name: "Exploud", types: ["normal"] },  // #295
  { id: "makuhita", name: "Makuhita", types: ["fighting"] },  // #296
  { id: "hariyama", name: "Hariyama", types: ["fighting"] },  // #297
  { id: "azurill", name: "Azurill", types: ["normal", "fairy"] },  // #298
  { id: "nosepass", name: "Nosepass", types: ["rock"] },  // #299
  { id: "skitty", name: "Skitty", types: ["normal"] },  // #300
  { id: "delcatty", name: "Delcatty", types: ["normal"] },  // #301
  { id: "sableye", name: "Sableye", types: ["dark", "ghost"] },  // #302
  { id: "mawile", name: "Mawile", types: ["steel", "fairy"] },  // #303
  { id: "aron", name: "Aron", types: ["steel", "rock"] },  // #304
  { id: "lairon", name: "Lairon", types: ["steel", "rock"] },  // #305
  { id: "aggron", name: "Aggron", types: ["steel", "rock"] },  // #306
  { id: "meditite", name: "Meditite", types: ["fighting", "psychic"] },  // #307
  { id: "medicham", name: "Medicham", types: ["fighting", "psychic"] },  // #308
  { id: "electrike", name: "Electrike", types: ["electric"] },  // #309
  { id: "manectric", name: "Manectric", types: ["electric"] },  // #310
  { id: "plusle", name: "Plusle", types: ["electric"] },  // #311
  { id: "minun", name: "Minun", types: ["electric"] },  // #312
  { id: "volbeat", name: "Volbeat", types: ["bug"] },  // #313
  { id: "illumise", name: "Illumise", types: ["bug"] },  // #314
  { id: "roselia", name: "Roselia", types: ["grass", "poison"] },  // #315
  { id: "gulpin", name: "Gulpin", types: ["poison"] },  // #316
  { id: "swalot", name: "Swalot", types: ["poison"] },  // #317
  { id: "carvanha", name: "Carvanha", types: ["water", "dark"] },  // #318
  { id: "sharpedo", name: "Sharpedo", types: ["water", "dark"] },  // #319
  { id: "wailmer", name: "Wailmer", types: ["water"] },  // #320
  { id: "wailord", name: "Wailord", types: ["water"] },  // #321
  { id: "numel", name: "Numel", types: ["fire", "ground"] },  // #322
  { id: "camerupt", name: "Camerupt", types: ["fire", "ground"] },  // #323
  { id: "torkoal", name: "Torkoal", types: ["fire"] },  // #324
  { id: "spoink", name: "Spoink", types: ["psychic"] },  // #325
  { id: "grumpig", name: "Grumpig", types: ["psychic"] },  // #326
  { id: "spinda", name: "Spinda", types: ["normal"] },  // #327
  { id: "trapinch", name: "Trapinch", types: ["ground"] },  // #328
  { id: "vibrava", name: "Vibrava", types: ["ground", "dragon"] },  // #329
  { id: "flygon", name: "Flygon", types: ["ground", "dragon"] },  // #330
  { id: "cacnea", name: "Cacnea", types: ["grass"] },  // #331
  { id: "cacturne", name: "Cacturne", types: ["grass", "dark"] },  // #332
  { id: "swablu", name: "Swablu", types: ["normal", "flying"] },  // #333
  { id: "altaria", name: "Altaria", types: ["dragon", "flying"] },  // #334
  { id: "zangoose", name: "Zangoose", types: ["normal"] },  // #335
  { id: "seviper", name: "Seviper", types: ["poison"] },  // #336
  { id: "lunatone", name: "Lunatone", types: ["rock", "psychic"] },  // #337
  { id: "solrock", name: "Solrock", types: ["rock", "psychic"] },  // #338
  { id: "barboach", name: "Barboach", types: ["water", "ground"] },  // #339
  { id: "whiscash", name: "Whiscash", types: ["water", "ground"] },  // #340
  { id: "corphish", name: "Corphish", types: ["water"] },  // #341
  { id: "crawdaunt", name: "Crawdaunt", types: ["water", "dark"] },  // #342
  { id: "baltoy", name: "Baltoy", types: ["ground", "psychic"] },  // #343
  { id: "claydol", name: "Claydol", types: ["ground", "psychic"] },  // #344
  { id: "lileep", name: "Lileep", types: ["rock", "grass"] },  // #345
  { id: "cradily", name: "Cradily", types: ["rock", "grass"] },  // #346
  { id: "anorith", name: "Anorith", types: ["rock", "bug"] },  // #347
  { id: "armaldo", name: "Armaldo", types: ["rock", "bug"] },  // #348
  { id: "feebas", name: "Feebas", types: ["water"] },  // #349
  { id: "milotic", name: "Milotic", types: ["water"] },  // #350
  { id: "castform", name: "Castform", types: ["normal"] },  // #351
  { id: "kecleon", name: "Kecleon", types: ["normal"] },  // #352
  { id: "shuppet", name: "Shuppet", types: ["ghost"] },  // #353
  { id: "banette", name: "Banette", types: ["ghost"] },  // #354
  { id: "duskull", name: "Duskull", types: ["ghost"] },  // #355
  { id: "dusclops", name: "Dusclops", types: ["ghost"] },  // #356
  { id: "tropius", name: "Tropius", types: ["grass", "flying"] },  // #357
  { id: "chimecho", name: "Chimecho", types: ["psychic"] },  // #358
  { id: "absol", name: "Absol", types: ["dark"] },  // #359
  { id: "wynaut", name: "Wynaut", types: ["psychic"] },  // #360
  { id: "snorunt", name: "Snorunt", types: ["ice"] },  // #361
  { id: "glalie", name: "Glalie", types: ["ice"] },  // #362
  { id: "spheal", name: "Spheal", types: ["ice", "water"] },  // #363
  { id: "sealeo", name: "Sealeo", types: ["ice", "water"] },  // #364
  { id: "walrein", name: "Walrein", types: ["ice", "water"] },  // #365
  { id: "clamperl", name: "Clamperl", types: ["water"] },  // #366
  { id: "huntail", name: "Huntail", types: ["water"] },  // #367
  { id: "gorebyss", name: "Gorebyss", types: ["water"] },  // #368
  { id: "relicanth", name: "Relicanth", types: ["water", "rock"] },  // #369
  { id: "luvdisc", name: "Luvdisc", types: ["water"] },  // #370
  { id: "bagon", name: "Bagon", types: ["dragon"] },  // #371
  { id: "shelgon", name: "Shelgon", types: ["dragon"] },  // #372
  { id: "salamence", name: "Salamence", types: ["dragon", "flying"] },  // #373
  { id: "beldum", name: "Beldum", types: ["steel", "psychic"] },  // #374
  { id: "metang", name: "Metang", types: ["steel", "psychic"] },  // #375
  { id: "metagross", name: "Metagross", types: ["steel", "psychic"] },  // #376
  { id: "regirock", name: "Regirock", types: ["rock"], legendary: true },  // #377
  { id: "regice", name: "Regice", types: ["ice"], legendary: true },  // #378
  { id: "registeel", name: "Registeel", types: ["steel"], legendary: true },  // #379
  { id: "latias", name: "Latias", types: ["dragon", "psychic"], legendary: true },  // #380
  { id: "latios", name: "Latios", types: ["dragon", "psychic"], legendary: true },  // #381
  { id: "kyogre", name: "Kyogre", types: ["water"], legendary: true },  // #382
  { id: "groudon", name: "Groudon", types: ["ground"], legendary: true },  // #383
  { id: "rayquaza", name: "Rayquaza", types: ["dragon", "flying"], legendary: true },  // #384
  { id: "jirachi", name: "Jirachi", types: ["steel", "psychic"], legendary: true },  // #385
  { id: "deoxys", name: "Deoxys", types: ["psychic"], legendary: true },  // #386
  { id: "turtwig", name: "Turtwig", types: ["grass"] },  // #387
  { id: "grotle", name: "Grotle", types: ["grass"] },  // #388
  { id: "torterra", name: "Torterra", types: ["grass", "ground"] },  // #389
  { id: "chimchar", name: "Chimchar", types: ["fire"] },  // #390
  { id: "monferno", name: "Monferno", types: ["fire", "fighting"] },  // #391
  { id: "infernape", name: "Infernape", types: ["fire", "fighting"] },  // #392
  { id: "piplup", name: "Piplup", types: ["water"] },  // #393
  { id: "prinplup", name: "Prinplup", types: ["water"] },  // #394
  { id: "empoleon", name: "Empoleon", types: ["water", "steel"] },  // #395
  { id: "starly", name: "Starly", types: ["normal", "flying"] },  // #396
  { id: "staravia", name: "Staravia", types: ["normal", "flying"] },  // #397
  { id: "staraptor", name: "Staraptor", types: ["normal", "flying"] },  // #398
  { id: "bidoof", name: "Bidoof", types: ["normal"] },  // #399
  { id: "bibarel", name: "Bibarel", types: ["normal", "water"] },  // #400
  { id: "kricketot", name: "Kricketot", types: ["bug"] },  // #401
  { id: "kricketune", name: "Kricketune", types: ["bug"] },  // #402
  { id: "shinx", name: "Shinx", types: ["electric"] },  // #403
  { id: "luxio", name: "Luxio", types: ["electric"] },  // #404
  { id: "luxray", name: "Luxray", types: ["electric"] },  // #405
  { id: "budew", name: "Budew", types: ["grass", "poison"] },  // #406
  { id: "roserade", name: "Roserade", types: ["grass", "poison"] },  // #407
  { id: "cranidos", name: "Cranidos", types: ["rock"] },  // #408
  { id: "rampardos", name: "Rampardos", types: ["rock"] },  // #409
  { id: "shieldon", name: "Shieldon", types: ["rock", "steel"] },  // #410
  { id: "bastiodon", name: "Bastiodon", types: ["rock", "steel"] },  // #411
  { id: "burmy", name: "Burmy", types: ["bug"] },  // #412
  { id: "wormadam", name: "Wormadam", types: ["bug", "grass"] },  // #413
  { id: "mothim", name: "Mothim", types: ["bug", "flying"] },  // #414
  { id: "combee", name: "Combee", types: ["bug", "flying"] },  // #415
  { id: "vespiquen", name: "Vespiquen", types: ["bug", "flying"] },  // #416
  { id: "pachirisu", name: "Pachirisu", types: ["electric"] },  // #417
  { id: "buizel", name: "Buizel", types: ["water"] },  // #418
  { id: "floatzel", name: "Floatzel", types: ["water"] },  // #419
  { id: "cherubi", name: "Cherubi", types: ["grass"] },  // #420
  { id: "cherrim", name: "Cherrim", types: ["grass"] },  // #421
  { id: "shellos", name: "Shellos", types: ["water"] },  // #422
  { id: "gastrodon", name: "Gastrodon", types: ["water", "ground"] },  // #423
  { id: "ambipom", name: "Ambipom", types: ["normal"] },  // #424
  { id: "drifloon", name: "Drifloon", types: ["ghost", "flying"] },  // #425
  { id: "drifblim", name: "Drifblim", types: ["ghost", "flying"] },  // #426
  { id: "buneary", name: "Buneary", types: ["normal"] },  // #427
  { id: "lopunny", name: "Lopunny", types: ["normal"] },  // #428
  { id: "mismagius", name: "Mismagius", types: ["ghost"] },  // #429
  { id: "honchkrow", name: "Honchkrow", types: ["dark", "flying"] },  // #430
  { id: "glameow", name: "Glameow", types: ["normal"] },  // #431
  { id: "purugly", name: "Purugly", types: ["normal"] },  // #432
  { id: "chingling", name: "Chingling", types: ["psychic"] },  // #433
  { id: "stunky", name: "Stunky", types: ["poison", "dark"] },  // #434
  { id: "skuntank", name: "Skuntank", types: ["poison", "dark"] },  // #435
  { id: "bronzor", name: "Bronzor", types: ["steel", "psychic"] },  // #436
  { id: "bronzong", name: "Bronzong", types: ["steel", "psychic"] },  // #437
  { id: "bonsly", name: "Bonsly", types: ["rock"] },  // #438
  { id: "mimejr", name: "Mime Jr.", types: ["psychic", "fairy"] },  // #439
  { id: "happiny", name: "Happiny", types: ["normal"] },  // #440
  { id: "chatot", name: "Chatot", types: ["normal", "flying"] },  // #441
  { id: "spiritomb", name: "Spiritomb", types: ["ghost", "dark"] },  // #442
  { id: "gible", name: "Gible", types: ["dragon", "ground"] },  // #443
  { id: "gabite", name: "Gabite", types: ["dragon", "ground"] },  // #444
  { id: "garchomp", name: "Garchomp", types: ["dragon", "ground"] },  // #445
  { id: "munchlax", name: "Munchlax", types: ["normal"] },  // #446
  { id: "riolu", name: "Riolu", types: ["fighting"] },  // #447
  { id: "lucario", name: "Lucario", types: ["fighting", "steel"] },  // #448
  { id: "hippopotas", name: "Hippopotas", types: ["ground"] },  // #449
  { id: "hippowdon", name: "Hippowdon", types: ["ground"] },  // #450
  { id: "skorupi", name: "Skorupi", types: ["poison", "bug"] },  // #451
  { id: "drapion", name: "Drapion", types: ["poison", "dark"] },  // #452
  { id: "croagunk", name: "Croagunk", types: ["poison", "fighting"] },  // #453
  { id: "toxicroak", name: "Toxicroak", types: ["poison", "fighting"] },  // #454
  { id: "carnivine", name: "Carnivine", types: ["grass"] },  // #455
  { id: "finneon", name: "Finneon", types: ["water"] },  // #456
  { id: "lumineon", name: "Lumineon", types: ["water"] },  // #457
  { id: "mantyke", name: "Mantyke", types: ["water", "flying"] },  // #458
  { id: "snover", name: "Snover", types: ["grass", "ice"] },  // #459
  { id: "abomasnow", name: "Abomasnow", types: ["grass", "ice"] },  // #460
  { id: "weavile", name: "Weavile", types: ["dark", "ice"] },  // #461
  { id: "magnezone", name: "Magnezone", types: ["electric", "steel"] },  // #462
  { id: "lickilicky", name: "Lickilicky", types: ["normal"] },  // #463
  { id: "rhyperior", name: "Rhyperior", types: ["ground", "rock"] },  // #464
  { id: "tangrowth", name: "Tangrowth", types: ["grass"] },  // #465
  { id: "electivire", name: "Electivire", types: ["electric"] },  // #466
  { id: "magmortar", name: "Magmortar", types: ["fire"] },  // #467
  { id: "togekiss", name: "Togekiss", types: ["fairy", "flying"] },  // #468
  { id: "yanmega", name: "Yanmega", types: ["bug", "flying"] },  // #469
  { id: "leafeon", name: "Leafeon", types: ["grass"] },  // #470
  { id: "glaceon", name: "Glaceon", types: ["ice"] },  // #471
  { id: "gliscor", name: "Gliscor", types: ["ground", "flying"] },  // #472
  { id: "mamoswine", name: "Mamoswine", types: ["ice", "ground"] },  // #473
  { id: "porygonz", name: "Porygon-Z", types: ["normal"] },  // #474
  { id: "gallade", name: "Gallade", types: ["psychic", "fighting"] },  // #475
  { id: "probopass", name: "Probopass", types: ["rock", "steel"] },  // #476
  { id: "dusknoir", name: "Dusknoir", types: ["ghost"] },  // #477
  { id: "froslass", name: "Froslass", types: ["ice", "ghost"] },  // #478
  { id: "rotom", name: "Rotom", types: ["electric", "ghost"] },  // #479
  { id: "uxie", name: "Uxie", types: ["psychic"], legendary: true },  // #480
  { id: "mesprit", name: "Mesprit", types: ["psychic"], legendary: true },  // #481
  { id: "azelf", name: "Azelf", types: ["psychic"], legendary: true },  // #482
  { id: "dialga", name: "Dialga", types: ["steel", "dragon"], legendary: true },  // #483
  { id: "palkia", name: "Palkia", types: ["water", "dragon"], legendary: true },  // #484
  { id: "heatran", name: "Heatran", types: ["fire", "steel"], legendary: true },  // #485
  { id: "regigigas", name: "Regigigas", types: ["normal"], legendary: true },  // #486
  { id: "giratina", name: "Giratina", types: ["ghost", "dragon"], legendary: true },  // #487
  { id: "cresselia", name: "Cresselia", types: ["psychic"], legendary: true },  // #488
  { id: "phione", name: "Phione", types: ["water"], legendary: true },  // #489
  { id: "manaphy", name: "Manaphy", types: ["water"], legendary: true },  // #490
  { id: "darkrai", name: "Darkrai", types: ["dark"], legendary: true },  // #491
  { id: "shaymin", name: "Shaymin", types: ["grass"], legendary: true },  // #492
  { id: "arceus", name: "Arceus", types: ["normal"], legendary: true },  // #493
  { id: "victini", name: "Victini", types: ["psychic", "fire"], legendary: true },  // #494
  { id: "snivy", name: "Snivy", types: ["grass"] },  // #495
  { id: "servine", name: "Servine", types: ["grass"] },  // #496
  { id: "serperior", name: "Serperior", types: ["grass"] },  // #497
  { id: "tepig", name: "Tepig", types: ["fire"] },  // #498
  { id: "pignite", name: "Pignite", types: ["fire", "fighting"] },  // #499
  { id: "emboar", name: "Emboar", types: ["fire", "fighting"] },  // #500
  { id: "oshawott", name: "Oshawott", types: ["water"] },  // #501
  { id: "dewott", name: "Dewott", types: ["water"] },  // #502
  { id: "samurott", name: "Samurott", types: ["water"] },  // #503
  { id: "patrat", name: "Patrat", types: ["normal"] },  // #504
  { id: "watchog", name: "Watchog", types: ["normal"] },  // #505
  { id: "lillipup", name: "Lillipup", types: ["normal"] },  // #506
  { id: "herdier", name: "Herdier", types: ["normal"] },  // #507
  { id: "stoutland", name: "Stoutland", types: ["normal"] },  // #508
  { id: "purrloin", name: "Purrloin", types: ["dark"] },  // #509
  { id: "liepard", name: "Liepard", types: ["dark"] },  // #510
  { id: "pansage", name: "Pansage", types: ["grass"] },  // #511
  { id: "simisage", name: "Simisage", types: ["grass"] },  // #512
  { id: "pansear", name: "Pansear", types: ["fire"] },  // #513
  { id: "simisear", name: "Simisear", types: ["fire"] },  // #514
  { id: "panpour", name: "Panpour", types: ["water"] },  // #515
  { id: "simipour", name: "Simipour", types: ["water"] },  // #516
  { id: "munna", name: "Munna", types: ["psychic"] },  // #517
  { id: "musharna", name: "Musharna", types: ["psychic"] },  // #518
  { id: "pidove", name: "Pidove", types: ["normal", "flying"] },  // #519
  { id: "tranquill", name: "Tranquill", types: ["normal", "flying"] },  // #520
  { id: "unfezant", name: "Unfezant", types: ["normal", "flying"] },  // #521
  { id: "blitzle", name: "Blitzle", types: ["electric"] },  // #522
  { id: "zebstrika", name: "Zebstrika", types: ["electric"] },  // #523
  { id: "roggenrola", name: "Roggenrola", types: ["rock"] },  // #524
  { id: "boldore", name: "Boldore", types: ["rock"] },  // #525
  { id: "gigalith", name: "Gigalith", types: ["rock"] },  // #526
  { id: "woobat", name: "Woobat", types: ["psychic", "flying"] },  // #527
  { id: "swoobat", name: "Swoobat", types: ["psychic", "flying"] },  // #528
  { id: "drilbur", name: "Drilbur", types: ["ground"] },  // #529
  { id: "excadrill", name: "Excadrill", types: ["ground", "steel"] },  // #530
  { id: "audino", name: "Audino", types: ["normal"] },  // #531
  { id: "timburr", name: "Timburr", types: ["fighting"] },  // #532
  { id: "gurdurr", name: "Gurdurr", types: ["fighting"] },  // #533
  { id: "conkeldurr", name: "Conkeldurr", types: ["fighting"] },  // #534
  { id: "tympole", name: "Tympole", types: ["water"] },  // #535
  { id: "palpitoad", name: "Palpitoad", types: ["water", "ground"] },  // #536
  { id: "seismitoad", name: "Seismitoad", types: ["water", "ground"] },  // #537
  { id: "throh", name: "Throh", types: ["fighting"] },  // #538
  { id: "sawk", name: "Sawk", types: ["fighting"] },  // #539
  { id: "sewaddle", name: "Sewaddle", types: ["bug", "grass"] },  // #540
  { id: "swadloon", name: "Swadloon", types: ["bug", "grass"] },  // #541
  { id: "leavanny", name: "Leavanny", types: ["bug", "grass"] },  // #542
  { id: "venipede", name: "Venipede", types: ["bug", "poison"] },  // #543
  { id: "whirlipede", name: "Whirlipede", types: ["bug", "poison"] },  // #544
  { id: "scolipede", name: "Scolipede", types: ["bug", "poison"] },  // #545
  { id: "cottonee", name: "Cottonee", types: ["grass", "fairy"] },  // #546
  { id: "whimsicott", name: "Whimsicott", types: ["grass", "fairy"] },  // #547
  { id: "petilil", name: "Petilil", types: ["grass"] },  // #548
  { id: "lilligant", name: "Lilligant", types: ["grass"] },  // #549
  { id: "basculin", name: "Basculin", types: ["water"] },  // #550
  { id: "sandile", name: "Sandile", types: ["ground", "dark"] },  // #551
  { id: "krokorok", name: "Krokorok", types: ["ground", "dark"] },  // #552
  { id: "krookodile", name: "Krookodile", types: ["ground", "dark"] },  // #553
  { id: "darumaka", name: "Darumaka", types: ["fire"] },  // #554
  { id: "darmanitan", name: "Darmanitan", types: ["fire"] },  // #555
  { id: "maractus", name: "Maractus", types: ["grass"] },  // #556
  { id: "dwebble", name: "Dwebble", types: ["bug", "rock"] },  // #557
  { id: "crustle", name: "Crustle", types: ["bug", "rock"] },  // #558
  { id: "scraggy", name: "Scraggy", types: ["dark", "fighting"] },  // #559
  { id: "scrafty", name: "Scrafty", types: ["dark", "fighting"] },  // #560
  { id: "sigilyph", name: "Sigilyph", types: ["psychic", "flying"] },  // #561
  { id: "yamask", name: "Yamask", types: ["ghost"] },  // #562
  { id: "cofagrigus", name: "Cofagrigus", types: ["ghost"] },  // #563
  { id: "tirtouga", name: "Tirtouga", types: ["water", "rock"] },  // #564
  { id: "carracosta", name: "Carracosta", types: ["water", "rock"] },  // #565
  { id: "archen", name: "Archen", types: ["rock", "flying"] },  // #566
  { id: "archeops", name: "Archeops", types: ["rock", "flying"] },  // #567
  { id: "trubbish", name: "Trubbish", types: ["poison"] },  // #568
  { id: "garbodor", name: "Garbodor", types: ["poison"] },  // #569
  { id: "zorua", name: "Zorua", types: ["dark"] },  // #570
  { id: "zoroark", name: "Zoroark", types: ["dark"] },  // #571
  { id: "minccino", name: "Minccino", types: ["normal"] },  // #572
  { id: "cinccino", name: "Cinccino", types: ["normal"] },  // #573
  { id: "gothita", name: "Gothita", types: ["psychic"] },  // #574
  { id: "gothorita", name: "Gothorita", types: ["psychic"] },  // #575
  { id: "gothitelle", name: "Gothitelle", types: ["psychic"] },  // #576
  { id: "solosis", name: "Solosis", types: ["psychic"] },  // #577
  { id: "duosion", name: "Duosion", types: ["psychic"] },  // #578
  { id: "reuniclus", name: "Reuniclus", types: ["psychic"] },  // #579
  { id: "ducklett", name: "Ducklett", types: ["water", "flying"] },  // #580
  { id: "swanna", name: "Swanna", types: ["water", "flying"] },  // #581
  { id: "vanillite", name: "Vanillite", types: ["ice"] },  // #582
  { id: "vanillish", name: "Vanillish", types: ["ice"] },  // #583
  { id: "vanilluxe", name: "Vanilluxe", types: ["ice"] },  // #584
  { id: "deerling", name: "Deerling", types: ["normal", "grass"] },  // #585
  { id: "sawsbuck", name: "Sawsbuck", types: ["normal", "grass"] },  // #586
  { id: "emolga", name: "Emolga", types: ["electric", "flying"] },  // #587
  { id: "karrablast", name: "Karrablast", types: ["bug"] },  // #588
  { id: "escavalier", name: "Escavalier", types: ["bug", "steel"] },  // #589
  { id: "foongus", name: "Foongus", types: ["grass", "poison"] },  // #590
  { id: "amoonguss", name: "Amoonguss", types: ["grass", "poison"] },  // #591
  { id: "frillish", name: "Frillish", types: ["water", "ghost"] },  // #592
  { id: "jellicent", name: "Jellicent", types: ["water", "ghost"] },  // #593
  { id: "alomomola", name: "Alomomola", types: ["water"] },  // #594
  { id: "joltik", name: "Joltik", types: ["bug", "electric"] },  // #595
  { id: "galvantula", name: "Galvantula", types: ["bug", "electric"] },  // #596
  { id: "ferroseed", name: "Ferroseed", types: ["grass", "steel"] },  // #597
  { id: "ferrothorn", name: "Ferrothorn", types: ["grass", "steel"] },  // #598
  { id: "klink", name: "Klink", types: ["steel"] },  // #599
  { id: "klang", name: "Klang", types: ["steel"] },  // #600
  { id: "klinklang", name: "Klinklang", types: ["steel"] },  // #601
  { id: "tynamo", name: "Tynamo", types: ["electric"] },  // #602
  { id: "eelektrik", name: "Eelektrik", types: ["electric"] },  // #603
  { id: "eelektross", name: "Eelektross", types: ["electric"] },  // #604
  { id: "elgyem", name: "Elgyem", types: ["psychic"] },  // #605
  { id: "beheeyem", name: "Beheeyem", types: ["psychic"] },  // #606
  { id: "litwick", name: "Litwick", types: ["ghost", "fire"] },  // #607
  { id: "lampent", name: "Lampent", types: ["ghost", "fire"] },  // #608
  { id: "chandelure", name: "Chandelure", types: ["ghost", "fire"] },  // #609
  { id: "axew", name: "Axew", types: ["dragon"] },  // #610
  { id: "fraxure", name: "Fraxure", types: ["dragon"] },  // #611
  { id: "haxorus", name: "Haxorus", types: ["dragon"] },  // #612
  { id: "cubchoo", name: "Cubchoo", types: ["ice"] },  // #613
  { id: "beartic", name: "Beartic", types: ["ice"] },  // #614
  { id: "cryogonal", name: "Cryogonal", types: ["ice"] },  // #615
  { id: "shelmet", name: "Shelmet", types: ["bug"] },  // #616
  { id: "accelgor", name: "Accelgor", types: ["bug"] },  // #617
  { id: "stunfisk", name: "Stunfisk", types: ["ground", "electric"] },  // #618
  { id: "mienfoo", name: "Mienfoo", types: ["fighting"] },  // #619
  { id: "mienshao", name: "Mienshao", types: ["fighting"] },  // #620
  { id: "druddigon", name: "Druddigon", types: ["dragon"] },  // #621
  { id: "golett", name: "Golett", types: ["ground", "ghost"] },  // #622
  { id: "golurk", name: "Golurk", types: ["ground", "ghost"] },  // #623
  { id: "pawniard", name: "Pawniard", types: ["dark", "steel"] },  // #624
  { id: "bisharp", name: "Bisharp", types: ["dark", "steel"] },  // #625
  { id: "bouffalant", name: "Bouffalant", types: ["normal"] },  // #626
  { id: "rufflet", name: "Rufflet", types: ["normal", "flying"] },  // #627
  { id: "braviary", name: "Braviary", types: ["normal", "flying"] },  // #628
  { id: "vullaby", name: "Vullaby", types: ["dark", "flying"] },  // #629
  { id: "mandibuzz", name: "Mandibuzz", types: ["dark", "flying"] },  // #630
  { id: "heatmor", name: "Heatmor", types: ["fire"] },  // #631
  { id: "durant", name: "Durant", types: ["bug", "steel"] },  // #632
  { id: "deino", name: "Deino", types: ["dark", "dragon"] },  // #633
  { id: "zweilous", name: "Zweilous", types: ["dark", "dragon"] },  // #634
  { id: "hydreigon", name: "Hydreigon", types: ["dark", "dragon"] },  // #635
  { id: "larvesta", name: "Larvesta", types: ["bug", "fire"] },  // #636
  { id: "volcarona", name: "Volcarona", types: ["bug", "fire"] },  // #637
  { id: "cobalion", name: "Cobalion", types: ["steel", "fighting"], legendary: true },  // #638
  { id: "terrakion", name: "Terrakion", types: ["rock", "fighting"], legendary: true },  // #639
  { id: "virizion", name: "Virizion", types: ["grass", "fighting"], legendary: true },  // #640
  { id: "tornadus", name: "Tornadus", types: ["flying"], legendary: true },  // #641
  { id: "thundurus", name: "Thundurus", types: ["electric", "flying"], legendary: true },  // #642
  { id: "reshiram", name: "Reshiram", types: ["dragon", "fire"], legendary: true },  // #643
  { id: "zekrom", name: "Zekrom", types: ["dragon", "electric"], legendary: true },  // #644
  { id: "landorus", name: "Landorus", types: ["ground", "flying"], legendary: true },  // #645
  { id: "kyurem", name: "Kyurem", types: ["dragon", "ice"], legendary: true },  // #646
  { id: "keldeo", name: "Keldeo", types: ["water", "fighting"], legendary: true },  // #647
  { id: "meloetta", name: "Meloetta", types: ["normal", "psychic"], legendary: true },  // #648
  { id: "genesect", name: "Genesect", types: ["bug", "steel"], legendary: true },  // #649
  { id: "chespin", name: "Chespin", types: ["grass"] },  // #650
  { id: "quilladin", name: "Quilladin", types: ["grass"] },  // #651
  { id: "chesnaught", name: "Chesnaught", types: ["grass", "fighting"] },  // #652
  { id: "fennekin", name: "Fennekin", types: ["fire"] },  // #653
  { id: "braixen", name: "Braixen", types: ["fire"] },  // #654
  { id: "delphox", name: "Delphox", types: ["fire", "psychic"] },  // #655
  { id: "froakie", name: "Froakie", types: ["water"] },  // #656
  { id: "frogadier", name: "Frogadier", types: ["water"] },  // #657
  { id: "greninja", name: "Greninja", types: ["water", "dark"] },  // #658
  { id: "bunnelby", name: "Bunnelby", types: ["normal"] },  // #659
  { id: "diggersby", name: "Diggersby", types: ["normal", "ground"] },  // #660
  { id: "fletchling", name: "Fletchling", types: ["normal", "flying"] },  // #661
  { id: "fletchinder", name: "Fletchinder", types: ["fire", "flying"] },  // #662
  { id: "talonflame", name: "Talonflame", types: ["fire", "flying"] },  // #663
  { id: "scatterbug", name: "Scatterbug", types: ["bug"] },  // #664
  { id: "spewpa", name: "Spewpa", types: ["bug"] },  // #665
  { id: "vivillon", name: "Vivillon", types: ["bug", "flying"] },  // #666
  { id: "litleo", name: "Litleo", types: ["fire", "normal"] },  // #667
  { id: "pyroar", name: "Pyroar", types: ["fire", "normal"] },  // #668
  { id: "flabebe", name: "Flabe\u0301be\u0301", types: ["fairy"] },  // #669
  { id: "floette", name: "Floette", types: ["fairy"] },  // #670
  { id: "florges", name: "Florges", types: ["fairy"] },  // #671
  { id: "skiddo", name: "Skiddo", types: ["grass"] },  // #672
  { id: "gogoat", name: "Gogoat", types: ["grass"] },  // #673
  { id: "pancham", name: "Pancham", types: ["fighting"] },  // #674
  { id: "pangoro", name: "Pangoro", types: ["fighting", "dark"] },  // #675
  { id: "furfrou", name: "Furfrou", types: ["normal"] },  // #676
  { id: "espurr", name: "Espurr", types: ["psychic"] },  // #677
  { id: "meowstic", name: "Meowstic", types: ["psychic"] },  // #678
  { id: "honedge", name: "Honedge", types: ["steel", "ghost"] },  // #679
  { id: "doublade", name: "Doublade", types: ["steel", "ghost"] },  // #680
  { id: "aegislash", name: "Aegislash", types: ["steel", "ghost"] },  // #681
  { id: "spritzee", name: "Spritzee", types: ["fairy"] },  // #682
  { id: "aromatisse", name: "Aromatisse", types: ["fairy"] },  // #683
  { id: "swirlix", name: "Swirlix", types: ["fairy"] },  // #684
  { id: "slurpuff", name: "Slurpuff", types: ["fairy"] },  // #685
  { id: "inkay", name: "Inkay", types: ["dark", "psychic"] },  // #686
  { id: "malamar", name: "Malamar", types: ["dark", "psychic"] },  // #687
  { id: "binacle", name: "Binacle", types: ["rock", "water"] },  // #688
  { id: "barbaracle", name: "Barbaracle", types: ["rock", "water"] },  // #689
  { id: "skrelp", name: "Skrelp", types: ["poison", "water"] },  // #690
  { id: "dragalge", name: "Dragalge", types: ["poison", "dragon"] },  // #691
  { id: "clauncher", name: "Clauncher", types: ["water"] },  // #692
  { id: "clawitzer", name: "Clawitzer", types: ["water"] },  // #693
  { id: "helioptile", name: "Helioptile", types: ["electric", "normal"] },  // #694
  { id: "heliolisk", name: "Heliolisk", types: ["electric", "normal"] },  // #695
  { id: "tyrunt", name: "Tyrunt", types: ["rock", "dragon"] },  // #696
  { id: "tyrantrum", name: "Tyrantrum", types: ["rock", "dragon"] },  // #697
  { id: "amaura", name: "Amaura", types: ["rock", "ice"] },  // #698
  { id: "aurorus", name: "Aurorus", types: ["rock", "ice"] },  // #699
  { id: "sylveon", name: "Sylveon", types: ["fairy"] },  // #700
  { id: "hawlucha", name: "Hawlucha", types: ["fighting", "flying"] },  // #701
  { id: "dedenne", name: "Dedenne", types: ["electric", "fairy"] },  // #702
  { id: "carbink", name: "Carbink", types: ["rock", "fairy"] },  // #703
  { id: "goomy", name: "Goomy", types: ["dragon"] },  // #704
  { id: "sliggoo", name: "Sliggoo", types: ["dragon"] },  // #705
  { id: "goodra", name: "Goodra", types: ["dragon"] },  // #706
  { id: "klefki", name: "Klefki", types: ["steel", "fairy"] },  // #707
  { id: "phantump", name: "Phantump", types: ["ghost", "grass"] },  // #708
  { id: "trevenant", name: "Trevenant", types: ["ghost", "grass"] },  // #709
  { id: "pumpkaboo", name: "Pumpkaboo", types: ["ghost", "grass"] },  // #710
  { id: "gourgeist", name: "Gourgeist", types: ["ghost", "grass"] },  // #711
  { id: "bergmite", name: "Bergmite", types: ["ice"] },  // #712
  { id: "avalugg", name: "Avalugg", types: ["ice"] },  // #713
  { id: "noibat", name: "Noibat", types: ["flying", "dragon"] },  // #714
  { id: "noivern", name: "Noivern", types: ["flying", "dragon"] },  // #715
  { id: "xerneas", name: "Xerneas", types: ["fairy"], legendary: true },  // #716
  { id: "yveltal", name: "Yveltal", types: ["dark", "flying"], legendary: true },  // #717
  { id: "zygarde", name: "Zygarde", types: ["dragon", "ground"], legendary: true },  // #718
  { id: "diancie", name: "Diancie", types: ["rock", "fairy"], legendary: true },  // #719
  { id: "hoopa", name: "Hoopa", types: ["psychic", "ghost"], legendary: true },  // #720
  { id: "volcanion", name: "Volcanion", types: ["fire", "water"], legendary: true },  // #721
  { id: "rowlet", name: "Rowlet", types: ["grass", "flying"] },  // #722
  { id: "dartrix", name: "Dartrix", types: ["grass", "flying"] },  // #723
  { id: "decidueye", name: "Decidueye", types: ["grass", "ghost"] },  // #724
  { id: "litten", name: "Litten", types: ["fire"] },  // #725
  { id: "torracat", name: "Torracat", types: ["fire"] },  // #726
  { id: "incineroar", name: "Incineroar", types: ["fire", "dark"] },  // #727
  { id: "popplio", name: "Popplio", types: ["water"] },  // #728
  { id: "brionne", name: "Brionne", types: ["water"] },  // #729
  { id: "primarina", name: "Primarina", types: ["water", "fairy"] },  // #730
  { id: "pikipek", name: "Pikipek", types: ["normal", "flying"] },  // #731
  { id: "trumbeak", name: "Trumbeak", types: ["normal", "flying"] },  // #732
  { id: "toucannon", name: "Toucannon", types: ["normal", "flying"] },  // #733
  { id: "yungoos", name: "Yungoos", types: ["normal"] },  // #734
  { id: "gumshoos", name: "Gumshoos", types: ["normal"] },  // #735
  { id: "grubbin", name: "Grubbin", types: ["bug"] },  // #736
  { id: "charjabug", name: "Charjabug", types: ["bug", "electric"] },  // #737
  { id: "vikavolt", name: "Vikavolt", types: ["bug", "electric"] },  // #738
  { id: "crabrawler", name: "Crabrawler", types: ["fighting"] },  // #739
  { id: "crabominable", name: "Crabominable", types: ["fighting", "ice"] },  // #740
  { id: "oricorio", name: "Oricorio", types: ["fire", "flying"] },  // #741
  { id: "cutiefly", name: "Cutiefly", types: ["bug", "fairy"] },  // #742
  { id: "ribombee", name: "Ribombee", types: ["bug", "fairy"] },  // #743
  { id: "rockruff", name: "Rockruff", types: ["rock"] },  // #744
  { id: "lycanroc", name: "Lycanroc", types: ["rock"] },  // #745
  { id: "wishiwashi", name: "Wishiwashi", types: ["water"] },  // #746
  { id: "mareanie", name: "Mareanie", types: ["poison", "water"] },  // #747
  { id: "toxapex", name: "Toxapex", types: ["poison", "water"] },  // #748
  { id: "mudbray", name: "Mudbray", types: ["ground"] },  // #749
  { id: "mudsdale", name: "Mudsdale", types: ["ground"] },  // #750
  { id: "dewpider", name: "Dewpider", types: ["water", "bug"] },  // #751
  { id: "araquanid", name: "Araquanid", types: ["water", "bug"] },  // #752
  { id: "fomantis", name: "Fomantis", types: ["grass"] },  // #753
  { id: "lurantis", name: "Lurantis", types: ["grass"] },  // #754
  { id: "morelull", name: "Morelull", types: ["grass", "fairy"] },  // #755
  { id: "shiinotic", name: "Shiinotic", types: ["grass", "fairy"] },  // #756
  { id: "salandit", name: "Salandit", types: ["poison", "fire"] },  // #757
  { id: "salazzle", name: "Salazzle", types: ["poison", "fire"] },  // #758
  { id: "stufful", name: "Stufful", types: ["normal", "fighting"] },  // #759
  { id: "bewear", name: "Bewear", types: ["normal", "fighting"] },  // #760
  { id: "bounsweet", name: "Bounsweet", types: ["grass"] },  // #761
  { id: "steenee", name: "Steenee", types: ["grass"] },  // #762
  { id: "tsareena", name: "Tsareena", types: ["grass"] },  // #763
  { id: "comfey", name: "Comfey", types: ["fairy"] },  // #764
  { id: "oranguru", name: "Oranguru", types: ["normal", "psychic"] },  // #765
  { id: "passimian", name: "Passimian", types: ["fighting"] },  // #766
  { id: "wimpod", name: "Wimpod", types: ["bug", "water"] },  // #767
  { id: "golisopod", name: "Golisopod", types: ["bug", "water"] },  // #768
  { id: "sandygast", name: "Sandygast", types: ["ghost", "ground"] },  // #769
  { id: "palossand", name: "Palossand", types: ["ghost", "ground"] },  // #770
  { id: "pyukumuku", name: "Pyukumuku", types: ["water"] },  // #771
  { id: "typenull", name: "Type: Null", types: ["normal"], legendary: true },  // #772
  { id: "silvally", name: "Silvally", types: ["normal"], legendary: true },  // #773
  { id: "minior", name: "Minior", types: ["rock", "flying"] },  // #774
  { id: "komala", name: "Komala", types: ["normal"] },  // #775
  { id: "turtonator", name: "Turtonator", types: ["fire", "dragon"] },  // #776
  { id: "togedemaru", name: "Togedemaru", types: ["electric", "steel"] },  // #777
  { id: "mimikyu", name: "Mimikyu", types: ["ghost", "fairy"] },  // #778
  { id: "bruxish", name: "Bruxish", types: ["water", "psychic"] },  // #779
  { id: "drampa", name: "Drampa", types: ["normal", "dragon"] },  // #780
  { id: "dhelmise", name: "Dhelmise", types: ["ghost", "grass"] },  // #781
  { id: "jangmoo", name: "Jangmo-o", types: ["dragon"] },  // #782
  { id: "hakamoo", name: "Hakamo-o", types: ["dragon", "fighting"] },  // #783
  { id: "kommoo", name: "Kommo-o", types: ["dragon", "fighting"] },  // #784
  { id: "tapukoko", name: "Tapu Koko", types: ["electric", "fairy"], legendary: true },  // #785
  { id: "tapulele", name: "Tapu Lele", types: ["psychic", "fairy"], legendary: true },  // #786
  { id: "tapubulu", name: "Tapu Bulu", types: ["grass", "fairy"], legendary: true },  // #787
  { id: "tapufini", name: "Tapu Fini", types: ["water", "fairy"], legendary: true },  // #788
  { id: "cosmog", name: "Cosmog", types: ["psychic"], legendary: true },  // #789
  { id: "cosmoem", name: "Cosmoem", types: ["psychic"], legendary: true },  // #790
  { id: "solgaleo", name: "Solgaleo", types: ["psychic", "steel"], legendary: true },  // #791
  { id: "lunala", name: "Lunala", types: ["psychic", "ghost"], legendary: true },  // #792
  { id: "nihilego", name: "Nihilego", types: ["rock", "poison"] },  // #793
  { id: "buzzwole", name: "Buzzwole", types: ["bug", "fighting"] },  // #794
  { id: "pheromosa", name: "Pheromosa", types: ["bug", "fighting"] },  // #795
  { id: "xurkitree", name: "Xurkitree", types: ["electric"] },  // #796
  { id: "celesteela", name: "Celesteela", types: ["steel", "flying"] },  // #797
  { id: "kartana", name: "Kartana", types: ["grass", "steel"] },  // #798
  { id: "guzzlord", name: "Guzzlord", types: ["dark", "dragon"] },  // #799
  { id: "necrozma", name: "Necrozma", types: ["psychic"], legendary: true },  // #800
  { id: "magearna", name: "Magearna", types: ["steel", "fairy"], legendary: true },  // #801
  { id: "marshadow", name: "Marshadow", types: ["fighting", "ghost"], legendary: true },  // #802
  { id: "poipole", name: "Poipole", types: ["poison"] },  // #803
  { id: "naganadel", name: "Naganadel", types: ["poison", "dragon"] },  // #804
  { id: "stakataka", name: "Stakataka", types: ["rock", "steel"] },  // #805
  { id: "blacephalon", name: "Blacephalon", types: ["fire", "ghost"] },  // #806
  { id: "zeraora", name: "Zeraora", types: ["electric"], legendary: true },  // #807
  { id: "meltan", name: "Meltan", types: ["steel"], legendary: true },  // #808
  { id: "melmetal", name: "Melmetal", types: ["steel"], legendary: true },  // #809
  { id: "grookey", name: "Grookey", types: ["grass"] },  // #810
  { id: "thwackey", name: "Thwackey", types: ["grass"] },  // #811
  { id: "rillaboom", name: "Rillaboom", types: ["grass"] },  // #812
  { id: "scorbunny", name: "Scorbunny", types: ["fire"] },  // #813
  { id: "raboot", name: "Raboot", types: ["fire"] },  // #814
  { id: "cinderace", name: "Cinderace", types: ["fire"] },  // #815
  { id: "sobble", name: "Sobble", types: ["water"] },  // #816
  { id: "drizzile", name: "Drizzile", types: ["water"] },  // #817
  { id: "inteleon", name: "Inteleon", types: ["water"] },  // #818
  { id: "skwovet", name: "Skwovet", types: ["normal"] },  // #819
  { id: "greedent", name: "Greedent", types: ["normal"] },  // #820
  { id: "rookidee", name: "Rookidee", types: ["flying"] },  // #821
  { id: "corvisquire", name: "Corvisquire", types: ["flying"] },  // #822
  { id: "corviknight", name: "Corviknight", types: ["flying", "steel"] },  // #823
  { id: "blipbug", name: "Blipbug", types: ["bug"] },  // #824
  { id: "dottler", name: "Dottler", types: ["bug", "psychic"] },  // #825
  { id: "orbeetle", name: "Orbeetle", types: ["bug", "psychic"] },  // #826
  { id: "nickit", name: "Nickit", types: ["dark"] },  // #827
  { id: "thievul", name: "Thievul", types: ["dark"] },  // #828
  { id: "gossifleur", name: "Gossifleur", types: ["grass"] },  // #829
  { id: "eldegoss", name: "Eldegoss", types: ["grass"] },  // #830
  { id: "wooloo", name: "Wooloo", types: ["normal"] },  // #831
  { id: "dubwool", name: "Dubwool", types: ["normal"] },  // #832
  { id: "chewtle", name: "Chewtle", types: ["water"] },  // #833
  { id: "drednaw", name: "Drednaw", types: ["water", "rock"] },  // #834
  { id: "yamper", name: "Yamper", types: ["electric"] },  // #835
  { id: "boltund", name: "Boltund", types: ["electric"] },  // #836
  { id: "rolycoly", name: "Rolycoly", types: ["rock"] },  // #837
  { id: "carkol", name: "Carkol", types: ["rock", "fire"] },  // #838
  { id: "coalossal", name: "Coalossal", types: ["rock", "fire"] },  // #839
  { id: "applin", name: "Applin", types: ["grass", "dragon"] },  // #840
  { id: "flapple", name: "Flapple", types: ["grass", "dragon"] },  // #841
  { id: "appletun", name: "Appletun", types: ["grass", "dragon"] },  // #842
  { id: "silicobra", name: "Silicobra", types: ["ground"] },  // #843
  { id: "sandaconda", name: "Sandaconda", types: ["ground"] },  // #844
  { id: "cramorant", name: "Cramorant", types: ["flying", "water"] },  // #845
  { id: "arrokuda", name: "Arrokuda", types: ["water"] },  // #846
  { id: "barraskewda", name: "Barraskewda", types: ["water"] },  // #847
  { id: "toxel", name: "Toxel", types: ["electric", "poison"] },  // #848
  { id: "toxtricity", name: "Toxtricity", types: ["electric", "poison"] },  // #849
  { id: "sizzlipede", name: "Sizzlipede", types: ["fire", "bug"] },  // #850
  { id: "centiskorch", name: "Centiskorch", types: ["fire", "bug"] },  // #851
  { id: "clobbopus", name: "Clobbopus", types: ["fighting"] },  // #852
  { id: "grapploct", name: "Grapploct", types: ["fighting"] },  // #853
  { id: "sinistea", name: "Sinistea", types: ["ghost"] },  // #854
  { id: "polteageist", name: "Polteageist", types: ["ghost"] },  // #855
  { id: "hatenna", name: "Hatenna", types: ["psychic"] },  // #856
  { id: "hattrem", name: "Hattrem", types: ["psychic"] },  // #857
  { id: "hatterene", name: "Hatterene", types: ["psychic", "fairy"] },  // #858
  { id: "impidimp", name: "Impidimp", types: ["dark", "fairy"] },  // #859
  { id: "morgrem", name: "Morgrem", types: ["dark", "fairy"] },  // #860
  { id: "grimmsnarl", name: "Grimmsnarl", types: ["dark", "fairy"] },  // #861
  { id: "obstagoon", name: "Obstagoon", types: ["dark", "normal"] },  // #862
  { id: "perrserker", name: "Perrserker", types: ["steel"] },  // #863
  { id: "cursola", name: "Cursola", types: ["ghost"] },  // #864
  { id: "sirfetchd", name: "Sirfetch\u2019d", types: ["fighting"] },  // #865
  { id: "mrrime", name: "Mr. Rime", types: ["ice", "psychic"] },  // #866
  { id: "runerigus", name: "Runerigus", types: ["ground", "ghost"] },  // #867
  { id: "milcery", name: "Milcery", types: ["fairy"] },  // #868
  { id: "alcremie", name: "Alcremie", types: ["fairy"] },  // #869
  { id: "falinks", name: "Falinks", types: ["fighting"] },  // #870
  { id: "pincurchin", name: "Pincurchin", types: ["electric"] },  // #871
  { id: "snom", name: "Snom", types: ["ice", "bug"] },  // #872
  { id: "frosmoth", name: "Frosmoth", types: ["ice", "bug"] },  // #873
  { id: "stonjourner", name: "Stonjourner", types: ["rock"] },  // #874
  { id: "eiscue", name: "Eiscue", types: ["ice"] },  // #875
  { id: "indeedee", name: "Indeedee", types: ["psychic", "normal"] },  // #876
  { id: "morpeko", name: "Morpeko", types: ["electric", "dark"] },  // #877
  { id: "cufant", name: "Cufant", types: ["steel"] },  // #878
  { id: "copperajah", name: "Copperajah", types: ["steel"] },  // #879
  { id: "dracozolt", name: "Dracozolt", types: ["electric", "dragon"] },  // #880
  { id: "arctozolt", name: "Arctozolt", types: ["electric", "ice"] },  // #881
  { id: "dracovish", name: "Dracovish", types: ["water", "dragon"] },  // #882
  { id: "arctovish", name: "Arctovish", types: ["water", "ice"] },  // #883
  { id: "duraludon", name: "Duraludon", types: ["steel", "dragon"] },  // #884
  { id: "dreepy", name: "Dreepy", types: ["dragon", "ghost"] },  // #885
  { id: "drakloak", name: "Drakloak", types: ["dragon", "ghost"] },  // #886
  { id: "dragapult", name: "Dragapult", types: ["dragon", "ghost"] },  // #887
  { id: "zacian", name: "Zacian", types: ["fairy"], legendary: true },  // #888
  { id: "zamazenta", name: "Zamazenta", types: ["fighting"], legendary: true },  // #889
  { id: "eternatus", name: "Eternatus", types: ["poison", "dragon"], legendary: true },  // #890
  { id: "kubfu", name: "Kubfu", types: ["fighting"], legendary: true },  // #891
  { id: "urshifu", name: "Urshifu", types: ["fighting", "dark"], legendary: true },  // #892
  { id: "zarude", name: "Zarude", types: ["dark", "grass"], legendary: true },  // #893
  { id: "regieleki", name: "Regieleki", types: ["electric"], legendary: true },  // #894
  { id: "regidrago", name: "Regidrago", types: ["dragon"], legendary: true },  // #895
  { id: "glastrier", name: "Glastrier", types: ["ice"], legendary: true },  // #896
  { id: "spectrier", name: "Spectrier", types: ["ghost"], legendary: true },  // #897
  { id: "calyrex", name: "Calyrex", types: ["psychic", "grass"], legendary: true },  // #898
  { id: "wyrdeer", name: "Wyrdeer", types: ["normal", "psychic"] },  // #899
  { id: "kleavor", name: "Kleavor", types: ["bug", "rock"] },  // #900
  { id: "ursaluna", name: "Ursaluna", types: ["ground", "normal"] },  // #901
  { id: "basculegion", name: "Basculegion", types: ["water", "ghost"] },  // #902
  { id: "sneasler", name: "Sneasler", types: ["fighting", "poison"] },  // #903
  { id: "overqwil", name: "Overqwil", types: ["dark", "poison"] },  // #904
  { id: "enamorus", name: "Enamorus", types: ["fairy", "flying"], legendary: true },  // #905
  { id: "sprigatito", name: "Sprigatito", types: ["grass"] },  // #906
  { id: "floragato", name: "Floragato", types: ["grass"] },  // #907
  { id: "meowscarada", name: "Meowscarada", types: ["grass", "dark"] },  // #908
  { id: "fuecoco", name: "Fuecoco", types: ["fire"] },  // #909
  { id: "crocalor", name: "Crocalor", types: ["fire"] },  // #910
  { id: "skeledirge", name: "Skeledirge", types: ["fire", "ghost"] },  // #911
  { id: "quaxly", name: "Quaxly", types: ["water"] },  // #912
  { id: "quaxwell", name: "Quaxwell", types: ["water"] },  // #913
  { id: "quaquaval", name: "Quaquaval", types: ["water", "fighting"] },  // #914
  { id: "lechonk", name: "Lechonk", types: ["normal"] },  // #915
  { id: "oinkologne", name: "Oinkologne", types: ["normal"] },  // #916
  { id: "tarountula", name: "Tarountula", types: ["bug"] },  // #917
  { id: "spidops", name: "Spidops", types: ["bug"] },  // #918
  { id: "nymble", name: "Nymble", types: ["bug"] },  // #919
  { id: "lokix", name: "Lokix", types: ["bug", "dark"] },  // #920
  { id: "pawmi", name: "Pawmi", types: ["electric"] },  // #921
  { id: "pawmo", name: "Pawmo", types: ["electric", "fighting"] },  // #922
  { id: "pawmot", name: "Pawmot", types: ["electric", "fighting"] },  // #923
  { id: "tandemaus", name: "Tandemaus", types: ["normal"] },  // #924
  { id: "maushold", name: "Maushold", types: ["normal"] },  // #925
  { id: "fidough", name: "Fidough", types: ["fairy"] },  // #926
  { id: "dachsbun", name: "Dachsbun", types: ["fairy"] },  // #927
  { id: "smoliv", name: "Smoliv", types: ["grass", "normal"] },  // #928
  { id: "dolliv", name: "Dolliv", types: ["grass", "normal"] },  // #929
  { id: "arboliva", name: "Arboliva", types: ["grass", "normal"] },  // #930
  { id: "squawkabilly", name: "Squawkabilly", types: ["normal", "flying"] },  // #931
  { id: "nacli", name: "Nacli", types: ["rock"] },  // #932
  { id: "naclstack", name: "Naclstack", types: ["rock"] },  // #933
  { id: "garganacl", name: "Garganacl", types: ["rock"] },  // #934
  { id: "charcadet", name: "Charcadet", types: ["fire"] },  // #935
  { id: "armarouge", name: "Armarouge", types: ["fire", "psychic"] },  // #936
  { id: "ceruledge", name: "Ceruledge", types: ["fire", "ghost"] },  // #937
  { id: "tadbulb", name: "Tadbulb", types: ["electric"] },  // #938
  { id: "bellibolt", name: "Bellibolt", types: ["electric"] },  // #939
  { id: "wattrel", name: "Wattrel", types: ["electric", "flying"] },  // #940
  { id: "kilowattrel", name: "Kilowattrel", types: ["electric", "flying"] },  // #941
  { id: "maschiff", name: "Maschiff", types: ["dark"] },  // #942
  { id: "mabosstiff", name: "Mabosstiff", types: ["dark"] },  // #943
  { id: "shroodle", name: "Shroodle", types: ["poison", "normal"] },  // #944
  { id: "grafaiai", name: "Grafaiai", types: ["poison", "normal"] },  // #945
  { id: "bramblin", name: "Bramblin", types: ["grass", "ghost"] },  // #946
  { id: "brambleghast", name: "Brambleghast", types: ["grass", "ghost"] },  // #947
  { id: "toedscool", name: "Toedscool", types: ["ground", "grass"] },  // #948
  { id: "toedscruel", name: "Toedscruel", types: ["ground", "grass"] },  // #949
  { id: "klawf", name: "Klawf", types: ["rock"] },  // #950
  { id: "capsakid", name: "Capsakid", types: ["grass"] },  // #951
  { id: "scovillain", name: "Scovillain", types: ["grass", "fire"] },  // #952
  { id: "rellor", name: "Rellor", types: ["bug"] },  // #953
  { id: "rabsca", name: "Rabsca", types: ["bug", "psychic"] },  // #954
  { id: "flittle", name: "Flittle", types: ["psychic"] },  // #955
  { id: "espathra", name: "Espathra", types: ["psychic"] },  // #956
  { id: "tinkatink", name: "Tinkatink", types: ["fairy", "steel"] },  // #957
  { id: "tinkatuff", name: "Tinkatuff", types: ["fairy", "steel"] },  // #958
  { id: "tinkaton", name: "Tinkaton", types: ["fairy", "steel"] },  // #959
  { id: "wiglett", name: "Wiglett", types: ["water"] },  // #960
  { id: "wugtrio", name: "Wugtrio", types: ["water"] },  // #961
  { id: "bombirdier", name: "Bombirdier", types: ["flying", "dark"] },  // #962
  { id: "finizen", name: "Finizen", types: ["water"] },  // #963
  { id: "palafin", name: "Palafin", types: ["water"] },  // #964
  { id: "varoom", name: "Varoom", types: ["steel", "poison"] },  // #965
  { id: "revavroom", name: "Revavroom", types: ["steel", "poison"] },  // #966
  { id: "cyclizar", name: "Cyclizar", types: ["dragon", "normal"] },  // #967
  { id: "orthworm", name: "Orthworm", types: ["steel"] },  // #968
  { id: "glimmet", name: "Glimmet", types: ["rock", "poison"] },  // #969
  { id: "glimmora", name: "Glimmora", types: ["rock", "poison"] },  // #970
  { id: "greavard", name: "Greavard", types: ["ghost"] },  // #971
  { id: "houndstone", name: "Houndstone", types: ["ghost"] },  // #972
  { id: "flamigo", name: "Flamigo", types: ["flying", "fighting"] },  // #973
  { id: "cetoddle", name: "Cetoddle", types: ["ice"] },  // #974
  { id: "cetitan", name: "Cetitan", types: ["ice"] },  // #975
  { id: "veluza", name: "Veluza", types: ["water", "psychic"] },  // #976
  { id: "dondozo", name: "Dondozo", types: ["water"] },  // #977
  { id: "tatsugiri", name: "Tatsugiri", types: ["dragon", "water"] },  // #978
  { id: "annihilape", name: "Annihilape", types: ["fighting", "ghost"] },  // #979
  { id: "clodsire", name: "Clodsire", types: ["poison", "ground"] },  // #980
  { id: "farigiraf", name: "Farigiraf", types: ["normal", "psychic"] },  // #981
  { id: "dudunsparce", name: "Dudunsparce", types: ["normal"] },  // #982
  { id: "kingambit", name: "Kingambit", types: ["dark", "steel"] },  // #983
  { id: "greattusk", name: "Great Tusk", types: ["ground", "fighting"] },  // #984
  { id: "screamtail", name: "Scream Tail", types: ["fairy", "psychic"] },  // #985
  { id: "brutebonnet", name: "Brute Bonnet", types: ["grass", "dark"] },  // #986
  { id: "fluttermane", name: "Flutter Mane", types: ["ghost", "fairy"] },  // #987
  { id: "slitherwing", name: "Slither Wing", types: ["bug", "fighting"] },  // #988
  { id: "sandyshocks", name: "Sandy Shocks", types: ["electric", "ground"] },  // #989
  { id: "irontreads", name: "Iron Treads", types: ["ground", "steel"] },  // #990
  { id: "ironbundle", name: "Iron Bundle", types: ["ice", "water"] },  // #991
  { id: "ironhands", name: "Iron Hands", types: ["fighting", "electric"] },  // #992
  { id: "ironjugulis", name: "Iron Jugulis", types: ["dark", "flying"] },  // #993
  { id: "ironmoth", name: "Iron Moth", types: ["fire", "poison"] },  // #994
  { id: "ironthorns", name: "Iron Thorns", types: ["rock", "electric"] },  // #995
  { id: "frigibax", name: "Frigibax", types: ["dragon", "ice"] },  // #996
  { id: "arctibax", name: "Arctibax", types: ["dragon", "ice"] },  // #997
  { id: "baxcalibur", name: "Baxcalibur", types: ["dragon", "ice"] },  // #998
  { id: "gimmighoul", name: "Gimmighoul", types: ["ghost"] },  // #999
  { id: "gholdengo", name: "Gholdengo", types: ["steel", "ghost"] },  // #1000
  { id: "wochien", name: "Wo-Chien", types: ["dark", "grass"], legendary: true },  // #1001
  { id: "chienpao", name: "Chien-Pao", types: ["dark", "ice"], legendary: true },  // #1002
  { id: "tinglu", name: "Ting-Lu", types: ["dark", "ground"], legendary: true },  // #1003
  { id: "chiyu", name: "Chi-Yu", types: ["dark", "fire"], legendary: true },  // #1004
  { id: "roaringmoon", name: "Roaring Moon", types: ["dragon", "dark"] },  // #1005
  { id: "ironvaliant", name: "Iron Valiant", types: ["fairy", "fighting"] },  // #1006
  { id: "koraidon", name: "Koraidon", types: ["fighting", "dragon"], legendary: true },  // #1007
  { id: "miraidon", name: "Miraidon", types: ["electric", "dragon"], legendary: true },  // #1008
  { id: "walkingwake", name: "Walking Wake", types: ["water", "dragon"] },  // #1009
  { id: "ironleaves", name: "Iron Leaves", types: ["grass", "psychic"] },  // #1010
  { id: "dipplin", name: "Dipplin", types: ["grass", "dragon"] },  // #1011
  { id: "poltchageist", name: "Poltchageist", types: ["grass", "ghost"] },  // #1012
  { id: "sinistcha", name: "Sinistcha", types: ["grass", "ghost"] },  // #1013
  { id: "okidogi", name: "Okidogi", types: ["poison", "fighting"], legendary: true },  // #1014
  { id: "munkidori", name: "Munkidori", types: ["poison", "psychic"], legendary: true },  // #1015
  { id: "fezandipiti", name: "Fezandipiti", types: ["poison", "fairy"], legendary: true },  // #1016
  { id: "ogerpon", name: "Ogerpon", types: ["grass"], legendary: true },  // #1017
  { id: "archaludon", name: "Archaludon", types: ["steel", "dragon"] },  // #1018
  { id: "hydrapple", name: "Hydrapple", types: ["grass", "dragon"] },  // #1019
  { id: "gougingfire", name: "Gouging Fire", types: ["fire", "dragon"] },  // #1020
  { id: "ragingbolt", name: "Raging Bolt", types: ["electric", "dragon"] },  // #1021
  { id: "ironboulder", name: "Iron Boulder", types: ["rock", "psychic"] },  // #1022
  { id: "ironcrown", name: "Iron Crown", types: ["steel", "psychic"] },  // #1023
  { id: "terapagos", name: "Terapagos", types: ["normal"], legendary: true },  // #1024
  { id: "pecharunt", name: "Pecharunt", types: ["poison", "ghost"], legendary: true },  // #1025
];

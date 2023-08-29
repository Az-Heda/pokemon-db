let data = {
	"Abilities": {
		"description": [ "Cures any major status ailment upon switching out.", "Negates all effects of weather, but does not prevent the weather itself." ],
		"id": [ "abilities:natural_cure", "abilities:cloud_nine" ],
		"name": [ "natural-cure", "cloud-nine" ]
	},
	"Moves": {
		"move_type": [ "physical", "physical", "physical", "physical", "physical", "status", "status", "status", "special", "status", "special", "special", "physical", "special", "special", "physical", "status", "status", "status", "status", "special", "special", "special", "physical", "status", "status", "physical", "special", "status", "special", "status", "physical", "status", "physical", "status", "physical", "status", "status", "status", "physical", "physical", "status", "special", "physical", "special", "special", "status", "status", "status", "physical", "special", "special", "status", "physical", "status", "status", "physical", "special", "physical", "special", "physical", "physical", "status", "status", "physical", "physical", "status", "status", "special", "physical", "physical", "status", "special", "status", "special", "status", "status", "special", "special", "special", "physical", "physical", "status", "special", "special", "physical", "special", "status", "special", "physical", "physical", "special", "status", "physical" ],
		"name": [ "fly", "fury-attack", "body-slam", "take-down", "double-edge", "growl", "roar", "sing", "flamethrower", "mist", "ice-beam", "hyper-beam", "peck", "solar-beam", "fire-spin", "earthquake", "toxic", "agility", "mimic", "double-team", "fire-blast", "swift", "dream-eater", "sky-attack", "rest", "substitute", "thief", "snore", "protect", "mud-slap", "perish-song", "outrage", "endure", "false-swipe", "swagger", "steel-wing", "attract", "sleep-talk", "heal-bell", "return", "frustration", "safeguard", "dragon-breath", "iron-tail", "hidden-power", "twister", "rain-dance", "sunny-day", "psych-up", "rock-smash", "uproar", "heat-wave", "will-o-wisp", "facade", "helping-hand", "refresh", "secret-power", "hyper-voice", "astonish", "air-cutter", "aerial-ace", "dragon-claw", "dragon-dance", "roost", "natural-gift", "pluck", "tailwind", "power-swap", "dragon-pulse", "brave-bird", "giga-impact", "defog", "draco-meteor", "captivate", "ominous-wind", "hone-claws", "wonder-room", "round", "echoed-voice", "incinerate", "acrobatics", "bulldoze", "cotton-guard", "hurricane", "disarming-voice", "play-rough", "moonblast", "confide", "dazzling-gleam", "breaking-swipe", "dual-wingbeat", "tera-blast", "snowscape", "trailblaze" ],
		"type": [ "types:flying", "types:normal", "types:normal", "types:normal", "types:normal", "types:normal", "types:normal", "types:normal", "types:fire", "types:ice", "types:ice", "types:normal", "types:flying", "types:grass", "types:fire", "types:ground", "types:poison", "types:psychic", "types:normal", "types:normal", "types:fire", "types:normal", "types:psychic", "types:flying", "types:psychic", "types:normal", "types:dark", "types:normal", "types:normal", "types:ground", "types:normal", "types:dragon", "types:normal", "types:normal", "types:normal", "types:steel", "types:normal", "types:normal", "types:normal", "types:normal", "types:normal", "types:normal", "types:dragon", "types:steel", "types:normal", "types:dragon", "types:water", "types:fire", "types:normal", "types:fighting", "types:normal", "types:fire", "types:fire", "types:normal", "types:normal", "types:normal", "types:normal", "types:normal", "types:ghost", "types:flying", "types:flying", "types:dragon", "types:dragon", "types:flying", "types:normal", "types:flying", "types:flying", "types:psychic", "types:dragon", "types:flying", "types:normal", "types:flying", "types:dragon", "types:normal", "types:ghost", "types:dark", "types:psychic", "types:normal", "types:normal", "types:fire", "types:flying", "types:ground", "types:grass", "types:flying", "types:fairy", "types:fairy", "types:fairy", "types:normal", "types:fairy", "types:dragon", "types:flying", "types:normal", "types:ice", "types:grass" ]
	},
	"Types": [ "dragon", "flying" ],
	"dex_id": 334,
	"height": 11,
	"id": "pokemon:altaria",
	"name": "altaria",
	"weight": 206
};

console.clear();
// console.log(data);

function copy(a) {
	return JSON.parse(JSON.stringify(a));
}

['Abilities', 'Moves'].forEach((key) => {
	if (Object.keys(data).includes(key)) {
		let tempArray = [...Array(copy(data[key][Object.keys(data[key])[0]]).length).keys()].map((item) => {
			let allKeys = Object.keys(data[key]);
			let obj = {};
			allKeys.forEach((k) => {
				obj[k] = '';
			});
			return obj;
		});
		let keysInData = Object.keys(data[key]);
		console.log({ keysInData })
		keysInData.forEach((k) => {
			// tempArray[i] = data[key][k];
			data[key][k].forEach((e, i) => {
				tempArray[i][k] = copy(e);
			})
		})
		data[key] = copy(tempArray);
	}
});

console.log(data);
"use strict";

import Pokedex from 'pokedex-promise-v2';
import { Surreal } from 'surrealdb.js';
import fse from 'fs-extra';
import path from 'path';
import fs from 'fs';
import HideTerminalCursor from 'hide-terminal-cursor';
import ShowTerminalCursor from 'show-terminal-cursor';

const cursor = { hide: HideTerminalCursor, show: ShowTerminalCursor };


const p = new Pokedex({
	cacheLimit: 86400 * 1000, // 1g
	timeout: 100 * 1000 // 100s
});
const db = new Surreal('http://127.0.0.1:8000/rpc');
const options = { offset: 0, limit: 10000 };
const tempDir = 'temp';

fse.emptyDirSync(tempDir);

function filterID(id) {
	if (typeof id != 'string') {
		return id;
	}
	return id.replaceAll('-', '_');
}

async function sleep(ms) {
	return new Promise((resolve) => {
		setTimeout(() => { resolve(ms) }, ms);
	})
}

async function saveToFile(data, filename) {
	return new Promise((resolve) => {
		let fullpath = path.join(tempDir, filename);
		fs.writeFile(fullpath, JSON.stringify(data, '\t', 4), (err) => {
			if (err) throw err;
			resolve(fullpath);
		})
	})
}

function parsePerc(v) {
	return v.toFixed(2);
	// let newV = parseInt(v);
	// return (newV < 10) ? `${newV}  ` : (newV < 100) ? `${newV} ` : newV
}

async function addAll(table, list, idkey, pos=0) {
	if (pos == 0) {
		process.stdout.clearLine();
		process.stdout.cursorTo(0);
		process.stdout.write(`[ ${parsePerc(((pos) * 100) / list.length)}% ] Creazione tabella ${table}`)
	}
	// console.log({ table, list, pos})
	if (pos < list.length) {
		// process.stdout.clearLine();
		process.stdout.cursorTo(0);
		process.stdout.write(`[ ${parsePerc(((pos+1) * 100) / list.length)}% ] `);
		let item = list[pos];
		item.id = `${table}:${filterID(item[idkey])}`
		await db.create(table, list[pos])
		return await addAll(table, list, idkey, pos+1);
	}
	process.stdout.clearLine();
	process.stdout.cursorTo(0);
	process.stdout.write(`[ ${parsePerc(((pos) * 100) / list.length)}% ] Creazione tabella ${table}`);
	console.log();
	return Promise.resolve(pos);
}

function roman_to_Int(str1) {
	if(str1 == null) return -1;
	var num = char_to_int(str1.charAt(0));
	var pre, curr;
	
	for(var i = 1; i < str1.length; i++) {
		curr = char_to_int(str1.charAt(i));
		pre = char_to_int(str1.charAt(i-1));
		if(curr <= pre) {
			num += curr;
		}
		else {
			num = num - pre*2 + curr;
		}
	}
	return num;
}
	
function char_to_int(c) {
	switch (c){
		case 'I': return 1;
		case 'V': return 5;
		case 'X': return 10;
		case 'L': return 50;
		case 'C': return 100;
		case 'D': return 500;
		case 'M': return 1000;
		default: return -1;
	}
}

async function main() {
	cursor.hide();
	await db.signin({ user: 'root', pass: 'root' });
	await db.use({ ns: 'test', db: 'test' });

	// Request API
	let allPokemon = (await p.getPokemonsList(options)).results;

	let allMoves = (await p.getMovesList(options)).results;
	let allTypes = (await p.getTypesList(options)).results;	
	let allNatures = (await p.getNaturesList(options)).results;
	let allColors = (await p.getPokemonColorsList(options)).results;
	let allAbilities = (await p.getAbilitiesList(options)).results;
	let test = (await p.getPokemonColorsList(options)).results;


	let startTime = null;
	const getTime = (starting) => {
		if (starting) {
			startTime = Date.now();
		}
		return new Date(Date.now() - startTime).toISOString().substr(11, 8);
	}
	const findStats = (list, req) => {
		return  list.filter((item) => { return item.stat.name == req })
					.map((item) => { return item.base_stat })[0];
	};
	const filterMoves = (moves, game) => {
		return moves.map((item) => {
			return {
				name: `moves:${filterID(item.move.name)}`,
				method: item.version_group_details.filter((f) => { return f.version_group.name == game; }).map((m) => { return m.move_learn_method.name })[0],
				level: item.version_group_details.filter((f) => { return f.version_group.name == game; }).map((m) => { return m.level_learned_at })[0],
			}
		});
	}
	const filtraGenerazione = (r) => {
		return roman_to_Int(r.toUpperCase());
	};
	const getTypeFromDamage = (list) => {
		if (list.length > 0) {
			return list.map((item) => {
				return `types:${filterID(item.name)}`;
			})
		}
		return [];
	}
	

	//Add Pokemons
	if (false) {
		await db.query('REMOVE TABLE pokemon;');
		process.stdout.clearLine();
		process.stdout.cursorTo(0);
		process.stdout.write(`[ ${parsePerc(((0) * 100) / allPokemon.length)}% ${getTime(true)} ]  Creazione dati pokemon`)
		let allPKData = [];
		for (let pk = 0; pk < allPokemon.length; pk ++) {
			process.stdout.cursorTo(0);
			process.stdout.write(`[ ${parsePerc(((pk+1) * 100) / allPokemon.length)}% ${getTime()} ]`);
			// await sleep(750);
			let currentPK = await p.getPokemonByName(allPokemon[pk].name)
			let pokemonData = {
				name: currentPK.name,
				dex_id: currentPK.id,
				height: currentPK.height,
				weight: currentPK.weight,
				type1: `types:${filterID(currentPK.types[0].type.name)}`,
				type2: (currentPK.types.length > 1) ? `types:${filterID(currentPK.types[1].type.name)}` : null,
				stats: {
					hp: findStats(currentPK.stats, 'hp'),
					atk: findStats(currentPK.stats, 'attack'),
					def: findStats(currentPK.stats, 'defense'),
					sp_atk: findStats(currentPK.stats, 'special-attack'),
					sp_def: findStats(currentPK.stats, 'special-defense'),
					mov: findStats(currentPK.stats, 'speed'),
				},
				sprites: currentPK.sprites,
				abilities: currentPK.abilities.map((item) => {
					return {
						name: `abilities:${filterID(item.ability.name)}`,
						is_hidden: item.is_hidden,
						slot: item.slot,
					}
				}),
				moves: filterMoves(currentPK.moves, 'ultra-sun-ultra-moon'),
			}
			allPKData.push(pokemonData);
			await saveToFile(currentPK, 'test-by-name1.json');
			await saveToFile(pokemonData, 'test-by-name2.json');
		}
		process.stdout.clearLine();
		process.stdout.cursorTo(0);
		process.stdout.write(`[ ${parsePerc(100)}% ${getTime()} ] Creazione dati pokemon`)
		console.log();
		await saveToFile(allPKData, 'all-pk-data.json');
		await addAll('pokemon', allPKData, 'name');
	}
	
	// Add Moves
	if (false) {
		let allMovesData = [];
		await db.query('REMOVE TABLE moves;');
		process.stdout.clearLine();
		process.stdout.cursorTo(0);
		process.stdout.write(`[ ${parsePerc(((0) * 100) / allMoves.length)}% ${getTime(true)} ]  Creazione dati mosse`)

		for (let mv = 0; mv < allMoves.length; mv ++) {
			process.stdout.cursorTo(0);
			process.stdout.write(`[ ${parsePerc(((mv+1) * 100) / allMoves.length)}% ${getTime()} ] `);
			// await sleep(200);
			let currentMV = await p.getMoveByName(allMoves[mv].name)
			let moveData = {
				move_id: currentMV.id,
				name: currentMV.name,
				type: `types:${currentMV.type.name}`,
				accuracy: (currentMV.accuracy !== undefined) ? currentMV.accuracy : null,
				type: `types:${currentMV.type.name}`,
				move_type: (currentMV.damage_class.name !== undefined) ? currentMV.damage_class.name : null,
				power: (currentMV.power !== undefined) ? currentMV.power : null,
				pp: (currentMV.pp !== undefined) ? currentMV.pp : null,
				priority: (currentMV.priority !== undefined) ? currentMV.priority : null,
				target: currentMV.target.name.replaceAll('-', ' '),
				effect_chance: (currentMV.effect_chance !== undefined) ? currentMV.effect_chance : null,
				effect_description: (currentMV.effect_entries[0] !== undefined) ? currentMV.effect_entries[0].short_effect : null,
				description: currentMV.flavor_text_entries.filter((e) => {
					return e.language.name == 'en';
				}).map((item) => { return item.flavor_text }),
				generation: filtraGenerazione(currentMV.generation.name.replace('generation-', '')),
				pokemon: currentMV.learned_by_pokemon.map((item) => { return `pokemon:${filterID(item.name)}`}),
			}
			moveData.description = moveData.description[moveData.description.length - 1];
			allMovesData.push(moveData);
			// await saveToFile(moveData, 'test-by-name2.json');
			// await saveToFile(currentMV, 'test-all-data.json');
		}
		process.stdout.clearLine();
		process.stdout.cursorTo(0);
		process.stdout.write(`[ ${parsePerc(100)}% ${getTime()} ] Creazione dati mosse`)
		console.log();
		await saveToFile(allMovesData, 'all-mv-data.json');
		await addAll('moves', allMovesData, 'name');
	}

	// Types
	if (true) {
		let allTypesData = [];
		await db.query('REMOVE TABLE types');
		process.stdout.clearLine();
		process.stdout.cursorTo(0);
		process.stdout.write(`[ ${parsePerc(((0) * 100) / allTypes.length)}% ${getTime(true)} ]  Creazione dati tipi`)
		for (let td = 0; td < allTypes.length; td ++) {
			process.stdout.cursorTo(0);
			process.stdout.write(`[ ${parsePerc(((td+1) * 100) / allTypes.length)}% ${getTime()} ] `);
			// await sleep(200);
			let currentTD = await p.getTypeByName(allTypes[td].name);
			let typeData = {
				name: currentTD.name,
				generation: filtraGenerazione(currentTD.generation.name.replace('generation-', '')),
				type_id: currentTD.id,
				damage: {
					attack: {
						double: getTypeFromDamage(currentTD.damage_relations.double_damage_to),
						half: getTypeFromDamage(currentTD.damage_relations.half_damage_to),
						zero: getTypeFromDamage(currentTD.damage_relations.no_damage_to),
					},
					defense: {
						double: getTypeFromDamage(currentTD.damage_relations.double_damage_from),
						half: getTypeFromDamage(currentTD.damage_relations.half_damage_from),
						zero: getTypeFromDamage(currentTD.damage_relations.no_damage_from),
					},
				},
				pokemon: currentTD.pokemon.map((item) =>{ return `pokemon:${filterID(item.pokemon.name)}`}),
				moves: currentTD.moves.map((item) => { return `moves:${filterID(item.name)}`}),
			};
			allTypesData.push(typeData);
			await saveToFile(typeData, 'type-info.json');
			await saveToFile(currentTD, 'all-type-info1.json');
		}
		process.stdout.clearLine();
		process.stdout.cursorTo(0);
		process.stdout.write(`[ ${parsePerc(100)}% ${getTime()} ] Creazione dati tipi`)
		console.log('');
		await saveToFile(allTypesData, 'all-type-info2.json');
		await addAll('types', allTypesData, 'name')
	}


	// Natures 
	if (false) {
		let allNaturesData = [];
		await db.query('REMOVE TABLE natures');
		process.stdout.clearLine();
		process.stdout.cursorTo(0);
		process.stdout.write(`[ ${parsePerc(((0) * 100) / allNatures.length)}% ${getTime(true)} ]  Creazione dati nature`)
		for (let n = 0; n < allNatures.length; n ++) {
			process.stdout.cursorTo(0);
			process.stdout.write(`[ ${parsePerc(((n+1) * 100) / allNatures.length)}% ${getTime()} ] `);
			// await sleep(250);
			let currentN = await p.getNatureByName(allNatures[n].name);
			let natureData = {
				nature_id: currentN.id,
				name: currentN.name,
				stat: {
					increased: (currentN.increased_stat !== null) ? currentN.increased_stat.name : null,
					decreased: (currentN.decreased_stat !== null) ? currentN.decreased_stat.name : null,
				},
			};
			allNaturesData.push(natureData);
			// await saveToFile(natureData, 'nature-info.json');
			// await saveToFile(currentN, 'all-nature-info1.json');
		}
		process.stdout.clearLine();
		process.stdout.cursorTo(0);
		process.stdout.write(`[ ${parsePerc(100)}% ${getTime()} ] Creazione dati nature`)
		console.log();
		await saveToFile(allNaturesData, 'all-nature-info2.json');
		await addAll('natures', allNaturesData, 'name');
	}

	
	// Abilities
	if (false) {
		let allAbilitiesData = [];
		await db.query('REMOVE TABLE abilities');
		process.stdout.clearLine();
		process.stdout.cursorTo(0);
		process.stdout.write(`[ ${parsePerc(((0) * 100) / allAbilities.length)}% ${getTime(true)} ]  Creazione dati abilità`)
		for (let a = 0; a < allAbilities.length; a ++) {
			process.stdout.cursorTo(0);
			process.stdout.write(`[ ${parsePerc(((a+1) * 100) / allAbilities.length)}% ${getTime()} ] `);
			// await sleep(200);
			let currentA = await p.getAbilityByName(allAbilities[a].name);
			let abilityData = {
				ability_id: currentA.id,
				name: currentA.name,
				generation: filtraGenerazione(currentA.generation.name.replace('generation-', '')),
				description: currentA.effect_entries.filter((item) => { return item.language.name == 'en' }).map((item) => { return item.short_effect }),
				pokemon: currentA.pokemon.map((item) => { return `pokemon:${filterID(item.pokemon.name)}`}),
			};
			abilityData.description = (abilityData.description.length == 1) ? abilityData.description[0] : null;
			allAbilitiesData.push(abilityData);
			// await saveToFile(currentA, 'all-ability-info1.json');
			// await saveToFile(abilityData, 'ability-info.json');
		}
		process.stdout.clearLine();
		process.stdout.cursorTo(0);
		process.stdout.write(`[ ${parsePerc(100)}% ${getTime()} ] Creazione dati abilità`)
		console.log();
		await saveToFile(allAbilitiesData, 'all-ability-info2.json');
		await addAll('abilities', allAbilitiesData, 'name');
	}

	// scrittura file
	// await saveToFile(allPokemon, 'pk-list.json');
	// await saveToFile(allMoves, 'mv-list.json');
	// await saveToFile(allTypes, 'types-list.json');
	// await saveToFile(allNatures, 'natures-list.json');
	// await saveToFile(allColors, 'color-list.json');
	// await saveToFile(allAbilities, 'ability-list.json');
	// await saveToFile(test, 'test.json');

	// Reset database
	if (false) {
		await db.query('REMOVE TABLE colors');
		await addAll('colors', allColors, 'name')
	}

	await db.close();
	cursor.show();
	return Promise.resolve(true);
}

console.clear();
main();


// SELECT 
//     dex_id, height, weight, id, name,
//     moves.*.name AS Moves,
//     abilities.*.name AS Abilities,
//     [type1.*.name,
//     IF type2 IS NOT null
//         THEN type2.*.name
//     END] as Types
// from pokemon:altaria

// https://github.com/PokeAPI/pokedex-promise-v2
// https://pokeapi.co/docs/v2
// https://bytearcher.com/articles/refresh-changes-browser-express-livereload-nodemon/#:~:text=LiveReload%20client%20snippet
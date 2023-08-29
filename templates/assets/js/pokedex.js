const baseUrl = `${document.location.protocol}//${document.location.host}`;
let global = {
	'pokedex': {
		'x-row': 12,
	}
};


$(document).ready(() => {
	// fetch(`${baseUrl}/surreal/pokemon/list`).then(res => res.json()).then(setPokemonSelector);
	setPokedex(pokedex);
	setPokemonSelector(pokedex);
})

async function setPokemonSelector(pklist) {
	let container = document.getElementById('elencoPokemon');
	container.innerHTML = '';
	let firstOption = document.createElement('option');
	firstOption.innerHTML = '--- Seleziona';
	firstOption.setAttribute('selected', '');
	container.appendChild(firstOption);
	let pks = pklist.copy();
	pks.forEach((pk) => {
		let option = document.createElement('option');
		option.innerHTML = pk.name;
		option.value = pk.id;
		container.appendChild(option);
	});
	container.onchange = function() {
		// console(this.value);
		console.log(this.value);
		document.location.href = `${baseUrl}/pokemon/${this.value.split(':')[1]}`
	}
	return container;
}

function pokemonSelected(id) {
	fetch(`${baseUrl}/surreal/pokemon/get/${id}`).then(res => res.json()).then(showPokemon);
}

function showPokemon(data) {
	global['pokemon-selected'] = joinListData(data[0].copy(), ['Abilities', 'Moves']);
	console.log(global['pokemon-selected']);
}

function setPokedex(pokemonList) {
	let container = document.getElementById('pokedex');
	container.innerHTML = '';

	let title = document.createElement('h2');
	title.innerHTML = 'Pokedex completo';
	container.appendChild(title);
	
	global['pokedex']['data'] = pokemonList.copy()
		.filter((item) => { return item.dex_id <= 809 })
		.map((item) => {
			item.generation = getGeneration(item);
			return item;
		});
	global['pokedex']['data'].sort((a, b) => { return (a.dex_id < b.dex_id) ? -1 : (a.dex_id > b.dex_id) ? 1 : 0});
	// global['pokedex']['data'] = global['pokedex']['data'].copy().splice(300, 400);
	let gens = [...new Set(global['pokedex']['data'].copy().map((item) => { return item.generation }))]
	for (let g = 0; g < gens.length; g ++) {
		let genContainer = document.createElement('div');
		let genTitle = document.createElement('h3');

		genTitle.innerHTML = `Gen-${gens[g]}`;
		
		if (g > 0) {
			genContainer.setAttribute('style', 'margin-top: 5vh;');
		}

		genContainer.appendChild(genTitle);
		let pkOfgen = global['pokedex']['data'].copy().filter((item) => { return item.generation == gens[g] });
		for (let i = 0; i < pkOfgen.length; i += global['pokedex']['x-row']) {
			let row = document.createElement('div');
			row.classList.add('row');
			for (let j = 0; j < global['pokedex']['x-row']; j ++) {
				if (i + j < pkOfgen.length) {
					let currentPokemon = pkOfgen[i+j];
					let cell = document.createElement('div');
					let img = document.createElement('img');

					cell.classList.add('col-sm-1', 'col-md-1', 'col-lg-1');

					img.setAttribute('loading', 'lazy');
					img.setAttribute('title', currentPokemon.name);
					if (Object.keys(currentPokemon).includes('sprites')) {
						if (Object.keys(currentPokemon.sprites).includes('front_default')) {
							img.setAttribute('src', currentPokemon.sprites.front_default);
							img.onclick = () => {
								document.location.href = `${baseUrl}/pokemon/${currentPokemon.id.split(':')[1]}`
							}
						}
					}

					cell.appendChild(img);
					row.appendChild(cell);
				}
			}
			genContainer.appendChild(row);
		}
		container.appendChild(genContainer);
	}
}
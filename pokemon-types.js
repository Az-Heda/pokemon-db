const e = React.createElement;

const pokemonState = {
	"name": "bulbasaur",
	"types": [
		{
			"slot": 1,
			"type": {
				"name": "grass",
				"url": "https://pokeapi.co/api/v2/type/12/"
			}
		},
		{
			"slot": 2,
			"type": {
				"name": "poison",
				"url": "https://pokeapi.co/api/v2/type/4/"
			}
		}
	],
	"weight": 69
};

let types_data = {
	"grass": {
		"attack": {
			"double": ["ground", "rock", "water"],
			"half": ["flying", "poison", "bug", "steel", "fire", "grass", "dragon" ],
			"zero": []
		},
		"defense": {
			"half": ["ground", "water", "grass", "electric"],
			"double": ["flying", "poison", "bug", "fire", "ice"],
			"zero": []
		}
	},
	"poison": {
		"attack": {
			"double": ["grass", "fairy"],
			"half": ["poison", "ground", "rock", "fairy"],
			"zero": ["steel"]
		},
		"defense": {
			"half": ["fighting", "poison", "bug", "grass", "fairy"],
			"double": ["ground", "psychic"],
			"zero": []
		}
	}
};

const PokemonTypeChart = () => {
	if (!_.isEmpty(pokemonState)) {
		const allTypes = Object.entries(types_data);
		const pokemonType = allTypes.map(([key, value]) => {
			return (pokemonState.types.map((el) => {
				if (el.type.name === key) {
					return (
						<p key="{el.type.name}">{el.type.name}</p>
					);
				}
			}));
		});


		let weaknesses = {};
		pokemonState.types.forEach(item =>{
			let defense = types_data[item.type.name].defense;
			Object.entries(defense).forEach(([key, value]) => {
				switch(key){
					case('double'):
						value.forEach(i => {weaknesses[i] ? weaknesses[i] *= 2 : weaknesses[i] = 2});
						break;
					case('half'):
						value.forEach(i => {weaknesses[i] ? weaknesses[i] *= .5 : weaknesses[i] = .5});
						break;
					case('zero'):
						value.forEach(i => {weaknesses[i] = 0});
						break;
				}
			});
		});

		const weaknessDisplay = [];
		Object.entries(weaknesses).forEach(([key, value]) =>
		{
			weaknessDisplay.push(<li key={key}>{key} - {value}x</li>);
		});
			  return (
			<div>
				<h1>{pokemonState.name}</h1>
				<hr />
				<h2>Pokemon Type</h2>
				{pokemonType}
				<hr />
				<h2>Weaknesses</h2>
				{weaknessDisplay}

			</div>
		);
	}};


const domContainer = document.querySelector('#pokemon');
ReactDOM.render(e(PokemonTypeChart), domContainer);
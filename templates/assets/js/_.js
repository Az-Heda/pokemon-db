function joinListData(list, keysToJoin=[]) {
	let data = list.copy();
	keysToJoin.forEach((key) => {
		if (Object.keys(data).includes(key)) {
			let tempArray = [...Array(data[key][Object.keys(data[key])[0]].copy().length).keys()].map((item) => {
				let allKeys = Object.keys(data[key]);
				let obj = {};
				allKeys.forEach((k) => {
					obj[k] = '';
				});
				return obj;
			});
			let keysInData = Object.keys(data[key]);
			keysInData.forEach((k) => {
				data[key][k].forEach((e, i) => {
					tempArray[i][k] = e.copy();
					// console.log(e.copy());
				})
			})
			data[key] = tempArray.copy();;
		}
	});
	return data;
}


function getGeneration(pokemon) {
	let gens = [
		getArrayRange(1, 151),
		getArrayRange(152, 251),
		getArrayRange(252, 386),
		getArrayRange(387, 493),
		getArrayRange(494, 649),
		getArrayRange(650, 721),
		getArrayRange(722, 809),
		getArrayRange(810, 905),
		getArrayRange(906, 1010),
	];
	let correctGen = 0;

	for (let g = 0; g < gens.length; g ++) {
		if (gens[g].includes(pokemon.dex_id)) {
			correctGen = g+1;
		}
	}
	
	return correctGen;
}


function getArrayRange(start, stop, step=1) {
	if (stop < start) {
		stop += start - 1;
	}
	return  Array.from({ length: (stop - start) / step + 1 }, (value, index) => start + index * step);
}


Array.prototype.copy = function() { return JSON.parse(JSON.stringify(this)) };
Object.prototype.copy = function() { return JSON.parse(JSON.stringify(this)) };
String.prototype.capitalize = function() {
	const str = this;
	const arr = str.split(" ");
	for (var i = 0; i < arr.length; i++) {
		arr[i] = arr[i].charAt(0).toUpperCase() + arr[i].slice(1);
	}
	const str2 = arr.join(" ");
	return str2;
}
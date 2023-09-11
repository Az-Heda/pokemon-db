const expressListEndpoints = require('express-list-endpoints');
const bodyParser = require('body-parser');
const express = require('express');
const colors = require('colors');
const fse = require('fs-extra');
const cors = require('cors');
const path = require('path');
const fs = require('fs');
const errors = require('./errors');
const { default: Surreal } = require('surrealdb.js');

"use strict";

colors.enable();
const CONFIG = {
	app: { host: undefined, port: undefined, url: undefined, },
	surrealdb:{
		user: 'root', password: 'root',
		namespace: 'test', database: 'test',
		url: 'http://127.0.0.1:8000/rpc'
	},
	allowDebugMessages: true,
}

let global = {};

class WebServer {
	constructor(options) {
		CONFIG.app.host = options.host;
		CONFIG.app.port = options.port;
		CONFIG.app.url = `http://${options.host}:${options.port}`;
		
		this.started = false;
		this.app = express();
		this.app.use(cors());
		this.app.use(bodyParser.urlencoded({ extended: true }));
		this.app.listen(CONFIG.app.port, CONFIG.app.host, this.serverStarted);

		this.connections();
		this.handleOtherRequests();
		this.endpointList();
		this.connectDatabase();
	}

	serverStarted() {
		log('SERVER', `Server online a: ${CONFIG.app.url.brightGreen}`);
		this.started = true;
	}

	async connectDatabase() {
		global.db = new Surreal(CONFIG.surrealdb.url);
		await global.db.signin({ user: CONFIG.surrealdb.user, pass: CONFIG.surrealdb.password });
		await global.db.use({ ns: CONFIG.surrealdb.namespace, db: CONFIG.surrealdb.database });
		log('SURREAL-DB', `Database online a: ${CONFIG.surrealdb.url.brightGreen}`);
	}
	
	connections() {
		this.app.get('/', this.page_homepage);
		this.app.get('/pokedex', this.page_pokedex);
		this.app.get('/pokemon/:name', this.page_pokemon);
		this.app.get('/getFile/:filename', this.sendFile);
		this.app.get('/image/type/:type', this.sendTypeImage);
		this.app.get('/surreal/pokemon/list', this.getPokemonList);
		this.app.get('/surreal/pokemon/get/:id', this.getPokemonByID);
		// this.app.get('/sdb/query/:query', this.executeQuery);
	}

	handleOtherRequests() {
		this.app.get('*', this.errorPage);
		this.app.post('*', this.errorPage);
	}

	endpointList() {
		return new Promise((resolve) => {
			let eps = [];
			expressListEndpoints(this.app).forEach((endpoint) => {
				eps.push(`[${endpoint.methods.join(', ')}] ${CONFIG.app.url + (!endpoint.path.startsWith('/') ? '/' : '') + endpoint.path}`);
			});
			setTimeout(() => {
				eps.forEach((e) => {
					debugMessage('endpointList', e);
				});
				resolve(eps);
			}, 500)
		})
	}

	async executeQuery(req, res) {
		const { query } = req.params;
		let data = await global.db.query(query)
		debugMessage('executeQuery', query)
		if (data.length > 0) {
			res.json(data.map((item) => { return item.result}))
		}
		else {
			res.json(errors['QUERY-WITH-NO-OUTPUT'])
		}
	}

	page_homepage(req, res) {
		debugMessage('page.homepage', 'redirect to /pokedex');
		res.redirect('/pokedex')
	}

	async page_pokedex(req, res) {
		const file = path.join('templates', 'pokedex.html');
		debugMessage('page.pokedex', file);
		fs.readFile(file, async (err, html) => {
			if (err) throw err;
			
			html = Buffer.from(html).toString();

			html = html.replaceAll('$pokedex%', JSON.stringify((await global.db.query(`SELECT dex_id, height, weight, name, id, type1, type2, sprites from pokemon`))[0].result))

			html = Buffer.from(html, 'utf-8');
			res.writeHead(200, { 'Content-Type': 'text/html' });
			res.write(html);
			res.end();
		});
	}

	async page_pokemon(req, res) {
		const { name } = req.params;
		let names = (await global.db.query('SELECT name FROM pokemon'))[0].result.map((item) => { return item.name.replaceAll('-', '_') });
		const file = path.join('templates', 'pokemon.html');
		debugMessage(`page.pokemon.${name}`, file);
		if (names.includes(name)) {
			fs.readFile(file, async (err, html) => {
				if (err) throw err;

				html = Buffer.from(html).toString();
				const dataToReplace = {
					'pokemon': (await global.db.query(`SELECT	dex_id, height, weight, id, name, sprites,
																{ id: abilities.*.name.id,  name: abilities.*.name.name, description: abilities.*.name.description } AS Abilities,
																{
																	name: moves.*.name.name,
																	type: moves.*.name.type.name,
																	move_type: moves.*.name.move_type,
																	pp: moves.*.name.pp
																} AS Moves,
																stats.* AS Stats,
																[
																	{
																		name: type1.*.name,
																		damage: type1.*.damage
																	},
																	IF type2 IS NOT null
																		THEN { name: type2.*.name, damage: type2.*.damage }
																		ELSE { name: null, damage: null }
																	END
																] as Types
														from pokemon:${name.replaceAll('-', '_')}`))[0].result,
					'types': (await global.db.query('select name from types'))[0].result.map((item) => { return item.name }).filter((item) => { return !['shadow', 'unknown'].includes(item)}),
				}
				Object.keys(dataToReplace).forEach((k) => {
					html = html.replaceAll(`$${k}%`, JSON.stringify(dataToReplace[k]));
				})
				fs.writeFileSync(path.join('temp', `pokemon-${name}.json`), JSON.stringify(dataToReplace.pokemon, '\t', 4))
				html = Buffer.from(html, 'utf-8');
				res.writeHead(200, { 'Content-Type': 'text/html' });
				res.write(html);
				res.end();
			});
		}
		else {
			// res.redirect('/error');
			res.send(name )
		}
	}

	errorPage(req, res) {
		res.json(errors['PAGE-NOT-FOUND']);
	}

	sendTypeImage(req, res) {
		const { type } = req.params;
		const typeImageDir = path.join('templates', 'assets', 'images', 'types');
		let found = false;
		fs.readdir(typeImageDir, (err, files) => {
			if (err) throw err;
			files.forEach((file) => {
				if (type == file.split('.')[0]) {
					found = true;
					fs.readFile(path.join(typeImageDir, file), (err, pic) => {
						debugMessage('sendTypeImage', path.join(typeImageDir, file))
						if (err) throw err;
						res.writeHead(200, { 'Content-Type': 'image/svg+xml' });
						res.write(pic);
						res.end();
					});
				}
			})
		})
	}
	
	sendFile(req, res) {
		const { filename } = req.params;
		const ext = filename.split('.').splice(-1)[0];
		const dirPath = path.join('templates', 'assets', ext )
		if (fs.existsSync(dirPath)) {
			fs.readdir(dirPath, (err, files) => {
				if (err) throw err;
				let fileRequest = files.filter((file) => {
					return file == filename
				});
				// debugMessage('sendFile', fileRequest)
				if (fileRequest.length == 1) {
					debugMessage('sendFile', path.join(dirPath, fileRequest[0]))
					res.writeHead(200, { 'Content-Type': `text/${ext}` });
					res.write(fs.readFileSync(path.join(dirPath, fileRequest[0])));
					res.end();
				}
				else {
					res.json(errors['PAGE-NOT-FOUND']);
				}
			})
		}
		else {
			res.json(errors['PAGE-NOT-FOUND']);
		}
	}

	async getPokemonList(req, res) {
		let query = `SELECT 
						dex_id, height, weight,
						name, id,
						type1, type2,
						sprites
					from pokemon`;
					let data = await global.db.query(query);
		debugMessage('getPokemonList', 'Pokemon list requested')
		if (data.length > 0) {
			res.json(data.map((item) => { return item.result })[0])
		}
		else {
			res.json(errors['QUERY-WITH-NO-OUTPUT'])
		}
	}
	
	async getPokemonByID(req, res) {
		const { id } = req.params;
		let query = `SELECT	dex_id, height, weight, id, name,
							{ id: abilities.*.name.id,  name: abilities.*.name.name, description: abilities.*.name.description } AS Abilities,
							{ name: moves.*.name.name, type: moves.*.name.type.name, move_type: moves.*.name.move_type } AS Moves,
							stats.* AS Stats,
							[ type1.*.name,
							  IF type2 IS NOT null
								 THEN type2.*.name
							  END
							] as Types
					 from ${id}`;
		let data = await global.db.query(query);
		debugMessage('getPokemonByID', `Requested pokemon with id=${id}`);
		if (data.length > 0) {
			res.json(data.map((item) => { return item.result })[0])
		}
		else {
			res.json(errors['QUERY-WITH-NO-OUTPUT'])
		}
	}
}


function debugMessage(fn, msg) {
	if (CONFIG.allowDebugMessages) {
		let dt = new Date(Date.now());
		let ct = `${parseNumber(dt.getHours())}:${parseNumber(dt.getMinutes())}:${parseNumber(dt.getSeconds())}.${parseNumber(dt.getMilliseconds(), 3)}`;
		log(`debug [${__filename.replaceAll('\\', '/').split('/').splice(-1)[0]}].${fn} (${ct})`, JSON.stringify(msg), 'cyan');
	}
}

function parseNumber(n, d=2) {
	n = n+'';
	while (n.length < d) {
		n = `0${n}`;
	}
	return n;
}


function log(t, m, color='red') {
	let title = t.toUpperCase();
	title = (color == 'red') ? t.brightRed :
			(color == 'green') ? t.brightGreen :
			(color == 'cyan') ? t.brightCyan :
			t;
	console.log(`[${title}] ${m}`)
}

module.exports = WebServer; 

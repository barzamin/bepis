const _ = require('lodash');
const Discord = require('discord.js');
const tracery = require('tracery-grammar');

const config = require('./config.json');
const smut = require('./smut');

const package_json = require('./package.json');
const VERSION = package_json.version;


const bot = new Discord.Client();

const grammar = tracery.createGrammar(require('./bepis.json'));
grammar.addModifiers(tracery.baseEngModifiers);

bot.on('ready', () => {
	console.log("==> Bot logged in!");
	console.log("Currently in:", bot.guilds.map(g=>g.name));
});

bot.on('message', (m) => {
	if (m.content.toLowerCase().startsWith('bepis me')) {
		console.log(`Bepising ${m.author.username}#${m.author.discriminator}`);

		const gen = grammar.flatten('#origin#');
		console.log(`    ${gen}`);
		m.reply(gen);
	}

    if (m.content.includes("help") && m.isMentioned(bot.user)) {
        m.reply(`*fucc u* but heres some help anyway
- ofc just say "bepis me" to be quickly bepised
- \`smut me <booru name> [tags=<tags>]\`
    - supported boorus: \`${smut.BOORUS.join(', ')}\`
- to get me on UR SERVER, click this fat spicy link right down there ⤵\n     <https://discordapp.com/oauth2/authorize?client_id=283818048127893515&scope=bot&permissions=0>
- u are bein SERVED dat HAWT BEPIS by BepisBot version ${VERSION}. u can thank \`barzamin#3698\` fo dat SHIZ`);
    }

    if (m.content.toLowerCase().startsWith('smut me')) {
        const args = m.content.split(' ').slice(2);
        const argss = args.join(' ');

        const argm = argss.match(/from (\w+)(?: tags=(.+))?/i);
        if (!argm) {
            m.reply('bad command fucc u'); return;
        }
        const [,source,tags] = argm;
        const smutf = smut.get(source.trim(), tags);
        m.reply(`fetching smut...`)
            .then(m_ => {
                smutf.then(u=>{m_.delete(); m.reply(u)})
                    .catch(u=>{m.reply(`error ${u}`); m_.delete()});
            });
    }
});

bot.login(config.token);

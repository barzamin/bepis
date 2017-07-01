const _ = require('lodash');
const Discord = require('discord.js');
const tracery = require('tracery-grammar');
const redis = require('redis');

const config = _.merge(require('./config.json'), require('./secrets.json'));

const smut = require('./smut');
const inspirobotme = require('./inspirobotme');

const package_json = require('./package.json');
const VERSION = package_json.version;


const bot = new Discord.Client();
const rclient = redis.createClient(config.db.redis);

const grammar = tracery.createGrammar(require('./bepis.json'));
grammar.addModifiers(tracery.baseEngModifiers);

bot.on('ready', () => {
	console.log("==> Bot logged in!");
	console.log(`Currently in ${bot.guilds.size} servers`);
});

bot.on('message', (m) => {
	if (m.content.toLowerCase().startsWith('bepis me')) {
        rclient.hincrby("usage:command", "bepisme", 1);


		console.log(`Bepising ${m.author.username}#${m.author.discriminator}`);

		const gen = grammar.flatten('#origin#');
		console.log(`    ${gen}`);
		m.reply(gen);
	}

    if (m.content.includes("help") && m.isMentioned(bot.user)) {
        rclient.hincrby("usage:command", "help", 1);

        m.reply(`*fucc u* but heres some help anyway
- ofc just say "bepis me" to be quickly bepised
- \`smut me <booru name> [tags=<tags>]\`
	- supported boorus: \`${smut.BOORUS.join(', ')}\`
- \`🍆 inspirobot me\` will pull an *inspiring* image from <http://inspirobot.me>

- (note/news: eventually transitioning to 🍆 as a prefix)

- to get me on UR SERVER, click this fat spicy link right down there ⤵\n     <https://discordapp.com/oauth2/authorize?client_id=283818048127893515&scope=bot&permissions=0>
- u are bein SERVED dat HAWT BEPIS by BepisBot version ${VERSION}. u can thank \`barzamin#3698\` fo dat SHIZ
- ${bot.guilds.size} :floppy_disk:SERVBERS:floppy_disk: are currently bein BEPISED :eggplant:`);
    }

    if (m.content.toLowerCase().startsWith('smut me')) {
        rclient.hincrby("usage:command", "smutme", 1);

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

    if (m.content.match(/^🍆\s*inspirobot me/i)) {
        rclient.hincrby("usage:command", "inspirobotme", 1);

        inspirobotme().then(url => {
            m.channel.send(':white_check_mark: INSPIRATION GET! :white_check_mark:', {
                files: [url],
            });
        }).catch(err => {
            m.reply(`Error getting inspiration: ${err}`);
        });
    }

    if (m.content.match(/^🍆\s*stats/i)) {
        rclient.hincrby("usage:command", "stats", 1);

        rclient.hgetall("usage:command", (err, res) => {
            const statdesc = _.reverse(_.sortBy(_.toPairs(res), [o=>o[1]]))
                .map(c => `• ${c[0]} : ${c[1]}`)
                .join('\n');
            m.channel.send(`:chart_with_downwards_trend: Usage statistics :chart_with_upwards_trend:
${statdesc}`);
        });
    }
});

bot.login(config.token);

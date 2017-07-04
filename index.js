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

const leftPad = (s,c,n) => (s.length<n) ? c.repeat(n-s.length)+s : s;

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
            const stats = _.reverse(_.sortBy(_.toPairs(_.mapValues(res, v=>parseInt(v))), [o=>o[1]]));
            const hist_max = _.maxBy(stats, [c => c[1]])[1];
            const HIST_SIZE = 10;
            statmsg = "stastontics:::\n```";
            for ([cmd, usage] of stats) {
                const barlen = Math.round(usage/hist_max*HIST_SIZE);
                statmsg += `${leftPad(cmd, ' ', 15)}|${'#'.repeat(barlen)}\n`; 
            }
            statmsg += "```";
            m.channel.send(statmsg);
        });
    }

    if (m.content.match(/^🍆\s*eval\n```(?:js)?\n([\s\S]*)\n```/i) && config.owners.includes(m.author.id)) {
        const [, code] = m.content.match(/^🍆\s*eval\n```(?:js)?\n([\s\S]*)\n```/i);

        console.log(`running eval at request of ${m.author}`);
        try {
            const res = eval(code);
            m.channel.send('```\n' + inspect(res) + '```');
        } catch (e) {
            m.channel.send('```\n' + e + '```')
        }
    }
});

bot.login(config.token);

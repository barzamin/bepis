const _ = require('lodash');
const Discord = require('discord.js');
const tracery = require('tracery-grammar');
const redis = require('redis');
const {inspect} = require('util');

const config = require('./config.json');
config.token = process.env.TOKEN;

const smut = require('./smut');
const inspirobotme = require('./inspirobotme');

const package_json = require('./package.json');
const VERSION = package_json.version;


const bot = new Discord.Client();
const rclient = redis.createClient(process.env.REDIS_URL);

const bepisGrammar = tracery.createGrammar(require('./bepis.json'));
bepisGrammar.addModifiers(tracery.baseEngModifiers);

const genderGrammar = tracery.createGrammar(require('./gender.json'));
genderGrammar.addModifiers(tracery.baseEngModifiers);

const identityGrammar = tracery.createGrammar(require('./identity.json'));
identityGrammar.addModifiers(tracery.baseEngModifiers);

bot.on('ready', () => {
    console.log("==> Bot logged in!");
	console.log(`Currently in ${bot.guilds.size} servers`);
	bot.user.setPresence({game: {name: 'try 🍆help', type:0 }});
});

const leftPad = (s,c,n) => (s.length<n) ? c.repeat(n-s.length)+s : s;

bot.on('message', (m) => {
    if (m.author.id === bot.user.id) {
        return;
    }

    if (m.content.toLowerCase().startsWith('bepis me')) {
        rclient.hincrby("usage:command", "bepisme", 1);

        console.log(`Bepising ${m.author.username}#${m.author.discriminator}`);

        const gen = bepisGrammar.flatten('#origin#');
        console.log(`    ${gen}`);
        m.reply(gen);
    }

    if (m.content.match(/^🍆\s*gender/i)) {
        rclient.hincrby("usage:command", "gender", 1);

        const gen = genderGrammar.flatten('#origin#');
        m.reply(gen);
    }

    if (m.content.match(/^🍆\s*identity/i)) {
        rclient.hincrby("usage:command", "identity", 1);

        const gen = identityGrammar.flatten('#origin#');
        m.reply(gen);
    }

    if (m.content.match(/^🍆\s*help/i)) {
        rclient.hincrby("usage:command", "help", 1);

        m.reply(`*fucc u* but heres some help anyway
- ofc just say "bepis me" to be quickly bepised (*note: will stay forever unprefixed*)
- \`🍆smut me from <booru name> <tags separated by spaces>\`
    - supported boorus: \`${smut.BOORUS.join(', ')}\`
- \`🍆inspirobot me\` will pull an *inspiring* image from <http://inspirobot.me>
- \`🍆gender me\` will come up with a terrible new gender for you and your friends
- \`🍆help\` for whatever the Fuck this Shit yr reading atm is

- to get me on UR SERVER, click this fat spicy link right down there ⤵
<https://discordapp.com/oauth2/authorize?client_id=283818048127893515&scope=bot&permissions=0>

- u are bein SERVED dat HAWT BEPIS by BepisBot version ${VERSION}. u can thank \`barzamin#3698\` fo dat SHIZ
- ${bot.guilds.size} :floppy_disk:SERVBERS:floppy_disk: are currently bein BEPISED :eggplant:`);
    }

    if (m.content.match(/^🍆\s*smut ?me/i)) {
        rclient.hincrby("usage:command", "smutme", 1);

        if (m.content.includes('tags=')) {
            m.reply(`command format changed! now do \`🍆smut me from <booru name> <tags>\``);
            return;
        }

        const argm = m.content.match(/^🍆\s*smut ?me from (\w+)\s*(.+)?/i);
        if (!argm) {
            m.reply(`bad command fucc u
command changed; format is now is \`🍆smut me from <booru name> <tags>\``);
            return;
        }

        const [,source,tagargs] = argm;
        function collapse(a) {
            if (a.length === 1 && a[0] === "") {
                return [];
            } else {
                return a;
            }
        }
        const tags = collapse(tagargs.split(' '));

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
            m.channel.send('```js\n' + inspect(res) + '```');
        } catch (e) {
            m.channel.send('```\n' + e + '```')
        }
    }

    if (m.content.match(/^🍆\s*ping/i)) {
        m.channel.send(":eggplant: pong :weary:")
            .then(m_s => {
                dt = Date.now() - m_s.createdTimestamp;
                m_s.edit(`:eggplant: pong :weary: ::: **${dt}ms**`);
            });
    }
});

bot.login(config.token);

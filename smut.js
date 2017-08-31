const _ = require('lodash');

const gelbooru = require('./boorus/gelbooru');

const BOORUS = ['r34', 'rule34', 'gelbooru', 'furrybooru'];
const BOORU_FETCHERS = {
    'gelbooru': ['r34', 'rule34', 'gelbooru', 'furrybooru',
        'r34stuck'],
};
const BOORU_URLS = {
    'r34': 'http://rule34.xxx',
    'rule34': 'http://rule34.xxx',
    'gelbooru': 'http://gelbooru.com',
    'furrybooru': 'http://furry.booru.org',
    'r34stuck': 'http://rule34stuck.booru.org',
};

function get(source, tagargs) {
    console.log(`getting smut from ${source} with tagargs=${tagargs}`);

    if (source.startsWith('booru') || BOORUS.includes(source)) {
        const booru = source.startsWith('booru') ? source.split(' ').slice(1) : source;
        const fetcher = _.findKey(BOORU_FETCHERS, (o) => o.includes(booru));
        const url = BOORU_URLS[booru];
        console.log(` fetching from booru ${booru} with ${fetcher}`);

        if (fetcher == 'gelbooru') {
            const tags = tagargs?tagargs:"";

            return gelbooru.randomUrl(url, tags);
        }
    }

    return undefined;
}

module.exports = {get, BOORUS};


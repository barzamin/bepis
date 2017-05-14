const fetch = require('node-fetch');
const xml2js = require('xml2js-es6-promise');
const promisify = require('promisify-node');
const normalizeUrl = require('normalize-url');

function get(base_url, limit, postid, tags='') {
    const req_url = `${base_url}/index.php?page=dapi&s=post&q=index&limit=${limit}&pid=${postid}&tags=${tags}`;
    //console.log(`request to ${req_url}`);
    return fetch(req_url)
        .then((res) => res.text())
        .then((b) => xml2js(b))
        .then((x) => x.posts);
}

function random(base_url, tags='') {
    // get the most recent post
    return get(base_url, 1, 0, tags)
        .then(p_ => {
            const topid = p_.$.count;
            return Math.floor(Math.random() * topid);})
        .then(r => Promise.all([r, get(base_url, 1, r, tags)]))
}

function randomUrl(base_url, tags='') {
    return random(base_url, tags)
        .then(r => {
            if (!r[1].post) throw 'no images found';
            return normalizeUrl(r[1].post[0].$.file_url)
        });
}


module.exports = {get, random, randomUrl};


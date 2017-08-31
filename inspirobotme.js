const fetch = require('node-fetch');

function inspirobotme() {
    return fetch('http://inspirobot.me/api?generate=true')
        .then(res => res.text())
}

module.exports = inspirobotme;
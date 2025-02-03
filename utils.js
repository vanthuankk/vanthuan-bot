let etag;

module.exports = {
    random: {
        color: (type = '#')=>type === '#'?(x=>`${type}${'0'.repeat(6-x.length)}${x}`)(Math.floor(Math.random()*16777215).toString(16)): null,
    },
    is_imgur_die: async function (url) {
        try {
            if (!/imgur\.com/.test(url))return false;
            // etag (entity tag) link die thi etag nhu nhau het
            const $etag = async url=>(await require('axios').head(url)).headers.etag;
            if (!etag)etag = await $etag('https://i.imgur.com/qxvLG4n.mp4');
            if (etag === (await $etag(url)))return true;
        } catch(e) {
            if (/^(ERR_BAD_REQUEST|ERR_FR_TOO_MANY_REDIRECTS)$/.test(e?.code))return true;
        };

        return false;
    },
};
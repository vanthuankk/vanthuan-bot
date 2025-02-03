const FormData = require('form-data');
const axios = require('axios');

class Catbox {
    constructor(hash) {
        this.hash = hash;
    }
    async upload(file) {
        let formdata = new FormData;

        formdata.append('reqtype', 'fileupload');
        formdata.append('fileToUpload', file);

        if (this.hash)formdata.append('userhash', this.hash);

        let link = (await axios({
            method: 'POST',
            url: 'https://catbox.moe/user/api.php',
            headers: formdata.getHeaders(),
            data: formdata,
            responseType: 'text',
        })).data;

        return link;
    }
};

const catbox = new Catbox();

module.exports = {
    cfg: {
        path: '/catbox',
        query: [['url', 'https://ep.edu.vn/xem-hinh-hot-girl-de-thuong/imager_9_11850_700.jpg']],
        author: 'Niio-team',
    },
    on: {
        get: async function (req, res) {
            try {
                if (!/^https:\/\//.test(req.query.url))return res.json({
                    error: 'query "url" invalid',
                });

                const file = await axios({
                    method: 'GET',
                    url: req.query.url,
                    responseType: 'stream',
                });
                const ext = req.query.ext || require('mime-types').extension(file.headers['content-type']);

                file.data.path = 'tmp.'+ext;

                res.json({
                    url: await catbox.upload(file.data),
                });
            } catch(e) {
                console.error(e);
                res.json({
                    error: e.toString(),
                });
            }
        },
    },
}
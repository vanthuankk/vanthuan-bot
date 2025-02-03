const fs = require('fs');

const path = 'assets/girl.json';
const data = JSON.parse(fs.readFileSync(path));
const save = _=>fs.writeFileSync(path, JSON.stringify(data, 0, 4));

module.exports = {
    cfg: {
        path: '/girl-video',
        author: 'Niio-team',
    },
    on: {
        get: async function (req, res) {
            switch (req.query.action) {
                case 'check_die':
                    res.json((await Promise.all(data.urls.map(async (e, i)=>[i, e, await utils.is_imgur_die(e)]))).filter(e=>e[2] === true));
                    break;
                default: {
                    const res_link = async _=> {
                        const msg = {
                            total: data.urls.length,
                            index: data.i,
                            url: data.urls[data.i++],
                        };

                        if (!msg.url)(data.i = 0, res_link());
                        else if (await utils.is_imgur_die(msg.url))res_link();
                        else res.json(msg);
                        save();
                    };
                    res_link();
                };
                    break;
            };
        },
        put: function (req, res) {
            if (!req.body?.urls)return res.status(400).end();

            if (req.body.type === 'push') data.urls.push(...req.body.urls);
            else data.urls = data.urls.filter((e, i)=>!req.body.urls.includes(i));
            save();
            res.status(200).end();
        },
    },
}
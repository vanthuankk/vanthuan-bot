module.exports = {
    cfg: {
        path: '/imgur',
        query: [['url', 'URL']],
        author: 'Niio-team',
    },
    on: {
        get: async function (req, res) {
            try {
                let {
                    url
                } = req.query;

                if (!/^https:\/\//.test(url))return res.json({
                    error: 'query "url" invalid',
                });

                let d = new FormData();
                d.append(/(\.|)mp4/.test(url)?'video': 'image', Buffer.from(await fetch(url).then(f=>f.arrayBuffer()).catch(()=>'')).toString('base64'));
                d.append('type', 'base64');

                fetch('https://api.imgur.com/3/upload', {
                    method: 'post',
                    headers: {
                        Authorization: 'Client-ID 0beb6e44d5c89f3',
                    },
                    body: d,
                }).then(f=>f.json()).catch(f=>f.json()).then(json=>res.json({
                        url: json?.data?.link || json
                    }));
            } catch(e) {
                console.error(e);
                res.json({
                    error: e.toString()
                })
            }
        },
    },
}
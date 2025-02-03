const fs = require('fs');

if (!fs.existsSync('assets/note'))fs.mkdirSync('assets/note')

module.exports = {
    cfg: {
        path: '/note/:UUID',
        author: 'Niio-team',
    },
    on: {
        get: function (req, res) {
            const uuid = req.params.UUID;
            
            if (!uuid || uuid === ':UUID' || uuid.length > 36)res.redirect(`./${require('uuid').v4()}`);

            const path = `assets/note/${uuid}.txt`;
            const text = fs.existsSync(path)?fs.readFileSync(path, 'utf8'):'';
            
            if (fs.existsSync(path+'.raw')) {
                const path_raw = fs.readFileSync(path+'.raw', 'utf8');
                
                if (fs.existsSync(path_raw))return(res.set('content-type', 'text/plain'), res.end(fs.readFileSync(path_raw, 'utf8')));
                else return res.status(404).end();
            };
            if (req.query.raw == 'true' || !/^Mozilla/.test(req.headers['user-agent']))return(res.set('content-type', 'text/plain'), res.end(text));

            res.set('content-type', 'text/html');
            res.end(`<!--
@Author: DC-Nam
-->
<meta name="viewport" content="width=device-width, initial-scale=1.0">
<style>
    body {
        margin: 0;
        padding: 0;
        background-color: #f9f6ef;
    }

    #content {
        width: 100%
        height: 100vh;
        overflow: scroll;
        border-top: 1px solid #333;
    }

    #content div {
        display: flex;
        min-height: 100%;
        height: auto;
    }

    #content .lines {
        color: red;
        padding: 4px;
        font-size: 10px;
        text-align: right;
        margin: 1px;
        border-right: 1px solid #333;
    }

    #content textarea {
        width: 100%;
        padding: 4px 8px;
        border: none;
        font-size: 10px;
        resize: none;
        outline: none;
        background-color: #f9f6ef;
        white-space: pre;
    }
</style>
<h3>Note by Niio-team</h3>
<h6>Sau khi chỉnh sửa thay đổi hãy đợi 1s để upload data<h6>
<div id="content">
    <div>
        <div class="lines"></div>
        <textarea placeholder="..."></textarea>
    </div>
</div>
<script>
    const textarea = document.querySelector('#content textarea');
    const lines = document.querySelector('#content .lines');

    const update_lines = (thiss, texts = textarea.value.split('\\n'))=> (texts.length === 1 || texts.length !== lines.innerHTML.split('<br>')) && (lines.innerHTML = texts.map((e, i)=>(i+1)).join('<br>'));
    const put = _=>fetch(location.href, {
        method: 'PUT',
        headers: {
            'content-type': 'text/plain; charset=utf-8',
        },
        body: textarea.value,
    });
    let putt;
    const u = new URL(location.href);u.searchParams.append('raw', 'true');
    fetch(u.href, {
        method: 'GET',headers:{'user-agent':'fetch'}
    }).then(r=>r.text()).then(t=>{
    textarea.value = t;
    update_lines();
    textarea.addEventListener('input', function () {
        if (putt)clearTimeout(putt);
        putt = setTimeout(put, 1000);
        update_lines();
    })})
</script>`);
        },
        put: async function (req, res) {
            const chunks = [];

            req.on('data', chunk=>chunks.push(chunk));
            await new Promise(resolve=>req.on('end', resolve));
            
            const uuid = req.params.UUID;
            const path = `assets/note/${uuid}.txt`;
            
            if (req.query.raw) {
                if (!fs.existsSync(path+'.raw'))fs.writeFileSync(path+'.raw', `assets/note/${req.query.raw}.txt`);
            }
            else fs.writeFileSync(path, Buffer.concat(chunks));
            
            res.end();
        },
    },
}
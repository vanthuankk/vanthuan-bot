const cfg_ip = {
    // max 10 request / 5s
    max: ([10, 1000*5]),

    // neu ip bi cam se mo cam sau 1 tieng
    unlock_ms: 1000*60*60,
};

(async function () {
    const fs = require('fs');
    const express = require('express');
    const chalk = (await import('chalk')).default;

    const utils = { // giả sử bạn có một module utils để sinh màu ngẫu nhiên
        random: {
            color: () => '#' + Math.floor(Math.random() * 16777215).toString(16)
        }
    };

    const logc = (type, IP, method, url, status) => {
    const icons = {
        required: chalk.blue('🔍 [Yêu cầu]'),
        success: chalk.green('✅ [Thành công]'),
        warning: chalk.yellow('⚠️ [Cảnh báo]'),
        error: chalk.red('❌ [Lỗi]'),
    };

    const logType = icons[type.toLowerCase()] || chalk.white('[Khác]');
    const timestamp = chalk.gray(new Date().toLocaleString('vi', {
        timeZone: 'Asia/Ho_Chi_Minh',
        hour12: false,
    }));

    // Thông tin log chi tiết
    const details = [
        `${chalk.cyan('IP')}: ${chalk.magenta(IP)}`,
        `${chalk.cyan('Phương thức')}: ${chalk.yellow(method)}`,
        `${chalk.cyan('URL')}: ${chalk.green(url)}`,
        `${chalk.cyan('Trạng thái')}: ${chalk.red(status || '-')}`,
    ].join(` | `);

    console.log(`${timestamp} ${logType} ${details}`);
};

// Ví dụ sử dụng:
logc('required', '123.45.67.89', 'GET', '/api/v1/users', 200);
logc('success', '192.168.0.1', 'POST', '/login', 201);
logc('warning', '172.16.0.1', 'GET', '/api/v1/data', 429); // Cảnh báo quá giới hạn request
logc('error', '10.0.0.1', 'PUT', '/update', 500);

    const port = process.env.PORT || 80; 
    const app = express();
    const path = 'IP.json'; 
    if (!fs.existsSync(path)) fs.writeFileSync(path, '{}');
    
    const data = JSON.parse(fs.readFileSync(path));

    app.use(require('cors')());
    app.use('/static', express.static('assets/static/'));
    app.use(express.json());
    app.set('json spaces', 4);

    app.use(function (req, res, next) {
        if (/^\/static\//.test(req.url)) next();

        const forwardedFor = req.headers['x-forwarded-for'];
        const IP = forwardedFor ? forwardedFor.split(',')[0] : req.connection.remoteAddress;

        let ip = data[IP];

        if (!ip) ip = data[IP] = {
            count: 0,
            last: Date.now(),
        };
        if (ip.blocked === true) {
            if (Date.now() - ip.last >= cfg_ip.unlock_ms) {
                ip.count = 0;
                ip.last = Date.now();
                ip.blocked = false;
            } else {
                return res.end();
            }
        }
        if (ip.blocked !== true) {
            if (ip.count <= cfg_ip.max[0] && Date.now() - ip.last >= cfg_ip.max[1]) {
                ip.count = 0;
                ip.last = Date.now();
            }
            if (++ip.count > cfg_ip.max[0]) {
                ip.blocked = true;
                return res.end();
            }
        }

        logc(IP, req.method, req.url);
        if (!res.finished) next();
        fs.writeFileSync(path, JSON.stringify(data, null, 4));
    });

    // Kiểm tra và xử lý controllers trong thư mục "ctrls"
    fs.readdirSync('ctrls').map(file => {
        const ctrl = require('./ctrls/' + file);
        if (ctrl.on) {
            Object.entries(ctrl.on).map(e => {
                if (ctrl.cfg && ctrl.cfg.path) {
                    app[e[0]](ctrl.cfg.path, e[1]);
                } else {
                    console.warn(`Controller ${file} is missing cfg.path or has incorrect structure.`);
                }
            });
        } else {
            console.warn(`Controller ${file} is missing 'on' property.`);
        }
    });

    app.listen(port, () => logc(`listening on port ${port}`));
})();

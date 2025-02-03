const fs = require('fs').promises;
const path = require('path');
const stringSimilarity = require('string-similarity');
const axios = require('axios');

// Đường dẫn tới file JSON
const dataSimPath = path.join(__dirname, '..', 'assets', 'data', 'data.json');

// Nạp dữ liệu JSON
let dataSim;
async function loadDataSim() {
  try {
    const fileData = await fs.readFile(dataSimPath, 'utf-8');
    dataSim = JSON.parse(fileData);
  } catch (error) {
    console.error('Lỗi khi tải dữ liệu JSON:', error.message);
    dataSim = [];
  }
}

// Ghi dữ liệu JSON
async function saveDataSim() {
  try {
    await fs.writeFile(dataSimPath, JSON.stringify(dataSim, null, 2), 'utf-8');
  } catch (error) {
    console.error('Lỗi khi ghi dữ liệu JSON:', error.message);
  }
}

// Nạp dữ liệu lần đầu
loadDataSim();

module.exports = {
  cfg: {
    path: '/gau',
    query: [['type', 'ask', 'ans']],
    author: 'gaudev',
  },
  on: {
    get: async function (req, res) {
      try {
        const type = req.query.type;

        if (!type) {
          return res.json({ error: 'Thiếu dữ liệu để khởi chạy' });
        }

        if (type === 'ask') {
          const ask = req.query.ask;
          if (!ask) {
            return res.json({ error: 'Thiếu dữ liệu để khởi chạy chương trình' });
          }

          // Kiểm tra trong dữ liệu JSON
          const msg = dataSim.map((item) => item.ask);
          const checker = stringSimilarity.findBestMatch(ask, msg);

          if (checker.bestMatch.rating >= 1) {
            const search = checker.bestMatch.target;
            const match = dataSim.filter((item) => item.ask.toLowerCase() === search.toLowerCase());
            const selected = match[Math.floor(Math.random() * match.length)];
            const answer = selected.ans[Math.floor(Math.random() * selected.ans.length)];
            return res.json({ answer });
          }

          // Gọi API SimSimi nếu không tìm thấy câu trả lời
          const apiAnswer = await callSimSimiAPI(ask);
          if (apiAnswer) {
            // Lưu câu hỏi và câu trả lời từ API SimSimi
            const newEntry = {
              id: dataSim.length,
              ask,
              ans: [apiAnswer],
            };
            dataSim.push(newEntry);

            // Ghi dữ liệu vào file JSON
            await saveDataSim();

            return res.json({ answer: apiAnswer });
          }

          return res.json({ answer: 'tao đéo hiểu nói cái khác đi 😢' });
        }

        if (type === 'teach') {
          const ask = req.query.ask;
          const ans = req.query.ans;

          if (!ask || !ans) {
            return res.json({ error: 'Thiếu dữ liệu để thực thi lệnh' });
          }

          const existing = dataSim.find((item) => item.ask.toLowerCase() === ask.toLowerCase());

          if (existing) {
            if (existing.ans.includes(ans)) {
              return res.json({ error: 'Câu trả lời đã tồn tại!' });
            }
            existing.ans.push(ans);
          } else {
            dataSim.push({
              id: dataSim.length,
              ask,
              ans: [ans],
            });
          }

          await saveDataSim();

          return res.json({
            msg: 'Dạy sim thành công',
            data: { ask, ans },
          });
        }

        return res.json({ error: 'Loại yêu cầu không hợp lệ' });
      } catch (error) {
        console.error('Lỗi xử lý yêu cầu:', error.message);
        res.status(500).end();
      }
    },
  },
};

// Hàm gọi API SimSimi
async function callSimSimiAPI(text) {
  const url = 'https://api.simsimi.vn/v1/simtalk';
  const data = `text=${encodeURIComponent(text)}&lc=vn`;
  const headers = { 'Content-Type': 'application/x-www-form-urlencoded' };

  try {
    const response = await axios.post(url, data, { headers });
    return response.data.message || null; // Trả về câu trả lời từ API
  } catch (error) {
    console.error('Lỗi khi gọi API SimSimi:', error.message);
    return null; // Nếu API gặp lỗi, trả về null
  }
}

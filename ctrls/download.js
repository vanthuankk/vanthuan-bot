const CryptoJS = require('crypto-js');
const axios = require('axios');

// Cấu hình dữ liệu API và khóa bí mật
const _e = {
  J2DOWN_SECRET: "U2FsdGVkX18wVfoTqTpAQwAnu9WB9osIMSnldIhYg6rMvFJkhpT6eUM9YqgpTrk41mk8calhYvKyhGF0n26IDXNmtXqI8MjsXtsq0nnAQLROrsBuLnu4Mzu63mpJsGyw",
  API_URL: "https://api.zm.io.vn/v1/"
};

// Kiểm tra URL có hợp lệ không
function isRegexURL(url) {
  const regex = /(?:(?:https?|ftp|file):\/\/|www\.|ftp\.)(?:\([-A-Z0-9+&@#\/%=~_|$?!:,.]*\)|[-A-Z0-9+&@#\/%=~_|$?!:,.])*(?:\([-A-Z0-9+&@#\/%=~_|$?!:,.]*\)|[A-Z0-9+&@#\/%=~_|$])/igm;
  const match = url.match(regex);
  const cleanUrl = match ? match[0] : url;
  return /^(?:https?:\/\/)?(?:[\w-]+\.)?(tiktok|douyin|iesdouyin|capcut|instagram|threads|facebook|fb|espn|kuaishou|pinterest|pin|imdb|imgur|ifunny|reddit|youtube|youtu|twitter|x|t|vimeo|snapchat|bilibili|dailymotion|sharechat|linkedin|tumblr|hipi|getstickerpack|xvideos|xnxx|xiaohongshu|xhslink|weibo|miaopai|meipai|xiaoying|nationalvideo|yingke|soundcloud|mixcloud|spotify|zingmp3|bitchute|febspot|bandcamp|izlesene|9gag|rumble|streamable|ted|sohu|ixigua|likee|sina)\.[a-z]{2,}(\/.*)?$/i.test(cleanUrl);
}

// Giải mã khóa bí mật
function secretKey() {
  const decrypted = CryptoJS.AES.decrypt(_e.J2DOWN_SECRET, "manhg-api");
  return decrypted.toString(CryptoJS.enc.Utf8);
}

// Tạo chuỗi ngẫu nhiên
function randomString(length) {
  const chars = "ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789";
  let result = '';
  for (let i = 0; i < length; i++) {
    result += chars.charAt(Math.floor(Math.random() * chars.length));
  }
  return result;
}

// Mã hóa dữ liệu
function encryptData(data) {
  const key = CryptoJS.enc.Hex.parse(secretKey());
  const iv = CryptoJS.lib.WordArray.random(16);
  const encrypted = CryptoJS.AES.encrypt(data, key, {
    iv: iv,
    mode: CryptoJS.mode.CBC,
    padding: CryptoJS.pad.Pkcs7
  });

  return {
    iv: iv.toString(CryptoJS.enc.Hex),
    k: randomString(11) + "8QXBNv5pHbzFt5QC",
    r: "BRTsfMmf3CuN",
    encryptedData: encrypted.toString()
  };
}

// Hàm mã hóa URL và gửi yêu cầu tới API
async function encryptAndSendUrl(clearValue) {
  try {
    // Kiểm tra nếu URL không hợp lệ
    if (!isRegexURL(clearValue)) {
      console.error("Invalid URL:", clearValue);  // Log URL lỗi
      throw new Error("Invalid URL");
    }

    const data = JSON.stringify({ url: clearValue, unlock: true });
    const encryptedData = encryptData(data);

    // Gửi yêu cầu đến API
    const response = await axios.post(_e.API_URL + "social/autolink", {
      data: encryptedData
    }, {
      headers: {
        "content-type": "application/json",
        "token": "eyJ0eXAiOiJqd3QiLCJhbGciOiJIUzI1NiJ9.eyJxxx"
      }
    });

    return response.data;  // Trả về dữ liệu nhận được từ API
  } catch (error) {
    console.error("Error:", error.message);
    if (error.response) {
      console.error("Response data:", error.response.data);
      console.error("Response status:", error.response.status);
      console.error("Response headers:", error.response.headers);
    }
    throw error; // Ném lại lỗi nếu có
  }
}

// Định nghĩa các hàm để xử lý Threads
const { downloadv1, downloadv2 } = require('./threads');  // Giả định file threads.js bạn đã cung cấp trước đó

module.exports = {
    cfg: {
        path: '/download/',  // Đường dẫn API
        author: 'Satoru',        // Tên tác giả
        description: "API để gửi URL và nhận dữ liệu từ API", // Mô tả ngắn gọn về chức năng
        commandCategory: "Utility", // Loại lệnh
    },
    on: {
        get: async function (req, res) {
            try {
                const { url } = req.query;  // Nhận URL từ query string

                if (!url) {
                    return res.status(400).send({ error: "Cần có tham số 'url' để gửi yêu cầu." });
                }

                // Kiểm tra nếu URL là của Threads
                if (url.includes("threads.net")) {
                    const responseV1 = await downloadv1(url); // Lấy dữ liệu từ Threads v1
                    if (responseV1) {
                        return res.json({
                            success: true,
                            data: {
                                url: url,
                                title: responseV1.title,
                                author: responseV1.user.username,
                                profile_pic_url: responseV1.user.profile_pic_url,
                                media_urls: responseV1.results,
                                error: false
                            }
                        });
                    }
                    const responseV2 = await downloadv2(url); // Lấy dữ liệu từ Threads v2
                    if (responseV2) {
                        return res.json({
                            success: true,
                            data: {
                                url: url,
                                message: responseV2.message,
                                like_count: responseV2.like_count,
                                reply_count: responseV2.reply_count,
                                repost_count: responseV2.repost_count,
                                quote_count: responseV2.quote_count,
                                author: responseV2.author,
                                short_code: responseV2.short_code,
                                taken_at: responseV2.taken_at,
                                attachments: responseV2.attachments,
                                error: false
                            }
                        });
                    }
                }

                // Nếu không phải là threads.net, gửi URL đến API ngoài và thay đổi cấu trúc dữ liệu trả về
                const response = await encryptAndSendUrl(url);
                res.json({
                    success: true,
                    data: response,  // Trả về cấu trúc { success: true, data: ... }
                });

            } catch (error) {
                console.error("Lỗi trong API:", error);
                res.status(500).json({ error: "Đã xảy ra lỗi khi xử lý yêu cầu." });
            }
        },
    },
};

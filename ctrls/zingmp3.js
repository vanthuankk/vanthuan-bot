const axios = require('axios');
const cheerio = require('cheerio');
const FormData = require('form-data');
const express = require('express');
const app = express();

module.exports = {
    cfg: {
        path: '/zingmp3dl',  // Đường dẫn API
        author: 'gaudev',  // Tác giả
    },
    on: {
        get: async function (req, res) {
            try {
                const url = req.query.url;  // Lấy URL từ query parameter
                if (!url) {
                    return res.status(400).json({ error: 'URL parameter is required' });
                }

                const form = new FormData();
                form.append('link', url);

                // Gửi POST request đến dịch vụ lấy thông tin từ Zing MP3
                const response = await axios.post('https://m.vuiz.net/getlink/mp3zing/apizing.php', form, {
                    headers: form.getHeaders()
                });

                const resData = response.data;

                // Nếu không có kết quả, trả về lỗi
                if (!resData.success) {
                    return res.status(500).json({ error: 'Failed to fetch data from Zing MP3' });
                }

                // Dùng cheerio để trích xuất thông tin bài hát
                const $ = cheerio.load(resData.success);
                const audioElement = $('#amazingaudioplayer-1 ul.amazingaudioplayer-audios li').first();
                
                // Thông tin bài hát
                const data = {
                    title: audioElement.attr('data-title'),
                    artist: audioElement.attr('data-artist'),
                    thumb: audioElement.attr('data-image'),
                    duration: audioElement.attr('data-duration'),
                    source: audioElement.find('.amazingaudioplayer-source').attr('data-src'),
                    type: audioElement.find('.amazingaudioplayer-source').attr('data-type')
                };

                // Danh sách các chất lượng MP3
                const medias = [];
                $('.menu div a').each((index, element) => {
                    const link = $(element).attr('href');
                    const quality = $(element).text().trim();
                    medias.push({
                        link,
                        quality
                    });
                });

                // Trả về dữ liệu
                return res.json({ data, medias });
            } catch (error) {
                console.error(error.message);
                return res.status(500).json({ error: 'Something went wrong' });
            }
        },
    },
};

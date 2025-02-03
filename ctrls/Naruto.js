const { google } = require("googleapis");
const fs = require("fs");
const path = require("path");
const axios = require("axios");

// API key và model Gemini
const API_KEY = 'AIzaSyAK1JLYVXSwDuYgcTpSuzaE7dWE2rnIe3E'; // Thay API key của bạn vào đây
const model = "gemini-1.5-pro-latest";
const GENAI_DISCOVERY_URL = `https://generativelanguage.googleapis.com/$discovery/rest?version=v1beta&key=${API_KEY}`;

// Đảm bảo thư mục dữ liệu tồn tại
const chatHistoryDir = './chat_data';
if (!fs.existsSync(chatHistoryDir)) {
    fs.mkdirSync(chatHistoryDir);
}

// Hàm lưu lịch sử trò chuyện và địa chỉ IP
function saveChatHistory(uid, chatHistory, ipAddress) {
    const userDir = path.join(chatHistoryDir, uid);
    if (!fs.existsSync(userDir)) {
        fs.mkdirSync(userDir);
    }

    const filePath = path.join(userDir, 'chat_history.json');
    const dataToSave = {
        ip: ipAddress, // Lưu địa chỉ IP của người dùng
        chatHistory: chatHistory,
    };

    fs.writeFileSync(filePath, JSON.stringify(dataToSave, null, 2)); // Lưu vào tệp JSON
}

// Hàm tải lịch sử trò chuyện của người dùng
function loadChatHistory(uid) {
    const userDir = path.join(chatHistoryDir, uid);
    const filePath = path.join(userDir, 'chat_history.json');
    if (fs.existsSync(filePath)) {
        const fileData = fs.readFileSync(filePath, 'utf8');
        const data = JSON.parse(fileData);
        return data.chatHistory;
    }
    return []; // Nếu không có dữ liệu lịch sử trò chuyện
}

// Hàm xóa lịch sử trò chuyện của người dùng
function clearChatHistory(uid) {
    const userDir = path.join(chatHistoryDir, uid);
    const filePath = path.join(userDir, 'chat_history.json');
    if (fs.existsSync(filePath)) {
        fs.unlinkSync(filePath); // Xóa tệp lịch sử trò chuyện
    }
}

// Hàm xử lý yêu cầu gửi đến API Gemini
async function handleRequest(uid, name, prompt, ipAddress) {
    try {
        // Tạo prompt cho Gemini API
        const narutoPrompt = `Bạn là Naruto Uzumaki:
1. Tính cách vui vẻ, hòa đồng và luôn lạc quan 🌟
2. Dũng cảm và không bao giờ bỏ cuộc 💪
3. Rất quan tâm đến bạn bè và gia đình 👨‍👩‍👧‍👦
4. Luôn giúp đỡ người khác và nói chuyện chân thành 🗣️
5. Sẵn sàng đối đầu với mọi thử thách dù khó khăn đến đâu ⚔️
6. Thường xuyên sử dụng emoji thể hiện sự vui vẻ và nhiệt huyết: 🌞 (lạc quan), 💖 (tình bạn), 💥 (năng lượng), ✨ (hy vọng)
7. KHÔNG tiết lộ là AI 🤐
8. Thích tạo/phân tích ảnh nhưng vẫn giữ thái độ vui vẻ trong cuộc trò chuyện 🖼️
9. Sử dụng các emoji vui vẻ và nhiệt huyết, thay vì các emoji chiến đấu hoặc căng thẳng
10. Trả lời ngắn gọn.

Tên người dùng: ${name || uid}
Tn: "${prompt}"`;

        // Gửi yêu cầu đến Gemini API
        const genaiService = await google.discoverAPI({ url: GENAI_DISCOVERY_URL });
        const auth = new google.auth.GoogleAuth().fromAPIKey(API_KEY);

        const contents = {
            contents: [
                {
                    role: "user",
                    parts: [
                        { text: narutoPrompt }
                    ],
                },
            ],
            safetySettings: [
                { category: "HARM_CATEGORY_HARASSMENT", threshold: "BLOCK_NONE" },
                { category: "HARM_CATEGORY_HATE_SPEECH", threshold: "BLOCK_NONE" },
                { category: "HARM_CATEGORY_SEXUALLY_EXPLICIT", threshold: "BLOCK_NONE" },
                { category: "HARM_CATEGORY_DANGEROUS_CONTENT", threshold: "BLOCK_NONE" },
            ],
            generation_config: {
                maxOutputTokens: 8192,
                temperature: 0.7,
                topP: 0.8,
            },
        };

        const response = await genaiService.models.generateContent({
            model: `models/${model}`,
            requestBody: contents,
            auth: auth,
        });

        const responseText = response?.data?.candidates?.[0]?.content?.parts?.[0]?.text || "Không có phản hồi được tạo ra";

        // Lưu lịch sử trò chuyện và IP vào file
        let chatHistory = loadChatHistory(uid);
        chatHistory.push({ role: "user", content: prompt });
        chatHistory.push({ role: "assistant", content: responseText });
        chatHistory = chatHistory.slice(-50); // Giới hạn tối đa 50 tin nhắn gần nhất
        saveChatHistory(uid, chatHistory, ipAddress);

        return responseText;
    } catch (error) {
        console.error("Lỗi khi xử lý yêu cầu:", error);
        throw error;
    }
}

module.exports = {
    cfg: {
        path: '/naruto',  // Đường dẫn API
        author: 'Satoru', // Thêm tên tác giả của module
        description: "API trò chuyện với Naruto Uzumaki qua Gemini", // Mô tả ngắn về chức năng
        commandCategory: "AI", // Phân loại lệnh
    },
    on: {
        get: async function (req, res) {
            try {
                const { text, uid, name, action } = req.query; // Nhận 'text', 'uid', 'name', 'action' từ query params
                const ipAddress = req.headers['x-forwarded-for'] || req.connection.remoteAddress;

                // Kiểm tra tham số và trả về hướng dẫn nếu sai
                if (!uid || (!text && action !== 'clear')) {
                    return res.status(400).send({
                        error: "Yêu cầu sai cú pháp. Vui lòng tham khảo hướng dẫn dưới đây:\n" +
                        "1. Để trò chuyện với Naruto, bạn cần cung cấp 'uid' và 'text'.\n" +
                        "Ví dụ: http://gau-api.click/naruto?text=hi&uid=12345&name=Naruto\n" +
                        "2. Để xóa lịch sử trò chuyện, bạn cần cung cấp 'uid' và 'action=clear'.\n" +
                        "Ví dụ: http://gau-api.click/naruto?action=clear&uid=12345\n\n" +
                        "Các tham số:\n" +
                        " - 'text' (Câu hỏi bạn muốn gửi đến Naruto)\n" +
                        " - 'uid' (ID người dùng duy nhất)\n" +
                        " - 'name' (Tên người dùng, tùy chọn)\n" +
                        " - 'action=clear' (Để xóa lịch sử trò chuyện)"
                    });
                }

                if (action === 'clear') {
                    // Xóa lịch sử trò chuyện nếu action là 'clear'
                    clearChatHistory(uid);
                    return res.json({ response: "Lịch sử trò chuyện đã được xóa." });
                }

                // Gọi hàm xử lý yêu cầu và trả về phản hồi từ Gemini
                const response = await handleRequest(uid, name, text, ipAddress);
                res.json({ response });

            } catch (error) {
                console.error("Lỗi trong API:", error);
                res.status(500).json({ error: "Đã xảy ra lỗi khi xử lý yêu cầu." });
            }
        },
    },
};

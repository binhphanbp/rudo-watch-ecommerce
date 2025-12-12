import axios from "axios";

// ==========================
// 1. CẤU HÌNH GEMINI API
// ==========================
const GEMINI_API_KEY = ""; // ← thay vào Gemini API của ai cũng đc nhưng check xem API key có model đc gọi không
export const GEMINI_MODEL = "models/gemini-2.5-flash";

// Base URL luôn cố định
export const GEMINI_BASE_URL =
	"https://generativelanguage.googleapis.com/v1beta/";

// Tạo instance Axios
const apiGemini = axios.create({
	baseURL: GEMINI_BASE_URL,
	headers: {
		"Content-Type": "application/json",
	},
	params: {
		key: GEMINI_API_KEY, // tự động thêm ?key=...
	},
});

// ==========================
// 2. INTERCEPTOR 
// ==========================
apiGemini.interceptors.response.use(
	(response) => response,
	(error) => {
		if (!error.response) {
			error.message =
				"Không kết nối được đến Gemini API. Kiểm tra mạng hoặc API key.";
		}
		return Promise.reject(error);
	}
);

// ==========================
// 3. HÀM GỌI GEMINI
// =========================

apiGemini.post = async (url, body) => {
	if (url === "/generate") {
		const prompt = body.prompt || "";

		const payload = {
			contents: [
				{
					role: "user",
					parts: [{ text: prompt }],
				},
			],
		};

		const res = await axios.post(
			`${GEMINI_BASE_URL}${GEMINI_MODEL}:generateContent`,
			payload,
			{
				headers: { "Content-Type": "application/json" },
				params: { key: GEMINI_API_KEY },
			}
		);

		const output =
			res.data?.candidates?.[0]?.content?.parts?.[0]?.text || "";

		return { data: output };
	}

	throw new Error("API route không tồn tại: " + url);
};

export default apiGemini;

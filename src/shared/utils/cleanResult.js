/**
 * Xử lý kết quả trả về từ Gemini
 * @param {string} text - Kết quả raw từ Gemini
 * @returns {object|string} - JSON nếu parse được, string gốc nếu không
 */
export function cleanAiOutput(text) {
	if (!text) return "";
	let cleaned = text.replace(/```(json|text)?\n?/gi, "").replace(/```/g, "");
	cleaned = cleaned.trim();
	// 3. Thử parse JSON
	try {
		return JSON.parse(cleaned);
	} catch (err) {
		// Nếu parse không được thì trả về string gốc
		return cleaned;
	}
}

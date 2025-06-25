const GEMINI_API_KEY = "AIzaSyD0Bh8pwS6Q4fxi80cWlWgGuv2B5U-Q9nE";
const GEMINI_API_URL = "https://generativelanguage.googleapis.com/v1beta/models/gemini-pro:generateContent?key=" + GEMINI_API_KEY;

/**
 * Get a reply from Gemini API for a given user message.
 * @param {string} userMessage
 * @returns {Promise<string>} Gemini's reply text
 */
async function getGeminiReply(userMessage) {
    const body = {
        contents: [
            { parts: [{ text: userMessage }] }
        ]
    };
    let response;
    try {
        response = await fetch(GEMINI_API_URL, {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify(body)
        });
    } catch (networkErr) {
        throw new Error("Network error: " + networkErr.message);
    }
    if (!response.ok) {
        let errorText = await response.text();
        throw new Error("Gemini API error: " + response.status + " " + errorText);
    }
    const data = await response.json();
    return (
        data?.candidates?.[0]?.content?.parts?.[0]?.text ||
        "Sorry, I couldn't get a response from Gemini."
    );
}

// Make function available globally if needed
window.getGeminiReply = getGeminiReply;

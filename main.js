document.addEventListener("DOMContentLoaded", () => {
    const GEMINI_API_KEY = "AIzaSyD0Bh8pwS6Q4fxi80cWlWgGuv2B5U-Q9nE";
    const GEMINI_API_URL = "https://generativelanguage.googleapis.com/v1/models/gemini-1.5-flash:generateContent?key=" + GEMINI_API_KEY;

    const chatForm = document.getElementById("chatForm");
    const chatInput = document.getElementById("chatInput");
    const chatMessages = document.getElementById("chatMessages");

    function appendChatMessage(sender, text, type) {
        const msgDiv = document.createElement("div");
        msgDiv.className = type === "user" ? "mb-2 text-right" : "mb-2 text-left";
        msgDiv.innerHTML = `<span class="font-bold ${type === "user" ? 'text-\[\#FF5733\]' : 'text-gray-300'}">${sender}:</span> <span>${escapeHTML(text)}</span>`;
        chatMessages.appendChild(msgDiv);
        chatMessages.scrollTop = chatMessages.scrollHeight;
    }

    function escapeHTML(str) {
        return str.replace(/[&<>"']/g, function (m) {
            return ({
                '&': '&amp;',
                '<': '&lt;',
                '>': '&gt;',
                '"': '&quot;',
                "'": '&#39;'
            })[m];
        });
    }

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
            return "Network error: " + networkErr.message;
        }
        if (!response.ok) {
            let errorText = await response.text();
            return "Gemini API error: " + response.status + " " + errorText;
        }
        const data = await response.json();
        return (
            data?.candidates?.[0]?.content?.parts?.[0]?.text ||
            "Sorry, I couldn't get a response from Gemini."
        );
    }

    if (chatForm && chatInput && chatMessages) {
        chatForm.addEventListener("submit", async function (e) {
            e.preventDefault();
            const msg = chatInput.value.trim();
            if (!msg) return;
            appendChatMessage("You", msg, "user");
            chatInput.value = "";
            appendChatMessage("Cosmic AI", "Thinking...", "bot");
            const reply = await getGeminiReply(msg);
            appendChatMessage("Cosmic AI", reply, "bot");
        });
    }
});

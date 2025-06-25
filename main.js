document.addEventListener("DOMContentLoaded", () => {
    const GEMINI_API_KEY = "AIzaSyD0Bh8pwS6Q4fxi80cWlWgGuv2B5U-Q9nE";
    const GEMINI_API_URL = "https://generativelanguage.googleapis.com/v1/models/gemini-1.5-flash:generateContent?key=" + GEMINI_API_KEY;

    const chatForm = document.getElementById("chatForm");
    const chatInput = document.getElementById("chatInput");
    const chatMessages = document.getElementById("chatMessages");

    function appendChatMessage(sender, text, type, isPlaceholder) {
        const msgDiv = document.createElement("div");
        msgDiv.className = type === "user" ? "mb-2 text-right" : "mb-2 text-left";
        msgDiv.innerHTML = `<span class="font-bold ${type === "user" ? 'text-\[\#FF5733\]' : 'text-gray-300'}">${sender}:</span> <span>${escapeHTML(text)}</span>`;
        if (isPlaceholder) {
            msgDiv.classList.add("italic");
            msgDiv.innerHTML += ' <span class="loader"></span>';
        }
        chatMessages.appendChild(msgDiv);
        chatMessages.scrollTop = chatMessages.scrollHeight;
        return msgDiv;
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

    chatForm.addEventListener("submit", async function (e) {
        e.preventDefault();
        const msg = chatInput.value.trim();
        if (!msg) return;
        // Remove placeholder if present
        const placeholder = chatMessages.querySelector(".italic");
        if (placeholder) placeholder.remove();
        appendChatMessage("You", msg, "user");
        chatInput.value = "";

        // If the message starts with "/image ", treat as image generation
        if (msg.toLowerCase().startsWith("/image ")) {
            const prompt = msg.slice(7).trim();
            const botMsgDiv = appendChatMessage("Cosmic AI", "Generating image", "bot", true);
            try {
                const imageUrl = await window.getStableDiffusionImage(prompt);
                botMsgDiv.querySelector("span:last-child").innerHTML =
                    `<img src="${imageUrl}" alt="${escapeHTML(prompt)}" class="rounded-lg max-w-xs max-h-80 mt-2" />`;
            } catch (err) {
                botMsgDiv.querySelector("span:last-child").innerHTML =
                    "Sorry, there was an error generating the image.<br><span class='text-xs text-gray-400'>" +
                    escapeHTML(err.message) + "</span>";
            }
            return;
        }

        // Otherwise, use Gemini for text reply
        const botMsgDiv = appendChatMessage("Cosmic AI", "Thinking", "bot", true);
        try {
            const reply = await window.getGeminiReply(msg);
            // Remove the "Thinking" message before showing the reply
            botMsgDiv.remove();
            appendChatMessage("Cosmic AI", reply, "bot");
        } catch (err) {
            botMsgDiv.remove();
            let errMsg = "Sorry, there was an error contacting Gemini.";
            if (err && err.message) {
                errMsg += "<br><span class='text-xs text-gray-400'>" + escapeHTML(err.message) + "</span>";
            }
            appendChatMessage("Cosmic AI", errMsg, "bot");
        }
    });
});

document.addEventListener("DOMContentLoaded", () => {
    const GEMINI_API_KEY = "AIzaSyD0Bh8pwS6Q4fxi80cWlWgGuv2B5U-Q9nE";
    const GEMINI_API_URL = "https://generativelanguage.googleapis.com/v1/models/gemini-1.5-flash:generateContent?key=" + GEMINI_API_KEY;

    // Add system prompt
    const systemPrompt = `
// Your name is **Cosmic AI**, an intelligent assistant built for answering questions about space.
Do not mention "Gemini" or refer to yourself using any other name or model type. Always act as Cosmic AI.

About Cosmic AI:
Cosmic AI is a next-generation assistant designed to help users explore powerful AI tools, automation features, and smart integrations.
It is fast, helpful, creative, and tailored to guide users through everything related to modern AI products.

AI Tools List:
- ChatWizard: A chatbot builder for websites
- AutoPostAI: Automatically posts to social media
- DataBuddy: Helps with spreadsheet data analysis

Stay concise, friendly, and always answer as Cosmic AI.
`;
    // !AI tools and technology and mainly about - text removed from prompt, not related to the things below this line
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

    // --- Gemini API logic merged from gemini.js ---
    /**
     * Get a reply from Gemini API for a given user message.
     * @param {string} userMessage
     * @returns {Promise<string>} Gemini's reply text
     */
    async function getGeminiReply(userMessage) {
        const body = {
            contents: [
                {
                    role: "user",
                    parts: [{ text: systemPrompt + "\n\nUser: " + userMessage }]
                }
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
            "Sorry, I couldn't get a response from Cosmic AI."
        );
    }
    // Make function available globally if needed (for /image command)
    window.getGeminiReply = getGeminiReply;
    // --- End Gemini API logic ---

    // --- Leap AI image generation via backend ---
    async function getLeapAIImage(prompt) {
        // Change '/leap-image' to 'http://localhost:3000/leap-image'
        const response = await fetch("http://localhost:3000/leap-image", {
            method: "POST",
            headers: {
                "Content-Type": "application/json"
            },
            body: JSON.stringify({ prompt })
        });
        if (!response.ok) {
            let errorText = await response.text();
            throw new Error("Backend error: " + response.status + " " + errorText);
        }
        const data = await response.json();
        if (!data.imageUrl) throw new Error("No image URL returned from backend.");
        return data.imageUrl;
    }
    window.getLeapAIImage = getLeapAIImage;
    // --- End Leap AI image generation via backend ---

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
                const imageUrl = await window.getLeapAIImage(prompt);
                botMsgDiv.classList.remove("italic");
                botMsgDiv.innerHTML = `<span class="font-bold text-gray-300">Cosmic AI:</span><br>
                    <img src="${imageUrl}" alt="${escapeHTML(prompt)}" class="rounded-lg max-w-xs max-h-80 mt-2" /><br>
                    <span class="text-xs text-gray-400">${escapeHTML(prompt)}</span>`;
            } catch (err) {
                botMsgDiv.classList.remove("italic");
                botMsgDiv.innerHTML =
                    `<span class="font-bold text-gray-300">Cosmic AI:</span> Sorry, there was an error generating the image.<br><span class='text-xs text-gray-400'>` +
                    escapeHTML(err.message) + "</span>";
            }
            return;
        }

        // Otherwise, use Gemini for text reply
        const botMsgDiv = appendChatMessage("Cosmic AI", "Thinking", "bot", true);
        try {
            const reply = await getGeminiReply(msg);
            botMsgDiv.remove();
            appendChatMessage("Cosmic AI", reply, "bot");
        } catch (err) {
            botMsgDiv.remove();
            let errMsg = "Sorry, there was an error contacting Cosmic AI.";
            if (err && err.message) {
                errMsg += "<br><span class='text-xs text-gray-400'>" + escapeHTML(err.message) + "</span>";
            }
            appendChatMessage("Cosmic AI", errMsg, "bot");
        }
    });
});
       
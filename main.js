document.addEventListener("DOMContentLoaded", () => {
    // Dark mode logic
    let isDarkMode = true;
    const darkModeToggleBtn = document.getElementById("darkModeToggle");
    const moonIcon = document.getElementById("moonIcon");
    const sunIcon = document.getElementById("sunIcon");

    function applyTheme(theme) {
        if (theme === "dark") {
            document.body.classList.add("dark-mode");
            if (moonIcon) moonIcon.classList.add("hidden");
            if (sunIcon) sunIcon.classList.remove("hidden");
            isDarkMode = true;
        } else {
            document.body.classList.remove("dark-mode");
            if (moonIcon) moonIcon.classList.remove("hidden");
            if (sunIcon) sunIcon.classList.add("hidden");
            isDarkMode = false;
        }
        localStorage.setItem("theme", theme);
    }

    function toggleDarkMode() {
        if (isDarkMode) {
            applyTheme("light");
        } else {
            applyTheme("dark");
        }
    }

    // On load, set dark mode by default unless user prefers light
    const savedTheme = localStorage.getItem("theme");
    if (savedTheme === "light") {
        applyTheme("light");
    } else {
        applyTheme("dark");
    }
    if (darkModeToggleBtn) {
        darkModeToggleBtn.addEventListener("click", toggleDarkMode);
    }

    // Chat logic
    const chatForm = document.getElementById("chatForm");
    const chatInput = document.getElementById("chatInput");
    const chatMessages = document.getElementById("chatMessages");

    function appendChatMessage(sender, text, type, isLoading = false) {
        const msgDiv = document.createElement("div");
        msgDiv.className = "flex " + (type === "user" ? "justify-end" : "justify-start");
        msgDiv.innerHTML = `
            <div class="max-w-xl px-4 py-3 rounded-2xl shadow ${type === "user" ? 'bg-\\[\\#FF5733\\] text-white' : 'bg-gray-800 text-gray-100'}">
                <span class="block text-xs mb-1 font-bold ${type === "user" ? '' : 'text-\\[\\#FF5733\\]'}">${sender}</span>
                <span>${escapeHTML(text)}${isLoading ? ' <span class="animate-pulse">...</span>' : ''}</span>
            </div>
        `;
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

    chatForm.addEventListener("submit", async function (e) {
        e.preventDefault();
        const msg = chatInput.value.trim();
        if (msg) {
            // Remove placeholder if present
            const placeholder = chatMessages.querySelector(".italic");
            if (placeholder) placeholder.remove();
            appendChatMessage("You", msg, "user");
            chatInput.value = "";
            // Show loading bot message
            const botMsgDiv = appendChatMessage("Cosmic AI", "Thinking", "bot", true);
            try {
                const reply = await getGeminiReply(msg);
                botMsgDiv.querySelector("span:last-child").innerHTML = escapeHTML(reply);
            } catch (err) {
                let errMsg = "Sorry, there was an error contacting Gemini.";
                if (err && err.message) {
                    errMsg += "<br><span class='text-xs text-gray-400'>" + escapeHTML(err.message) + "</span>";
                }
                botMsgDiv.querySelector("span:last-child").innerHTML = errMsg;
            }
        }
    });

    chatInput.focus();
});

const MY_USER = "marcocarbajalb";

const detectURL = (text) => {
    const match = text.match(/https?:\/\/[^\s]+/);
    return match ? match[0] : null;
};

const addPreview = async (url, bubble) => {
    try {
        const response = await fetch("/api/preview?url=" + encodeURIComponent(url));
        if (!response.ok) return;
        const data = await response.json();

        if (!data.title) return;

        const preview = document.createElement("div");
        preview.classList.add("preview");

        if (data.image) {
            const img = document.createElement("img");
            img.src = data.image;
            img.classList.add("preview-image");
            preview.appendChild(img);
        }

        const title = document.createElement("span");
        title.classList.add("preview-title");
        title.textContent = data.title;
        preview.appendChild(title);

        if (data.description) {
            const desc = document.createElement("span");
            desc.classList.add("preview-desc");
            desc.textContent = data.description;
            preview.appendChild(desc);
        }

        bubble.appendChild(preview);
    } catch (err) {
        console.error("No se pudo cargar la preview:", err);
    }
};

const getMessages = async () => {
    try {
        const response = await fetch("/api/messages");
        if (!response.ok) throw new Error("Error del servidor");
        const messages = await response.json();

        const validMessages = messages.filter(m =>
            (m.author || m.user)?.trim() && m.text?.trim()
        );

        const chatBox = document.getElementById("chat-box");

        const isAtBottom = chatBox.scrollHeight - chatBox.scrollTop - chatBox.clientHeight < 50;

        chatBox.innerHTML = "";

        for (let i = 0; i < validMessages.length; i++) {
            const message = validMessages[i];
            const author = message.author || message.user;
            const isOwn = author === MY_USER;

            const bubble = document.createElement("div");
            bubble.classList.add("bubble", isOwn ? "own" : "other");

            if (!isOwn) {
                const authorEl = document.createElement("span");
                authorEl.classList.add("author");
                authorEl.textContent = author;
                bubble.appendChild(authorEl);
            }

            const textEl = document.createElement("span");
            const url = detectURL(message.text);
            if (url) {
                const parts = message.text.split(url);
                textEl.appendChild(document.createTextNode(parts[0]));
                const link = document.createElement("a");
                link.href = url;
                link.textContent = url;
                link.target = "_blank";
                link.classList.add("message-link");
                textEl.appendChild(link);
                textEl.appendChild(document.createTextNode(parts[1] || ""));
            } else {
                textEl.textContent = message.text;
            }
            bubble.appendChild(textEl);

            chatBox.appendChild(bubble);

            if (url) {
                addPreview(url, bubble);
            }
        }

        if (isAtBottom) {
            chatBox.scrollTop = chatBox.scrollHeight;
        }
    } catch (err) {
        console.error("No se pudieron cargar los mensajes:", err);
    }
};

const postMessage = async (message) => {
    try {
        const response = await fetch("/api/messages", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify(message),
        });
        if (!response.ok) throw new Error("Error al enviar mensaje");
        await getMessages();
    } catch (err) {
        console.error("No se pudo enviar el mensaje:", err);
    }
};

getMessages();

setInterval(() => {
    getMessages();
}, 5000);

const sendButton = document.getElementById("send-button");
const userInput = document.getElementById("user-input");

const send = () => {
    const message = userInput.value;
    if (message.trim() !== "") {
        postMessage({ user: MY_USER, text: message });
        userInput.value = "";
        const counter = document.getElementById("char-count");
        counter.textContent = 140;
        counter.style.color = "#8696a0";
    }
};

sendButton.addEventListener("click", send);

userInput.addEventListener("keydown", (e) => {
    if (e.key === "Enter" && !e.shiftKey) {
        e.preventDefault();
        send();
    }
});

userInput.addEventListener("input", () => {
    const remaining = 140 - userInput.value.length;
    const counter = document.getElementById("char-count");
    counter.textContent = remaining;
    counter.style.color = remaining <= 20 ? "#ef4444" : "#8696a0";
});
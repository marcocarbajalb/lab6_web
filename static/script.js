const MY_USER = "Marco Carbajal";

const getMessages = async () => {
    try {
        const response = await fetch("/api/messages");
        if (!response.ok) throw new Error("Error del servidor");
        const messages = await response.json();

        const validMessages = messages.filter(m =>
            (m.author || m.user)?.trim() && m.text?.trim()
        );

        const chatBox = document.getElementById("chat-box");
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
            textEl.textContent = message.text;
            bubble.appendChild(textEl);

            chatBox.appendChild(bubble);
        }

        chatBox.scrollTop = chatBox.scrollHeight;
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
    }
};

sendButton.addEventListener("click", send);

userInput.addEventListener("keydown", (e) => {
    if (e.key === "Enter" && !e.shiftKey) {
        e.preventDefault();
        send();
    }
});
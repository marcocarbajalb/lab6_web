const getMessages = async () => {
    try {
        const response = await fetch("/api/messages");
        if (!response.ok) throw new Error("Error del servidor");
        const messages = await response.json();

        const chatBox = document.getElementById("chat-box");
        chatBox.innerHTML = "";

        const validMessages = messages.filter(m =>
            (m.author || m.user)?.trim() && m.text?.trim()
        );

        for (let i = 0; i < validMessages.length; i++) {
            const message = validMessages[i];

            const div = document.createElement("div");

            const strong = document.createElement("strong");
            strong.textContent = message.author || message.user;

            const span = document.createElement("span");
            span.textContent = message.text;

            div.appendChild(strong);
            div.appendChild(span);
            chatBox.appendChild(div);
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

sendButton.addEventListener("click", () => {
    const message = userInput.value;
    if (message.trim() !== "") {
        postMessage({
            user: "marcocarbajalb",
            text: message,
        });
        userInput.value = "";
    }
});
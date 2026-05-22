const chatToggle =
  document.getElementById("chat-toggle");

const chatContainer =
  document.getElementById("chat-container");

const closeChat =
  document.getElementById("close-chat");

const sendBtn =
  document.getElementById("send-btn");

const chatInput =
  document.getElementById("chat-input");

const chatMessages =
  document.getElementById("chat-messages");

const typing =
  document.getElementById("typing");

/* ===========================
   OPEN / CLOSE
=========================== */
chatToggle.onclick = () => {
  chatContainer.classList.toggle("hidden");
};

closeChat.onclick = () => {
  chatContainer.classList.add("hidden");
};

/* ===========================
   SEND MESSAGE
=========================== */
async function sendMessage() {

  const message =
    chatInput.value.trim();

  if (!message) return;

  /* USER MESSAGE */
  addMessage(message, "user");

  chatInput.value = "";

  typing.classList.remove("hidden");

  try {

    const response = await fetch(
      "http://localhost:5002/api/ai/chat",
      {
        method: "POST",

        headers: {
          "Content-Type":
            "application/json",
        },

        body: JSON.stringify({
          message,
        }),
      }
    );

    const data =
      await response.json();

    typing.classList.add("hidden");

    addMessage(
      data.reply || "No response",
      "bot"
    );

    /* PRODUCTS */
    if (
      data.products &&
      data.products.length > 0
    ) {

      data.products.forEach((p) => {

        addMessage(
          `
🛍 <b>${p.name}</b><br>
💵 $${p.price}<br>
📦 Stock: ${p.stock}
`,
          "bot"
        );

      });

    }

  } catch (err) {

    typing.classList.add("hidden");

    addMessage(
      "⚠️ AI server error.",
      "bot"
    );

    console.log(err);

  }
}

/* ===========================
   ADD MESSAGE
=========================== */
function addMessage(text, sender) {

  const div =
    document.createElement("div");

  div.className =
    sender === "user"
      ? "user-message"
      : "bot-message";

  div.innerHTML = text;

  chatMessages.appendChild(div);

  chatMessages.scrollTop =
    chatMessages.scrollHeight;
}

/* ===========================
   EVENTS
=========================== */
sendBtn.onclick = sendMessage;

chatInput.addEventListener(
  "keypress",
  (e) => {

    if (e.key === "Enter") {
      sendMessage();
    }

  }
);
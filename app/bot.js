const { default: makeWASocket, useSingleFileAuthState } = require('@adiwajshing/baileys');
const express = require("express");
const fs = require("fs");

// Autenticação
const { state, saveState } = useSingleFileAuthState("./auth_info.json");

const app = express();
const PORT = process.env.PORT || 3000;

let sock;

async function startBot() {
    sock = makeWASocket({
        auth: state,
    });

    // Evento: Receber mensagens
    sock.ev.on("messages.upsert", async (msg) => {
        const message = msg.messages[0];
        if (!message.key.fromMe && message.message) {
            const text = message.message.conversation;
            console.log("Mensagem recebida:", text);

            // Resposta automática
            let reply = "Olá! Bem-vindo ao suporte da Euforotec. Como posso ajudar?";
            if (text.toLowerCase().includes("site")) {
                reply = "Podemos ajudar com otimização de sites. Qual é a sua necessidade?";
            } else if (text.toLowerCase().includes("automação")) {
                reply = "Oferecemos serviços de automação. Vamos conversar mais sobre isso?";
            }

            await sock.sendMessage(message.key.remoteJid, {
                text: reply,
            });
        }
    });

    sock.ev.on("connection.update", (update) => {
        const { connection, lastDisconnect } = update;
        if (connection === "close") {
            console.log("Conexão perdida. Tentando reconectar...");
            startBot();
        } else if (connection === "open") {
            console.log("Bot conectado ao WhatsApp!");
        }
    });

    sock.ev.on("creds.update", saveState);
}

// Iniciar o bot
app.get("/start", async (req, res) => {
    await startBot();
    res.send("Bot iniciado!");
});

// Endpoint de teste
app.get("/", (req, res) => {
    res.send("O bot está rodando no Railway!");
});

app.listen(PORT, () => {
    console.log(`Servidor rodando na porta ${PORT}`);
});


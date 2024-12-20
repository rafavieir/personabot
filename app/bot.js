// Importa dependências necessárias
const { default: makeWASocket, useSingleFileAuthState } = require("@adiwajshing/baileys");
const express = require("express");
const qrcode = require("qrcode");
const fs = require("fs");

// Configuração de autenticação: credenciais salvas no arquivo auth_info.json
const { state, saveState } = useSingleFileAuthState("./auth_info.json");

const app = express();
const PORT = process.env.PORT || 3000;

let sock; // Variável para armazenar a conexão do Baileys
let qrCode; // Variável para armazenar o QR Code gerado

// Função principal para iniciar o bot
async function startBot() {
    sock = makeWASocket({
        auth: state, // Usa as credenciais do arquivo auth_info.json
    });

    // Evento de atualização de conexão
    sock.ev.on("connection.update", (update) => {
        const { connection, qr, lastDisconnect } = update;

        if (qr) {
            // Gera o QR Code como uma URL base64
            qrcode.toDataURL(qr, (err, url) => {
                if (err) {
                    console.error("Erro ao gerar QR Code:", err);
                } else {
                    qrCode = url; // Armazena o QR Code gerado
                    console.log("QR Code gerado! Acesse o endpoint /qr para visualizar.");
                }
            });
        }

        if (connection === "open") {
            console.log("WhatsApp conectado com sucesso!");
        } else if (connection === "close") {
            const shouldReconnect = lastDisconnect.error?.output?.statusCode !== 401;
            console.log("Conexão encerrada. Reconectando...", shouldReconnect);
            if (shouldReconnect) startBot(); // Tenta reconectar automaticamente
        }
    });

    // Evento para salvar credenciais atualizadas
    sock.ev.on("creds.update", saveState);

    // Evento de mensagens recebidas
    sock.ev.on("messages.upsert", async (msg) => {
        const message = msg.messages[0];
        if (!message.key.fromMe && message.message) {
            const text = message.message.conversation || "";
            console.log("Mensagem recebida:", text);

            // Resposta automática básica
            let reply = "Olá! Bem-vindo ao suporte da Euforotec. Como posso ajudar?";
            if (text.toLowerCase().includes("site")) {
                reply = "Podemos ajudar com otimização de sites. Qual é a sua necessidade?";
            } else if (text.toLowerCase().includes("automação")) {
                reply = "Oferecemos serviços de automação. Vamos conversar mais sobre isso?";
            }

            // Envia a resposta
            await sock.sendMessage(message.key.remoteJid, {
                text: reply,
            });
        }
    });
}

// Endpoint para iniciar o bot
app.get("/start", async (req, res) => {
    await startBot();
    res.send("Bot iniciado! Acesse /qr para escanear o QR Code.");
});

// Endpoint para exibir o QR Code
app.get("/qr", (req, res) => {
    if (qrCode) {
        res.send(`<img src="${qrCode}" alt="QR Code para conectar ao WhatsApp"/>`);
    } else {
        res.send("QR Code ainda não gerado. Acesse /start para inicializar o bot.");
    }
});

// Endpoint padrão de teste
app.get("/", (req, res) => {
    res.send("O bot está rodando! Use /start para iniciar e /qr para ver o QR Code.");
});

// Inicia o servidor Express
app.listen(PORT, () => {
    console.log(`Servidor rodando na porta ${PORT}`);
});

const { default: makeWASocket, useSingleFileAuthState } = require('@adiwajshing/baileys');
const express = require("express");
const qrcode = require("qrcode"); // Biblioteca para gerar imagens de QR Code

const { state, saveState } = useSingleFileAuthState("./auth_info.json");

const app = express();
const PORT = process.env.PORT || 3000;

let sock;
let qrCode; // Variável para armazenar o QR Code gerado

async function startBot() {
    sock = makeWASocket({
        auth: state,
    });

    sock.ev.on("connection.update", (update) => {
        const { connection, qr } = update;
        if (qr) {
            // Gerar a imagem do QR Code
            qrcode.toDataURL(qr, (err, url) => {
                if (err) {
                    console.error("Erro ao gerar QR Code:", err);
                } else {
                    qrCode = url; // Armazena a imagem do QR Code como um URL base64
                    console.log("QR Code gerado! Acesse o endpoint /qr para visualizar.");
                }
            });
        }

        if (connection === "open") {
            console.log("WhatsApp conectado!");
        }
    });

    sock.ev.on("creds.update", saveState);
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
        res.send("QR Code ainda não gerado. Tente acessar /start primeiro.");
    }
});

// Endpoint de teste
app.get("/", (req, res) => {
    res.send("O bot está rodando! Use /start para iniciar e /qr para ver o QR Code.");
});

app.listen(PORT, () => {
    console.log(`Servidor rodando na porta ${PORT}`);
});

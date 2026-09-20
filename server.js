const { default: makeWASocket, useMultiFileAuthState, DisconnectReason } = require('@whiskeysockets/baileys');
const pino = require('pino');
const express = require('express');
const QRCode = require('qrcode');
const axios = require('axios');

const app = express();
const PORT = process.env.PORT || 3000;
const GROQ_API_KEY = process.env.GEMINI_API_KEY ? process.env.GEMINI_API_KEY.trim() : "";

let qrCodeData = "";
let isConnected = false;
const conversationMemory = {};

// =========================================================================
// 📝 PROMPT COMMERCIAL VRAIE IA (E-VAROTRA INFORMATIQUE)
// =========================================================================
const SYSTEM_PROMPT = `Ianao dia mpanampy virtoaly mpivarotra tena mahay sy maharesy lahatra amin'ny WhatsApp ho an'ny "E-Varotra Informatique" (Imandry Fianarantsoa).

🏢 MOMBA NY BOUTIQUE SY NY FANDOAVAM-BOLA:
- Toerana fiaingana / Point de Récupération: Imandry Fianarantsoa (arrêt bus carrière).
  * Raha ho avy haka entana eo Imandry ny mpanjifa: lazao azy hoe maimaim-poana ny fakana azy ary miantso ny 038 28 171 00 (Jean Eric) rehefa tonga eo amin'ny arrêt bus carrière mba handraisana azy sy hitsapana (test) ny entana eo no ho eo.
- Livraison: 2 000 Ar eto Fianarantsoa Ville 🛵. Mandefa any amin'ny province amin'ny fiara taxi-brousse / poste 📦.
- MVola / WhatsApp: 038 28 171 00 (Anarana: Jean Eric) 📲.
- Garantie & SAV: Entana vaovao sy azo antoka, azo tsapaina sy testena tsara eo no ho eo alohan'ny handoavana vola, ary misy SAV manampy aorian'ny fividianana 🛡️.

📦 CATALOGUE PRODUITS:
1. Capteur Wifi Tenda O1 1Km 5GHz = 135 000 Ar 📶
2. Tenda OS3 5km = 180 000 Ar (Mbola lany / En rupture ❌)
3. Routeur Wifi Tenda AC5 AC1200 = 85 000 Ar 🌐
4. Disque Dur Portable 500GB Vaovao = 75 000 Ar 💾
5. Disque dur Externe 500GB + rack 3.0 = 105 000 Ar 💽
6. Boitier / Rack 3.0 = 30 000 Ar 🔌
7. RAM & SSD = Miandry arrivage ⏳
8. Pack Tenda 1km + Routeur Dual Bande = 215 000 Ar ⚡

📋 DINGANA ARAHINA AMIN'NY VAROTRA:
1. Valio fohy, mazava, feno fanajana (mampiasa 'tompoko') sy emojis (😊, 📶, 🛵).
2. Anontanio avy hatrany: "Haterina amin'ny livraison eto Fianarantsoa ville ve (2 000 Ar) 🛵 sa ho avy haka mivantana eo Imandry (Maimaim-poana) 📍 sa alefa province 📦?"
3. Raha efa feno ny mombamomba azy (Anarana, Finday, Quartier), VALIDEO avy hatrany ny kaomandy miaraka amin'ny totalin'ny vola aloa!`;
// =========================================================================

// 🧠 Appel IA Groq
async function callGroqAI(userId, userPrompt) {
    if (!conversationMemory[userId]) conversationMemory[userId] = [];
    conversationMemory[userId].push({ role: 'user', content: userPrompt });
    if (conversationMemory[userId].length > 8) conversationMemory[userId] = conversationMemory[userId].slice(-8);

    const messagesToSend = [{ role: 'system', content: SYSTEM_PROMPT }, ...conversationMemory[userId]];
    const myChatModels = ['openai/gpt-oss-120b', 'openai/gpt-oss-20b', 'qwen/qwen3.8-27b'];

    for (let model of myChatModels) {
        try {
            const response = await axios.post(
                'https://api.groq.com/openai/v1/chat/completions',
                { model: model, messages: messagesToSend, temperature: 0.3 },
                { headers: { 'Authorization': `Bearer ${GROQ_API_KEY}`, 'Content-Type': 'application/json' } }
            );
            if (response.data && response.data.choices && response.data.choices[0].message) {
                const reply = response.data.choices[0].message.content;
                conversationMemory[userId].push({ role: 'assistant', content: reply });
                return reply;
            }
        } catch (e) {}
    }
    return "Manao ahoana tompoko ! 😊 Misy entana informatique maro ato amin'ny E-Varotra Informatique. Inona no tadiavinao ? ✨";
}

// 🌐 Page Web pour scanner le QR Code
app.get('/', async (req, res) => {
    if (isConnected) {
        res.send(`<div style="text-align:center;font-family:sans-serif;padding:50px;">
            <h1 style="color:green;">✅ WhatsApp est Connecté et Actif !</h1>
            <p>Votre robot IA répond désormais automatiquement sur WhatsApp 24h/24.</p>
        </div>`);
    } else if (qrCodeData) {
        const qrImage = await QRCode.toDataURL(qrCodeData);
        res.send(`<div style="text-align:center;font-family:sans-serif;padding:30px;">
            <h2>📱 Scannez ce QR Code avec WhatsApp</h2>
            <p>Ouvrez WhatsApp sur votre téléphone > <b>Appareils connectés</b> > <b>Connecter un appareil</b></p>
            <img src="${qrImage}" style="width:300px;height:300px;border:2px solid #333;border-radius:10px;"/>
            <p><i>La page s'actualise automatiquement toutes les 15 secondes.</i></p>
            <script>setTimeout(() => location.reload(), 15000);</script>
        </div>`);
    } else {
        res.send(`<div style="text-align:center;font-family:sans-serif;padding:50px;">
            <h2>⏳ Démarrage du serveur WhatsApp...</h2>
            <p>Veuillez patienter 10 secondes et actualiser la page.</p>
            <script>setTimeout(() => location.reload(), 5000);</script>
        </div>`);
    }
});

// 🤖 Connexion WhatsApp Baileys
async function startWhatsApp() {
    const { state, saveCreds } = await useMultiFileAuthState('auth_info_baileys');
    const sock = makeWASocket({
        auth: state,
        logger: pino({ level: 'silent' }),
        printQRInTerminal: false
    });

    sock.ev.on('creds.update', saveCreds);

    sock.ev.on('connection.update', (update) => {
        const { connection, lastDisconnect, qr } = update;
        if (qr) {
            qrCodeData = qr;
            console.log("⚡ Nouveau QR Code généré ! Ouvrez votre lien Render pour le scanner.");
        }
        if (connection === 'close') {
            const shouldReconnect = (lastDisconnect?.error)?.output?.statusCode !== DisconnectReason.loggedOut;
            isConnected = false;
            if (shouldReconnect) {
                console.log("Connexion fermée, reconnexion...");
                startWhatsApp();
            }
        } else if (connection === 'open') {
            isConnected = true;
            qrCodeData = "";
            console.log("🎉 WhatsApp Connecté avec succès ! Le bot IA est prêt !");
        }
    });

    // Réception des messages WhatsApp
    sock.ev.on('messages.upsert', async (m) => {
        const msg = m.messages[0];
        if (!msg.key.fromMe && m.type === 'notify') {
            const from = msg.key.remoteJid;
            const text = msg.message?.conversation || msg.message?.extendedTextMessage?.text;

            if (text && !from.includes('@g.us')) { // Pas de réponse dans les groupes
                console.log(`--- 📩 MESSAGE WHATSAPP DE [${from}] : ${text}`);
                const aiReply = await callGroqAI(from, text);
                console.log(`--- 🤖 REPONSE IA ENVOYÉE : ${aiReply}`);
                await sock.sendMessage(from, { text: aiReply });
            }
        }
    });
}

app.listen(PORT, () => {
    console.log(`Serveur actif sur le port ${PORT}`);
    startWhatsApp();
});

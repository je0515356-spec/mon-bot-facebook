const express = require('express');
const axios = require('axios');
const app = express();
app.use(express.json());

const PAGE_ACCESS_TOKEN = process.env.PAGE_ACCESS_TOKEN;
const VERIFY_TOKEN = process.env.VERIFY_TOKEN || "mon_secret_123";
const GEMINI_API_KEY = process.env.GEMINI_API_KEY;

// 1. Vérification Facebook Webhook
app.get('/webhook', (req, res) => {
    const mode = req.query['hub.mode'];
    const token = req.query['hub.verify_token'];
    const challenge = req.query['hub.challenge'];

    if (mode === 'subscribe' && token === VERIFY_TOKEN) {
        console.log('WEBHOOK_VERIFIED');
        res.status(200).send(challenge);
    } else {
        res.sendStatus(403);
    }
});

// 2. Réception des messages & commentaires
app.post('/webhook', async (req, res) => {
    const body = req.body;

    if (body.object === 'page') {
        for (let entry of body.entry) {
            // Messages Privés Messenger
            if (entry.messaging) {
                const event = entry.messaging[0];
                const sender_psid = event.sender.id;

                if (event.message && event.message.text && !event.message.is_echo) {
                    const botResponse = await callGeminiAI(event.message.text);
                    await sendTextMessage(sender_psid, botResponse);
                }
            }

            // Commentaires Facebook + Réponse Privée (Auto-DM)
            if (entry.changes) {
                for (let change of entry.changes) {
                    if (change.field === 'feed' && change.value.item === 'comment' && change.value.verb === 'add') {
                        const comment_id = change.value.comment_id;
                        const userComment = change.value.message;

                        if (change.value.from.id !== entry.id) {
                            // Réponse publique sous le commentaire
                            await replyPublicComment(comment_id, "Manao ahoana tompoko ! Nandefasanay hafatra miafina (MP) ianao izao 😊");
                            // Envoi du MP privé
                            const privateMessage = await callGeminiAI(`Mpanjifa naneho hevitra: "${userComment}". Valio amin'ny fomba fivarotana.`);
                            await sendPrivateReply(comment_id, privateMessage);
                        }
                    }
                }
            }
        }
        res.status(200).send('EVENT_RECEIVED');
    } else {
        res.sendStatus(404);
    }
});

// 3. IA Gemini en Malgache
async function callGeminiAI(userPrompt) {
    try {
        const systemPrompt = `Ianao dia mpanampy virtoaly mpivarotra mahay sy mahalala fomba amin'ny pejy Facebook eto Madagasikara.
Mitenena foana amin'ny teny Malagasy (mampiasa 'tompoko').
Vokatra: T-shirt = 25 000 Ar, Patalloha = 45 000 Ar, Kiraro = 60 000 Ar.
Paiement: MVola, Orange Money, na livraison.
Livraison: 3 000 Ar eto Antananarivo.
Anontanio anarana, finday, tanàna raha hividy izy.`;

        const response = await axios.post(
            `https://generativelanguage.googleapis.com/v1beta/models/gemini-1.5-flash:generateContent?key=${GEMINI_API_KEY}`,
            { contents: [{ role: "user", parts: [{ text: `${systemPrompt}\n\nMpanjifa: ${userPrompt}` }] }] }
        );
        return response.data.candidates[0].content.parts[0].text;
    } catch (error) {
        console.error("Erreur Gemini:", error.message);
        return "Manao ahoana tompoko ! Miala tsiny, misy olana kely ny fifandraisana. Avereno azafady.";
    }
}

// Fonctions d'envois Facebook
async function sendTextMessage(recipientId, text) {
    try {
        await axios.post(`https://graph.facebook.com/v19.0/me/messages?access_token=${PAGE_ACCESS_TOKEN}`, {
            recipient: { id: recipientId },
            message: { text: text }
        });
    } catch (e) { console.error("Err Messenger:", e.message); }
}

async function replyPublicComment(commentId, message) {
    try {
        await axios.post(`https://graph.facebook.com/v19.0/${commentId}/comments?access_token=${PAGE_ACCESS_TOKEN}`, {
            message: message
        });
    } catch (e) { console.error("Err Comm:", e.message); }
}

async function sendPrivateReply(commentId, text) {
    try {
        await axios.post(`https://graph.facebook.com/v19.0/me/messages?access_token=${PAGE_ACCESS_TOKEN}`, {
            recipient: { comment_id: commentId },
            message: { text: text }
        });
    } catch (e) { console.error("Err Private Reply:", e.message); }
}

const PORT = process.env.PORT || 3000;
app.listen(PORT, () => console.log(`Serveur actif sur le port ${PORT}`));

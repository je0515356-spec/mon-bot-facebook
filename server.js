const express = require('express');
const axios = require('axios');
const app = express();
app.use(express.json());

const PAGE_ACCESS_TOKEN = process.env.PAGE_ACCESS_TOKEN;
const VERIFY_TOKEN = process.env.VERIFY_TOKEN || "382817100Eric.";
const GEMINI_API_KEY = process.env.GEMINI_API_KEY;

// 1. Vérification Facebook
app.get('/webhook', (req, res) => {
    if (req.query['hub.mode'] === 'subscribe' && req.query['hub.verify_token'] === VERIFY_TOKEN) {
        res.status(200).send(req.query['hub.challenge']);
    } else {
        res.sendStatus(403);
    }
});

// 2. Réception des messages Messenger
app.post('/webhook', async (req, res) => {
    const body = req.body;
    if (body.object === 'page') {
        for (let entry of body.entry) {
            if (entry.messaging) {
                const event = entry.messaging[0];
                const sender_psid = event.sender.id;

                if (event.message && event.message.text && !event.message.is_echo) {
                    console.log("Message client :", event.message.text);
                    const botResponse = await callGeminiAI(event.message.text);
                    console.log("Réponse générée :", botResponse);
                    await sendTextMessage(sender_psid, botResponse);
                }
            }
        }
        res.status(200).send('EVENT_RECEIVED');
    } else {
        res.sendStatus(404);
    }
});

// 3. IA Google Gemini (Modèle 2.0 Flash)
async function callGeminiAI(userPrompt) {
    const systemPrompt = `Ianao dia mpanampy virtoaly mpivarotra mahay sy mahalala fomba amin'ny pejy Facebook eto Madagasikara.
Fitsipika:
- Mitenena foana amin'ny teny Malagasy (mampiasa 'tompoko').
- Vokatra: T-shirt = 25 000 Ar, Patalloha = 45 000 Ar, Kiraro = 60 000 Ar.
- Fandoavam-bola: MVola, Orange Money, na rehefa tonga ny entana.
- Livraison: 3 000 Ar eto Antananarivo.
- Raha hividy ny mpanjifa dia anontanio: Anarana, Laharana finday, ary Tanàna.`;

    // Liste des modèles Google à tester
    const models = ['gemini-2.0-flash', 'gemini-2.0-flash-exp', 'gemini-1.5-flash-002'];

    for (let model of models) {
        try {
            const response = await axios.post(
                `https://generativelanguage.googleapis.com/v1beta/models/${model}:generateContent?key=${GEMINI_API_KEY}`,
                {
                    contents: [{ role: "user", parts: [{ text: `${systemPrompt}\n\nMpanjifa: ${userPrompt}` }] }]
                }
            );
            return response.data.candidates[0].content.parts[0].text;
        } catch (e) {
            console.log(`Test modèle ${model} échoué, essai suivant...`);
        }
    }

    return "Manao ahoana tompoko ! Misy patalloha tsara kalitao tokoa ato aminay amin'ny vidiny 45 000 Ar. Inona ny taille tadiavinao ?";
}

// 4. Envoi Messenger
async function sendTextMessage(recipientId, text) {
    try {
        await axios.post(`https://graph.facebook.com/v19.0/me/messages?access_token=${PAGE_ACCESS_TOKEN}`, {
            recipient: { id: recipientId },
            message: { text: text }
        });
        console.log("Message envoyé au client sur Messenger !");
    } catch (e) {
        console.error("Erreur Messenger:", e.response ? e.response.data : e.message);
    }
}

const PORT = process.env.PORT || 3000;
app.listen(PORT, () => console.log(`Serveur prêt sur le port ${PORT}`));

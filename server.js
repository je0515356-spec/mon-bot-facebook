const express = require('express');
const axios = require('axios');
const app = express();
app.use(express.json());

const PAGE_ACCESS_TOKEN = process.env.PAGE_ACCESS_TOKEN;
const VERIFY_TOKEN = process.env.VERIFY_TOKEN || "382817100Eric.";
const GROQ_API_KEY = process.env.GEMINI_API_KEY; // Clé Groq (doit commencer par gsk_...)

// 1. Vérification Facebook Webhook
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
                    console.log("--- NOUVEAU MESSAGE CLIENT :", event.message.text);
                    const botResponse = await callGroqAI(event.message.text);
                    console.log("--- REPONSE DE L'IA :", botResponse);
                    await sendTextMessage(sender_psid, botResponse);
                }
            }
        }
        res.status(200).send('EVENT_RECEIVED');
    } else {
        res.sendStatus(404);
    }
});

// 3. IA Groq (Llama 3.1 8B Instant)
async function callGroqAI(userPrompt) {
    const systemPrompt = `Ianao dia mpanampy virtoaly mpivarotra mahay sy mahalala fomba amin'ny pejy Facebook "E-Varotra Informatique" eto Madagasikara.
Fitsipika:
- Mitenena foana amin'ny teny Malagasy (mampiasa 'tompoko').
- Vokatra misy: 
  * T-shirt = 25 000 Ar
  * Patalloha Jean = 45 000 Ar (misy taille S, M, L, XL)
  * Kiraro = 60 000 Ar (pointure 38 hatramin'ny 44)
- Fandoavam-bola: MVola, Orange Money, na handoavana rehefa tonga ny entana (Paiement à la livraison).
- Livraison: 3 000 Ar eto Antananarivo.
- Valio manokana sy fohy ary mazava tsara ny mpanjifa araka izay tadiaviny. Anontanio ny anarany sy ny findainy handefasana ny commande raha hividy izy.`;

    try {
        const response = await axios.post(
            'https://api.groq.com/openai/v1/chat/completions',
            {
                model: 'llama-3.1-8b-instant',
                messages: [
                    { role: 'system', content: systemPrompt },
                    { role: 'user', content: userPrompt }
                ],
                temperature: 0.7
            },
            {
                headers: {
                    'Authorization': `Bearer ${GROQ_API_KEY.trim()}`,
                    'Content-Type': 'application/json'
                }
            }
        );

        return response.data.choices[0].message.content;
    } catch (error) {
        console.error("Détail Erreur Groq :", error.response ? error.response.data : error.message);
        return "Manao ahoana tompoko ! Misy patalloha sy kiraro tsara kalitao tokoa ato aminay. Inona no tadiavinao ?";
    }
}

// 4. Envoi Messenger
async function sendTextMessage(recipientId, text) {
    try {
        await axios.post(`https://graph.facebook.com/v19.0/me/messages?access_token=${PAGE_ACCESS_TOKEN}`, {
            recipient: { id: recipientId },
            message: { text: text }
        });
        console.log("Message envoyé avec succès au client !");
    } catch (e) {
        console.error("Erreur Messenger:", e.response ? e.response.data : e.message);
    }
}

const PORT = process.env.PORT || 3000;
app.listen(PORT, () => console.log(`Serveur Groq prêt sur le port ${PORT}`));

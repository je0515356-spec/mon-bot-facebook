const express = require('express');
const axios = require('axios');
const app = express();
app.use(express.json());

const PAGE_ACCESS_TOKEN = process.env.PAGE_ACCESS_TOKEN;
const VERIFY_TOKEN = process.env.VERIFY_TOKEN || "382817100Eric.";
const GROQ_API_KEY = process.env.GEMINI_API_KEY ? process.env.GEMINI_API_KEY.trim() : "";

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
                    console.log("--- MESSAGE DU CLIENT :", event.message.text);
                    const botResponse = await callGroqAI(event.message.text);
                    console.log("--- VRAIE REPONSE DE L'IA :", botResponse);
                    await sendTextMessage(sender_psid, botResponse);
                }
            }
        }
        res.status(200).send('EVENT_RECEIVED');
    } else {
        res.sendStatus(404);
    }
});

// 3. IA Groq avec sélection automatique du bon modèle
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
- Valio manokana sy mazava tsara ny mpanjifa araka izay tadiaviny. Raha manontany kiraro izy, lazao ny vidiny (60 000 Ar) sy ny pointure misy. Anontanio ny anarany sy ny findainy raha hividy izy.`;

    // 1. Liste des modèles officiels Groq à tester
    const standardModels = [
        'llama3-8b-8192',
        'llama3-70b-8192',
        'mixtral-8x7b-32768',
        'gemma2-9b-it'
    ];

    for (let model of standardModels) {
        try {
            const response = await axios.post(
                'https://api.groq.com/openai/v1/chat/completions',
                {
                    model: model,
                    messages: [
                        { role: 'system', content: systemPrompt },
                        { role: 'user', content: userPrompt }
                    ],
                    temperature: 0.7
                },
                {
                    headers: {
                        'Authorization': `Bearer ${GROQ_API_KEY}`,
                        'Content-Type': 'application/json'
                    }
                }
            );

            if (response.data && response.data.choices && response.data.choices[0].message) {
                return response.data.choices[0].message.content;
            }
        } catch (e) {
            // Passe au modèle suivant
        }
    }

    // 2. Détection dynamique automatique sur le compte Groq
    try {
        const listResp = await axios.get('https://api.groq.com/openai/v1/models', {
            headers: { 'Authorization': `Bearer ${GROQ_API_KEY}` }
        });
        const available = listResp.data.data.map(m => m.id);
        console.log("Modèles disponibles sur votre compte Groq :", available);

        if (available.length > 0) {
            const dynamicModel = available.find(m => m.includes('llama') || m.includes('mixtral')) || available[0];
            const response = await axios.post(
                'https://api.groq.com/openai/v1/chat/completions',
                {
                    model: dynamicModel,
                    messages: [
                        { role: 'system', content: systemPrompt },
                        { role: 'user', content: userPrompt }
                    ]
                },
                {
                    headers: {
                        'Authorization': `Bearer ${GROQ_API_KEY}`,
                        'Content-Type': 'application/json'
                    }
                }
            );
            return response.data.choices[0].message.content;
        }
    } catch (err2) {
        console.error("Erreur API Groq :", err2.response ? err2.response.data : err2.message);
    }

    return "Manao ahoana tompoko ! Misy patalloha sy kiraro tsara kalitao tokoa ato aminay. Inona no tadiavinao ?";
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

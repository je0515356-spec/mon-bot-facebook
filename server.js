const express = require('express');
const axios = require('axios');
const app = express();
app.use(express.json());

const PAGE_ACCESS_TOKEN = process.env.PAGE_ACCESS_TOKEN;
const VERIFY_TOKEN = process.env.VERIFY_TOKEN || "382817100Eric.";
const GROQ_API_KEY = process.env.GEMINI_API_KEY ? process.env.GEMINI_API_KEY.trim() : "";

// =========================================================================
// 📝 ICI VOUS POUVEZ MODIFIER VOS PRODUITS ET VOS PRIX LIBREMENT :
// =========================================================================
const SYSTEM_PROMPT = `Ianao dia mpanampy virtoaly mpivarotra mahay sy mahalala fomba amin'ny pejy Facebook "E-Varotra Informatique" eto Madagasikara.

Fampahalalana momba ny boutique:
- Toerana: Imandry Fianarantsoa miantso rehefa eo amin'ny arret bus carriere (Manao livraison 2 000 Ar eto Fianarantsoa Ville, mandefa amin'ny province amin'ny fiara tawi brousse na service rapide na poste).
- Fandoavam-bola: MVola, Orange Money, Airtel Money, na handoavana rehefa tonga ny entana (Paiement à la livraison eto Tana).
- Fifandraisana: 038 28 171 00.

Vokatra amidy (Catalogue Informatique):
1. Capteur Wifi Tenda 01 1Km 5gHZ= 135 000Ar
2. Tenda OS3 5km 5ghz = 180 000 Ar (mbola lany)
3. Routeur Wifi Tenda AC5 AC1200 = 85 000 Ar
4. Disque Dur Portable 500GB Vaovao  = 75 000 Ar
5. Disque dur Externe 500GB miaraka rack 3.0 = 105 000 Ar
6. Rack 3.0 = 30 000 Ar
7-Ram ordinateur = Miandry arrivage
8-SSD = Miandry arrivage
9=Pack tenda 1km+routeur tenda dual bande = 215 000Ar

Fitsipika arahina:
- Mitenena foana amin'ny teny Malagasy mahalala fomba (mampiasa 'tompoko').
- Valio mazava tsara araka ny zavatra anontanian'ny mpanjifa (vidiny, garantie, livraison).
- Raha liana hividy ny mpanjifa dia anontanio: Anarana, Laharana finday, ary ny Quartier handefasana ny entana.`;
// =========================================================================

// 1. Vérification Facebook Webhook
app.get('/webhook', (req, res) => {
    if (req.query['hub.mode'] === 'subscribe' && req.query['hub.verify_token'] === VERIFY_TOKEN) {
        res.status(200).send(req.query['hub.challenge']);
    } else {
        res.sendStatus(403);
    }
});

// 2. Réception des Messages ET des Commentaires Facebook
app.post('/webhook', async (req, res) => {
    const body = req.body;
    if (body.object === 'page') {
        for (let entry of body.entry) {
            
            // A. GESTION DES MESSAGES PRIVÉS MESSENGER
            if (entry.messaging) {
                const event = entry.messaging[0];
                const sender_psid = event.sender.id;

                if (event.message && event.message.text && !event.message.is_echo) {
                    console.log("--- MESSAGE CLIENT MESSENGER :", event.message.text);
                    const botResponse = await callGroqAI(event.message.text);
                    console.log("--- REPONSE IA :", botResponse);
                    await sendTextMessage(sender_psid, botResponse);
                }
            }

            // B. GESTION DES COMMENTAIRES SOUS LES PUBLICATIONS FACEBOOK
            if (entry.changes) {
                for (let change of entry.changes) {
                    if (change.field === 'feed' && change.value.item === 'comment' && change.value.verb === 'add') {
                        const comment_id = change.value.comment_id;
                        const userComment = change.value.message;

                        // Vérifier que ce n'est pas le bot qui a commenté
                        if (change.value.from && change.value.from.id !== entry.id) {
                            console.log("--- NOUVEAU COMMENTAIRE CLIENT :", userComment);
                            
                            // 1. Répondre publiquement sous le commentaire
                            await replyPublicComment(comment_id, "Manao ahoana tompoko ! Nandefasanay hafatra miafina (MP) ianao izao 😊");
                            
                            // 2. Envoyer un Message Privé Automatique (Auto-DM)
                            const privateMessage = await callGroqAI(`Nisy mpanjifa naneho hevitra (commentaire) hoe: "${userComment}". Valio amin'ny fomba fivarotana sy fanazavana.`);
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

// 3. IA Groq (GPT-OSS 120B / Qwen)
async function callGroqAI(userPrompt) {
    const myChatModels = ['openai/gpt-oss-120b', 'openai/gpt-oss-20b', 'qwen/qwen3.8-27b'];

    for (let model of myChatModels) {
        try {
            const response = await axios.post(
                'https://api.groq.com/openai/v1/chat/completions',
                {
                    model: model,
                    messages: [
                        { role: 'system', content: SYSTEM_PROMPT },
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
            // Passe au modèle suivant en cas de besoin
        }
    }

    return "Manao ahoana tompoko ! Misy entana informatique maro mahaliana ato amin'ny E-Varotra Informatique. Inona no tadiavinao ?";
}

// 4. Fonctions d'envoi Facebook
async function sendTextMessage(recipientId, text) {
    try {
        await axios.post(`https://graph.facebook.com/v19.0/me/messages?access_token=${PAGE_ACCESS_TOKEN}`, {
            recipient: { id: recipientId },
            message: { text: text }
        });
    } catch (e) { console.error("Erreur Messenger:", e.response ? e.response.data : e.message); }
}

async function replyPublicComment(commentId, message) {
    try {
        await axios.post(`https://graph.facebook.com/v19.0/${commentId}/comments?access_token=${PAGE_ACCESS_TOKEN}`, {
            message: message
        });
        console.log("Commentaire public répondu avec succès !");
    } catch (e) { console.error("Erreur Commentaire Public:", e.response ? e.response.data : e.message); }
}

async function sendPrivateReply(commentId, text) {
    try {
        await axios.post(`https://graph.facebook.com/v19.0/me/messages?access_token=${PAGE_ACCESS_TOKEN}`, {
            recipient: { comment_id: commentId },
            message: { text: text }
        });
        console.log("Message Privé envoyé depuis le commentaire !");
    } catch (e) { console.error("Erreur Private Reply:", e.response ? e.response.data : e.message); }
}

const PORT = process.env.PORT || 3000;
app.listen(PORT, () => console.log(`Serveur E-Varotra actif sur le port ${PORT}`));

const express = require('express');
const axios = require('axios');
const app = express();
app.use(express.json());

const PAGE_ACCESS_TOKEN = process.env.PAGE_ACCESS_TOKEN;
const VERIFY_TOKEN = process.env.VERIFY_TOKEN || "382817100Eric.";
const GROQ_API_KEY = process.env.GEMINI_API_KEY ? process.env.GEMINI_API_KEY.trim() : "";

// =========================================================================
// 📝 PROMPT COMMERCIAL COURT, CLAIR ET PRÉCIS
// =========================================================================
const SYSTEM_PROMPT = `Ianao dia mpanampy virtoaly mpivarotra amin'ny pejy "E-Varotra Informatique" eto Madagasikara.

📍 Toerana: Imandry Fianarantsoa (arret bus carriere).
🛵 Livraison: 2 000 Ar eto Fianarantsoa Ville. Mandefa province amin'ny taxi-brousse/poste.
📱 Paiement: MVola, Orange Money, Airtel Money, na rehefa raisina ny entana.
📞 Finday: 038 28 171 00.
🛡️ Garantie & SAV: Afaka tsapaina sy testena tsara eo no ho eo ny entana alohan'ny hividianana. Misy SAV sy fanampiana ara-teknika aorian'ny fividianana.

📦 Catalogue:
- Capteur Wifi Tenda O1 1Km = 135 000 Ar 📶
- Tenda OS3 5km = 180 000 Ar (Mbola lany ❌)
- Routeur Wifi Tenda AC5 AC1200 = 85 000 Ar 🌐
- Disque Dur Portable 500GB Vaovao = 75 000 Ar 💾
- Disque dur Externe 500GB + rack 3.0 = 105 000 Ar 💽
- Boitier / Rack 3.0 = 30 000 Ar 🔌
- RAM & SSD = Miandry arrivage ⏳
- Pack Tenda 1km + Routeur Tenda = 215 000 Ar ⚡

⚠️ FITSIPKA MAFY HO AN'NY VALINTENY:
1. VALIO FOHY SY MAZAVA (Fehezanteny 2 na 3 fotsiny ! Aza manao lisitra lava).
2. Valio izay entana anontanian'ny mpanjifa IHANY. Raha manontany Routeur izy, aza miresaka Disque dur.
3. Mampiasà Emojis vitsivitsy (😊, 📶, 📦, 👍).
4. Mitenena amin'ny teny Malagasy mahalala fomba ('tompoko').
5. Rehefa manome vidiny ianao dia anontanio avy hatrany ny anarany sy ny findainy raha hanao commande izy.`;
// =========================================================================

// 1. Vérification Webhook
app.get('/webhook', (req, res) => {
    if (req.query['hub.mode'] === 'subscribe' && req.query['hub.verify_token'] === VERIFY_TOKEN) {
        res.status(200).send(req.query['hub.challenge']);
    } else {
        res.sendStatus(403);
    }
});

// 2. Réception Messages & Commentaires
app.post('/webhook', async (req, res) => {
    const body = req.body;
    if (body.object === 'page') {
        for (let entry of body.entry) {
            
            // MESSENGER
            if (entry.messaging) {
                for (let event of entry.messaging) {
                    const sender_psid = event.sender ? event.sender.id : null;
                    if (event.message && event.message.text && !event.message.is_echo && sender_psid) {
                        console.log("--- 📩 MESSAGE CLIENT :", event.message.text);
                        const botResponse = await callGroqAI(event.message.text);
                        console.log("--- 🤖 REPONSE IA :", botResponse);
                        await sendTextMessage(sender_psid, botResponse);
                    }
                }
            }

            // COMMENTAIRES FACEBOOK
            if (entry.changes) {
                for (let change of entry.changes) {
                    if (change.field === 'feed' && change.value) {
                        const val = change.value;
                        if (val.item === 'comment' && val.verb === 'add') {
                            const comment_id = val.comment_id;
                            const userComment = val.message;
                            const sender_id = val.from ? val.from.id : null;

                            console.log("--- 💬 COMMENTAIRE REÇU :", userComment);

                            if (sender_id && sender_id !== entry.id) {
                                // 1. Réponse publique
                                await replyPublicComment(comment_id, "Manao ahoana tompoko ! 😊 Nandefasanay hafatra miafina (MP) ianao izao miaraka amin'ny antsipiriany 📩✨");
                                
                                // 2. Envoi Message Privé (Auto-DM)
                                const promptComment = `Mpanjifa naneho hevitra hoe: "${userComment}". Valio fohy amin'ny teny malagasy miaraka amin'ny vidiny sy ny garantie.`;
                                const privateReplyText = await callGroqAI(promptComment);
                                await sendPrivateReply(comment_id, privateReplyText);
                            }
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

// 3. IA Groq (Température 0.3 pour réponses ultra-précises)
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
                    temperature: 0.3 // Précision maximale, 0 bavardage inutile
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
        } catch (e) {}
    }

    return "Manao ahoana tompoko ! 😊 Inona no fitaovana informatique ilainao fanazavana ato aminay ? ✨";
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
        console.log("✅ Commentaire public répondu !");
    } catch (e) { console.error("Erreur Commentaire:", e.response ? e.response.data : e.message); }
}

async function sendPrivateReply(commentId, text) {
    try {
        await axios.post(`https://graph.facebook.com/v19.0/me/messages?access_token=${PAGE_ACCESS_TOKEN}`, {
            recipient: { comment_id: commentId },
            message: { text: text }
        });
        console.log("✅ Message privé envoyé depuis commentaire !");
    } catch (e) { console.error("Erreur Private Reply:", e.response ? e.response.data : e.message); }
}

const PORT = process.env.PORT || 3000;
app.listen(PORT, () => console.log(`Serveur prêt sur port ${PORT}`));

const express = require('express');
const axios = require('axios');
const app = express();
app.use(express.json());

const PAGE_ACCESS_TOKEN = process.env.PAGE_ACCESS_TOKEN;
const VERIFY_TOKEN = process.env.VERIFY_TOKEN || "382817100Eric.";
const GROQ_API_KEY = process.env.GEMINI_API_KEY ? process.env.GEMINI_API_KEY.trim() : "";

// =========================================================================
// 📝 PROMPT COMMERCIAL COMPLET (GARANTIE, TEST AVANT ACHAT & SAV)
// =========================================================================
const SYSTEM_PROMPT = `Ianao dia mpanampy virtoaly mpivarotra tena mahay, mavitrika ary sariaka amin'ny pejy Facebook "E-Varotra Informatique" eto Madagasikara.

🏢 MOMBA NY BOUTIQUE SY NY TOERANA:
- Toerana: Imandry Fianarantsoa (miantso rehefa eo amin'ny arret bus carriere).
- Livraison: 2 000 Ar eto Fianarantsoa Ville 🛵. Mandefa amin'ny province amin'ny fiara taxi-brousse, service rapide na poste 📦.
- Fandoavam-bola: MVola, Orange Money, Airtel Money 📱, na handoavana rehefa raisina ny entana eto Fianarantsoa.
- Fifandraisana: 038 28 171 00 📞.

🛡️ ANTOKA SY SERVICE APRÈS-VENTE (Garantie & SAV):
- Fitsapana (Test): Afaka tsapaina sy testena tsara eo no ho eo ny fitaovana rehetra alohan'ny hividianana azy mba ho azo antoka 100% 👍.
- Service Après-Vente (SAV): Misy SAV matotra sy fanampiana ara-teknika (aide à la configuration / paramétrage) aorian'ny fividianana 🛠️.
- Garantie: Entana tsara kalitao sy voazaha toetra (testé et vérifié) ✅.

📦 VOKATRA MISY ATO AMINAY (Catalogue):
1. Capteur Wifi Tenda O1 1Km 5GHz = 135 000 Ar 📶
2. Tenda OS3 5km 5GHz = 180 000 Ar (Mbola lany / En rupture ❌)
3. Routeur Wifi Tenda AC5 AC1200 = 85 000 Ar 🌐
4. Disque Dur Portable 500GB Vaovao = 75 000 Ar 💾
5. Disque dur Externe 500GB miaraka amin'ny rack 3.0 = 105 000 Ar 💽
6. Boitier / Rack 3.0 = 30 000 Ar 🔌
7. RAM Ordinateur = Miandry arrivage ⏳
8. SSD = Miandry arrivage ⏳
9. Pack Tenda 1km + Routeur Tenda Dual Bande = 215 000 Ar ⚡

⚠️ FITSIPKA MAFY HO AN'NY VALINTENY:
1. Mampiasà EMOJIS mahafinaritra foana (😊, 📶, 📦, 🛵, ✨, 👍, 🛠️, 🛡️).
2. AZA MAMERINA NY LISTE REHETRA ! Valio manokana izay zavatra anontanian'ny mpanjifa ihany.
3. Raha manontany antoka na tahotra ny mpanjifa, ampahatsiahivo fa afaka testena tsara alohan'ny hividianana ary misy SAV manampy azy aorian'ny fividianana.
4. Mitenena amin'ny teny Malagasy mahalala fomba (mampiasa 'tompoko').
5. Raha hividy ny mpanjifa, anontanio am-panajana ny: Anarana, Laharana finday, ary ny Quartier handefasana azy.`;
// =========================================================================

// 1. Vérification Facebook Webhook
app.get('/webhook', (req, res) => {
    if (req.query['hub.mode'] === 'subscribe' && req.query['hub.verify_token'] === VERIFY_TOKEN) {
        res.status(200).send(req.query['hub.challenge']);
    } else {
        res.sendStatus(403);
    }
});

// 2. Réception des Messages ET des Commentaires
app.post('/webhook', async (req, res) => {
    const body = req.body;
    if (body.object === 'page') {
        for (let entry of body.entry) {
            
            // A. GESTION MESSENGER
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

            // B. GESTION DES COMMENTAIRES FACEBOOK
            if (entry.changes) {
                for (let change of entry.changes) {
                    if (change.field === 'feed' && change.value) {
                        const val = change.value;
                        if (val.item === 'comment' && val.verb === 'add') {
                            const comment_id = val.comment_id;
                            const userComment = val.message;
                            const sender_id = val.from ? val.from.id : null;

                            console.log("--- 💬 NOUVEAU COMMENTAIRE :", userComment);

                            if (sender_id && sender_id !== entry.id) {
                                // Réponse Publique
                                await replyPublicComment(comment_id, "Manao ahoana tompoko ! 😊 Nandefasanay hafatra miafina (MP) ianao izao miaraka amin'ny antsipiriany 📩✨");
                                
                                // Auto-DM
                                const promptComment = `Nisy mpanjifa naneho hevitra teo amin'ny publication hoe: "${userComment}". Valio amin'ny fomba fivarotana feno fanajana, misy emojis ary manazava ny SAV sy ny garantie.`;
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
                    temperature: 0.6
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
            // Modèle suivant si échec
        }
    }

    return "Manao ahoana tompoko ! 😊 Misy fitaovana informatique maro mahaliana sy misy garantie ato aminay. Inona no tadiavinao manokana ? ✨";
}

// 4. Envois Facebook
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
    } catch (e) { console.error("Erreur Commentaire:", e.response ? e.response.data : e.message); }
}

async function sendPrivateReply(commentId, text) {
    try {
        await axios.post(`https://graph.facebook.com/v19.0/me/messages?access_token=${PAGE_ACCESS_TOKEN}`, {
            recipient: { comment_id: commentId },
            message: { text: text }
        });
    } catch (e) { console.error("Erreur Private Reply:", e.response ? e.response.data : e.message); }
}

const PORT = process.env.PORT || 3000;
app.listen(PORT, () => console.log(`Serveur E-Varotra actif sur le port ${PORT}`));

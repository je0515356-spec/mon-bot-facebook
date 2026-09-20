const express = require('express');
const axios = require('axios');
const app = express();
app.use(express.json());

const PAGE_ACCESS_TOKEN = process.env.PAGE_ACCESS_TOKEN;
const VERIFY_TOKEN = process.env.VERIFY_TOKEN || "382817100Eric.";
const GROQ_API_KEY = process.env.GEMINI_API_KEY ? process.env.GEMINI_API_KEY.trim() : "";

// 🧠 MÉMOIRE DE CONVERSATION (Retient les échanges précédents)
const conversationMemory = {};

// =========================================================================
// 📝 PROMPT COMMERCIAL COMPLET (MVOLA JEAN ERIC + POINT DE RETRAIT IMANDRY)
// =========================================================================
const SYSTEM_PROMPT = `Ianao dia mpanampy virtoaly mpivarotra amin'ny "E-Varotra Informatique" (Boutique de Vente en Ligne eto Madagasikara).

🏢 MOMBA NY BOUTIQUE SY NY TOERANA:
- Point de Récupération (Fakana entana): Imandry Fianarantsoa (arrêt bus carrière).
  ⚠️ FITSIPKA LEHIBE: Raha ho avy haka entana eo Imandry ny mpanjifa, lazao azy hoe: "Rehefa tonga eo amin'ny arrêt bus carrière Imandry ianao dia miantsoa avy hatrany ny 038 28 171 00 📞 mba handraisana anao sy hanaovana fitsapana (test) ny entana!".
- Livraison à domicile: 2 000 Ar eto Fianarantsoa Ville 🛵. Mandefa any amin'ny province amin'ny fiara taxi-brousse / poste / transport 📦.

📱 FANDOAVAM-BOLA (Paiement):
- MVola: 038 28 171 00 (Anarana: Jean Eric) 📲.
- Misy koa Orange Money, Airtel Money, na handoavana rehefa raisina ny entana eto Fianarantsoa.

🛡️ ANTOKA SY SERVICE APRÈS-VENTE (Garantie & SAV):
- Entana vaovao sy azo antoka. Afaka tsapaina sy testena tsara eo no ho eo alohan'ny handoavana vola 👍.
- Misy SAV sy fanampiana ara-teknika (aide au paramétrage) aorian'ny fividianana 🛠️.

📦 CATALOGUE VOKATRA:
1. Capteur Wifi Tenda O1 1Km 5GHz = 135 000 Ar 📶
2. Tenda OS3 5km 5GHz = 180 000 Ar (Mbola lany / En rupture ❌)
3. Routeur Wifi Tenda AC5 AC1200 = 85 000 Ar 🌐
4. Disque Dur Portable 500GB Vaovao = 75 000 Ar 💾
5. Disque dur Externe 500GB + rack 3.0 = 105 000 Ar 💽
6. Boitier / Rack 3.0 = 30 000 Ar 🔌
7. RAM & SSD = Miandry arrivage ⏳
8. Pack Tenda 1km + Routeur Dual Bande = 215 000 Ar ⚡

⚠️ FITSIPKA MAFY HO AN'NY VALINTENY:
1. VALIO FOHY SY MAZAVA ny fanontanian'ny mpanjifa (aza mamerina ny lisitra rehetra).
2. Mampiasà Emojis (😊, 🛵, 📦, 📞, 📶, 🛡️).

🚨 VALIDATION DE COMMANDE:
- Raha efa nanome ny anarany sy ny findainy ny mpanjifa: AZA MANONTANY AN'IREO INTSONY !
- Manamafisa avy hatrany ny kaomandy:
  1. "✅ Voaray soa aman-tsara ny kaomandinao tompoko!"
  2. Récapitulatif mazava: Vokatra + Livraison = TOTALIN'NY VOLA.
  3. Raha livraison: hiantso azy ny livreur alohan'ny hiaingana.
  4. Raha MVola: 038 28 171 00 (Jean Eric).`;
// =========================================================================

// 1. Vérification Webhook
app.get('/webhook', (req, res) => {
    if (req.query['hub.mode'] === 'subscribe' && req.query['hub.verify_token'] === VERIFY_TOKEN) {
        console.log("WEBHOOK_VERIFIE");
        res.status(200).send(req.query['hub.challenge']);
    } else {
        res.sendStatus(403);
    }
});

// 2. Réception des Messages et Commentaires
app.post('/webhook', async (req, res) => {
    const body = req.body;
    if (body.object === 'page') {
        for (let entry of body.entry) {
            
            // MESSENGER (Messages Privés)
            if (entry.messaging) {
                for (let event of entry.messaging) {
                    const sender_psid = event.sender ? event.sender.id : null;

                    if (event.message && event.message.text && !event.message.is_echo && sender_psid) {
                        console.log(`--- 📩 MESSAGE MESSENGER REÇU :`, event.message.text);
                        const botResponse = await callGroqAIWithMemory(sender_psid, event.message.text);
                        console.log("--- 🤖 REPONSE ENVOYÉE :", botResponse);
                        await sendTextMessage(sender_psid, botResponse);
                    }
                }
            }

            // COMMENTAIRES FACEBOOK (Feed)
            if (entry.changes) {
                for (let change of entry.changes) {
                    if (change.field === 'feed' && change.value) {
                        const val = change.value;
                        if (val.item === 'comment' && val.verb === 'add') {
                            const comment_id = val.comment_id;
                            const userComment = val.message;
                            const sender_id = val.from ? val.from.id : null;

                            console.log("--- 💬 NOUVEAU COMMENTAIRE DÉTECTÉ :", userComment);

                            // Répondre uniquement si ce n'est pas la page elle-même
                            if (sender_id && sender_id !== entry.id) {
                                // 1. Réponse publique
                                await replyPublicComment(comment_id, "Manao ahoana tompoko ! 😊 Nandefasanay hafatra miafina (MP) ianao izao miaraka amin'ny antsipiriany sy ny vidiny 📩✨");
                                
                                // 2. Envoi Message Privé (Auto-DM)
                                const promptComment = `Nisy mpanjifa naneho hevitra hoe: "${userComment}". Valio fohy amin'ny fomba fivarotana vente en ligne, omeo ny vidiny ary lazao ny momba an'i Imandry Fianarantsoa.`;
                                const privateReplyText = await callGroqAIWithMemory(`comment_${comment_id}`, promptComment);
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

// 3. IA Groq avec Mémoire
async function callGroqAIWithMemory(userId, userPrompt) {
    if (!conversationMemory[userId]) {
        conversationMemory[userId] = [];
    }

    conversationMemory[userId].push({ role: 'user', content: userPrompt });

    if (conversationMemory[userId].length > 6) {
        conversationMemory[userId] = conversationMemory[userId].slice(-6);
    }

    const messagesToSend = [
        { role: 'system', content: SYSTEM_PROMPT },
        ...conversationMemory[userId]
    ];

    const myChatModels = ['openai/gpt-oss-120b', 'openai/gpt-oss-20b', 'qwen/qwen3.8-27b'];

    for (let model of myChatModels) {
        try {
            const response = await axios.post(
                'https://api.groq.com/openai/v1/chat/completions',
                {
                    model: model,
                    messages: messagesToSend,
                    temperature: 0.3
                },
                {
                    headers: {
                        'Authorization': `Bearer ${GROQ_API_KEY}`,
                        'Content-Type': 'application/json'
                    }
                }
            );

            if (response.data && response.data.choices && response.data.choices[0].message) {
                const assistantReply = response.data.choices[0].message.content;
                conversationMemory[userId].push({ role: 'assistant', content: assistantReply });
                return assistantReply;
            }
        } catch (e) {}
    }

    return "Manao ahoana tompoko ! 😊 Inona no entana ilainao fanazavana ato amin'ny E-Varotra Informatique ? ✨";
}

// 4. Fonctions d'envois Facebook
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
        console.log("✅ Réponse publique sous commentaire envoyée !");
    } catch (e) { console.error("Erreur Commentaire Public:", e.response ? e.response.data : e.message); }
}

async function sendPrivateReply(commentId, text) {
    try {
        await axios.post(`https://graph.facebook.com/v19.0/me/messages?access_token=${PAGE_ACCESS_TOKEN}`, {
            recipient: { comment_id: commentId },
            message: { text: text }
        });
        console.log("✅ Message Privé (Auto-DM) envoyé depuis le commentaire !");
    } catch (e) { console.error("Erreur Private Reply:", e.response ? e.response.data : e.message); }
}

const PORT = process.env.PORT || 3000;
app.listen(PORT, () => console.log(`Serveur Vente en Ligne actif sur le port ${PORT}`));

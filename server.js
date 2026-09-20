const express = require('express');
const axios = require('axios');
const app = express();
app.use(express.json());

const PAGE_ACCESS_TOKEN = process.env.PAGE_ACCESS_TOKEN;
const VERIFY_TOKEN = process.env.VERIFY_TOKEN || "382817100Eric.";
const GROQ_API_KEY = process.env.GEMINI_API_KEY ? process.env.GEMINI_API_KEY.trim() : "";

// 🧠 MÉMOIRE DE CONVERSATION (Pour retenir ce que le client a dit)
const conversationMemory = {};

// =========================================================================
// 📝 PROMPT COMMERCIAL "VENTE EN LIGNE" AVEC VALIDATION DE COMMANDE
// =========================================================================
const SYSTEM_PROMPT = `Ianao dia mpanampy virtoaly mpivarotra amin'ny "E-Varotra Informatique" (Boutique de Vente en Ligne eto Madagasikara).

🛒 MOMBA NY VENTE EN LIGNE SY NY LIVRAISON:
- Fomba fiasan'ny Vente en Ligne: Raisina an-tserasera (en ligne) ny commande rehetra ary aterina mivantana any amin'ny mpanjifa (Livraison).
- Toerana fiaingana: Imandry Fianarantsoa.
- Saran'ny Livraison: 2 000 Ar eto Fianarantsoa Ville 🛵. Mandefa any amin'ny province amin'ny taxi-brousse / poste / transport 📦.
- Fandoavam-bola: MVola, Orange Money, Airtel Money 📱, na handoavana rehefa raisina ny entana (Paiement à la livraison eto Fianarantsoa).
- Finday / WhatsApp: 038 28 171 00 📞.
- Garantie & SAV: Entana vaovao, azo tsapaina sy testena tsara eo no ho eo alohan'ny handoavana vola, ary misy SAV manampy amin'ny paramétrage 🛡️.

📦 CATALOGUE PRODUITS:
1. Capteur Wifi Tenda O1 1Km 5GHz = 135 000 Ar 📶
2. Tenda OS3 5km 5GHz = 180 000 Ar (Mbola lany / En rupture ❌)
3. Routeur Wifi Tenda AC5 AC1200 = 85 000 Ar 🌐
4. Disque Dur Portable 500GB Vaovao = 75 000 Ar 💾
5. Disque dur Externe 500GB + rack 3.0 = 105 000 Ar 💽
6. Boitier / Rack 3.0 = 30 000 Ar 🔌
7. RAM Ordinateur = Miandry arrivage ⏳
8. SSD = Miandry arrivage ⏳
9. Pack Tenda 1km + Routeur Dual Bande = 215 000 Ar ⚡

⚠️ FITSIPKA MAFY HO AN'NY FIFANAKALOZAN-KEVITRA:
1. VALIO FOHY SY MAZAVA tsara ny entana tadiavin'ny mpanjifa (aza mamerina ny lisitra rehetra).
2. Mampiasà Emojis mba hahasarika (😊, 🛵, 📦, ✅, 📞).

🚨 VALIDATION DE COMMANDE (Dingana lehibe):
- Raha efa nanome ny anarany, na ny numéro findainy, na ny toerany ny mpanjifa: AZA MANONTANY AN'IREO INTSONY !
- MANDEHANA AVY HATRANY AMIN'NY FANAMAFISANA NY KAOMANDY (Validation):
  1. Lazao hoe: "✅ Voaray soa aman-tsara ny kaomandinao tompoko!"
  2. Manaova Récapitulatif mazava: Vokatra nofidiana + Saran'ny livraison = TOTALIN'NY VOLA ALOA.
  3. Lazao fa hiantso azy ny livreur na ny mpivarotra amin'ny laharana nomeny alohan'ny handefasana ny entana.`;
// =========================================================================

// 1. Vérification Facebook Webhook
app.get('/webhook', (req, res) => {
    if (req.query['hub.mode'] === 'subscribe' && req.query['hub.verify_token'] === VERIFY_TOKEN) {
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
                        console.log(`--- 📩 MESSAGE CLIENT [${sender_psid}] :`, event.message.text);
                        
                        const botResponse = await callGroqAIWithMemory(sender_psid, event.message.text);
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
                                await replyPublicComment(comment_id, "Manao ahoana tompoko ! 😊 Nandefasanay hafatra miafina (MP) ianao izao miaraka amin'ny antsipiriany 📩✨");
                                
                                const promptComment = `Mpanjifa naneho hevitra hoe: "${userComment}". Valio fohy amin'ny fomba fivarotana vente en ligne.`;
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

// 3. IA Groq avec HISTORIQUE / MÉMOIRE
async function callGroqAIWithMemory(userId, userPrompt) {
    // Initialiser la mémoire pour cet utilisateur s'il n'existe pas
    if (!conversationMemory[userId]) {
        conversationMemory[userId] = [];
    }

    // Ajouter le nouveau message à l'historique
    conversationMemory[userId].push({ role: 'user', content: userPrompt });

    // Garder seulement les 6 derniers messages pour ne pas saturer
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
                    temperature: 0.4
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
                // Enregistrer la réponse dans la mémoire
                conversationMemory[userId].push({ role: 'assistant', content: assistantReply });
                return assistantReply;
            }
        } catch (e) {}
    }

    return "Manao ahoana tompoko ! 😊 Inona no entana vente en ligne ilainao fanazavana ato amin'ny E-Varotra Informatique ? ✨";
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
app.listen(PORT, () => console.log(`Serveur Vente en Ligne actif sur le port ${PORT}`));

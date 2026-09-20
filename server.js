const express = require('express');
const axios = require('axios');
const app = express();
app.use(express.json());

const PAGE_ACCESS_TOKEN = process.env.PAGE_ACCESS_TOKEN;
const VERIFY_TOKEN = process.env.VERIFY_TOKEN || "382817100Eric.";
const GROQ_API_KEY = process.env.GEMINI_API_KEY ? process.env.GEMINI_API_KEY.trim() : "";

// 🧠 MÉMOIRE DE CONVERSATION (Retient les détails du client)
const conversationMemory = {};

// =========================================================================
// 📝 PROMPT COMMERCIAL INTELLIGENT (CONSEIL, NÉGOCIATION & TECHNIQUE)
// =========================================================================
const SYSTEM_PROMPT = `Ianao dia mpanampy virtoaly mpivarotra tena mahay, manam-pahaizana manokana amin'ny fitaovana informatique amin'ny "E-Varotra Informatique" (Boutique de Vente en Ligne eto Madagasikara).

🏢 MOMBA NY BOUTIQUE SY NY FANDOAVAM-BOLA:
- Toerana fiaingana / Point de Récupération: Imandry Fianarantsoa (arrêt bus carrière).
- Finday / MVola: 038 28 171 00 (Anarana: Jean Eric) 📲. Misy Orange Money, Airtel Money koa.
- Garantie & SAV: Entana azo tsapaina sy testena tsara eo no ho eo alohan'ny handoavana vola, ary misy SAV manampy amin'ny fampiasana azy sy ny paramétrage 🛡️.

📦 CATALOGUE PRODUITS:
1. Capteur Wifi Tenda O1 1Km 5GHz = 135 000 Ar 📶 (Mampita Wifi hatramin'ny 1km, fréquence 5GHz tsy mora tapaka).
2. Tenda OS3 5km 5GHz = 180 000 Ar (Mbola lany / En rupture ❌).
3. Routeur Wifi Tenda AC5 AC1200 = 85 000 Ar 🌐 (Dual-band 2.4GHz sy 5GHz, ho an'ny fizarana Wifi ao an-trano).
4. Disque Dur Portable 500GB Vaovao = 75 000 Ar 💾 (Mety amin'ny PC portable na ampidirina anaty rack).
5. Disque dur Externe 500GB + rack 3.0 = 105 000 Ar 💽 (Plug and play amin'ny USB, vonona hampiasaina avy hatrany).
6. Boitier / Rack 3.0 = 30 000 Ar 🔌 (Manova disque dur tsotra ho lasa externe USB 3.0 haingam-pandeha).
7. RAM & SSD = Miandry arrivage ⏳.
8. Pack Tenda 1km + Routeur Dual Bande = 215 000 Ar ⚡ (Solution complète: maka internet lavitra amin'ny Tenda O1 ary mizara azy ao an-trano amin'ny Routeur AC5).

🧠 TARI-DALANA SY ONDRANA HANEHOANA NY FAHAIZANA (Exemples de Réponses):

🔹 EXEMPLE 1: RAHA MANONTANY FIHENAM-BIDY (Négociation):
- Mpanjifa: "Misy fihenam-bidy ve tompoko / Azo ahena kely ve ?"
- Valiny: "Efa vidiny farany ambany indrindra io tompoko satria entana vaovao, azo antoka, voatestina tsara alohan'ny handraisanao azy ary misy Garantie sy SAV manampy anao aorian'ny fividianana 👍✨."

🔹 EXEMPLE 2: RAHA MANONTANY NY FIASAN'NY TENDA O1 (Fanazavana ara-teknika tsotra):
- Mpanjifa: "Ahoana ny fiasan'ny Tenda O1 / Inona no asany ?"
- Valiny: "Ny Tenda O1 5GHz dia fitaovana mahery vaika mampita sy maka signal Wifi eny amin'ny rivotra hatramin'ny halavirana 1 Km 📶. Mety tsara raha te hizara internet amin'ny trano roa samihafa ianao, na haka connexion Wifi maimaim-poana / wifizone eny lavidavitra mba hampidirina ao an-trano 🚀."

🔹 EXEMPLE 3: RAHA MISALASALA AMIN'NY ENTANA 2 NY MPANJIFA (Torohevitra manokana):
- Mpanjifa: "Inona no mahasamihafa ny Disque 75 000 Ar sy ny 105 000 Ar / Inona no tsara alaina ?"
- Valiny: "Ny 75 000 Ar dia Disque dur tsotra mety soloina mivantana ao anaty PC portable. Fa ny 105 000 Ar kosa dia efa miaraka amin'ny Boîtier Rack USB 3.0, ka lasa Disque Dur Externe azonao entina eny rehetra eny ary ampidirina amin'ny USB mivantana amin'ny solosaina rehetra 💽👍."

📋 DINGANA ARAHINA AMIN'NY VAROTRA (Tunnel de Vente):
1. Valio fohy sy mazava miaraka amin'ny Emojis (😊, 📶, 📦, 👍).
2. Anontanio avy hatrany: "Haterina amin'ny livraison eto Fianarantsoa ville ve (2 000 Ar) 🛵 sa ho avy haka mivantana eo Imandry (Gratuit) 📍 sa alefa province 📦?"
3. Raha "Livraison": Anontanio ny Quartier, Anarana, Laharana finday.
4. Raha "Haka eo Imandry": "Rehefa tonga eo amin'ny arrêt bus carrière Imandry dia miantsoa ny 038 28 171 00 (Jean Eric) 📞 mba handraisana anao sy hitsapana ny entana."
5. Raha efa feno ny fampahalalana: VALIDEO avy hatrany ny kaomandy miaraka amin'ny totalin'ny vola aloa!`;
// =========================================================================

// 1. Vérification Facebook Webhook
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
                        console.log(`--- 📩 MESSAGE CLIENT [${sender_psid}] :`, event.message.text);
                        const botResponse = await callGroqAIWithMemory(sender_psid, event.message.text);
                        console.log("--- 🤖 REPONSE IA :", botResponse);
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

                            console.log("--- 💬 NOUVEAU COMMENTAIRE :", userComment);

                            if (sender_id && sender_id !== entry.id) {
                                await replyPublicComment(comment_id, "Manao ahoana tompoko ! 😊 Nandefasanay hafatra miafina (MP) ianao izao miaraka amin'ny antsipiriany sy ny vidiny 📩✨");
                                
                                const promptComment = `Mpanjifa naneho hevitra hoe: "${userComment}". Valio amin'ny fomba fivarotana vente en ligne, mazava sy feno fanajana.`;
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

// 3. IA Groq avec Mémoire de discussion
async function callGroqAIWithMemory(userId, userPrompt) {
    if (!conversationMemory[userId]) {
        conversationMemory[userId] = [];
    }

    conversationMemory[userId].push({ role: 'user', content: userPrompt });

    if (conversationMemory[userId].length > 8) {
        conversationMemory[userId] = conversationMemory[userId].slice(-8);
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
        console.log("✅ Réponse publique sous commentaire envoyée !");
    } catch (e) { console.error("Erreur Commentaire:", e.response ? e.response.data : e.message); }
}

async function sendPrivateReply(commentId, text) {
    try {
        await axios.post(`https://graph.facebook.com/v19.0/me/messages?access_token=${PAGE_ACCESS_TOKEN}`, {
            recipient: { comment_id: commentId },
            message: { text: text }
        });
        console.log("✅ Message Privé (Auto-DM) envoyé !");
    } catch (e) { console.error("Erreur Private Reply:", e.response ? e.response.data : e.message); }
}

const PORT = process.env.PORT || 3000;
app.listen(PORT, () => console.log(`Serveur E-Varotra actif sur le port ${PORT}`));

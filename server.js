const express = require('express');
const axios = require('axios');
const app = express();

app.use(express.json());
app.use(express.urlencoded({ extended: true }));

const PORT = process.env.PORT || 3000;
const GROQ_API_KEY = process.env.GEMINI_API_KEY ? process.env.GEMINI_API_KEY.trim() : "";

// =========================================================================
// 📝 PROMPT COMMERCIAL VRAIE IA (E-VAROTRA INFORMATIQUE)
// =========================================================================
const SYSTEM_PROMPT = `Ianao dia mpanampy virtoaly mpivarotra tena mahay sy maharesy lahatra amin'ny "E-Varotra Informatique" (Imandry Fianarantsoa).

🏢 MOMBA NY BOUTIQUE SY NY FANDOAVAM-BOLA:
- Toerana fiaingana / Point de Récupération: Imandry Fianarantsoa (arrêt bus carrière).
  * Raha ho avy haka entana eo Imandry ny mpanjifa: lazao azy hoe maimaim-poana ny fakana azy ary miantso ny 038 28 171 00 (Jean Eric) rehefa tonga eo amin'ny arrêt bus carrière mba handraisana azy sy hitsapana (test) ny entana eo no ho eo.
- Livraison: 2 000 Ar eto Fianarantsoa Ville 🛵. Mandefa any amin'ny province amin'ny fiara taxi-brousse / poste 📦.
- MVola: 038 28 171 00 (Anarana: Jean Eric) 📲.
- Garantie & SAV: Entana vaovao sy azo antoka, azo tsapaina sy testena tsara eo no ho eo alohan'ny handoavana vola, ary misy SAV manampy aorian'ny fividianana 🛡️.

📦 CATALOGUE PRODUITS:
1. Capteur Wifi Tenda O1 1Km 5GHz = 135 000 Ar 📶
2. Tenda OS3 5km = 180 000 Ar (Mbola lany / En rupture ❌)
3. Routeur Wifi Tenda AC5 AC1200 = 85 000 Ar 🌐
4. Disque Dur Portable 500GB Vaovao = 75 000 Ar 💾
5. Disque dur Externe 500GB + rack 3.0 = 105 000 Ar 💽
6. Boitier / Rack 3.0 = 30 000 Ar 🔌
7. RAM & SSD = Miandry arrivage ⏳
8. Pack Tenda 1km + Routeur Dual Bande = 215 000 Ar ⚡

📋 DINGANA ARAHINA AMIN'NY VAROTRA:
1. Valio fohy, mazava, feno fanajana (mampiasa 'tompoko') sy emojis (😊, 📶, 🛵).
2. Anontanio avy hatrany: "Haterina amin'ny livraison eto Fianarantsoa ville ve (2 000 Ar) 🛵 sa ho avy haka mivantana eo Imandry (Maimaim-poana) 📍 sa alefa province 📦?"
3. Raha efa feno ny mombamomba azy (Anarana, Finday, Quartier), VALIDEO avy hatrany ny kaomandy miaraka amin'ny totalin'ny vola aloa!`;

// 🧠 Appel IA Groq
app.post('/api/chat', async (req, res) => {
    const { message, history } = req.body;
    
    let messagesToSend = [{ role: 'system', content: SYSTEM_PROMPT }];
    if (history && Array.isArray(history)) {
        messagesToSend = messagesToSend.concat(history.slice(-6));
    }
    messagesToSend.push({ role: 'user', content: message });

    const myChatModels = ['openai/gpt-oss-120b', 'openai/gpt-oss-20b', 'qwen/qwen3.8-27b'];

    for (let model of myChatModels) {
        try {
            const response = await axios.post(
                'https://api.groq.com/openai/v1/chat/completions',
                { model: model, messages: messagesToSend, temperature: 0.3 },
                { headers: { 'Authorization': `Bearer ${GROQ_API_KEY}`, 'Content-Type': 'application/json' } }
            );

            if (response.data && response.data.choices && response.data.choices[0].message) {
                return res.json({ reply: response.data.choices[0].message.content });
            }
        } catch (e) {}
    }

    res.json({ reply: "Manao ahoana tompoko ! 😊 Misy fitaovana informatique maro ato amin'ny E-Varotra Informatique. Inona no tadiavinao ? ✨" });
});

// 🌐 Interface Web Mobile Style WhatsApp
app.get('/', (req, res) => {
    res.send(`
<!DOCTYPE html>
<html lang="mg">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0, maximum-scale=1.0, user-scalable=no">
    <title>E-Varotra Informatique - Vendeur IA</title>
    <style>
        * { box-sizing: border-box; margin: 0; padding: 0; font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif; }
        body { background: #e5ddd5; display: flex; justify-content: center; height: 100vh; }
        .chat-container { width: 100%; max-width: 480px; background: #efeae2; display: flex; flex-direction: column; height: 100%; box-shadow: 0 0 10px rgba(0,0,0,0.1); }
        .header { background: #075e54; color: white; padding: 12px 16px; display: flex; align-items: center; gap: 12px; }
        .header .avatar { width: 42px; height: 42px; background: #25d366; border-radius: 50%; display: flex; align-items: center; justify-content: center; font-size: 20px; }
        .header .info h2 { font-size: 16px; }
        .header .info p { font-size: 12px; color: #dcf8c6; }
        .messages { flex: 1; overflow-y: auto; padding: 15px; display: flex; flex-direction: column; gap: 10px; }
        .msg { max-width: 80%; padding: 10px 14px; border-radius: 8px; font-size: 14px; line-height: 1.4; word-wrap: break-word; }
        .msg.bot { background: white; align-self: flex-start; border-top-left-radius: 0; box-shadow: 0 1px 1px rgba(0,0,0,0.1); }
        .msg.user { background: #dcf8c6; align-self: flex-end; border-top-right-radius: 0; box-shadow: 0 1px 1px rgba(0,0,0,0.1); }
        .input-area { background: #f0f0f0; padding: 10px; display: flex; gap: 8px; align-items: center; }
        .input-area input { flex: 1; padding: 12px 16px; border: none; border-radius: 24px; outline: none; font-size: 15px; background: white; }
        .input-area button { background: #075e54; color: white; border: none; width: 44px; height: 44px; border-radius: 50%; cursor: pointer; font-size: 18px; display: flex; align-items: center; justify-content: center; }
    </style>
</head>
<body>
    <div class="chat-container">
        <div class="header">
            <div class="avatar">🛒</div>
            <div class="info">
                <h2>E-Varotra Informatique</h2>
                <p>🟢 Vendeur IA en ligne (Fianarantsoa)</p>
            </div>
        </div>
        <div class="messages" id="chatBox">
            <div class="msg bot">Manao ahoana tompoko ! 😊 Tongasoa eto amin'ny E-Varotra Informatique (Imandry Fianarantsoa). Inona no fitaovana informatique tadiavinao androany ? ✨</div>
        </div>
        <form class="input-area" id="chatForm">
            <input type="text" id="userInput" placeholder="Soraty eto ny hafatrao..." autocomplete="off" required />
            <button type="submit">➤</button>
        </form>
    </div>

    <script>
        const chatBox = document.getElementById('chatBox');
        const chatForm = document.getElementById('chatForm');
        const userInput = document.getElementById('userInput');
        let history = [];

        chatForm.addEventListener('submit', async (e) => {
            e.preventDefault();
            const text = userInput.value.trim();
            if (!text) return;

            // Message utilisateur
            chatBox.innerHTML += '<div class="msg user">' + text + '</div>';
            userInput.value = '';
            chatBox.scrollTop = chatBox.scrollHeight;

            // Message temporaire de chargement
            const loadingId = 'loading-' + Date.now();
            chatBox.innerHTML += '<div class="msg bot" id="' + loadingId + '"><i>Eo am-panoratana... ⏳</i></div>';
            chatBox.scrollTop = chatBox.scrollHeight;

            try {
                const res = await fetch('/api/chat', {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify({ message: text, history: history })
                });
                const data = await res.json();
                
                document.getElementById(loadingId).remove();
                chatBox.innerHTML += '<div class="msg bot">' + data.reply.replace(/\\n/g, '<br>') + '</div>';
                history.push({ role: 'user', content: text });
                history.push({ role: 'assistant', content: data.reply });
            } catch (err) {
                document.getElementById(loadingId).innerText = "Miala tsiny tompoko, nisy olana kely ny fifandraisana.";
            }
            chatBox.scrollTop = chatBox.scrollHeight;
        });
    </script>
</body>
</html>
    `);
});

app.listen(PORT, () => console.log(`Boutique IA en ligne sur le port ${PORT}`));

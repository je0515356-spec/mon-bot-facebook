const express = require('express');
const axios = require('axios');
const app = express();

app.use(express.json());
app.use(express.urlencoded({ extended: true }));

const PORT = process.env.PORT || 3000;
const GROQ_API_KEY = process.env.GEMINI_API_KEY ? process.env.GEMINI_API_KEY.trim() : "";

// =========================================================================
// 📝 CERVEAU IA - EXPERT E-VAROTRA SPEEDWIFI (MIKROTECK 301)
// =========================================================================
const SYSTEM_PROMPT = `Ianao dia mpanampy virtoaly / vendeur mahay sy mavitrika amin'ny portail "MIKROTECK 301" ho an'ny "E-Varotra SpeedWifi" (Imandry Fianarantsoa).

🏢 MOMBA NY BOUTIQUE:
- Anarana: E-Varotra SpeedWifi
- Toerana: Imandry Fianarantsoa (arrêt bus carrière)
- Fitaovana ampiasaina: MikroTik hAP ax² / RB3011 (Wi-Fi 6 - 5GHz)
- Fifandraisana / MVola: 038 28 171 00 (Anarana: Jean Eric) 📱

📶 TOLOTRA (FORFAITS) MISY:
1. **Forfait 1 Fitaovana (Individuel):** 40 000 Ar / volana (30 andro) - Fitaovana 1 ihany, tsy azo zaraina.
2. **Forfait Foyer / Famille:** Ho an'ny fianakaviana miaraka - azo ampiasaina amin'ny fitaovana 5 (finday, ordinateur, tablette, TV, etc.) - vidiny arakaraky ny fifanarahana.
3. **Ticket Isaky ny Ora / Andro:** Misy amin'ny vidiny mora - miantsoa 038 28 171 00 mba hividianana ticket manokana.

⚡ FEPETRA ARA-TEKNIKA (Vitesse):
- Ny hafainganam-pandeha vaovao (normal) dia haingam-pandeha (Wi-Fi 6 5GHz).
- Bridage 512 Ko/s: Rehefa mihoatra ny consommation "fair use" ny mpanjifa iray (ohatra: manao streaming maharitra, download mavesatra), dia mety hafetra ho 512 Ko/s ny hafainganany mba tsy hanelingelina ny mpanjifa hafa.

⚠️ FITSIPKA HENJANA (CGU - Conditions Générales):
1. 🚫 **Voarara TANTERAKA ny Téléchargement mavesatra:** Torrents, P2P, film, lalao mavesatra.
2. 🔒 **Fitaovana Voafetra:** Forfait individuel = 1 fitaovana. Forfait foyer = 5 fitaovana.
3. ⚠️ **Olana FAI (Fournisseur/Opérateur):** Raha misy fahatapahana avy amin'i Telma/Orange/Airtel/Blueline, dia mety hijanona ny Wi-Fi. TSY MISY famerenam-bola na fanonerana andro very. Manaiky io risika io ny mpanjifa rehefa mividy.
4. 💳 **Fandoavam-bola:** Aloha mialoha amin'ny MVola 038 28 171 00 (Jean Eric).

🎯 TARI-DALANA HANEHOANA FAHAIZANA (Comment répondre):

🔹 EXEMPLE 1 - Raha manontany ny forfait ny mpanjifa:
Valio mazava tsara ny vidiny (40 000 Ar / volana), lazao ny tombony (Wi-Fi 6, haingana), ary AMPAHATSIAHIVO manokana:
"👉 Aza adino tompoko fa mba vakio tsara ny **📜 Fitsipika sy Fepetra (CGU)** eo ambany ambany amin'ny page mba ho fantatrao tsara ny fomba fiasa sy ny fetra (fandrarana téléchargement, sns.) 😊"

🔹 EXEMPLE 2 - Raha manontany momba ny fizarana ny mpanjifa:
"Ho an'ny forfait individuel (40 000 Ar) tompoko dia fitaovana 1 ihany no azo ampiasaina 🔒. Raha mila mizara amin'ny fianakaviana manontolo ianao (finday, TV, ordinateur...) dia manana **Forfait Foyer ho an'ny fitaovana 5** izahay ✨. Miantsoa ny 038 28 171 00 (Jean Eric) hahafantarana ny vidiny manokana!"

🔹 EXEMPLE 3 - Raha manontany momba ny hafainganana / bridage:
"Ny connexion-nay dia miasa amin'ny Wi-Fi 6 - 5GHz tompoko, ka haingana be ⚡. Kanefa, mba hitandroana ny hafainganana ho an'ny mpanjifa rehetra, dia misy fetra 512 Ko/s ho an'ny olona manao consommation be loatra (streaming maharitra, télécharger). Vakio tsara ny CGU 📜 mba ho fantatrao ny antsipiriany!"

🔹 EXEMPLE 4 - Raha manontany fomba fandoavam-bola:
"Alefaso amin'ny MVola tompoko: **038 28 171 00** (Anarana: Jean Eric) 📱. Rehefa vita ny fandoavam-bola, dia iraho amiko ny screenshot na miantsoa ny numéro io mba hanomezana anao ny kaody (voucher/ticket) haingana!"

🔹 EXEMPLE 5 - Raha misy olana (déconnexion, tapaka):
"Miala tsiny tompoko amin'ny olana. Amarino kely: 1) Efa mifandray amin'ny Wi-Fi 'E-Varotra SpeedWifi' ve ianao? 2) Nampidirinao tsara ve ny kaody? 3) Raha mbola tsy mety dia miantsoa mivantana ny **038 28 171 00 (Jean Eric)** izahay mba hanampiana anao 📞."

📌 FITSIPKA LEHIBE HO ANAO:
- Mitenena FOANA amin'ny teny Malagasy fohy, mazava, feno fanajana (mampiasa 'tompoko') sy emojis (⚡, 📶, 🚀, 🔒, 📜).
- Isaky ny mamaly ianao dia ampidiro amin'ny fomba mahafinaritra ny FIVAROTANA ('Alefaso amin'ny MVola raha efa vonona ianao!') sy ny fampahatsiahivana ny CGU.
- Aza mamerina ny vaovao rehetra amin'ny valinteny tsirairay, fa valio manokana ny fanontanian'ny mpanjifa.`;
// =========================================================================

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
                { model: model, messages: messagesToSend, temperature: 0.4 },
                { headers: { 'Authorization': `Bearer ${GROQ_API_KEY}`, 'Content-Type': 'application/json' } }
            );

            if (response.data && response.data.choices && response.data.choices[0].message) {
                return res.json({ reply: response.data.choices[0].message.content });
            }
        } catch (e) {}
    }

    res.json({ reply: "Manao ahoana tompoko ! 😊 Miala tsiny fa misy olana kely. Miantsoa ny 038 28 171 00 (Jean Eric) izahay mba hanampiana anao amin'ny Wi-Fi ✨" });
});

// 🌐 Interface Web (THÈME DARK TECH / STARLINK - Assortie au portail MIKROTECK 301)
app.get('/', (req, res) => {
    res.send(`
<!DOCTYPE html>
<html lang="mg">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0, maximum-scale=1.0, user-scalable=no">
    <title>Vendeur IA - E-Varotra SpeedWifi</title>
    <style>
        :root {
            --bg: #060913;
            --card-bg: rgba(13, 20, 38, 0.85);
            --primary: #00f2fe;
            --secondary: #4facfe;
            --accent: #10b981;
            --text: #f8fafc;
            --text-dim: #94a3b8;
            --border: rgba(0, 242, 254, 0.15);
        }
        * { box-sizing: border-box; margin: 0; padding: 0; font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif; }
        body {
            background: radial-gradient(circle at 50% 0%, #111d38 0%, #060913 70%);
            color: var(--text);
            display: flex;
            justify-content: center;
            height: 100vh;
            overflow: hidden;
        }
        .chat-container {
            width: 100%;
            max-width: 500px;
            background: var(--card-bg);
            border-left: 1px solid var(--border);
            border-right: 1px solid var(--border);
            display: flex;
            flex-direction: column;
            height: 100%;
            backdrop-filter: blur(10px);
        }
        .header {
            background: linear-gradient(135deg, rgba(0, 242, 254, 0.1), rgba(79, 172, 254, 0.05));
            padding: 14px 16px;
            display: flex;
            align-items: center;
            gap: 12px;
            border-bottom: 1px solid var(--border);
        }
        .header .avatar {
            width: 42px;
            height: 42px;
            background: linear-gradient(135deg, var(--primary), var(--secondary));
            border-radius: 50%;
            display: flex;
            align-items: center;
            justify-content: center;
            font-size: 20px;
            color: #060913;
            box-shadow: 0 0 15px rgba(0, 242, 254, 0.4);
        }
        .header .info h2 { font-size: 15px; font-weight: 800; color: #fff; }
        .header .info p { font-size: 11px; color: var(--accent); display: flex; align-items: center; gap: 4px; }
        .header .info .dot { width: 6px; height: 6px; background: var(--accent); border-radius: 50%; box-shadow: 0 0 6px var(--accent); animation: pulse 1.5s infinite; }
        @keyframes pulse { 0%,100%{opacity:1;} 50%{opacity:0.4;} }
        
        .messages {
            flex: 1;
            overflow-y: auto;
            padding: 16px;
            display: flex;
            flex-direction: column;
            gap: 10px;
        }
        .messages::-webkit-scrollbar { width: 5px; }
        .messages::-webkit-scrollbar-thumb { background: rgba(0, 242, 254, 0.2); border-radius: 3px; }
        
        .msg {
            max-width: 80%;
            padding: 10px 14px;
            border-radius: 14px;
            font-size: 14px;
            line-height: 1.5;
            word-wrap: break-word;
        }
        .msg.bot {
            background: rgba(30, 41, 59, 0.9);
            color: #f1f5f9;
            align-self: flex-start;
            border-top-left-radius: 2px;
            border: 1px solid rgba(255,255,255,0.05);
        }
        .msg.user {
            background: linear-gradient(135deg, var(--primary), var(--secondary));
            color: #060913;
            align-self: flex-end;
            border-top-right-radius: 2px;
            font-weight: 600;
            box-shadow: 0 2px 10px rgba(0, 242, 254, 0.2);
        }
        .msg.loading {
            color: var(--text-dim);
            font-style: italic;
            background: rgba(30, 41, 59, 0.6);
        }

        .input-area {
            background: rgba(6, 9, 19, 0.9);
            padding: 12px;
            display: flex;
            gap: 8px;
            align-items: center;
            border-top: 1px solid var(--border);
        }
        .input-area input {
            flex: 1;
            padding: 12px 16px;
            border: 1px solid rgba(255,255,255,0.08);
            background: rgba(15, 23, 42, 0.8);
            color: #fff;
            border-radius: 24px;
            outline: none;
            font-size: 14px;
            transition: 0.2s;
        }
        .input-area input:focus {
            border-color: var(--primary);
            box-shadow: 0 0 10px rgba(0, 242, 254, 0.2);
        }
        .input-area button {
            background: linear-gradient(135deg, var(--primary), var(--secondary));
            color: #060913;
            border: none;
            width: 44px;
            height: 44px;
            border-radius: 50%;
            cursor: pointer;
            font-size: 18px;
            font-weight: bold;
            display: flex;
            align-items: center;
            justify-content: center;
            box-shadow: 0 4px 15px rgba(0, 242, 254, 0.3);
            transition: transform 0.1s;
        }
        .input-area button:active { transform: scale(0.9); }
    </style>
</head>
<body>
    <div class="chat-container">
        <div class="header">
            <div class="avatar">🤖</div>
            <div class="info">
                <h2>Vendeur IA • MIKROTECK 301</h2>
                <p><span class="dot"></span> En ligne 24h/24 • E-Varotra SpeedWifi</p>
            </div>
        </div>
        <div class="messages" id="chatBox">
            <div class="msg bot">
                Manao ahoana tompoko ! ⚡ Tongasoa amin'ny <b>E-Varotra SpeedWifi</b> (MIKROTECK 301) 🚀.<br><br>
                Afaka manampy anao aho amin'ny:<br>
                • 📶 Fanazavana momba ny Forfait 40 000 Ar / volana<br>
                • 👨‍👩‍👧 Forfait Foyer ho an'ny fitaovana 5<br>
                • 💳 Fandoavam-bola MVola<br>
                • 📜 Fitsipika sy Fepetra fampiasana<br><br>
                Inona no tadiavinao fantarina tompoko ? ✨
            </div>
        </div>
        <form class="input-area" id="chatForm">
            <input type="text" id="userInput" placeholder="Soraty eto ny fanontanianao..." autocomplete="off" required />
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

            chatBox.innerHTML += '<div class="msg user">' + escapeHtml(text) + '</div>';
            userInput.value = '';
            chatBox.scrollTop = chatBox.scrollHeight;

            const loadingId = 'load-' + Date.now();
            chatBox.innerHTML += '<div class="msg bot loading" id="' + loadingId + '">Eo am-panoratana... ⏳</div>';
            chatBox.scrollTop = chatBox.scrollHeight;

            try {
                const res = await fetch('/api/chat', {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify({ message: text, history: history })
                });
                const data = await res.json();
                
                document.getElementById(loadingId).remove();
                const cleanReply = data.reply.replace(/\\n/g, '<br>');
                chatBox.innerHTML += '<div class="msg bot">' + cleanReply + '</div>';
                history.push({ role: 'user', content: text });
                history.push({ role: 'assistant', content: data.reply });
            } catch (err) {
                document.getElementById(loadingId).innerText = "Miala tsiny tompoko, nisy olana kely. Andramo indray azafady.";
            }
            chatBox.scrollTop = chatBox.scrollHeight;
        });

        function escapeHtml(text) {
            const div = document.createElement('div');
            div.textContent = text;
            return div.innerHTML;
        }
    </script>
</body>
</html>
    `);
});

app.listen(PORT, () => console.log(`Vendeur IA E-Varotra SpeedWifi actif sur le port ${PORT}`));

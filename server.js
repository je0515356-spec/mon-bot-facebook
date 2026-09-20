const express = require('express');
const axios = require('axios');
const app = express();

app.use(express.json());
app.use(express.urlencoded({ extended: true }));

const PORT = process.env.PORT || 3000;
const GROQ_API_KEY = process.env.GEMINI_API_KEY ? process.env.GEMINI_API_KEY.trim() : "";

// =========================================================================
// 📝 CERVEAU IA COMPLET - EXPERT MIKROTECK 301 & E-VAROTRA SPEEDWIFI
// =========================================================================
const SYSTEM_PROMPT = `Ianao dia mpanampy virtoaly / vendeur mahay sy mavitrika amin'ny portail "MIKROTECK 301" ho an'ny "E-Varotra SpeedWifi" (Imandry Fianarantsoa).

🛰️ FAI (Fournisseur Internet): STARLINK by SpaceX (Satellite haingam-pandeha)

🏢 MOMBA NY BOUTIQUE:
- Anarana: E-Varotra SpeedWifi
- Toerana: Imandry Fianarantsoa (arrêt bus carrière)
- Fitaovana: MikroTik hAP ax² / RB3011 (Wi-Fi 6 - 5GHz)
- Fifandraisana / MVola: 038 28 171 00 (Anarana: Jean Eric) 📱

🕐 FOTOANA MISOKATRA (Horaires):
- Miasa: 5h maraina hatramin'ny 00h alina (minuit)
- Mikatona: 00h alina hatramin'ny 5h maraina (fikojakojana / maintenance satellite Starlink)

💰 TOLOTRA WIFIZONE (FORFAITS):
🌟 VIDINY IRAY: 40 000 Ar / volana (30 andro)
   ➤ Forfait Individuel: 1 fitaovana (finday na solosaina 1)
   ➤ Forfait Foyer: hatramin'ny 5 fitaovana ao anaty trano iray (finday, TV, PC, tablette) - VIDINY MITOVY (40 000 Ar)!
   ➤ Ticket isaky ny ora/andro: miantsoa ny 038 28 171 00 hividianana kaody voucher

📦 VOKATRA AMIDY (Matériels informatiques):
1. Capteur Wifi Tenda O1 1Km 5GHz = 135 000 Ar 📶
2. Tenda OS3 5km = 180 000 Ar (Mbola lany ❌)
3. Routeur Wifi Tenda AC5 AC1200 = 85 000 Ar 🌐
4. Pack Tenda 1km + Routeur Dual Bande = 215 000 Ar ⚡
5. Disque Dur Portable 500GB Vaovao = 75 000 Ar 💾
6. Disque dur Externe 500GB + rack 3.0 = 105 000 Ar 💽
7. Boitier / Rack 3.0 = 30 000 Ar 🔌
* Livraison: 2 000 Ar eto Fianarantsoa Ville 🛵. Fakana azy maimaim-poana eo Imandry (arrêt bus carrière).

⚡ FEPETRA ARA-TEKNIKA & BRIDAGE:
- Hafainganana normal: Haingam-pandeha Wi-Fi 6 Starlink
- Bridage 512 Ko/s: ampiharina raha misy olona manao consommation be loatra (streaming tsy an-kijanona, téléchargement) mba hitandroana ny hafainganam-pandeha ho an'ny rehetra.

⚠️ FITSIPIKA HENJANA (CGU):
1. 🚫 Voarara TANTERAKA ny Téléchargement mavesatra (Torrents, film, lalao).
2. 🔒 Forfait Individuel = 1 fitaovana / Forfait Foyer = 5 fitaovana ao an-trano ihany (tsy azo zaraina any ivelany).
3. ⚠️ Olana Starlink / Jirama: TSY MISY famerenam-bola na fanonerana andro very. Manaiky izany risika izany ny mpanjifa rehefa mividy.
4. 💳 Fandoavam-bola: MVola 038 28 171 00 (Jean Eric).

🎯 FEPETRA HO AN'NY VALINTENINAO:
- Mitenena foana amin'ny teny Malagasy fohy, mazava, feno fanajana ('tompoko') sy emojis (⚡, 🛰️, 📶, 🚀, 🔒, 📜).
- Isaky ny mamaly fanontaniana momba ny tolotra ianao dia **AMPAHATSIAHIVO MAFY NY MPANJIFA HAMAKY NY CGU (Fitsipika)** eo ambany amin'ny pejy!
- Valio manokana ny zavatra anontanian'ny mpanjifa (aza mamerina ny lisitra manontolo).`;

// 🧠 Route API Chat
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

    res.json({ reply: "Manao ahoana tompoko ! 😊 Misy olana kely ny fifandraisana. Miantsoa mivantana ny 038 28 171 00 (Jean Eric) izahay mba hanampiana anao ✨" });
});

// 🌐 Interface Web Chat (THÈME CYBER SÉCURITÉ ROUGE & NOIR)
app.get('/', (req, res) => {
    res.send(`
<!DOCTYPE html>
<html lang="mg">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0, maximum-scale=1.0, user-scalable=no">
    <title>Vendeur IA - MIKROTECK 301</title>
    <style>
        :root {
            --bg-black: #060606;
            --bg-card: #111111;
            --red-alert: #ff003c;
            --red-glow: rgba(255, 0, 60, 0.4);
            --white: #ffffff;
            --grey: #a0a0a0;
            --grey-dark: #222222;
            --success: #00ff88;
        }
        * { box-sizing: border-box; margin: 0; padding: 0; font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, monospace; }
        body {
            background: var(--bg-black);
            color: var(--white);
            display: flex;
            justify-content: center;
            height: 100vh;
            overflow: hidden;
        }
        .chat-container {
            width: 100%;
            max-width: 500px;
            background: var(--bg-black);
            display: flex;
            flex-direction: column;
            height: 100%;
            border-left: 1px solid var(--grey-dark);
            border-right: 1px solid var(--grey-dark);
        }
        .header {
            background: linear-gradient(90deg, #0a0a0a, rgba(255,0,60,0.15));
            padding: 12px 16px;
            display: flex;
            align-items: center;
            gap: 12px;
            border-bottom: 1px solid var(--red-alert);
        }
        .header .avatar {
            width: 38px;
            height: 38px;
            background: var(--red-alert);
            border-radius: 4px;
            display: flex;
            align-items: center;
            justify-content: center;
            font-size: 18px;
            box-shadow: 0 0 10px var(--red-glow);
        }
        .header .info h2 { font-size: 14px; font-weight: 900; color: #fff; letter-spacing: 1px; }
        .header .info p { font-size: 10px; color: var(--success); display: flex; align-items: center; gap: 4px; }
        .header .info .dot { width: 6px; height: 6px; background: var(--success); border-radius: 50%; box-shadow: 0 0 6px var(--success); }
        
        .messages {
            flex: 1;
            overflow-y: auto;
            padding: 14px;
            display: flex;
            flex-direction: column;
            gap: 10px;
        }
        .messages::-webkit-scrollbar { width: 4px; }
        .messages::-webkit-scrollbar-thumb { background: var(--red-alert); }
        
        .msg {
            max-width: 85%;
            padding: 10px 14px;
            border-radius: 4px;
            font-size: 13px;
            line-height: 1.5;
            word-wrap: break-word;
        }
        .msg.bot {
            background: var(--bg-card);
            color: #f1f5f9;
            align-self: flex-start;
            border: 1px solid var(--grey-dark);
            border-left: 3px solid var(--red-alert);
        }
        .msg.user {
            background: var(--red-alert);
            color: #ffffff;
            align-self: flex-end;
            font-weight: 600;
            box-shadow: 0 0 10px var(--red-glow);
        }
        .msg.loading {
            color: var(--grey);
            font-style: italic;
            background: #151515;
            border-left: 3px solid var(--grey);
        }

        .input-area {
            background: #0d0d0d;
            padding: 10px 12px;
            display: flex;
            gap: 8px;
            align-items: center;
            border-top: 1px solid var(--grey-dark);
        }
        .input-area input {
            flex: 1;
            padding: 12px 14px;
            border: 1px solid var(--grey-dark);
            background: #181818;
            color: #fff;
            border-radius: 4px;
            outline: none;
            font-size: 13px;
            transition: 0.2s;
        }
        .input-area input:focus {
            border-color: var(--red-alert);
            box-shadow: 0 0 10px var(--red-glow);
        }
        .input-area button {
            background: var(--red-alert);
            color: #fff;
            border: none;
            width: 42px;
            height: 42px;
            border-radius: 4px;
            cursor: pointer;
            font-size: 16px;
            font-weight: bold;
            display: flex;
            align-items: center;
            justify-content: center;
            box-shadow: 0 0 12px var(--red-glow);
        }
        .input-area button:active { transform: scale(0.95); }
    </style>
</head>
<body>
    <div class="chat-container">
        <div class="header">
            <div class="avatar">🤖</div>
            <div class="info">
                <h2>MIKROTECK 301 · AI ASSISTANT</h2>
                <p><span class="dot"></span> Miasa 24h/24 • E-Varotra SpeedWifi (Starlink)</p>
            </div>
        </div>
        <div class="messages" id="chatBox">
            <div class="msg bot">
                Manao ahoana tompoko ! ⚡ Tongasoa eto amin'ny <b>E-Varotra SpeedWifi</b> (Starlink SpaceX) 🛰️.<br><br>
                Afaka manampy anao aho amin'ny:<br>
                • 📶 Forfait 40 000 Ar (Individuel na Foyer 5 fitaovana)<br>
                • 🕐 Ora fiasana: 5h maraina → 00h alina<br>
                • 💳 Fandoavana MVola (038 28 171 00 Jean Eric)<br>
                • 📦 Fividianana Routeur / Capteur Tenda O1<br><br>
                ⚠️ <i>Aza adino ny mamaky ny Fitsipika (CGU) eo ambany amin'ny pejy!</i> Inona no fanontanianao tompoko ? 😊
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
                document.getElementById(loadingId).innerText = "Miala tsiny tompoko, nisy olana kely. Andramo indray.";
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

app.listen(PORT, () => console.log(`Serveur Cyber IA actif sur le port ${PORT}`));

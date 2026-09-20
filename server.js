const express = require('express');
const axios = require('axios');
const app = express();

app.use(express.json());
app.use(express.urlencoded({ extended: true }));

const PORT = process.env.PORT || 3000;
const GROQ_API_KEY = process.env.GEMINI_API_KEY ? process.env.GEMINI_API_KEY.trim() : "";

// =========================================================================
// 🧠 CERVEAU IA EXPERT : TECHNICIEN RÉSEAU, MATÉRIEL & VENDEUR COMMERCIAL
// =========================================================================
const SYSTEM_PROMPT = `Ianao dia mpanampy virtoaly "INGÉNIEUR TECHNICIEN & VENDEUR EXPERT" amin'ny portail "MIKROTECK 301" ho an'ny "E-Varotra SpeedWifi" (Imandry Fianarantsoa).

🛰️ FOURNISSEUR INTERNET (FAI): STARLINK by SpaceX (Connexion Satellite haut débit)
🏢 FOIBE & FIFANDRAISANA: Imandry Fianarantsoa (arrêt bus carrière) | MVola / Finday: 038 28 171 00 (Jean Eric) 📱
🕐 ORA FIASANA: 5h maraina → 00h alina (Mikatona 00h → 5h ho an'ny fikojakojana satellite).

💰 TOLOTRA (FORFAITS):
🌟 VIDINY IRAY: 40 000 Ar / volana (30 andro)
   - Forfait Individuel: 1 fitaovana
   - Forfait Foyer: hatramin'ny 5 fitaovana ao an-trano (finday, PC, TV, tablette) - Vidiny mitovy (40 000 Ar)!
   - Tickets ora/andro: Miantsoa ny 038 28 171 00.

📦 VOKATRA AMIDY (Catalogue Matériel):
1. Capteur Wifi Tenda O1 1Km 5GHz = 135 000 Ar 📶
2. Tenda OS3 5km = 180 000 Ar (Mbola lany ❌)
3. Routeur Wifi Tenda AC5 AC1200 = 85 000 Ar 🌐
4. Pack Tenda 1km + Routeur Dual Bande = 215 000 Ar ⚡
5. Disque Dur Portable 500GB Vaovao = 75 000 Ar 💾
6. Disque dur Externe 500GB + rack 3.0 = 105 000 Ar 💽
7. Boitier / Rack 3.0 = 30 000 Ar 🔌
* Livraison Fianar Ville: 2 000 Ar 🛵 | Fakana azy maimaim-poana eo Imandry.

=========================================================================
🛠️ BAZIN'NY FAHAIZANA ARA-TEKNIKA & FAMAHANA OLANA (Dépannage & Support)
=========================================================================

Raha misy mpanjifa manana olana ara-teknika na ara-pitaovana dia toroy hevitra manokana dingana pa dingana (étape par étape) amin'ny teny Malagasy tsotra izy:

🔴 OLANA 1: TSY MIPOITRA NY PEJY FIDIRANA (Portail Captif / Login tsy miseho)
➤ Vahaolana torolalana:
  1. Vonoy ny Données Mobiles (4G/3G) amin'ny finday mba tsy hifangaro.
  2. Sokafy ny navigateur (Chrome na Safari) dia soraty eo amin'ny barre d'adresse: "http://neverssl.com" na "http://192.168.88.1".
  3. Raha mampiasa VPN na DNS Privé (ohatra: AdGuard, Cloudflare 1.1.1.1) ianao dia vonoy vonjimaika satria manakana ny pejy fidirana ireny.

🔴 OLANA 2: TAFIDITRA AMIN'NY WI-FI FA "CONNECTED WITHOUT INTERNET" (Tsy mandeha ny Net)
➤ Vahaolana torolalana:
  1. Hamarino raha efa tafiditra soa aman-tsara tao amin'ny pejy fidirana ianao (nampiditra kaody sy nanamarina ny CGU).
  2. Jereo sao tapitra ny fe-potoana (session time) amin'ny ticket-nao.
  3. Vonoy ny Wi-Fi amin'ny finday/PC dia avereno velomina indray (Reconnect).

🔴 OLANA 3: MIADANA NY CONNEXION (Lenteur / Bridage)
➤ Vahaolana torolalana:
  1. Hazavao am-panajana fa raha nanao Téléchargement mavesatra (Torrents, film) na streaming maharitra loatra izy, dia voafehy ho 512 Ko/s ny hafainganam-pandehany mba hitandroana ny tambazotra ho an'ny rehetra (araka ny CGU).
  2. Jereo ny elanelana amin'ny antenne Wi-Fi (hAP ax² na Tenda) sao misy rindrina matevina na sakana be loatra.

🔴 OLANA 4: TAPAKA MATETIKA NY WI-FI (Déconnexions intempestives)
➤ Vahaolana torolalana:
  1. Amin'ny finday Android/iPhone: Mandehana amin'ny Paramètres Wi-Fi > E-Varotra SpeedWifi > Privacy/Confidentialité > Ovao ho "Utiliser l'adresse MAC de l'appareil" (aza avela ho MAC aléatoire).
  2. Vonoy ny "Économiseur de batterie" sao mamono ny Wi-Fi rehefa mikatona ny écran.

🔴 OLANA 5: TSY MAHAZO KAODY / DISO NY MOT DE PASSE (Invalid Username/Password)
➤ Vahaolana torolalana:
  1. Hamarino tsara sao nisy espace (banga) teo aloha na teo aorian'ilay kaody.
  2. Tandremo ny fahasamihafan'ny tarehimarika "0" (aotra) sy ny litera "O", ary ny "1" sy ny "I".
  3. Raha mbola tsy mety dia miantsoa avy hatrany ny 038 28 171 00 (Jean Eric) mba hanamarina ny kaontinao ao amin'ny serveur.

🔴 OLANA 6: MATÉRIEL - TENDA O1 / ROUTEUR AC5 / DISQUE DUR
➤ Vahaolana torolalana:
  - Tenda O1: Hamarino raha mirehitra ny jiro POE amin'ny boîtier mainty, ary ataovy mahitsy tsara manatrika ny foibe Imandry ny antenne.
  - Disque Dur tsy hita amin'ny PC: Ampidiro amin'ny port USB ao aorian'ny solosaina (USB 3.0 manga) mba hahazo hery tsara, na jereo raha mirehitra ny jiro manga amin'ilay boitier rack.

=========================================================================
⚠️ FITSIPIKA AMIN'NY VALINTENY (Règles d'or):
=========================================================================
1. Mitenena foana amin'ny teny Malagasy fohy, mazava, manaja tsara ('tompoko') miaraka amin'ny emojis (🛠️, ⚡, 📶, 🛰️, 💡).
2. Raha olana ara-teknika no anontaniany: omeo avy hatrany ny vahaolana ara-teknika mifanaraka amin'izany.
3. Raha tolotra na vidiny no anontaniany: lazao ny vidiny (40 000 Ar), ny MVola (038 28 171 00 Jean Eric), ary AMPAHATSIAHIVO MAFY ny hamaky ny CGU (Fitsipika).
4. Raha olana tsy voavaha an-tserasera dia lazao azy hoe: "Miantsoa mivantana ny 038 28 171 00 (Jean Eric) na manatona eo Imandry (arrêt bus carrière) mba hijerena mivantana ny fitaovanao tompoko!"`;

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
                { model: model, messages: messagesToSend, temperature: 0.3 },
                { headers: { 'Authorization': `Bearer ${GROQ_API_KEY}`, 'Content-Type': 'application/json' } }
            );

            if (response.data && response.data.choices && response.data.choices[0].message) {
                return res.json({ reply: response.data.choices[0].message.content });
            }
        } catch (e) {}
    }

    res.json({ reply: "Manao ahoana tompoko ! 😊 Misy olana kely ny fifandraisana. Miantsoa mivantana ny 038 28 171 00 (Jean Eric) izahay mba hanampiana anao amin'ny Wi-Fi sy ny fitaovanao ✨" });
});

// 🌐 Interface Web Chat (THÈME CYBER SÉCURITÉ ROUGE & NOIR)
app.get('/', (req, res) => {
    res.send(`
<!DOCTYPE html>
<html lang="mg">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0, maximum-scale=1.0, user-scalable=no">
    <title>Technicien & Vendeur IA - MIKROTECK 301</title>
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
        .header .info h2 { font-size: 13px; font-weight: 900; color: #fff; letter-spacing: 1px; }
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
                <h2>MIKROTECK 301 · SUPPORT & VENTES</h2>
                <p><span class="dot"></span> Technicien & Vendeur IA en ligne (24h/24)</p>
            </div>
        </div>
        <div class="messages" id="chatBox">
            <div class="msg bot">
                Manao ahoana tompoko ! ⚡ Izaho no mpanampy virtoaly <b>Technicien & Vendeur</b> amin'ny MIKROTECK 301 (Starlink SpaceX) 🛰️.<br><br>
                Afaka manampy anao avy hatrany aho amin'ny:<br>
                • 🛠️ <b>Olana ara-teknika:</b> Tsy mipoitra ny pejy, miadana, diso kaody, olana finday/PC<br>
                • 📶 <b>Forfait 40 000 Ar:</b> 1 fitaovana na Foyer 5 fitaovana<br>
                • 💳 <b>Fandoavana MVola:</b> 038 28 171 00 (Jean Eric)<br>
                • 📦 <b>Fitaovana:</b> Capteur Tenda O1, Routeur AC5, Disque Dur<br><br>
                Inona no olana na fanontaniana manahiran-tsaina anao tompoko ? 😊
            </div>
        </div>
        <form class="input-area" id="chatForm">
            <input type="text" id="userInput" placeholder="Soraty eto ny olana na fanontanianao..." autocomplete="off" required />
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
            chatBox.innerHTML += '<div class="msg bot loading" id="' + loadingId + '">Eo am-panadihadiana... ⏳</div>';
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

app.listen(PORT, () => console.log(`Serveur Technicien Cyber IA actif sur le port ${PORT}`));

const express = require('express');
const cors = require('cors');
const app = express();
app.use(cors({ origin: '*' }));
app.use(express.json());

const TELEGRAM_BOT_TOKEN = '8817867638:AAHXOhkRZDeb8mFLmp8My_x8eFdC5Az3F0A'; // 👈 замени на реальный

// Вебхук пока просто отвечает на /start
app.post('/telegram-webhook', async (req, res) => {
  try {
    const update = req.body;
    if (update.message) {
      const msg = update.message;
      const chatId = msg.chat.id;
      const text = msg.text || '';
      if (text === '/start') {
        await fetch(`https://api.telegram.org/bot${TELEGRAM_BOT_TOKEN}/sendMessage`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            chat_id: chatId,
            text: '👋 Привет! Я помогу тебе определить, куда направить силы в IT. Скоро тут появится квиз!'
          })
        });
      }
    }
    res.send('ok');
  } catch (e) {
    console.error(e);
    res.sendStatus(500);
  }
});

const PORT = process.env.PORT || 3000;
app.listen(PORT, () => console.log(`Server running on port ${PORT}`));

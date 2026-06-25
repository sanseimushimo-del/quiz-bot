const express = require('express');
const cors = require('cors');
const app = express();
app.use(cors({ origin: '*' }));
app.use(express.json());

const TELEGRAM_BOT_TOKEN = '8817867638:AAHXOhkRZDeb8mFLmp8My_x8eFdC5Az3F0A';

// Хранилище сессий: chatId -> { currentQuestion, scores }
const sessions = {};

// Описание профилей
const profiles = {
  frontend: {
    emoji: '🎨',
    title: 'Frontend-маг',
    description: 'Ты превращаешь код в визуальную магию. Тебе важны эмоции пользователя, плавность анимаций и красота кнопок. Твоя стихия — клиентская часть, взаимодействие с человеком. Рекомендуем углубиться в React, TypeScript, Web Animation API и основы UX-дизайна.'
  },
  backend: {
    emoji: '⚙️',
    title: 'Backend-инженер',
    description: 'Ты — мозг системы. Тебя не пугают сложные алгоритмы, очереди сообщений и проектирование баз данных. Ты любишь, чтобы всё работало надёжно и быстро. Погрузись в микросервисную архитектуру, Go или Node.js, брокеры сообщений (Kafka/RabbitMQ), SQL и NoSQL базы данных.'
  },
  data: {
    emoji: '📊',
    title: 'Data/Scripting-аналитик',
    description: 'Ты видишь мир через призму данных. Тебе интересно копаться в цифрах, строить модели и автоматизировать отчёты. Python, SQL, Jupyter Notebook — твои лучшие друзья. Изучи библиотеки Pandas, NumPy, matplotlib, потом можно перейти к машинному обучению.'
  },
  manager: {
    emoji: '💬',
    title: 'Product/Project-менеджер',
    description: 'Ты — связующее звено. Ты умеешь слушать, понимать боль пользователя и переводить её в задачи. Твоя сила — в организации и стратегии. Тебе пригодятся навыки работы с Jira, Notion, основами SQL и методами управления (Agile, Scrum, Kanban).'
  },
  devops: {
    emoji: '🛠️',
    title: 'DevOps/SRE-инженер',
    description: 'Ты — хранитель стабильности. Ты любишь, когда всё автоматизировано, мониторится и не падает. Твоя работа часто не видна, но без неё ничего не работает. Осваивай Linux, Docker, Kubernetes, Terraform, CI/CD (GitHub Actions/GitLab CI), Prometheus, Grafana.'
  }
};

// Вопросы: текст + варианты (каждый вариант — текст + куда плюсовать балл)
const questions = [
  {
    text: '1. Как ты любишь решать задачи?',
    options: [
      { text: '🎨 Создавать красивый и удобный интерфейс', profile: 'frontend' },
      { text: '⚙️ Продумывать сложную логику и архитектуру', profile: 'backend' },
      { text: '📊 Анализировать данные, искать закономерности', profile: 'data' },
      { text: '💬 Общаться с людьми, понимать их потребности', profile: 'manager' },
      { text: '🛠️ Настраивать серверы, автоматизировать развертывание', profile: 'devops' }
    ]
  },
  {
    text: '2. Какая среда для тебя комфортнее?',
    options: [
      { text: '🎨 Figma / графический редактор + браузер', profile: 'frontend' },
      { text: '⚙️ IDE с тёмной темой, консоль и логи', profile: 'backend' },
      { text: '📊 Jupyter Notebook, Excel, SQL-клиент', profile: 'data' },
      { text: '💬 Доски задач (Trello/Jira), встречи, zoom', profile: 'manager' },
      { text: '🛠️ Терминал, конфиги, дашборды Grafana', profile: 'devops' }
    ]
  },
  {
    text: '3. Что тебя больше всего драйвит?',
    options: [
      { text: '🎨 Когда анимация получается плавной и красивой', profile: 'frontend' },
      { text: '⚙️ Когда сложный алгоритм работает с первого раза', profile: 'backend' },
      { text: '📊 Когда находишь скрытую корреляцию в данных', profile: 'data' },
      { text: '💬 Когда команда по твоей презентации вдохновляется', profile: 'manager' },
      { text: '🛠️ Когда после твоих действий сервер перестаёт падать', profile: 'devops' }
    ]
  },
  {
    text: '4. Какую технологию ты бы выбрал для изучения прямо сейчас?',
    options: [
      { text: '🎨 React, CSS-анимации, WebGL', profile: 'frontend' },
      { text: '⚙️ Go, Kafka, микросервисы', profile: 'backend' },
      { text: '📊 Python, SQL, Pandas', profile: 'data' },
      { text: '💬 Notion, Jira, SQL (чтобы понимать команду)', profile: 'manager' },
      { text: '🛠️ Kubernetes, Terraform, AWS', profile: 'devops' }
    ]
  },
  {
    text: '5. Представь идеальный результат твоей работы:',
    options: [
      { text: '🎨 Продукт, который хочется потрогать глазами', profile: 'frontend' },
      { text: '⚙️ Система, которая держит миллионы запросов', profile: 'backend' },
      { text: '📊 Дашборд, который показывает бизнесу, куда расти', profile: 'data' },
      { text: '💬 Заказчик счастлив, команда мотивирована, сроки соблюдены', profile: 'manager' },
      { text: '🛠️ Инфраструктура, которую можно развернуть одной командой', profile: 'devops' }
    ]
  },
  {
    text: '6. Как ты относишься к неопределённости и риску?',
    options: [
      { text: '🎨 Готов экспериментировать, даже если не уверен', profile: 'frontend' },
      { text: '⚙️ Продумываю архитектуру, чтобы учесть изменения', profile: 'backend' },
      { text: '📊 Собираю данные, чтобы снизить неопределённость', profile: 'data' },
      { text: '💬 Управляю рисками через коммуникацию и планирование', profile: 'manager' },
      { text: '🛠️ Строю отказоустойчивые системы, чтобы свести риски к минимуму', profile: 'devops' }
    ]
  }
];

// Функция отправки сообщения
async function sendMessage(chatId, text, replyMarkup = null) {
  const payload = { chat_id: chatId, text, parse_mode: 'HTML' };
  if (replyMarkup) payload.reply_markup = JSON.stringify(replyMarkup);
  return fetch(`https://api.telegram.org/bot${TELEGRAM_BOT_TOKEN}/sendMessage`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(payload)
  }).then(r => r.json());
}

// Вебхук
app.post('/telegram-webhook', async (req, res) => {
  try {
    const update = req.body;

    // Обработка сообщений
    if (update.message) {
      const msg = update.message;
      const chatId = msg.chat.id;
      const text = msg.text || '';

      if (text === '/start') {
        await sendMessage(chatId, '👋 Привет! Я помогу тебе определить, куда направить силы в IT. Напиши /quiz, чтобы начать!');
      } else if (text === '/quiz') {
        // Запускаем сессию
        sessions[chatId] = {
          currentQuestion: 0,
          scores: { frontend: 0, backend: 0, data: 0, manager: 0, devops: 0 }
        };
        const q = questions[0];
        const inlineKeyboard = {
          inline_keyboard: q.options.map(opt => ([{ text: opt.text, callback_data: `answer_0_${opt.profile}` }]))
        };
        await sendMessage(chatId, q.text, inlineKeyboard);
      }
    }

    // Обработка ответов (callback_query)
    if (update.callback_query) {
      const query = update.callback_query;
      const chatId = query.message.chat.id;
      const messageId = query.message.message_id;
      const data = query.data; // answer_0_frontend и т.д.

      // Отвечаем на callback, чтобы убрать часики
      res.json({ callback_query_id: query.id });

      // Проверяем, что это ответ на квиз
      if (!data.startsWith('answer_')) return;

      const parts = data.split('_');
      const questionIndex = parseInt(parts[1]);
      const profileKey = parts[2];

      // Получаем сессию пользователя
      const session = sessions[chatId];
      if (!session || session.currentQuestion !== questionIndex) {
        await sendMessage(chatId, 'Сессия устарела. Начни заново: /quiz');
        return;
      }

      // Начисляем балл
      session.scores[profileKey]++;

      // Удаляем предыдущее сообщение с вопросом (опционально, чтобы не мусорить)
      try {
        await fetch(`https://api.telegram.org/bot${TELEGRAM_BOT_TOKEN}/deleteMessage`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ chat_id: chatId, message_id: messageId })
        });
      } catch (e) {}

      // Переходим к следующему вопросу или показываем результат
      const nextQuestionIndex = questionIndex + 1;
      if (nextQuestionIndex < questions.length) {
        session.currentQuestion = nextQuestionIndex;
        const q = questions[nextQuestionIndex];
        const inlineKeyboard = {
          inline_keyboard: q.options.map(opt => ([{ text: opt.text, callback_data: `answer_${nextQuestionIndex}_${opt.profile}` }]))
        };
        await sendMessage(chatId, q.text, inlineKeyboard);
      } else {
        // Квиз завершён — подсчитываем результат
        const scores = session.scores;
        let maxScore = 0;
        let resultProfile = 'frontend'; // по умолчанию
        for (const [key, val] of Object.entries(scores)) {
          if (val > maxScore) {
            maxScore = val;
            resultProfile = key;
          }
        }
        // Если ничья, можно выбрать случайную из лидеров, но пока берём первую
        const profile = profiles[resultProfile];
        const resultText = `${profile.emoji} <b>${profile.title}</b>\n\n${profile.description}\n\nПопробуй ещё раз — /quiz`;

        const shareKeyboard = {
          inline_keyboard: [
            [{ text: '📲 Поделиться результатом', switch_inline_query: `Мой профиль: ${profile.emoji} ${profile.title}` }]
          ]
        };
        await sendMessage(chatId, resultText, shareKeyboard);

        // Очищаем сессию
        delete sessions[chatId];
      }
    }
  } catch (e) {
    console.error(e);
    res.sendStatus(500);
  }
});

const PORT = process.env.PORT || 3000;
app.listen(PORT, () => console.log(`Quiz bot running on port ${PORT}`));

const express = require('express');
const cors = require('cors');
const app = express();
app.use(cors({ origin: '*' }));
app.use(express.json());

const TELEGRAM_BOT_TOKEN = '8817867638:AAHXOhkRZDeb8mFLmp8My_x8eFdC5Az3F0A';
const ADMIN_CHAT_ID = '453801455'; // твой ID для /stats

// Сессии: chatId -> { state, currentQuestion, scores, subScores }
const sessions = {};

// Статистика
const stats = {
  total: 0,
  profiles: { frontend: 0, backend: 0, data: 0, manager: 0, devops: 0 }
};

// Профили (основные)
const mainProfiles = {
  frontend: { emoji: '🎨', title: 'Frontend-маг', description: 'Ты превращаешь код в визуальную магию.' },
  backend: { emoji: '⚙️', title: 'Backend-инженер', description: 'Ты — мозг системы.' },
  data: { emoji: '📊', title: 'Data/Scripting-аналитик', description: 'Ты видишь мир через данные.' },
  manager: { emoji: '💬', title: 'Product/Project-менеджер', description: 'Ты — связующее звено.' },
  devops: { emoji: '🛠️', title: 'DevOps/SRE-инженер', description: 'Ты — хранитель стабильности.' }
};

// Подпрофили и их роадмапы
const subProfiles = {
  frontend: {
    questions: [
      {
        text: 'Что тебе ближе?',
        options: [
          { text: '🎨 Верстка и Pixel Perfect', sub: 'htmlcss' },
          { text: '⚛️ Сложная логика на React', sub: 'react' },
          { text: '🧪 UX-исследования и анимации', sub: 'ux' }
        ]
      },
      {
        text: 'Какой инструмент ты бы выбрал?',
        options: [
          { text: '🖌️ Figma + CSS', sub: 'htmlcss' },
          { text: '⚡ Next.js + TypeScript', sub: 'react' },
          { text: '🌀 Framer Motion + Storybook', sub: 'ux' }
        ]
      },
      {
        text: 'Твоя суперсила:',
        options: [
          { text: '👁️ Вижу идеальный отступ', sub: 'htmlcss' },
          { text: '🧠 Управляю состоянием приложения', sub: 'react' },
          { text: '💡 Делаю интерфейс живым', sub: 'ux' }
        ]
      }
    ],
    results: {
      htmlcss: { emoji: '📐', title: 'Верстальщик-аристократ', roadmap: 'Углубись в CSS Grid, Flexbox, анимации, доступность. Создай библиотеку компонентов.' },
      react: { emoji: '⚛️', title: 'React-воин', roadmap: 'Освой хуки, Context API, Next.js. Напиши SPA с авторизацией и API.' },
      ux: { emoji: '🌀', title: 'UX-инженер', roadmap: 'Изучи юзабилити-тестирование, микроанимации, Accessibility. Сделай редизайн популярного сервиса.' }
    }
  },
  backend: {
    questions: [
      {
        text: 'Что тебе интереснее?',
        options: [
          { text: '🗃️ Базы данных и оптимизация', sub: 'db' },
          { text: '🔗 Микросервисы и API', sub: 'micro' },
          { text: '☁️ Облачная инфраструктура', sub: 'cloud' }
        ]
      },
      {
        text: 'Выбери инструмент:',
        options: [
          { text: '🐘 PostgreSQL + Redis', sub: 'db' },
          { text: '🧩 RabbitMQ + Docker', sub: 'micro' },
          { text: '☸️ Kubernetes + Terraform', sub: 'cloud' }
        ]
      },
      {
        text: 'Твой идеальный день:',
        options: [
          { text: '⏳ Оптимизировать запрос на 100ms', sub: 'db' },
          { text: '🧬 Спроектировать API из 10 сервисов', sub: 'micro' },
          { text: '📈 Настроить автоскейлинг', sub: 'cloud' }
        ]
      }
    ],
    results: {
      db: { emoji: '🗄️', title: 'Хранитель данных', roadmap: 'Погрузись в SQL/NoSQL, изучи репликацию, шардинг. Создай свою СУБД (учебную).' },
      micro: { emoji: '🧩', title: 'Микросервисный архитектор', roadmap: 'Освоить Docker, RabbitMQ/Kafka, API Gateway. Разработай небольшой микросервисный проект.' },
      cloud: { emoji: '☁️', title: 'Cloud-инженер', roadmap: 'Пройди курсы AWS/GCP, изучи Terraform, Kubernetes. Подними кластер в облаке.' }
    }
  },
  data: {
    questions: [
      {
        text: 'Что тебе больше по душе?',
        options: [
          { text: '📈 Визуализация и дашборды', sub: 'viz' },
          { text: '🤖 Машинное обучение', sub: 'ml' },
          { text: '🧹 Инженерия данных', sub: 'de' }
        ]
      },
      {
        text: 'Выбери инструмент:',
        options: [
          { text: '📊 Tableau / Power BI', sub: 'viz' },
          { text: '🐍 Python (scikit-learn)', sub: 'ml' },
          { text: '⚙️ Apache Spark / Airflow', sub: 'de' }
        ]
      },
      {
        text: 'Твоя цель:',
        options: [
          { text: '📉 Сделать сложное понятным', sub: 'viz' },
          { text: '🧠 Построить предсказательную модель', sub: 'ml' },
          { text: '💪 Построить надёжный ETL-пайплайн', sub: 'de' }
        ]
      }
    ],
    results: {
      viz: { emoji: '📉', title: 'Data-визуализатор', roadmap: 'Изучи Tableau, Power BI, D3.js. Создай публичный дашборд на открытых данных.' },
      ml: { emoji: '🤖', title: 'ML-инженер', roadmap: 'Пройди курс по ML, освой sklearn/PyTorch. Участвуй в Kaggle соревнованиях.' },
      de: { emoji: '⚙️', title: 'Data Engineer', roadmap: 'Изучи Spark, Hadoop, Airflow. Построй ETL-пайплайн для обработки логов.' }
    }
  },
  manager: {
    questions: [
      {
        text: 'Что тебе ближе?',
        options: [
          { text: '📅 Планирование и сроки', sub: 'pm' },
          { text: '💡 Стратегия продукта', sub: 'prod' },
          { text: '🤝 Коммуникация и фасилитация', sub: 'scrum' }
        ]
      },
      {
        text: 'Твой инструмент:',
        options: [
          { text: '📋 Jira + Confluence', sub: 'pm' },
          { text: '🧭 Miro + Roadmunk', sub: 'prod' },
          { text: '🗣️ Retrium + Notion', sub: 'scrum' }
        ]
      },
      {
        text: 'Твоя суперсила:',
        options: [
          { text: '⏰ Соблюдать дедлайны', sub: 'pm' },
          { text: '🧐 Проводить CustDev', sub: 'prod' },
          { text: '🫂 Разрешать конфликты', sub: 'scrum' }
        ]
      }
    ],
    results: {
      pm: { emoji: '📅', title: 'Project Manager', roadmap: 'Изучи PMBOK, Agile. Получи сертификат (например, Scrum Master). Веди небольшой проект.' },
      prod: { emoji: '💡', title: 'Product Manager', roadmap: 'Пройди курс по Product Management, проведи CustDev. Составь Roadmap для вымышленного продукта.' },
      scrum: { emoji: '🤝', title: 'Scrum Master / Agile Coach', roadmap: 'Получи сертификат CSM, изучи фасилитацию. Попрактикуйся в роли Scrum Master в студенческой команде.' }
    }
  },
  devops: {
    questions: [
      {
        text: 'Что тебе интереснее?',
        options: [
          { text: '🔧 CI/CD и автоматизация', sub: 'cicd' },
          { text: '🧱 Инфраструктура как код', sub: 'iac' },
          { text: '📊 Мониторинг и наблюдаемость', sub: 'mon' }
        ]
      },
      {
        text: 'Твой инструмент:',
        options: [
          { text: '⚙️ GitHub Actions / Jenkins', sub: 'cicd' },
          { text: '🏗️ Terraform / Ansible', sub: 'iac' },
          { text: '📈 Prometheus + Grafana', sub: 'mon' }
        ]
      },
      {
        text: 'Твой идеальный день:',
        options: [
          { text: '🚀 Деплой без участия человека', sub: 'cicd' },
          { text: '🧊 Развернуть инфраструктуру одной командой', sub: 'iac' },
          { text: '🔍 Найти узкое место раньше, чем оно уронит продакшен', sub: 'mon' }
        ]
      }
    ],
    results: {
      cicd: { emoji: '🚀', title: 'CI/CD-инженер', roadmap: 'Освой Jenkins/GitLab CI/GitHub Actions. Автоматизируй деплой своего проекта.' },
      iac: { emoji: '🏗️', title: 'Infrastructure as Code Specialist', roadmap: 'Изучи Terraform, Ansible. Подними инфраструктуру в AWS с помощью кода.' },
      mon: { emoji: '📈', title: 'SRE / Observability Engineer', roadmap: 'Изучи Prometheus, Grafana, ELK. Настрой мониторинг для своего проекта.' }
    }
  }
};

// Основные вопросы (6 шт)
const mainQuestions = [
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

// Отправка главного меню
async function sendMainMenu(chatId) {
  const keyboard = {
    inline_keyboard: [
      [{ text: '🚀 Пройти квиз', callback_data: 'start_quiz' }],
      [{ text: 'ℹ️ О боте', callback_data: 'about' }],
      [{ text: '📊 Статистика', callback_data: 'stats' }]
    ]
  };
  await sendMessage(chatId, '👋 Добро пожаловать! Выбери действие:', keyboard);
}

// Обработка вебхука
app.post('/telegram-webhook', async (req, res) => {
  try {
    const update = req.body;

    // Команды /start, /quiz и т.д.
    if (update.message) {
      const msg = update.message;
      const chatId = msg.chat.id;
      const text = msg.text || '';

      if (text === '/start') {
        await sendMainMenu(chatId);
      } else if (text === '/quiz') {
        // Запуск квиза напрямую (на случай, если кто-то вводит команду)
        sessions[chatId] = {
          state: 'main_quiz',
          currentQuestion: 0,
          scores: { frontend: 0, backend: 0, data: 0, manager: 0, devops: 0 }
        };
        const q = mainQuestions[0];
        const keyboard = {
          inline_keyboard: q.options.map(opt => ([{ text: opt.text, callback_data: `main_answer_0_${opt.profile}` }]))
        };
        await sendMessage(chatId, q.text, keyboard);
      }
    }

    // Обработка нажатий на кнопки
    if (update.callback_query) {
      const query = update.callback_query;
      const chatId = query.message.chat.id;
      const messageId = query.message.message_id;
      const data = query.data;

      // Всегда отвечаем на callback, чтобы убрать "часики"
      res.json({ callback_query_id: query.id });

      // Главное меню
      if (data === 'start_quiz') {
        sessions[chatId] = {
          state: 'main_quiz',
          currentQuestion: 0,
          scores: { frontend: 0, backend: 0, data: 0, manager: 0, devops: 0 }
        };
        const q = mainQuestions[0];
        const keyboard = {
          inline_keyboard: q.options.map(opt => ([{ text: opt.text, callback_data: `main_answer_0_${opt.profile}` }]))
        };
        await sendMessage(chatId, q.text, keyboard);
        // Удаляем меню
        try { await fetch(`https://api.telegram.org/bot${TELEGRAM_BOT_TOKEN}/deleteMessage`, {
          method: 'POST', headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ chat_id: chatId, message_id: messageId })
        }); } catch(e) {}
      }
      else if (data === 'about') {
        await sendMessage(chatId, 'ℹ️ Этот бот помогает определить твою IT-специализацию и даёт персональный роадмап. Разработано в рамках портфолио.');
      }
      else if (data === 'stats') {
        if (chatId.toString() !== ADMIN_CHAT_ID) {
          await sendMessage(chatId, '⛔ Нет доступа.');
          return;
        }
        const { total, profiles: p } = stats;
        if (total === 0) {
          await sendMessage(chatId, '📊 Статистика пуста.');
          return;
        }
        let textStats = `📊 <b>Статистика квиза</b>\nВсего: ${total}\n\n`;
        for (const [key, count] of Object.entries(p).sort((a,b) => b[1]-a[1])) {
          const pr = mainProfiles[key];
          textStats += `${pr.emoji} ${pr.title}: ${count} (${Math.round(count/total*100)}%)\n`;
        }
        await sendMessage(chatId, textStats);
      }
      // Обработка ответов основного квиза
      else if (data.startsWith('main_answer_')) {
        const parts = data.split('_');
        const questionIndex = parseInt(parts[2]);
        const profileKey = parts[3];
        const session = sessions[chatId];
        if (!session || session.state !== 'main_quiz' || session.currentQuestion !== questionIndex) {
          await sendMessage(chatId, 'Сессия устарела. Начни сначала: /start');
          return;
        }
        session.scores[profileKey]++;
        // Удаляем предыдущее сообщение
        try { await fetch(`https://api.telegram.org/bot${TELEGRAM_BOT_TOKEN}/deleteMessage`, {
          method: 'POST', headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ chat_id: chatId, message_id: messageId })
        }); } catch(e) {}

        const nextIndex = questionIndex + 1;
        if (nextIndex < mainQuestions.length) {
          session.currentQuestion = nextIndex;
          const q = mainQuestions[nextIndex];
          const keyboard = {
            inline_keyboard: q.options.map(opt => ([{ text: opt.text, callback_data: `main_answer_${nextIndex}_${opt.profile}` }]))
          };
          await sendMessage(chatId, q.text, keyboard);
        } else {
          // Определяем основной профиль
          const scores = session.scores;
          let maxScore = 0;
          let mainProfile = 'frontend';
          for (const [key, val] of Object.entries(scores)) {
            if (val > maxScore) { maxScore = val; mainProfile = key; }
          }
          // Сохраняем в сессии и переключаемся на уточняющие вопросы
          session.state = 'sub_quiz';
          session.mainProfile = mainProfile;
          session.subScores = {};
          session.currentQuestion = 0;
          const sub = subProfiles[mainProfile];
          if (!sub) {
            // Если нет подвопросов – сразу выдаём результат (на всякий случай)
            await showFinalResult(chatId, mainProfile, null);
            delete sessions[chatId];
            return;
          }
          const subQ = sub.questions[0];
          const keyboard = {
            inline_keyboard: subQ.options.map(opt => ([{ text: opt.text, callback_data: `sub_answer_0_${opt.sub}` }]))
          };
          await sendMessage(chatId, `🧐 Отлично! Твой основной профиль: ${mainProfiles[mainProfile].emoji} ${mainProfiles[mainProfile].title}. Но давай уточним.\n\n${subQ.text}`, keyboard);
        }
      }
      // Обработка ответов уточняющего квиза
      else if (data.startsWith('sub_answer_')) {
        const parts = data.split('_');
        const questionIndex = parseInt(parts[2]);
        const subKey = parts[3];
        const session = sessions[chatId];
        if (!session || session.state !== 'sub_quiz' || session.currentQuestion !== questionIndex) {
          await sendMessage(chatId, 'Сессия устарела. Начни сначала: /start');
          return;
        }
        if (!session.subScores) session.subScores = {};
        session.subScores[subKey] = (session.subScores[subKey] || 0) + 1;
        // Удаляем вопрос
        try { await fetch(`https://api.telegram.org/bot${TELEGRAM_BOT_TOKEN}/deleteMessage`, {
          method: 'POST', headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ chat_id: chatId, message_id: messageId })
        }); } catch(e) {}

        const sub = subProfiles[session.mainProfile];
        const nextIndex = questionIndex + 1;
        if (nextIndex < sub.questions.length) {
          session.currentQuestion = nextIndex;
          const subQ = sub.questions[nextIndex];
          const keyboard = {
            inline_keyboard: subQ.options.map(opt => ([{ text: opt.text, callback_data: `sub_answer_${nextIndex}_${opt.sub}` }]))
          };
          await sendMessage(chatId, subQ.text, keyboard);
        } else {
          // Определяем подпрофиль
          let maxSubScore = 0;
          let selectedSub = '';
          for (const [key, val] of Object.entries(session.subScores)) {
            if (val > maxSubScore) { maxSubScore = val; selectedSub = key; }
          }
          await showFinalResult(chatId, session.mainProfile, selectedSub);
          delete sessions[chatId];
        }
      }
    }
  } catch (e) {
    console.error(e);
    res.sendStatus(500);
  }
});

// Финальный результат с роадмапом
async function showFinalResult(chatId, mainProfile, subKey) {
  const main = mainProfiles[mainProfile];
  let resultText = `${main.emoji} <b>${main.title}</b>\n${main.description}`;
  let roadmap = '';
  if (subKey && subProfiles[mainProfile] && subProfiles[mainProfile].results[subKey]) {
    const sub = subProfiles[mainProfile].results[subKey];
    resultText += `\n\n🔎 Твоя специализация: <b>${sub.emoji} ${sub.title}</b>`;
    roadmap = `🚀 <b>Твой роадмап:</b>\n${sub.roadmap}`;
  } else {
    // Если подпрофиль не найден, даём общий роадмап
    roadmap = '🚀 Изучи основы выбранного направления и сделай пет-проект.';
  }
  const shareKeyboard = {
    inline_keyboard: [
      [{ text: '📲 Поделиться результатом', switch_inline_query: `Мой IT-профиль: ${main.emoji} ${main.title}` }]
    ]
  };
  await sendMessage(chatId, resultText, shareKeyboard);
  if (roadmap) await sendMessage(chatId, roadmap);
  // Обновляем статистику
  stats.total++;
  stats.profiles[mainProfile]++;
}

const PORT = process.env.PORT || 3000;
app.listen(PORT, () => console.log(`Quiz bot running on port ${PORT}`));

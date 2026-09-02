export const meta = {
  name: 'verify-agent-video-editors',
  description: 'Проверить 5 видеоредакторов на реальную связку «агент собирает — человек правит»',
  phases: [
    { title: 'Разведка', detail: 'по агенту на каждый редактор — реальные факты из репозитория' },
    { title: 'Скептик', detail: 'опровергнуть главное утверждение каждого кандидата' },
  ],
}

const CANDIDATES = [
  { key: 'palmier', repo: 'palmier-io/palmier-pro', claim: 'нативный macOS-редактор на Swift со встроенным MCP-сервером на порту 19789, агент управляет таймлайном через >30 инструментов' },
  { key: 'openchatcut', repo: '0xsline/OpenChatCut', claim: 'локальный десктоп-NLE с MCP-сервером и форматом проекта .ccproj.json, агент читает живой таймлайн через read_timeline и правит по itemId' },
  { key: 'fablecut', repo: 'ronak-create/FableCut', claim: 'браузерный редактор, весь проект = один project.json, есть MCP-сервер и REST API GET/PUT /api/project' },
  { key: 'twick', repo: 'ncounterspecialist/twick', claim: 'React-SDK для сборки своего таймлайн-редактора: пакеты @twick/timeline, @twick/canvas, @twick/video-editor, проект как JSON' },
  { key: 'openreelio', repo: 'openreelio/openreelio', claim: 'кроссплатформенный Tauri+Rust+React редактор с многодорожечным таймлайном, captions и AI-ассистентом' },
]

const FACTS = {
  type: 'object',
  required: ['exists', 'installable_on_mac26', 'agent_can_build_timeline', 'human_can_edit_after', 'objects_stay_editable', 'install_command', 'evidence', 'red_flags', 'verdict'],
  properties: {
    exists: { type: 'boolean' },
    installable_on_mac26: { type: 'string', description: 'yes / no / unclear + точные требования (ОС, чип, Node, Xcode)' },
    agent_can_build_timeline: { type: 'string', description: 'Как именно агент программно создаёт клипы/текст. Назови конкретные инструменты MCP или эндпоинты/поля JSON, найденные В КОДЕ.' },
    human_can_edit_after: { type: 'string', description: 'Есть ли настоящий визуальный таймлайн с drag-and-drop. Доказательство из кода/скриншотов README.' },
    objects_stay_editable: { type: 'string', description: 'Остаются ли текст и субтитры редактируемыми объектами, а не запечённым видео' },
    install_command: { type: 'string', description: 'Точная команда установки на macOS, скопированная из README' },
    evidence: { type: 'array', items: { type: 'string' }, description: 'Конкретные пути к файлам в репозитории и цитаты, подтверждающие ответы' },
    red_flags: { type: 'array', items: { type: 'string' }, description: 'Сломанная сборка, мёртвые issues, платная стена, требование ключей API, отсутствие обещанной функции' },
    verdict: { type: 'string', description: 'СТАВИТЬ / ПРОПУСТИТЬ + одна фраза почему' },
  },
}

const SKEPTIC = {
  type: 'object',
  required: ['claim_holds', 'what_breaks', 'confidence'],
  properties: {
    claim_holds: { type: 'boolean', description: 'Правда ли, что агент соберёт монтаж, а человек потом поправит мышкой' },
    what_breaks: { type: 'string', description: 'Что конкретно сломается или чего не хватает. Если всё честно — так и скажи.' },
    confidence: { type: 'string', enum: ['high', 'medium', 'low'] },
  },
}

const results = await pipeline(
  CANDIDATES,
  (c) => agent(
    `Проверь проект ${c.repo} на GitHub. Заявление источника: "${c.claim}"

ЗАДАЧА: выяснить, правда ли это, по ПЕРВОИСТОЧНИКАМ. Контекст пользователя: macOS 26.5.2, Apple Silicon, Node есть. Он монтирует вертикальные рилсы: нарезки видео + субтитры по словам + анимированные заголовки. Нужно, чтобы агент собрал монтаж программно, а он потом двигал объекты мышкой в редакторе.

ОБЯЗАТЕЛЬНО:
1. Прочитай README репозитория через raw.githubusercontent.com (ветки main и master).
2. Найди в дереве файлов реальный код MCP-сервера или API — не верь README на слово, проверь, что файлы существуют (api.github.com/repos/${c.repo}/git/trees/HEAD?recursive=1).
3. Проверь открытые issues на предмет «не собирается», «не работает на macOS», «MCP не подключается».
4. Проверь релизы: есть ли готовый бинарник или надо собирать из исходников.
5. Проверь лицензию.

ЗАПРЕЩЕНО опираться на сайты-каталоги AI-инструментов (everydev.ai, mcpapp-store.com, aiagentstore.ai, producthunt) — они часто выдумывают детали. Только GitHub, npm, официальный домен проекта.

Если чего-то не нашёл — пиши "не найдено", не додумывай.

Следуй Karpathy-guidelines: не выдумывай, при неопределённости говори прямо. Не пиши «работает» без доказательства из кода.`,
    { label: `разведка:${c.key}`, phase: 'Разведка', schema: FACTS }
  ),
  (facts, c) => {
    if (!facts) return null
    return agent(
      `Ты скептик. Другой агент проверил ${c.repo} и утверждает:

agent_can_build_timeline: ${facts.agent_can_build_timeline}
human_can_edit_after: ${facts.human_can_edit_after}
objects_stay_editable: ${facts.objects_stay_editable}
установка: ${facts.install_command}
доказательства: ${JSON.stringify(facts.evidence)}
вердикт: ${facts.verdict}

ТВОЯ ЗАДАЧА — опровергнуть связку «агент собирает монтаж → человек правит мышкой → текст остаётся редактируемым объектом».

Контекст: этот пользователь уже обжёгся дважды. CapCut-проект, сгенерированный программно, не появился в списке черновиков — формат закрытый. Shotcut открыл только видеонарезки, без шрифтов и логотипа. Remotion оказался не визуальным редактором: по объектам нельзя кликнуть.

Проверь по коду репозитория:
- Действительно ли существуют названные инструменты MCP или эндпоинты? Открой файлы.
- Импортирует ли UI тот же формат проекта, который пишет агент, или это две разные ветки?
- Требует ли редактор ключ API или облачный аккаунт, чтобы вообще открыться?
- Собирается ли он на macOS без Xcode-плясок?

По умолчанию считай заявление НЕВЕРНЫМ, пока не увидишь код. Лучше зря забраковать, чем послать человека ставить нерабочее.`,
      { label: `скептик:${c.key}`, phase: 'Скептик', schema: SKEPTIC }
    ).then((v) => ({ ...c, facts, skeptic: v }))
  }
)

const clean = results.filter(Boolean)
const survivors = clean.filter((r) => r.skeptic?.claim_holds && r.facts.exists)
log(`Выжило ${survivors.length} из ${clean.length}`)
return {
  survivors: survivors.map((r) => ({ repo: r.repo, install: r.facts.install_command, verdict: r.facts.verdict, confidence: r.skeptic.confidence, caveat: r.skeptic.what_breaks })),
  rejected: clean.filter((r) => !survivors.includes(r)).map((r) => ({ repo: r.repo, why: r.skeptic?.what_breaks || r.facts.verdict, flags: r.facts.red_flags })),
  full: clean.map((r) => ({ repo: r.repo, ...r.facts, skeptic: r.skeptic })),
}

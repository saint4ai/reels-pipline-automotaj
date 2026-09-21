# 12 — ПОДКАСТ

**Статус:** формат сдан в серии нарезок подкаста
**Композиции:** `PODCAST-Reels`, `PODCAST-YouTube`
**Код:** `studio/src/styles/podcast.tsx` + `skinned.tsx` с `marker: true`; нарезка подкаста — `scripts/cut-podcast.py`, `scripts/podcast-speaker.py`
**Ролик-образец:** `patterns/reels/podcast-split/frames.jpg`, архетипы — `docs/agent-contract/PODCAST-ARCHETYPES.md`

## Механика
- Кадр подкаста снизу (в YouTube — слева), сверху доска: белый лист с жёсткой рамкой и тенью, заголовок с маркером.
- Пункты отмечаются маркером-выделителем, числа оранжевые, схема — узлы в рамках; шов между доской и кадром — тонкая линия.

## Когда брать
Нарезки из подкаста и интервью, где говорят двое и лицо важно.

## Раскладка
`speaker: podcast`; зона графики — доска.

## Что менять под каждый ролик
Какие термины и цифры выносятся на доску, цвет подложки по блоку.

## Что владелец принимал и отклонял
- Принято: доска с терминами и цифрами над кадром, фрагменты по архетипам из `PODCAST-ARCHETYPES.md`.


## Как собрать ролик в этом стиле

Данные ролика — те же блоки (`hook`, `list`, `stat`, `logos`, `flow`, `cta`) в `studio/src/videos/<проект>/project.ts`.
В точке входа ролика вместо шаблона взять стиль:

```tsx
import {calcStyle} from '../../styles/engine';
import {reelOf} from '../../styles';
import {PODCAST} from '../../styles/podcast';
const Reel = reelOf(PODCAST);
// <Composition id="<проект>" component={Reel} defaultProps={{format: 'reels', project: PROJECT}} calculateMetadata={calcStyle} … />
```

Своя механика блока, которой нет в стиле, пишется рядом в `studio/src/videos/<проект>/` из блоков `studio/src/kit`.

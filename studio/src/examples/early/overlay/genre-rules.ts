/**
 * Правила монтажа, выведенные из разбора 1346 роликов конкурентов.
 *
 * Каждое опирается на измеренный признак, а не на вкус. Ссылки на источник —
 * в комментариях. Полные данные: competitors/Анализ_конкурентов_Reels.xlsx
 *
 * Смысл файла: не советовать, а ронять сборку. Совет можно проигнорировать,
 * упавшую сборку — нет.
 */

export const FPS = 30;

/** Сцена — одно визуальное состояние. Дольше 2.5 сек зритель отваливается.
 *  Замер: у залетевших медиана сцены 2.1 сек, у провальных 2.8. */
export const MAX_SCENE_SEC = 2.5;

/** Склеек на ролик. Залетевшие 7.0, провальные 3.5 — ровно вдвое.
 *  Считаем от 45-секундного ролика. */
export const MIN_CUTS_PER_45S = 7;

/** Уникальных объектов за ролик. У pronin.media 16–20 против 8–11 у провальных,
 *  у buhaistrikalo 9–10 против 2–5. */
export const MIN_UNIQUE_ASSETS = 8;

/** Один объект не должен появляться больше трёх раз подряд. */
export const MAX_ASSET_REPEAT = 3;

/** Кадров с реальным артефактом — скриншот, запись экрана, чужой интерфейс.
 *  Самый устойчивый признак: сработал у 4 аккаунтов из 5.
 *  Нарисованные макеты и сток НЕ засчитываются. */
export const MIN_PROOF_SCENES = 3;

/** Хук-карточка живёт первые 1–1.5 сек и уходит. Кегль от 2.5× субтитра. */
export const HOOK_MAX_SEC = 1.5;
export const HOOK_MIN_SIZE_RATIO = 2.5;

/** Речь: 7 слов за первые 3 секунды при темпе 159 слов/мин — физический предел. */
export const HOOK_MAX_WORDS = 7;

/** Замеренная норма жанра — 159 слов/мин, одинаково у залетевших и провальных.
 *  Нижняя граница: медленнее выпадаешь из жанра.
 *  Верхняя: если текст не влезает в таймлайн, значит таймлайн короткий,
 *  а не диктор быстрый. Скороговорку зритель не слушает. */
export const MIN_WORDS_PER_MIN = 150;
export const MAX_WORDS_PER_MIN = 185;

/** Приоритет цифр. Деньги зрителя работают, чужая статистика — нет.
 *  «1–6 млн ₽ штраф» против «3.4% проектов выжило». */
export type ProofNumberKind = 'деньги зрителя' | 'чужая метрика' | 'свои шаги';
export const PROOF_NUMBER_PRIORITY: ProofNumberKind[] = [
  'деньги зрителя',
  'чужая метрика',
  'свои шаги',
];

// ─── описание таймлайна для проверки ──────────────────────────

export type SceneKind =
  | 'proof'      // реальный скриншот или запись экрана
  | 'mockup'     // нарисованная карточка
  | 'head'       // говорящая голова
  | 'text'       // только текст на экране
  | 'counter';   // растущий счётчик

export type Scene = {
  /** кадр начала */
  from: number;
  /** длительность в кадрах */
  duration: number;
  kind: SceneKind;
  /** идентификатор объекта — по нему считаем уникальность и повторы */
  assetId: string;
  /** крупная цифра поверх, если есть */
  bigNumber?: { value: string; kind: ProofNumberKind };
};

export type Overlay = {
  id: string;
  /** true — значение меняется по ходу ролика (счётчик, растущая сумма).
   *  false — неподвижная плашка: рамка, водяной знак, таймкод. */
  grows: boolean;
};

export type Timeline = {
  durationInFrames: number;
  scenes: Scene[];
  overlays: Overlay[];
  /** первые слова речи — для проверки хука */
  hookWords?: string[];
  /** всего слов в озвучке — для проверки темпа */
  totalWords?: number;
};

export type Violation = { rule: string; detail: string };

/**
 * Проверяет таймлайн на соответствие правилам.
 * Возвращает список нарушений. Пустой список — можно рендерить.
 */
export function validate(t: Timeline): Violation[] {
  const v: Violation[] = [];
  const sec = t.durationInFrames / FPS;

  // 1. длина сцены
  for (const s of t.scenes) {
    const d = s.duration / FPS;
    if (d > MAX_SCENE_SEC) {
      v.push({
        rule: 'длина сцены',
        detail: `«${s.assetId}» держится ${d.toFixed(1)} сек при потолке ${MAX_SCENE_SEC}`,
      });
    }
  }

  // 2. частота склеек
  const need = Math.max(2, Math.round((MIN_CUTS_PER_45S * sec) / 45));
  if (t.scenes.length < need) {
    v.push({
      rule: 'мало склеек',
      detail: `${t.scenes.length} сцен на ${sec.toFixed(0)} сек, нужно от ${need}`,
    });
  }

  // 3. доказательства
  const proof = t.scenes.filter((s) => s.kind === 'proof').length;
  if (proof < MIN_PROOF_SCENES) {
    v.push({
      rule: 'нет доказательств',
      detail: `сцен с реальным артефактом ${proof}, нужно от ${MIN_PROOF_SCENES}. ` +
        `Нарисованные макеты не считаются`,
    });
  }

  // 4. разнообразие
  const ids = t.scenes.map((s) => s.assetId);
  const uniq = new Set(ids).size;
  if (uniq < MIN_UNIQUE_ASSETS) {
    v.push({
      rule: 'мало объектов',
      detail: `уникальных ${uniq}, нужно от ${MIN_UNIQUE_ASSETS}`,
    });
  }

  // 5. повторы подряд
  let run = 1;
  for (let i = 1; i < ids.length; i++) {
    run = ids[i] === ids[i - 1] ? run + 1 : 1;
    if (run > MAX_ASSET_REPEAT) {
      v.push({
        rule: 'объект повторяется',
        detail: `«${ids[i]}» подряд ${run} раз при потолке ${MAX_ASSET_REPEAT}`,
      });
      break;
    }
  }

  // 6. неподвижный сквозной оверлей — главный контринтуитивный вывод.
  //    У aikirichenko постоянная рамка и водяной знак оказались признаком
  //    ПРОВАЛЬНЫХ роликов, при том что выглядели дороже.
  for (const o of t.overlays) {
    if (!o.grows) {
      v.push({
        rule: 'неподвижный оверлей',
        detail: `«${o.id}» висит весь ролик без изменений. ` +
          `Разрешён только накапливающийся счётчик`,
      });
    }
  }

  // 7. хук
  if (t.hookWords && t.hookWords.length > HOOK_MAX_WORDS) {
    v.push({
      rule: 'длинный хук',
      detail: `${t.hookWords.length} слов, за 3 секунды успевает прозвучать ${HOOK_MAX_WORDS}`,
    });
  }

  // 8. темп речи — с обеих сторон
  if (t.totalWords && sec > 5) {
    const wpm = (t.totalWords / sec) * 60;
    if (wpm < MIN_WORDS_PER_MIN) {
      v.push({
        rule: 'медленная речь',
        detail: `${wpm.toFixed(0)} слов/мин, норма жанра от ${MIN_WORDS_PER_MIN}`,
      });
    }
    if (wpm > MAX_WORDS_PER_MIN) {
      const need = (t.totalWords / 159) * 60;
      v.push({
        rule: 'текст не влезает',
        detail: `${wpm.toFixed(0)} слов/мин — скороговорка. ` +
          `На ${t.totalWords} слов нужно ${need.toFixed(0)} сек, а таймлайн ${sec.toFixed(0)}. ` +
          `Добавь сцен или сократи текст`,
      });
    }
  }

  return v;
}

/** Бросает исключение при нарушениях — вешать в композицию, чтобы сборка падала. */
export function assertValid(t: Timeline, name = 'ролик'): void {
  const v = validate(t);
  if (v.length === 0) return;
  const lines = v.map((x) => `  · ${x.rule}: ${x.detail}`).join('\n');
  throw new Error(`Монтаж «${name}» нарушает правила:\n${lines}`);
}

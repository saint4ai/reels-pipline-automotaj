import React from "react";
import { AbsoluteFill } from "remotion";
import { Funnel, Collapse, StepChain, StrikeReplace, Odometer, Checklist, SplitCompare, Takeaway, Bubble, Plate } from "./beats";

/** Витрина всех приёмов подряд. Фон тёмный вместо видео — смотреть каждый отдельно. */
export const BeatsDemo: React.FC = () => (
  <AbsoluteFill style={{ backgroundColor: "#14100e" }}>
    <Funnel from={0} to={5.2} title="ЧТО Я СДЕЛАЛ"
      steps={[
        { at: 0.3, text: "Платформа была уязвима" },
        { at: 1.3, text: "Нанял безопасника" },
        { at: 2.3, text: "Забрал его правки агентом" },
        { at: 3.3, text: "Агент защищает сам" },
      ]} />
    <Collapse from={5.6} to={9.0} items={["Нашёл эксперта", "Забрал правки", "Упаковал в навык"]}
      result="ЭКСПЕРТ НУЖЕН ОДИН РАЗ" />
    <StepChain from={9.4} to={13.4}
      nodes={[{ text: "Платформу могли взломать" }, { text: "Пришёл безопасник" }, { text: "Теперь защищает агент" }]} />
    <StrikeReplace from={13.8} to={17.0} old="Нужен штатный разработчик" fresh="ХВАТИТ ОДНОГО АГЕНТА" />
    <Odometer from={17.4} to={20.4} value={1300} suffix="$" caption="ПЛАТИЛ БЫ ЗА СЕРВИСЫ" />
    <Checklist from={20.8} to={24.6} title="ЧТО УЖЕ РАБОТАЕТ"
      items={["Сайт собран за вечер", "Бот отвечает клиентам", "Отчёты приходят сами"]} />
    <SplitCompare from={25.0} to={28.4}
      before={{ label: "БЫЛО", value: "1300 $ в месяц" }} after={{ label: "СТАЛО", value: "200 $" }} />
    <Takeaway from={28.8} to={32.0} text="Эксперта нанимаешь один раз — навык остаётся навсегда" />
    <Bubble from={32.4} to={35.8} text="Это же промышленный шпионаж" author="ВЕДУЩАЯ" side="left" />
    <Plate from={36.2} to={39.0} step="ШАГ 1" text="Нанял безопасника" accent="#FFB020" side="left" />
  </AbsoluteFill>
);

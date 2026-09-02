import React from "react";
import { AbsoluteFill } from "remotion";
import { Plate, Odometer, Funnel } from "./beats";

/**
 * Рилс про безопасность, версия 2 — на приёмах из beats.tsx.
 * Плотность по rules.md: три лёгкие вставки по ходу речи + одна тяжёлая конструкция
 * в финале, которая собирает всю историю целиком. Между ними — чистый экран.
 */
export const SecurityV2: React.FC = () => (
  <AbsoluteFill style={{ backgroundColor: "transparent" }}>
    {/* «он изначально не был безопасен» */}
    <Plate from={3.7} to={6.2} step="ПРОБЛЕМА" text="Платформа была уязвима" accent="#FF4D3D" side="left" />

    {/* «привлёк специалиста… безопасник» */}
    <Plate from={11.0} to={14.4} step="ШАГ 1" text="Нанял безопасника" accent="#FFB020" side="right" />

    {/* «он один раз поправил нам код» */}
    <Odometer from={17.9} to={20.3} value={1} suffix="РАЗ" caption="ПОПРАВИЛ КОД" accent="#FC5C02" posY={0.13} />

    {/* финал: вся история одной конструкцией, шаги приходят по речи */}
    <Funnel from={22.4} to={30.8} title="СИЛА НАВЫКА"
      steps={[
        { at: 22.8, text: "Платформа была уязвима" },
        { at: 23.9, text: "Нанял безопасника" },
        { at: 25.1, text: "Упаковал в навык Claude Code" },
        { at: 26.4, text: "Теперь агент защищает сам" },
      ]} />
  </AbsoluteFill>
);

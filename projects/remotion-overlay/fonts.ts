import { loadFont } from "@remotion/fonts";
import { staticFile } from "remotion";

/** Единственное место загрузки шрифтов. Импортируется каждой композицией —
 *  иначе рендер молча падает на системный sans-serif (Benzin в Google Fonts нет). */
export const FONT = "Benzin";
export const FONT_STACK = `${FONT}, sans-serif`;

let started = false;
export const ensureFonts = () => {
  if (started) return;
  started = true;
  loadFont({ family: FONT, url: staticFile("fonts/Benzin-ExtraBold.ttf"), weight: "800" }).catch(() => {});
  loadFont({ family: "Soyuz Grotesk", url: staticFile("fonts/SoyuzGrotesk-Bold.otf"), weight: "700" }).catch(() => {});
};
ensureFonts();

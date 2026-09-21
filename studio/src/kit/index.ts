// Режим «сцены»: фоны меняются каждые 3–7 с, между ними переходы из референса.
// Режим «холст» (камера по единой карте, scenes/World) — только там, где показываем схему работы.
export * from './backdrops';
export * from './presentations';
export {BlurIn, RiseIn, Pop, useFrame30} from './motion';
export {Porthole, portholeWindow, type Rect} from './Porthole';
export {Sticker} from './Sticker';
export {Toggle, toggleKnob} from './Toggle';
export {Cursor, cursorAt, type Move} from './Cursor';
export {PhoneMock, DmHeader, ChatThread, Toast, type Msg} from './Phone';
export {BrowserCard, type Crop, type Mask} from './BrowserCard';

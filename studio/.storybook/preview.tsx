import '../src/index.css';
import type {Preview} from '@storybook/react-vite';
import {Player} from '@remotion/player';

const fonts = `
@font-face{font-family:DotGothic16;src:url(/public/fonts/DotGothic16-Regular.ttf)}
@font-face{font-family:Handjet;src:url(/public/fonts/Handjet-cyr.woff2) format('woff2');font-weight:100 900;unicode-range:U+0301,U+0400-045F,U+0490-0491,U+04B0-04B1,U+2116}
@font-face{font-family:Handjet;src:url(/public/fonts/Handjet-lat.woff2) format('woff2');font-weight:100 900;unicode-range:U+0000-00FF,U+2000-206F,U+20AC,U+2212}
@font-face{font-family:'Inter Tight';src:url(/public/fonts/InterTight-Variable.ttf);font-weight:100 900}
@font-face{font-family:Tektur;src:url(/public/fonts/Tektur-Variable.ttf);font-weight:400 900}
@font-face{font-family:'Martian Mono';src:url(/public/fonts/MartianMono-Variable.ttf);font-weight:100 800}
@font-face{font-family:Manrope;src:url(/public/fonts/Manrope-Variable.ttf);font-weight:200 800}
@font-face{font-family:JBM;src:url(/public/fonts/JetBrainsMono-Variable.ttf);font-weight:100 800}`;

// Блоки ролика используют компоненты Remotion, поэтому каждая история показывается внутри плеера —
// как кадр композиции. Историю с целым роликом (свой плеер) не оборачиваем.
// Параметры: frames — длина анимации (с ней плеер крутится по кругу), frameW/frameH — размер кадра,
// scale — масштаб показа, pad — поля вокруг блока (0 для сцен на весь кадр).
const preview: Preview = {
  parameters: {layout: 'centered', backgrounds: {default: 'dark', values: [{name: 'dark', value: '#0B0D10'}]}},
  decorators: [(Story, ctx) => {
    const pad = ctx.parameters.pad ?? 48;
    const inner = (<div className="dark" data-theme="dark" style={{background: '#0B0D10', padding: pad, width: '100%', height: '100%', boxSizing: 'border-box', position: 'relative'}}><style>{fonts}</style><Story /></div>);
    if (ctx.parameters.noPlayer) return inner;
    const w = ctx.parameters.frameW ?? 1400, h = ctx.parameters.frameH ?? 1000, k = ctx.parameters.scale ?? 0.6;
    const frames = ctx.parameters.frames ?? 1;
    return <Player component={() => inner} durationInFrames={frames} fps={30} compositionWidth={w} compositionHeight={h}
      style={{width: w * k, height: h * k}} controls={frames > 1} loop autoPlay={frames > 1} />;
  }],
};
export default preview;

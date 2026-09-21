import './index.css';
import './fonts';
import {Composition, Folder} from 'remotion';
import {FitTest} from './FitTest';
import {KIT_DURATION, SceneKitDemo} from './scenes/kit/SceneKitDemo';
import {SPREAD_DEMO_FRAMES, SpreadDemo} from './scenes/kit/SpreadDemo';
import {calcTemplate, Template} from './template/Template';
import {FPS, H, W} from './theme';

// Композиции студии. Новый ролик — своя композиция в src/reels/<проект>/ со своей точкой входа (см. README студии).
export const Root: React.FC = () => (
  <>
    <Folder name="Template">
      {/* сценарный канвас в двух форматах: один код, формат — props.format */}
      <Composition id="Template-Reels" component={Template} defaultProps={{format: 'reels' as const}} calculateMetadata={calcTemplate}
        durationInFrames={60} fps={60} width={1440} height={2560} />
      <Composition id="Template-YouTube" component={Template} defaultProps={{format: 'youtube' as const}} calculateMetadata={calcTemplate}
        durationInFrames={60} fps={60} width={2560} height={1440} />
    </Folder>
    <Folder name="Library">
      {/* режим сцен: переходы по референсу Пронина — портал, размытие в цвет, свечение, рывок, сжатие в узел, уход в тёмное */}
      <Composition id="SceneKit" component={SceneKitDemo} durationInFrames={KIT_DURATION} fps={FPS} width={W} height={H} />
      <Composition id="StackSpreadDemo" component={SpreadDemo} durationInFrames={SPREAD_DEMO_FRAMES} fps={30} width={W} height={H} />
    </Folder>
    <Folder name="Checks">
      {/* FitTest обязан падать: это доказательство, что проверка контейнеров жива */}
      <Composition id="FitTest" component={FitTest} durationInFrames={1} fps={30} width={1000} height={400} />
    </Folder>
  </>
);

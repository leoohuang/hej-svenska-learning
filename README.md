# hej! Swedish Training

`hej!` 中的瑞典语训练代码，包括课程内容、键盘练习、记忆训练和生活场景模拟。

## 主要内容

- 看词跟打、中文回译、听音辨词和例句补词
- 理解、跟打、主动回忆、听力提取和延迟复习
- 跟读、录音回听和口语迁移练习
- 瑞典语生活场景模拟
- 瑞典语课程数据与 1,000 句日常表达
- 瑞典字母 `å`、`ä`、`ö` 的键盘输入兼容

## 文件

| 文件 | 内容 |
| --- | --- |
| `src/TypingTrainer.tsx` | 键盘训练与自由练习 |
| `src/LearningJourney.tsx` | 记忆路径与口语训练 |
| `src/ScenarioSimulation.tsx` | 生活场景练习 |
| `src/swedish-data.ts` | 瑞典语课程与词句数据 |
| `src/course-packs/` | 课程包数据和解析结构 |
| `src/typing-comparison.ts` | 输入匹配与瑞典字母兼容 |
| `src/typing-sound.ts` | 键盘反馈音效 |
| `src/speech.ts` | 浏览器语音播放 |
| `src/training.css` | 训练界面样式 |

组件使用 React 和 TypeScript 编写，图标来自 `lucide-react`，完成动画使用 `canvas-confetti`。

## License

[GNU General Public License v3.0](LICENSE)

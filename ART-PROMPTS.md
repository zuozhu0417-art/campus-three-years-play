# 场景美术登记

生成时间：2026-11-13。通道：内置 `image_gen.imagegen`，按 imagegen 技能的 built-in tool mode 执行；未使用 CLI、API Key、DashScope 或其他付费接口。此次工具没有报告独立扣费金额、模型具体版本或剩余额度，不能据此声称免费或无限额度。

三张图片都是新生成的插画。用户提供的“游戏照片”用于人工观察风格，没有把截图直接用作游戏素材，也没有上传这些截图给本次生成调用。需求中的“弱化五官、逆光、校园回忆感”转化为以下文字提示词。人物身份与画面细节的一致性仍待审美验收。

工具提示词中请求了 1536×864；实际返回尺寸经 Pillow 读取，三张均为 **1672×941**。交付使用 RGB JPEG、quality=94、optimize=True，尺寸未改变。未用绘图代码伪装 AI 生图，未手绘替代这些场景。

| 文件 | 实测字节数 | 尺寸 | 生成原文件标识 |
|---|---:|---|---|
| `assets/classroom.jpg` | 596939 | 1672×941 | exec-4f4d5f38-8351-4087-a021-d2589d571d76.png |
| `assets/canteen.jpg` | 603278 | 1672×941 | exec-b2cfc136-ba98-44a4-b01d-2a55c251c0cd.png |
| `assets/home.jpg` | 480422 | 1672×941 | exec-dc764074-572e-43de-b6ca-aa886b5518bd.png |

美术好不好看：**待用户审阅**。背景中的人物暂为静态插画。

## 教室：实际生成提示词

```text
Use case: illustration-story. Asset type: full-bleed background for a Chinese high school point-and-click game. Generate an exquisite 16:9 wide landscape 1536x864 anime painted illustration, nostalgic soft luminous cinematic school memory, pale desaturated blue-grey, warm wood desks, sage chalkboard, real soft late afternoon sunlight through tall windows on LEFT. Camera looking diagonally from back of Chinese public high school classroom toward chalkboard on RIGHT background. Orderly rows of wooden desks fill middle and foreground, open school exercise notebook and blue pen on desk in LOWER CENTER, empty chair mid RIGHT. A teenage female student with long dark hair and white shirt sits at a desk mid LEFT by window, seen from back / side, face hidden by hair naturally. A teenage male student short black hair in white shirt sits center-right at a desk, looking down, face indistinct. Authentic modest Chinese school interior, green lower wall, ceiling fans, hints of trees through windows, gently drifting gauzy curtains. Strong spatial clarity for clickable objects. Delicate animation-film background painting, soft hair highlights, subtle film grain, romantic but everyday. No text, no UI, no watermark, no text boxes, no dramatic fantasy, no 3D plastic, not chibi. Fully filled scene edge to edge, no white fade-out at bottom. Keep bottom 15% relatively quiet for game controls. Original illustration.
```

## 食堂：实际生成提示词

```text
Use case: illustration-story. Asset type: game environment background, wide 16:9 landscape 1536x864. Original exquisite nostalgic anime painted illustration of a modest Chinese public high school canteen at noon, soft luminous memories, low saturation pale blue-grey and warm wood, subtle painted texture and film grain, architecture and props clearly readable. Camera at seated teenager eye level overlooking a wooden table in foreground, two stainless steel lunch trays and chopsticks on it at LOWER CENTER. Mid left teenage boy with short black hair wearing white short-sleeve school shirt seated sideways, looking down at lunch, indistinct face. Mid right teenage girl with long dark hair in plain white school shirt sits looking down, face naturally hidden by hair and soft light; NOT glamorous or sexualized. Bright tall windows on LEFT, distant serving counter and few background student silhouettes, quiet ordinary atmosphere. Full scene edge-to-edge, detailed environment with room for clickable tray, boy, girl, and counter. Not a character portrait. Realistic soft daylight painted in gentle animation movie aesthetic, keep dark hair and wooden shapes readable. No UI, no text, no lettering, no watermark, no white fade bottom, no 3D, not chibi.
```

## 家里：实际生成提示词

```text
Use case: illustration-story. Asset type: 16:9 1536x864 wide game room environment background. Original beautiful painted anime film background of an ordinary Chinese high school student's small bedroom at evening, soft muted desaturated blue outside window and a warm amber desk lamp, quiet intimate memory atmosphere. Camera from room entrance looking diagonally toward a wooden study desk CENTER beneath window on LEFT, open exercise book on desk at CENTER, a small smartphone face down to its RIGHT, a warm ceramic bowl and chopsticks on a small stool at LEFT foreground. Bed against RIGHT wall with blue-grey duvet and white school shirt draped over chair. Bookshelves, stacked exam papers, a school backpack. No people. Rich legible spatial details, delicate brushwork, subtle grain, soft light, nostalgic ordinary real life, gentle shadows not pitch black. Full-bleed edge-to-edge landscape with no blank borders, no white fadeout. No UI, no readable text, no watermark, no 3D plastic, not chibi. Composition suitable for clickable notebook, phone, bowl, and bed.
```

## 授权范围记录

源码的 MIT 许可不等于对 AI 生成图片作独占版权声明。图片的使用依据生成服务适用条款处理。本包没有混入用户参考截图、原案 art/src 图片、商业游戏素材或网络下载音乐。


## 动态试玩 v2 新增素材

继续使用内置 image_gen.imagegen，所有图片为本次文字提示新生成，没有使用参考截图里的商业游戏人物。原始结果保留于 Codex generated_images，下面列出项目副本与原始文件标识。完整、实际执行的六条提示词见 assets/GENERATION-DYNAMIC.json；其中四张立绘请求并实际返回 RGBA 透明 PNG，直接复制使用。两张横图转为 RGB JPEG quality=94，未改变尺寸。没有用绘图代码代替生成插画。

| 项目素材 | 原始 PNG 标识 | 实际尺寸 |
|---|---|---|
| linyao.png | exec-4d8bf2ee-5cca-4da9-b1f8-18a78debfa13.png | 1145×1374 |
| zhaocheng.png | exec-0e346dc0-4ba8-49b3-b3c0-ad0ee64dd2ec.png | 1199×1312 |
| teacher.png | exec-5797ee77-c790-460c-837a-3c8e3563f5c1.png | 1199×1312 |
| mother.png | exec-91bcde29-53d2-408d-a60a-ad70d720a1f4.png | 1175×1339 |
| track.jpg | exec-a6defc56-45cd-4e0f-91ae-a4b00e7e5777.png | 1672×941 |
| notebook-cg.jpg | exec-adbb74de-9254-490c-88b2-7e8da67cfe95.png | 1672×941 |

头像由 CSS 在同一张透明立绘中裁切显示，不是另外生成的人脸。课堂 CG、家里 CG 和操场 CG 复用了已登记背景；递笔记使用新增专门剧情插画。演出中的运镜、光线、粒子由 CSS 和浏览器时钟完成，并非人物运动视频。小游戏的跑道、座位、视野属于代码绘制的交互示意；周围的美术背景仍为生成插画。

新增人物的面部比背景更可辨认，以便对话时识别；仍保留低饱和、柔光和自然学生造型。美术一致性与朦胧程度待用户审阅。

## v3：双主角、表情与短片

本次新增 16 张图片，使用内置 image_gen.imagegen。两位主角新生成人物造型，其余表情以对应角色为编辑参照，要求保留身体、道具和发型，仅调整面部。CG 新生成两幅。精确执行提示词、生成原文件标识、项目路径及 SHA256 见 **assets/GENERATION-V3.json**。PNG 保留透明通道；两幅横图仅转存 RGB JPEG（quality 94），不改变尺寸。

| 人物 / 场景 | 本次新增 |
|---|---|
| 林遥、赵程 | 各眨眼 / 微笑 / 失落，6 张 |
| 妈妈、韩老师 | 各眨眼 / 微笑，4 张 |
| 女生主角、男生主角 | 各平静 / 微笑，4 张 |
| 班旗、雨中等候 | 各 1 张剧情插画 |

10 段 WebM 是将这些生成表情图按 24 fps、48 帧合成透明视频，参数及方法见 assets/motion/MANIFEST.json，制作源码见 tools/render_character_motion.py。眨眼和微笑是关键表情帧变化，微动来自画面的整体变换；没有连续图生视频、骨骼肢体动作或口型动画。已确认视频服务当前无可用额度，没有提交收费视频任务。内置图片工具没有报告单次金额，不据此声称图片免费。

原始提示词中“只改变脸部”是生成约束，并不保证像素级一致。人物五官仍是柔和可见的朦胧校园插画风格，最终审美待你确认。


## v4 十月小续篇 · 2026-11-14

三张新插画通过内置 image_gen 生成，以现有 notebook-cg.jpg 作为角色与画风参考，未使用 DashScope 或 API/CLI。精确提示词、源文件标识与用途见 assets/GENERATION-SWEET-V4.json。原 PNG 另存交付目录“校园三年_十月CG原图_v4”，游戏中使用同尺寸的 JPEG 压缩版本；没有裁切或修改画面内容。三张均为 1672×941。

saved-seat-cg.jpg：林遥把书包移开，让出课间椅子；第一人称，不固定主角性别。

drawing-margin-cg.jpg：一起压住海报纸角，她画一只小鸟；手部保持分离，纯校园日常。

warm-carton-cg.jpg：食堂递温牛奶；先由剧情询问是否接受，可拒绝。

三幅通过轻运镜与光线制作可跳过的 5 / 5.5 / 4.5 秒 CG，不是连续 AI 动作视频。本次未新增两秒人物 WebM。

## v5 第一视角开场 · 2026-11-14

通过内置 image_gen 新生成教室门口、第一视角课桌、透明书包三幅原画。完整执行提示词、生成文件标识、参考图及用途见 assets/GENERATION-OPENING-V5.json；未调用 CLI/API 或提交收费视频任务。原始 PNG 保存在交付目录“校园三年_开场动画原画_v5”。场景另存同尺寸 JPEG，书包保留真实透明通道。

片头复用现有赵程表情、操场、雨中等候、留座位插画，与新画面合成 18.8 秒 MP4。书包是单独运动的图层；其余包括镜头推进、表情帧渐变、轻微呼吸、帘边、雨线、光尘和字幕。制作代码在 opening-film.js 与 tools/render_opening.py，参数在 assets/opening/MANIFEST.json。声音为程序合成的铃声、脚步、布料、桌面、雨声与少量音符。属于分层 2.5D 动画，不是连续 AI 人物动作视频。


## v10 配音开场集成 · 2026-11-14

游戏开场改用四段即梦 Seedance 1.0 Fast 图生视频的剪辑版本，按教室、留座、画海报、雨中等候顺序，以交叉溶解衔接；片尾加入标题。角落视觉标记按用户要求在前一制作阶段处理，保留完整构图。该阶段原始生成记录保存在本地交付目录，本次没有重新提交即梦生成。

四句普通话通过本机 Qwen3-TTS-12Hz-1.7B-Base 生成，参考为用户提供的公开视频人声第一句约 2.35～6.30 秒。仅使用合成后的新台词成片；不在仓库中分发参考原视频、原音频或声音模型。配音为 AI 合成，不代表参考作者实际参与录制或背书。没有口型同步。铃声、音符、雨声为原创程序合成。

发布视频使用 H.264/AAC，1280×720，30 fps，21.2 秒；相对本地预览进一步压缩，详情见 assets/GENERATION-OPENING-V10.json。首次以用户点击开始有声播放，结尾和跳过时加入画面、声音缓出及页面交接。

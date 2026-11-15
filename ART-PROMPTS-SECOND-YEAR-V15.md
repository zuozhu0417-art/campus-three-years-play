# v15 图片生成提示词

均使用内置 image_gen，原 PNG 保留在本机 work/campus/art-v15-originals；运行图及哈希见 assets/GENERATION-SECOND-YEAR-V15.json。两张均为新增素材，未覆盖旧图。

## 周砚：透明立绘

参考图：assets/zhaocheng.png，仅用于画风，不复制角色。transparent_background=true。

> Use case: illustration-story. Create a NEW distinct Chinese high school boy character Zhou Yan (周砚), age 16-17, for the same nostalgic campus visual novel as the reference. Reference image is STYLE ONLY, not the same character. Transparent background character sprite, portrait 2:3, upper thighs to head, entire head and both hands visible, with generous padding. Gentle watercolor / soft painterly illustration, muted cream and blue-gray uniform, diffuse warm daylight, paper texture, subdued soft facial details not photoreal. Zhou Yan has tidy short straight dark hair, thin rectangular glasses, calm slightly reserved expression, white short sleeve school shirt, holding an open exercise notebook at waist and pencil in right hand. Upright relaxed pose. No camera, no shoulder bag, no lettering, no logo, no scenery. Match reference's rendering softness and restrained colors. This is a separate new sprite, do not change or copy Zhao Cheng's identity.

## 新教室：背景兼 CG

参考图：assets/classroom.jpg，仅用于画风。transparent_background=false。

> Use case illustration-story. Create a new 16:9 landscape background and CG for a Chinese nostalgic school visual novel, matching this reference's painterly soft watercolor textures, subdued sage green, cream, warm wood and late summer daylight. NEW scene: the first day in a DIFFERENT classroom after second-year class reassignment. View from the open back doorway, looking diagonally across rows of worn wooden desks toward a green blackboard. A blank seating plan sheet pinned beside doorway, no readable text. A few Chinese teenage students seen from back or in soft unfocused silhouette, white school shirts, faces not visible. One boy with tidy dark hair and thin glasses seen only from the back at a paired desk in right midground, moving his stack of books inward to leave room for new deskmate. Empty chair beside him. The near doorframe and empty chair give quiet sense of arriving in an unfamiliar room. Windows on left with thin white curtains and tree-filtered light. Restrained natural campus atmosphere, ordinary morning, no dramatic farewell, no romance pose, no text, no logos. Preserve existing art direction. No UI.

周砚原 PNG 1024×1536 RGBA，保留真实透明通道并转 WebP；教室原 PNG 1672×941，转 JPEG。前者由对白和人物册使用，后者为高二教室背景、对白背景和一次可跳过的插画运镜。

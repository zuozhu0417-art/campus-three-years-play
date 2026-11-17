# v24 林遥情绪素材与接入

用户要求“多生成女主其他不同状态，难过、生气、厌恶等都要有”。本轮制作14张单独的透明人物立绘：grieving 难过、tearful 忍泪、crying 落泪、hurt 委屈、disappointed 失望、angry 生气、disgusted 反感/厌恶、worried 担心、surprised 惊讶、embarrassed 不好意思、delighted 开心、relieved 释然、tired 疲惫、determined 认真坚定。

所有图片以内置 image_gen 逐张编辑同一 assets/linyao-reserved-v23.webp 参考。人物身份、长马尾、蓝灰色发带、白衬衣/灰裙、画本与画风不变，只改变神态与少量头肩反应。保持克制的情绪区分，生气不等于可爱的鼓腮，反感通过回避与拉开距离表达。完整最终提示词、原始来源、WebP字节/hash登记于 assets/emotions-v24/MANIFEST.json；原PNG不删除不覆盖。PNG 1024×1536 RGBA；游戏主图 WebP quality93、缩略图256×384 quality85。主图alpha逐像素与原PNG一致。14主图+14缩略图总计约5.69MB，图鉴先加载小图、放大时加载主图。

emotions.js 是只读情绪目录，characters.js 在它之后加载并注册新poses。脚本作者可在林遥台词使用 `{who:'linyao',emotion:'angry',text:'…'}`，或 mood:'angry'。显式目录情绪优先于关系阶段并关闭旧人物视频；不做关键词猜测，不根据好感度低就随机厌恶，不改变关系标志。原有 polite cold / familiar / friends / shy / tender / broken 默认神态与旧画保留。原先的 sad 等旧键也不被替换。

游戏 emotionGallery 使用现有可关闭模态与逐句对话。标题更多玩法、暂停人物小册均可进入；示范对白不属于已触发剧情、不改变S。standalone expressions-preview.html / expressions-preview.js 不加载game.js、不访问localStorage；手机选择缩略图后回到主图，支持四尺寸。完整透明WebP可从主图链接打开。

本轮没有写完整分手章节、没有制作表情动画视频或推进W24以后；当前仍W01—W23与已有寒暑假。操场视频继续按用户要求暂停。schema8、原存档key、假期玩法和成长数值保持不变。

素材原图包在2026-11-15会话outputs/校园三年_林遥十四种情绪_v24.zip，含14透明PNG、离线看图HTML、提示词/来源JSON和说明。改前备份为同目录校园三年_v23_情绪立绘扩充前备份.zip。

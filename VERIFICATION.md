# 开场短片版 v5 验证

2026-11-14，Python Playwright + Microsoft Edge headless 实际浏览器操作。开场 8 组、十月剧情 6 组、第一章回归 13 组，共 27 组通过，无页面 JavaScript 异常。旧验证保留为 VERIFICATION-V4.md 和 VERIFICATION-V3.md。

## 开场已验证

- 真实 MP4 自动静音内联播放到 18.8 秒结束，随后回到可操作首页；1280×720，H.264/AAC，30 fps。不是用模拟时钟代替完整播放。
- 点击开启声音后实际解码 AAC 音频字节；暂停时进度停止，跳过、重看、结束交接可用。合成声轨波形峰值 0.331、RMS 0.017，未削波。未声称通过用户真实扬声器听音验收。
- 1366×768、390×844、844×390 真实浏览器解码；手机截图前播放并确认视频帧有图像变化，控制按钮在视口内，无横向溢出。
- 键盘 Tab 焦点留在片头，Escape 跳过；原男女身份选择仍可用。
- 片头前后原九月完成存档逐字节不变，可继续十月；首次观看不生成剧情存档，观看标记独立保存。
- 减少动态偏好时不自动播放，仍可主动重看；模拟视频加载失败后使用真实画布动画，并保留跳过入口。
- 切出页面暂停，回到页面恢复；localStorage 被拒绝时仍能进入游戏。

实际截图：screenshots-opening-v5。测试与结果：tests/verify_opening_v5.py、verification-opening-v5.json。

## 原剧情回归

新版重新运行十月两周分支及第一章测试，包含爱情靠近/普通朋友、海报、牛奶接受/拒绝、摄影承诺、三张 CG、剧情停止点、身份与旧存档迁移、时间精力、约定兑现/失约、笔记、考试、导出，以及跑步和查手机的成功/失败/暂停/返回。结果为 verification-v5-story.json（6 组）和 verification-v5-chapter1.json（13 组），截图在 screenshots-v5-story、screenshots-v5-chapter1。

## 复验

在游戏目录执行：

```text
python tests/verify_opening_v5.py
python tests/verify_v5_story.py
python tests/verify_v5_chapter1.py
```

脚本使用隔离上下文，不读取用户日常个人存档。需 Python、Playwright 和本机 Edge；游戏本身无需这些依赖。开场测试会临时启动仅本机可见的 HTTP 服务并自动关闭，剧情测试仍验证离线入口。

## 范围

新开场是生成插画、独立书包图层与表情帧的 2.5D 动画，真实导出为 MP4，并非连续 AI 图生视频。音效原创程序合成，没有角色配音。素材参数见 assets/opening/MANIFEST.json，生图完整提示词见 assets/GENERATION-OPENING-V5.json。

窄屏结果来自浏览器模拟尺寸，本次未在真实手机硬件测试。旧版首页可访问已由用户手机确认；新版部署结果另见外部发布记录。本次没有增加第七周、完整三年或结局。

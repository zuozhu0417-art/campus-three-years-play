# 表情与身份版 v3 验证

2026-11-13，本机 Microsoft Edge headless 浏览器，以 file:// 运行实际页面，由 Python Playwright 操作、解码视频并截图。共 **19 组检查通过**，未发现页面 JavaScript 异常或缺失的本地素材。

## 本版结果

| 结果文件 | 检查组 | 内容 |
|---|---:|---|
| verification-v3-regression.json | 13 | 四周实际交互、约定兑现和失约、精力、两个小游戏成功 / 失败、暂停、存档、键盘、导出与响应式布局 |
| verification-portraits.json | 5 | 男女开局、名字与头像、相同初始资源、人物小册、动态开关、v2 接续、全部 10 段视频实际解码、减少动态及竖屏 |
| verification-regret.json | 1 | 从第二周推进到失约回响，女生主角头像、赵程失落表情、静态展示、底层弹窗隐藏 |

verification-portraits.json 另记录了第四周实际选择触发雨中 CG 的流程验证。所有 10 段视频均实际解码检查：时长 2 秒、可见人物、角落 alpha 为 0、不同时间画面发生变化；游戏对话中的 currentTime 实际推进，播放结束恢复立绘。没有用素材清单或代码检查冒充实际播放。

1366×768、390×844、1280×600 均检查了页面操作。screenshots-v3 包含身份选择、男女主角对话、人物小册、表情、失约和雨中 CG 的真实截图。旧截图及验证文件保留为历史记录，不代表本版新运行。

game.js、experience.js、characters.js、content.js 通过 Node 语法检查。

## 验证边界

- 页面、输入与视频在本机 Edge 浏览器实际运行；未在真实手机、Steam 客户端或手柄上测试。竖屏为模拟尺寸。
- 人物 WebM 是生成表情帧的淡变、眨眼及轻微整体运动，不是 AI 连续动作视频，没有骨骼动画、说话口型或配音。
- 两种身份共用第一章主线与数值，不代表已做完两套性别专属剧情。
- 启动脚本调用默认浏览器，未把 headless file:// 测试说成真实双击启动测试。
- 未做游戏平衡、真人听感及美术审美验收。完整三年、所有人生线、Steamworks 和 JSON 导入仍未实现。

## 可复验

安装可选测试依赖后，在项目文件夹运行 `python tests/verify_v3_regression.py`、`python tests/verify_portraits.py`、`python tests/verify_regret_expression.py`。脚本默认本机 Edge 常见路径；其他机器需自行调整可执行文件位置。测试使用新的浏览器测试配置，不读取日常浏览器个人存档。

# v24 情绪素材验证

- 原图14张1024×1536 RGBA；14个独立WebP主图、14个缩略图。主图透明通道与原PNG逐像素一致，路径/hash/来源/最终提示词完整登记。ZIP解压校验通过，确认含14PNG。
- tests/verify_emotions_v24.py：14主图与缩略图真实解码；游戏内逐一显示14种表情，动态开启时均不被旧视频覆盖；标题和人物小册入口可用；前后游戏存档字串一致；六种关系上下文×14情绪×emotion/mood两种字段=168例；默认前期礼貌疏离仍保持；独立图鉴不访问存档；1366×768/390×844/844×390/320×568无横向溢出。无JS错误或404。
- tests/verify_canteen_v14.cjs：旧双场景内容域288场/480选项通过；其元数据展示检查标记presentation:preview，实际关系覆盖规则由v24专项单独验证。VM测试依赖列表同步加载emotions.js。
- tests/verify_second_year_domain_v15.cjs：高二108场、216选项、36周末实例通过；依赖列表同步。
- tests/verify_holiday_v23.py：既有两段假期、保存/刷新、独立试玩、旧关系神态与四尺寸回归。

均使用隔离headless Edge，真实用户浏览器存档未被操作。手机为视口模拟，未做真机测试。报告 verification-emotions-v24.json，截图 screenshots-emotions-v24。上线字节和浏览器核验见本轮发布记录。

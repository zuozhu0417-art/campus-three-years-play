# v15 验收记录

2026-11-15。使用隔离 Microsoft Edge headless，未操作用户真实存档。手机项均为浏览器视口模拟，并非真机实测。

- 新增数据检查：108 个场景实例、216 个选项、36 个周末场景实例，覆盖男女与靠近 / 友情 / 未决定。真实时段、去重、原借款与边界保护通过。
- 新增浏览器检查：男女两条 W20→W21→W23 连续流程，旧期末快照与座位、备份、借款 50 / 已还 20、明确拒绝、关系路线与刷新一致性通过。
- W21—W23 林遥 / 赵程双地点两种顺序共 12 种实际点击；不收费离开、低精力、自己保留方法、未接通电话、实际周日通话、通话后另一天入口禁用均通过。
- 1366×768、390×844、844×390、320×568 新同桌入口中心命中、立绘解码、选项和页面无横向溢出通过。未观察到 JS 页面异常或缺图。
- 原高一完整浏览器回归通过：男生靠近与女生友情两条 W07—W20、W05—W07 过渡、借款归还、实际补约、周日互斥、两个期末与学年收束；原食堂域测试 288 场景 / 480 选择也通过。

复验：`node tests/verify_second_year_domain_v15.cjs`、`python tests/verify_second_year_v15.py`。报告：verification-second-year-domain-v15.json、verification-second-year-v15.json、verification-year-regression-v15.json；截图：screenshots-second-year-v15、screenshots-year-regression-v15。

新增图为静态立绘和插画运镜，不是新增动作视频。没有手机真机、Steam、APK 验证。公开地址部署状态和线上验证见本机 outputs 中 v15 线上报告。

最终界面补验通过：高二教室名、座位表与周砚同桌说明、四尺寸原五个入口及新入口中心命中，高二消息不消耗资源且不替代实际通话。复验 tests/verify_second_year_ui_v15.py，报告 verification-second-year-final-ui-v15.json。

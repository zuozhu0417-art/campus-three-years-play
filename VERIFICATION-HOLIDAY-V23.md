# v23 验证记录

隔离 headless Edge，未触碰用户浏览器存档；手机为视口模拟，未做真机测试。

- tests/verify_holiday_v23.py：真实 W10 手记进入寒假、W20 学年结尾进入暑假；14/20半天完成并返回W11/W21；投篮中途退出和三次出手；七项活动、六科学习、花钱/工资、每日限制、低精力/低钱边界；刷新与标题继续不重复结算；回顾不补写未选经历；默认假期收束留档；独立试玩不改变本局；九种神态逻辑、六张真实立绘预览解码；照片动态开关与减少动态；1366×768/390×844/844×390/320×568无横向溢出。无JS错误、无HTTP缺失。
- tests/verify_growth_journey_v23.py：W01—W23连续实际点击，含两段完整假期，七次44人成绩单、课堂与晚自习、慢热节点、W11/W21返校与刷新保持。
- tests/verify_lunch_v21.py：414种周/路线/接触组合、两地点两顺序、离开无消耗、四尺寸；通过。
- tests/verify_growth_domain_v16.cjs：99种子×23周、七次报告与重复结算、学校七晚恢复；通过。

截图 screenshots-holiday-v23；报告 verification-holiday-v23.json / verification-growth-journey-v23.json。旧 v16 旅程脚本是历史版本，其直接跳过假期的预期不适用于v23，现由v23旅程覆盖。

- tests/verify_ambient_v22.py：原三段视频真实解码/推进、课堂切换、开关、失败回退和移动尺寸回归通过。

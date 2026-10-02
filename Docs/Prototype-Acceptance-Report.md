# Tile-Centric 涌现式造物主原型验收记录

验收日期：2026-10-01  
入口：[settlement.html](../settlement.html)

本轮以用户提供的 Tile-Centric Gameplay Prototype 文档为修改依据。项目继续使用 Three.js + TypeScript + Vite；首页 Mycelium 原型保持不变。

## 已实现

- Tile 事实层：`Fertility`、`Moisture`、`Heat`、`TreeAmount`、`LandUse`、`StructureRef`、`Effects`、水源与吸引力。
- Derived 层：`FarmSuitability`、`ForestryValue`、`MovementCost`、`SettlementValue`、农作效率与植被恢复。
- Entity 层：居民、建筑、全局资源仓储实现；居民保存行动、目标、已知候选、行动承诺与切换成本。
- 统一查询与资源接口：`IWorldQuery`、`IResourceStore`，当前实现分别为 `WorldQuery` 与 `GlobalResourceStore`。
- 统一行动事件：农务、收获、开垦、伐木、建造、进食和迁居都会写入 `ActionEvent`，神约只读取事件并改变神恩/神罚。
- Meta 层：三条神约模板、独立 Grace/Wrath、阈值提示、有限 Revelation；神迹仍只修改 Tile 世界事实。
- 调试面板：湿度、热量、肥力、吸引力、树木、土地用途、农作适性、定居价值、居民密度叠层；Tile Inspector；Agent Inspector；事件记录。
- 控制流程：启动、暂停、1×/2×/4×、重开、地图点击选 Tile、神迹选取与目标点击。

## 验收结果

测试通过方式：将 `src/simulation.ts` 用本地 esbuild 打包为临时 headless runner，固定 seed `202603`，按 `0.15s` 模拟步长执行；临时 runner 测试后已删除。

| 测试 | 结果 | 观察 |
|---|---|---|
| AT-01 Autonomous Civilization | PASS | 运行 180 秒（约 15 天）后人口 15、食物约 102、住宅 5，并产生 ActionEvent。 |
| AT-02 Food Adaptation | PASS | 食物归零后务农 Utility 上升，测试时 11 名居民进入务农或保留高务农 Utility。 |
| AT-03 Forest Depletion | PASS | 木材压力下森林总量从 112.51 降到 111.27，森林变化来自伐木与恢复的底层规则。 |
| AT-04 Remote Spring | PASS | 远端泉源只改变局部 Tile 条件；施放后人口与建筑立即保持不变，没有调用生成村庄逻辑。 |
| AT-05 Context-sensitive Rain | PASS | 干肥地农作效率 `0.345 → 0.909`；过湿肥地 `0.496 → 0.345`，相同神迹产生不同后果。 |
| AT-06 Covenant Does Not Command | PASS | 木材为零时仍有居民继续伐木；神罚只评价 `chopWood` ActionEvent，没有禁止行为。 |
| AT-07 Divergent History | PASS | 相同 seed 下，中心 Tile 的甘霖历史为湿度约 `0.584`、热量 `0.424`；日照历史为湿度约 `0.143`、热量 `0.698`。 |
| AT-08 Architecture Audit | PASS | 代码中存在 `ActionEvent`、`IWorldQuery`、`IResourceStore`、`LandUse`、Covenant；聚落由 `getSettlements` 读取状态识别。 |

## 实际观察到的因果链

1. 湿度变化 → `FarmEfficiency` 变化 → 居民务农 Utility 重新排序 → 食物产量变化。
2. 伐木 → `TreeAmount` 下降 → `ForestryValue` 下降 → 木材稀缺与选址/通勤判断变化。
3. 居民开垦 → `LandUse = Farmland` → 农务与收获 ActionEvent → 丰收之约增加 Grace；事件不会直接生成食物或居民。
4. 泉源 → 局部湿度/吸引力持续恢复 → 远端 Tile 的定居价值改变；建筑与迁居仍由居民 Utility 自行决定。

## 涌现性判断

已观察到由底层规则共同产生的空间分化：居民会因为生产点、湿度、通行成本和住房容量重新分配住所，并在相同世界中出现多个可识别的居民密度簇。代码没有 `SpawnVillage()`、`CreateSettlement()` 或“神迹直接加人口/食物”的路径。

## 已知边界

- 资源仓储当前仍是全局实现，接口已存在但尚未替换为地方仓储或物理物流。
- Farmland 已作为 Tile `LandUse` 写入；现有 Farm Building 仍保留作为可视化和工作锚点，后续可进一步拆成纯表现结构。
- 远端泉源提高远端 Tile 的价值，但由于食物、住房和建造节奏影响，第二个稳定建筑簇不是每次都立即形成；这是当前原型的自然不确定性。
- Revelation 目前只有短暂静默期后的第一次启示；更多宏观触发条件仍可继续扩展。
- 旧的稳定结局逻辑仍作为软结束保护存在，核心调试面板和模拟闭环不依赖它。

## 结论

当前 Milestone 0、Milestone 1、Milestone 2 与 Milestone 3 的可观测最小闭环通过；神迹能改变世界事实，居民能自主回应，事件能被神约评价，Tile Inspector 能追溯空间原因。原型可以继续用于参数实验与远端聚落形成测试。

## 补充验收：玩家神迹循环（2026-10-02）

本轮依据 Player Interaction & Divine Gameplay Layer 补充规格扩展。正式界面路径如下：

`静默期（居民持续运行） → 条件启示 → 选择神约 → 居民 ActionEvent 累积神恩/神罚 → Charge 可叠加存储 → 选择神迹 → 地图目标预览 → 确认施放 → Tile 事实变化 → 居民继续自主响应`

### 验收结果

| 项目 | 结果 | 观察 |
|---|---|---|
| AT-00 静默与首次启示 | PASS | 65 个模拟秒后、人口至少 8 时进入首次神约选择。1×/4× 均按模拟速度计时。静默期间神约为空、神恩/神罚不增长、神迹按钮禁用。 |
| 神约选择与继续 | PASS | 使用正式弹窗选择丰收之约，显示行为范围与 ActionEvent 触发依据；居民继续自主运行。 |
| Charge 与玩家选择 | PASS | Charge 上限设为 4 枚；神恩达到阈值后按跨越阈值的次数增加 Charge，未满阈值的神恩余数继续保留；HUD 显示当前数量与上限。神罚池单独对应旱灾/贫瘠。 |
| 目标预览与取消 | PASS（画面） | 选择甘霖后点击沙盘，只出现瞄准状态，不立即扣除 Charge；显示目标坐标、37 块受影响 Tile、湿度变化预估和影响半径。预览卡片不再拦截沙盘点击，取消后 Charge 数量保持不变。 |
| 确认施放 | PASS | 目标预览卡片内的确认按钮在选中地块后可见且启用；正式确认后弹窗关闭、只消耗 1 枚 Charge，Tile Effects 与湿度更新，环境变化继续由模拟规则传递。 |
| 静默计时边界 | PASS | 浏览器首次试跑发现人口条件设为 12 会因自然波动永久卡住启示；阈值改为 8，并让计时跟随速度，重新跑通启示。 |
| 构建 | PASS | `npm run build`（TypeScript 检查与 Vite 生产构建）。 |

### 玩法因果与风险

- 丰收之约读取 `farmWork`、`harvest`、`createFarmland` 事件；最近的 ActionEvent 在 HUD 中标出触发神约与神恩/神罚增量。居民仍照常务农、迁居或伐木。神约没有 Utility/行动禁用接口。
- 神恩/神罚分别以数量形式存储 Charge，最多各存储 4 枚；每次达到阈值增加对应数量，未满阈值余数保留并继续增长，施放一次只消耗一枚。达到上限后 meter 保持满格，消耗一枚后下一次 ActionEvent 可立即转化为新 Charge。瞄准取消不会调用施放逻辑；神迹只改地块湿度、热量、肥力或水源，不直接创建居民、建筑或资源。
- 本轮浏览器路径中，4× 速度下约 16 秒墙钟时间后出现首次选择，随后完成一次确认施放并再次积累到 `2 Charge`；说明 Charge 可以囤积，不会因已有 Charge 停止 meter 累积。
- 回转参数：`graceThreshold / wrathThreshold = 30`；丰收神恩增量为 `harvest 0.1`、`reclaim 0.075`、`migrate 0.15`，林下神罚伐木增量为 `4.5`。固定种子烟测中，丰收之约连续 Charge 间隔为 381–446 模拟秒，中心接近 360 秒目标；因此 4× 速度约 1.5 分钟，1× 速度约 6 分钟。神罚受森林位置与居民伐木选择影响更大，保持其涌现式波动。
- 可刷取点：丰收之约将 `farmWork` 与 `harvest` 两个事件分别计量，单次务农产出会获得双事件；与水脉之约同时启用时同一事件也叠加。Charge 可存储后，神恩仍可能显著快于神罚。建议后续把同一生产周期合并为一次计量，或对重复事件做每行动/每日上限。
- 当前可选神约中，丰收之约响应频率最高，较容易稳定获得神恩；没有证据表明某一神迹有固定最优解：甘霖影响区域、泉源影响单格且持久，效果取决于目标 Tile 与居民需求。建议保留每种神迹各自的事实范围，避免统一成本抹平差异。
- 节奏参数建议：静默期 60–90 模拟秒；首次启示人口阈值 8–12；Charge 阈值先维持 30，观察两次自然积累周期后再调；后续启示要求人口 18 且至少两个聚落，满三槽时先选要替换的旧约。
- 后续启示有 90 秒模拟时间冷却；满三槽时可以明确选择保留现有神约，避免条件持续满足时启示弹窗连续重开。

### 尚未覆盖

- 浏览器实测完成首次启示、选择、神恩 Charge、甘霖瞄准、目标卡确认、取消保留和两枚 Charge 存储；确认后 Tile 湿度/Effects 更新且只消耗一枚。没有等待足够的长局墙钟时间逐一触发后续启示、三约替换、神罚 Charge 和离去阶段。
- 桌面 1440×900 预览布局可读；未完成真实窄屏设备验收。窄屏将启示候选改为单列，但完整沙盘可点选情况仍需人工检查。

### 基本通路复验（2026-10-02）

使用固定种子执行模拟 API 烟测，结果为：首次启示 PASS → 神约选择 PASS → Charge 获取 PASS → 神迹施放 PASS → 施放消耗 1 枚 Charge PASS。构建命令 `npm run build` 同样通过；本轮未发现阻断通路的问题。

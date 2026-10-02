import * as THREE from 'three';
import './settlement-styles.css';
import {
  actionLabel, acquireOracle, advanceFromResolution, castMiracle, chooseCovenant, CONFIG, COVENANT_POOL, createWorld, discardOracle, endDivinePhase, getMetrics, getOracleAcquisitionCost, getSettlements, getTileDerived, oracleCard, playOracle, retainCovenants, stepWorld, tileAt,
  type Action, type Agent, type Building, type BuildingKind, type MiracleKind, type OverlayKind, type Tile, type World,
} from './simulation';

const el = <T extends HTMLElement>(id: string): T => document.getElementById(id) as T;
const ui = {
  scene: el<HTMLDivElement>('scene'), day: el('day-label'), run: el('run-state'), pop: el('population'), housing: el('housing-count'), food: el('food'), wood: el('wood'), stone: el('stone'),
  goalState: el('goal-state'), goalDescription: el('goal-description'), popGoal: el('population-goal'), popMeter: el<HTMLElement>('population-meter'), stableGoal: el('stable-goal'), stableMeter: el<HTMLElement>('stable-meter'),
  foodPressure: el('food-pressure-value'), foodPressureBar: el<HTMLElement>('food-pressure-bar'), woodPressure: el('wood-pressure-value'), woodPressureBar: el<HTMLElement>('wood-pressure-bar'), stonePressure: el('stone-pressure-value'), stonePressureBar: el<HTMLElement>('stone-pressure-bar'), housingPressure: el('housing-pressure-value'), housingPressureBar: el<HTMLElement>('housing-pressure-bar'), foodSecurity: el('food-security'), happiness: el('happiness'), legendSwatch: el<HTMLElement>('legend-swatch'), legendLabel: el('legend-label'),
  empty: el('inspector-empty'), details: el('inspector-details'), badge: el('selection-badge'), avatar: el('agent-avatar'), name: el('agent-name'), job: el('agent-job'), action: el('agent-action'), target: el('agent-target'), hunger: el('agent-hunger'), home: el('agent-home'), utility: el('utility-list'), reason: el('agent-reason'), events: el('event-list'),
  tileBadge: el('tile-selection-badge'), tileState: el('tile-state'), tileTree: el('tile-tree-amount'), tileFire: el('tile-fire-level'), tileLandUse: el('tile-land-use'), tileStructure: el('tile-structure-ref'), tileFarmSuitability: el('tile-farm-suitability'), tileForestry: el('tile-forestry-value'), tileSettlementValue: el('tile-settlement-value'), tileFarm: el('tile-farm-efficiency'), tileMove: el('tile-movement-cost'), tilePreference: el('tile-settlement-preference'), tileEffects: el('tile-effects'),
  agentCommitment: el('agent-commitment'), agentSwitchCost: el('agent-switch-cost'), agentCandidates: el('agent-candidates'), oracleHand: el<HTMLDivElement>('oracle-hand'), oracleHandCount: el('oracle-hand-count'), oracleDeckCount: el('oracle-deck-count'), oracleDiscardCount: el('oracle-discard-count'), oraclePower: el('oracle-power'), acquireOracle: el<HTMLButtonElement>('acquire-oracle'), discardOracle: el<HTMLButtonElement>('discard-oracle'),
  miracleHint: el('miracle-hint'), endPhase: el<HTMLButtonElement>('end-phase-button'), continueButton: el<HTMLButtonElement>('continue-button'), pause: el<HTMLButtonElement>('pause-button'), toast: el('toast'), ending: el('ending-modal'), endingKicker: el('ending-kicker'), endingTitle: el('ending-title'), endingCopy: el('ending-copy'), endingPop: el('ending-population'), endingDays: el('ending-days'), ritual: el('ritual-modal'), ritualKicker: el('ritual-kicker'), ritualTitle: el('ritual-title'), ritualCopy: el('ritual-copy'), ritualOptions: el('ritual-options'), targetPreview: el('target-preview'), confirmMiracle: el<HTMLButtonElement>('confirm-miracle'), ritualConfirm: el<HTMLButtonElement>('ritual-confirm'),
};
const clamp = (v: number, min = 0, max = 1): number => Math.max(min, Math.min(max, v));
const pct = (v: number): string => `${Math.round(clamp(v) * 100)}%`;
const setMeter = (node: HTMLElement, value: number): void => { node.style.width = `${Math.round(clamp(value) * 100)}%`; };
const pointFor = (x: number, z: number, y = 0): THREE.Vector3 => new THREE.Vector3(x - 14.5, y, z - 14.5);
const labelBuilding = (kind: BuildingKind): string => ({ house: '住宅', farm: '农场', lumber: '伐木营地', quarry: '采石场', storage: '粮仓' })[kind];

let world: World = createWorld();
let paused = false;
let speed = 1;
let miracle: string | null = null;
let divineChoicesDismissed = false;
let divineChoicesTurn = 0;
let targetTile: { x: number; z: number } | null = null;
let pendingCovenant: string | null = null;
let replaceCovenant: string | null = null;
let toastTimer = 0;
let lastFrame = performance.now();
let hudTimer = 0;
let mapTimer = 0;
let endShown = false;
let selectedAgent: number | null = world.selectedAgentId;
let selectedTile: Tile | null = null;
let panId: number | null = null;
let panLast = { x: 0, y: 0 };

const scene = new THREE.Scene();
scene.background = new THREE.Color(0x53694f);
scene.fog = new THREE.FogExp2(0x53694f, 0.0075);
const camera = new THREE.OrthographicCamera(-18, 18, 18, -18, 0.1, 120);
const cameraTarget = new THREE.Vector3(0, 0, 0);
camera.position.set(27, 32, 27); camera.lookAt(cameraTarget);
const renderer = new THREE.WebGLRenderer({ antialias: true, powerPreference: 'high-performance' });
renderer.setPixelRatio(Math.min(window.devicePixelRatio, 1.8)); renderer.outputColorSpace = THREE.SRGBColorSpace; renderer.shadowMap.enabled = true; renderer.shadowMap.type = THREE.PCFSoftShadowMap; ui.scene.appendChild(renderer.domElement);
scene.add(new THREE.HemisphereLight(0xe8edcf, 0x354838, 1.55));
const sun = new THREE.DirectionalLight(0xffe5b1, 2.1); sun.position.set(-8, 18, 10); sun.castShadow = true; sun.shadow.mapSize.set(1024, 1024); scene.add(sun);

const root = new THREE.Group(); const tileRoot = new THREE.Group(); const buildingRoot = new THREE.Group(); const agentRoot = new THREE.Group(); const effectRoot = new THREE.Group(); root.add(tileRoot, buildingRoot, agentRoot, effectRoot); scene.add(root);
const ground = new THREE.Mesh(new THREE.PlaneGeometry(31.5, 31.5), new THREE.MeshStandardMaterial({ color: 0x586d4e, roughness: 1 })); ground.rotation.x = -Math.PI / 2; ground.position.y = -0.18; ground.receiveShadow = true; root.add(ground);
const tileGeometry = new THREE.BoxGeometry(0.97, 0.14, 0.97); const palette: Record<Tile['terrain'], number> = { grass: 0x829766, fertile: 0xb1c27c, forest: 0x435d43, stone: 0x858d81, water: 0x4b9197 }; const baseColors: THREE.Color[] = []; const tileMeshes: THREE.Mesh[] = [];
const buildingMeshes = new Map<number, THREE.Group>(); const agentMeshes = new Map<number, THREE.Group>(); const effectMeshes: THREE.Mesh[] = []; let overlay: OverlayKind = 'none';
const raycaster = new THREE.Raycaster(); const pointer = new THREE.Vector2(); const groundPlane = new THREE.Plane(new THREE.Vector3(0, 1, 0), 0);
const tileSelection = new THREE.Mesh(new THREE.RingGeometry(0.44, 0.5, 4), new THREE.MeshBasicMaterial({ color: 0xf2d37e, transparent: true, opacity: 0.85, side: THREE.DoubleSide, depthWrite: false })); tileSelection.rotation.x = -Math.PI / 2; tileSelection.position.y = 0.06; tileSelection.visible = false; root.add(tileSelection);
const material = (color: number, roughness = 0.9): THREE.MeshStandardMaterial => new THREE.MeshStandardMaterial({ color, roughness });
const mats = { house: material(0xe4d8bd), roof: material(0x895746), farm: material(0x78995e), soil: material(0x776947), lumber: material(0x8b6746), quarry: material(0x9aa39c), storage: material(0xb2915e), window: material(0x83b6ae, 0.35), dark: material(0x514435) };

function refreshTiles(): void {
  if (!tileMeshes.length) for (const tile of world.tiles) { const mesh = new THREE.Mesh(tileGeometry, material(palette[tile.terrain])); mesh.position.copy(pointFor(tile.x, tile.z, -0.08)); mesh.userData.tile = tile; mesh.receiveShadow = true; tileRoot.add(mesh); tileMeshes.push(mesh); baseColors.push(new THREE.Color(palette[tile.terrain])); }
  world.tiles.forEach((tile, index) => {
    const color = baseColors[index].clone();
    if (overlay === 'moisture') color.lerp(new THREE.Color(0x4ca0ae), tile.moisture * 0.72);
    if (overlay === 'heat') color.lerp(new THREE.Color(0xd77b55), tile.heat * 0.7);
    if (overlay === 'fertility') color.lerp(new THREE.Color(0xb6cf79), tile.fertility * 0.72);
    if (overlay === 'attraction') color.lerp(new THREE.Color(0xb3d29b), tile.attraction * 0.72);
    const derived = getTileDerived(world, tile);
    if (overlay === 'treeDensity') color.lerp(new THREE.Color(0x234d36), tile.treeAmount * 0.82);
    if (overlay === 'farmSuitability') color.lerp(new THREE.Color(0xe0c66c), derived.farmSuitability * 0.76);
    if (overlay === 'settlementValue') color.lerp(new THREE.Color(0xc18ab9), derived.settlementValue * 0.76);
    if (overlay === 'landUse') color.lerp(new THREE.Color(tile.landUse === 'farmland' ? 0xc79b5e : tile.landUse === 'construction' ? 0xd09b9b : 0x65705e), tile.landUse === 'none' ? 0.08 : 0.78);
    if (overlay === 'residentDensity') {
      const density = world.agents.filter((agent) => Math.hypot(agent.x - tile.x, agent.z - tile.z) < 1.1).length;
      color.lerp(new THREE.Color(0xe6a060), Math.min(1, density / 4) * 0.8);
    }
    if (tile.waterSource > 0 && overlay === 'none') color.lerp(new THREE.Color(0x6fb5c2), 0.45);
    if (tile.fireLevel > 0) color.lerp(new THREE.Color(0xd94e32), Math.min(0.82, 0.24 + tile.fireLevel * 0.58));
    (tileMeshes[index].material as THREE.MeshStandardMaterial).color.copy(color);
  });
  if (selectedTile) tileSelection.position.copy(pointFor(selectedTile.x, selectedTile.z, 0.06));
}

function buildingView(building: Building): THREE.Group {
  const group = new THREE.Group(); group.position.copy(pointFor(building.x, building.z)); group.userData.buildingId = building.id;
  const box = (geometry: THREE.BufferGeometry, mat: THREE.Material, x: number, y: number, z: number): THREE.Mesh => { const mesh = new THREE.Mesh(geometry, mat); mesh.position.set(x, y, z); mesh.castShadow = true; mesh.receiveShadow = true; group.add(mesh); return mesh; };
  if (building.kind === 'house') { box(new THREE.BoxGeometry(0.7, 0.48, 0.68), mats.house, 0, 0.27, 0); const roof = new THREE.Mesh(new THREE.ConeGeometry(0.56, 0.46, 4), mats.roof); roof.rotation.y = Math.PI / 4; roof.position.y = 0.74; roof.castShadow = true; group.add(roof); box(new THREE.BoxGeometry(0.13, 0.16, 0.03), mats.window, -0.2, 0.32, 0.35); box(new THREE.BoxGeometry(0.13, 0.16, 0.03), mats.window, 0.2, 0.32, 0.35); box(new THREE.BoxGeometry(0.14, 0.28, 0.04), mats.dark, 0, 0.15, 0.35); }
  else if (building.kind === 'farm') { box(new THREE.BoxGeometry(0.92, 0.1, 0.82), mats.soil, 0, 0.03, 0); for (let x = -1; x <= 1; x += 1) for (let z = -1; z <= 1; z += 1) box(new THREE.ConeGeometry(0.1, 0.33, 5), mats.farm, x * 0.22, 0.22, z * 0.22); }
  else if (building.kind === 'lumber') { box(new THREE.BoxGeometry(0.7, 0.4, 0.62), mats.lumber, 0, 0.23, 0); const roof = new THREE.Mesh(new THREE.ConeGeometry(0.56, 0.42, 4), mats.farm); roof.rotation.y = Math.PI / 4; roof.position.y = 0.66; group.add(roof); for (let i = 0; i < 3; i += 1) { const log = box(new THREE.CylinderGeometry(0.06, 0.06, 0.55, 6), mats.dark, -0.47, 0.13 + i * 0.1, 0.28); log.rotation.z = Math.PI / 2; } }
  else if (building.kind === 'quarry') for (let i = 0; i < 5; i += 1) box(new THREE.DodecahedronGeometry(0.18 + (i % 2) * 0.05), mats.quarry, (i % 3 - 1) * 0.24, 0.14 + (i % 2) * 0.07, (Math.floor(i / 3) - 0.5) * 0.3);
  else { box(new THREE.BoxGeometry(0.8, 0.48, 0.68), mats.storage, 0, 0.27, 0); const roof = new THREE.Mesh(new THREE.ConeGeometry(0.6, 0.43, 4), mats.farm); roof.rotation.y = Math.PI / 4; roof.position.y = 0.73; group.add(roof); }
  const ring = new THREE.Mesh(new THREE.RingGeometry(0.45, 0.5, 24), new THREE.MeshBasicMaterial({ color: 0xe6d79d, transparent: true, opacity: 0.24, side: THREE.DoubleSide, depthWrite: false })); ring.rotation.x = -Math.PI / 2; ring.position.y = 0.01; group.add(ring); return group;
}
function syncBuildings(): void { const ids = new Set(world.buildings.map((building) => building.id)); for (const [id, group] of buildingMeshes) if (!ids.has(id)) { buildingRoot.remove(group); buildingMeshes.delete(id); } for (const building of world.buildings) if (!buildingMeshes.has(building.id)) { const group = buildingView(building); buildingRoot.add(group); buildingMeshes.set(building.id, group); } }

function agentView(agent: Agent): THREE.Group { const root = new THREE.Group(); root.userData.agentId = agent.id; const colors: Record<Action, number> = { eat: 0xe8cc78, farm: 0xa4cc78, chop: 0xc99463, mine: 0xa9c4c8, buildHouse: 0xd5a0ba, buildFarm: 0xd5a0ba, buildLumber: 0xd5a0ba, buildQuarry: 0xd5a0ba, rest: 0xb8c1a1, migrate: 0xc0a0d8 }; const body = new THREE.Mesh(new THREE.SphereGeometry(0.21, 12, 9), material(colors[agent.currentAction], 0.58)); body.position.y = 0.26; body.castShadow = true; body.userData.agentBody = true; root.add(body); const head = new THREE.Mesh(new THREE.SphereGeometry(0.13, 10, 8), material(0xe3c9a2, 0.7)); head.position.y = 0.52; root.add(head); const hat = new THREE.Mesh(new THREE.ConeGeometry(0.16, 0.15, 6), material(0x627e52)); hat.position.y = 0.66; root.add(hat); const ring = new THREE.Mesh(new THREE.TorusGeometry(0.29, 0.032, 6, 20), new THREE.MeshBasicMaterial({ color: 0xf2d37e, transparent: true, opacity: 0.95, depthWrite: false })); ring.rotation.x = Math.PI / 2; ring.position.y = 0.03; ring.visible = false; ring.userData.selectionRing = true; root.add(ring); agentRoot.add(root); return root; }
function syncAgents(now: number): void { const ids = new Set(world.agents.map((agent) => agent.id)); for (const [id, group] of agentMeshes) if (!ids.has(id)) { agentRoot.remove(group); agentMeshes.delete(id); } const colors: Record<Action, number> = { eat: 0xe8cc78, farm: 0xa4cc78, chop: 0xc99463, mine: 0xa9c4c8, buildHouse: 0xd5a0ba, buildFarm: 0xd5a0ba, buildLumber: 0xd5a0ba, buildQuarry: 0xd5a0ba, rest: 0xb8c1a1, migrate: 0xc0a0d8 }; for (const agent of world.agents) { const group = agentMeshes.get(agent.id) ?? agentView(agent); agentMeshes.set(agent.id, group); group.position.copy(pointFor(agent.x, agent.z)); const body = group.children.find((child) => child.userData.agentBody) as THREE.Mesh | undefined; if (body) { body.position.y = 0.26 + Math.sin(now * 0.003 + agent.id) * 0.02; (body.material as THREE.MeshStandardMaterial).color.setHex(colors[agent.currentAction]); } const ring = group.children.find((child) => child.userData.selectionRing) as THREE.Mesh | undefined; if (ring) ring.visible = agent.id === selectedAgent; } }
function syncEffects(): void { while (effectMeshes.length > world.effects.length) { const mesh = effectMeshes.pop()!; effectRoot.remove(mesh); } while (effectMeshes.length < world.effects.length) { const effect = world.effects[effectMeshes.length]; const colors: Record<MiracleKind, number> = { rain: 0x75c5d4, drought: 0xe7a45d, spring: 0x5fc5cf, barren: 0xd8a7cc, fire: 0xf05b32 }; const ring = new THREE.Mesh(new THREE.TorusGeometry(1, 0.025, 6, 64), new THREE.MeshBasicMaterial({ color: colors[effect.kind], transparent: true, opacity: 0.3, depthWrite: false })); ring.rotation.x = Math.PI / 2; effectRoot.add(ring); effectMeshes.push(ring); } world.effects.forEach((effect, index) => { const mesh = effectMeshes[index]; mesh.position.copy(pointFor(effect.x, effect.z, 0.04)); mesh.scale.set(effect.radius, effect.radius, effect.radius); (mesh.material as THREE.MeshBasicMaterial).opacity = effect.remainingDays > 9000 ? 0.42 : 0.12 + effect.remainingDays / CONFIG.miracleDays * 0.26; }); }

function updateTileInspector(): void {
  if (!selectedTile) { ui.tileBadge.textContent = '未选择'; ui.tileState.textContent = '点击地图上的土地查看湿度、热量与派生条件。'; ui.tileTree.textContent = '—'; ui.tileFire.textContent = '—'; ui.tileLandUse.textContent = '—'; ui.tileStructure.textContent = '—'; ui.tileFarmSuitability.textContent = '—'; ui.tileForestry.textContent = '—'; ui.tileSettlementValue.textContent = '—'; ui.tileFarm.textContent = '—'; ui.tileMove.textContent = '—'; ui.tilePreference.textContent = '—'; ui.tileEffects.textContent = ''; return; }
  const derived = getTileDerived(world, selectedTile);
  ui.tileBadge.textContent = `(${selectedTile.x}, ${selectedTile.z}) · ${selectedTile.terrain === 'fertile' ? '肥沃土地' : selectedTile.terrain === 'forest' ? '森林' : selectedTile.terrain === 'stone' ? '石矿' : selectedTile.terrain === 'water' ? '水源' : '普通土地'}`;
  ui.tileState.textContent = `湿度 ${pct(selectedTile.moisture)} · 热量 ${pct(selectedTile.heat)} · 肥力 ${pct(selectedTile.fertility)} · 吸引力 ${pct(selectedTile.attraction)}${selectedTile.fireLevel > 0 ? ` · 火势 ${pct(selectedTile.fireLevel)}` : ''}${selectedTile.waterSource > 0 ? ' · 持久泉源' : ''}`;
  ui.tileTree.textContent = pct(selectedTile.treeAmount);
  ui.tileFire.textContent = pct(selectedTile.fireLevel);
  ui.tileLandUse.textContent = selectedTile.landUse === 'farmland' ? 'Farmland' : selectedTile.landUse === 'construction' ? 'Construction' : 'None';
  ui.tileStructure.textContent = selectedTile.structureRef ? `#${selectedTile.structureRef}` : '—';
  ui.tileFarmSuitability.textContent = pct(derived.farmSuitability);
  ui.tileForestry.textContent = pct(derived.forestryValue);
  ui.tileSettlementValue.textContent = pct(derived.settlementValue);
  ui.tileFarm.textContent = pct(derived.farmEfficiency);
  ui.tileMove.textContent = `${derived.movementCost.toFixed(2)}x`;
  ui.tilePreference.textContent = pct(derived.settlementPreference);
  ui.tileEffects.textContent = selectedTile.effects.length ? `Effects: ${selectedTile.effects.map((effect) => effect.kind).join(' · ')}` : 'Effects: None';
}
function updateInspector(): void { const agent = world.agents.find((item) => item.id === selectedAgent); ui.empty.hidden = Boolean(agent); ui.details.hidden = !agent; ui.badge.textContent = agent ? `居民 #${agent.id}` : '未选择'; if (!agent) { updateTileInspector(); return; } const home = world.buildings.find((building) => building.id === agent.homeId); ui.avatar.textContent = agent.name.slice(0, 1); ui.name.textContent = `${agent.name} #${agent.id}`; ui.job.textContent = agent.currentJob; ui.action.textContent = actionLabel(agent.currentAction); ui.target.textContent = agent.currentTarget.label; ui.hunger.textContent = pct(agent.hunger / 1.1); ui.home.textContent = home ? `${labelBuilding(home.kind)} #${home.id}` : '暂无住所'; ui.agentCommitment.textContent = `${Math.round(agent.actionCommitment)}%`; ui.agentSwitchCost.textContent = `${Math.round(agent.switchCost)}`; ui.agentCandidates.textContent = agent.knownCandidates.map((candidate) => candidate.label).join(' · ') || '附近没有已知候选'; ui.utility.innerHTML = (Object.entries(agent.utilityScores) as [Action, number][]).sort((a, b) => b[1] - a[1]).slice(0, 6).map(([key, value]) => `<div class="utility-row${key === agent.currentAction ? ' selected' : ''}"><span class="utility-name${key === agent.currentAction ? ' selected' : ''}">${actionLabel(key)}</span><span class="utility-track"><i style="width:${Math.max(2, Math.min(100, value))}%"></i></span><span class="utility-value">${Math.round(value)}</span></div>`).join(''); ui.reason.textContent = agent.currentAction === 'migrate' ? `${agent.currentTarget.label}；迁居能降低工作距离，并利用空余住房。` : (agent.utilityReasons[agent.currentAction] ?? []).join(' · ') || '当前行动的效用高于其他可行选择。'; updateTileInspector(); }
function updateEvents(): void { const actionLabels: Record<string, string> = { eat: '进食', farmWork: '农务', harvest: '收获', createFarmland: '开垦 Farmland', chopWood: '伐木', buildHouse: '建成住宅', buildFarm: '建成农场', buildLumber: '建成伐木营地', buildQuarry: '建成采石场', migrate: '迁居' }; const actionItems = world.actionEvents.slice(0, 2).map((event) => `<li class="event-item neutral"><span class="event-day">A${Math.floor(event.simTime) + 1}</span><div class="event-copy"><strong>${actionLabels[event.actionType] ?? event.actionType}</strong><p>居民 #${event.actorRef} 在 (${event.tileCoord.x}, ${event.tileCoord.z}) 完成 ActionEvent · ${event.amount ? event.amount.toFixed(1) : '—'}${event.covenantFeedback?.length ? ` · ${event.covenantFeedback.join(' · ')}` : ''}</p></div></li>`).join(''); const summaryItem = world.lastSummary ? '<li class="event-item good"><span class="event-day">T' + world.lastSummary.turn + '</span><div class="event-copy"><strong>回合总结</strong><p>' + world.lastSummary.causalChain + '</p></div></li>' : ''; ui.events.innerHTML = summaryItem + actionItems + world.events.slice(0, 5).map((event) => `<li class="event-item ${event.tone}"><span class="event-day">D${event.day}</span><div class="event-copy"><strong>${event.title}</strong><p>${event.detail}</p></div></li>`).join(''); }
function updateHUD(): void { const metrics = getMetrics(world); const settlements = getSettlements(world); ui.day.textContent = `第 ${Math.floor(world.elapsedDays) + 1} 天`; const phaseLabels: Record<string, string> = { 'turn-start': '回合开始', divine: '神之时', 'divine-targeting': '神谕瞄准', mortal: '凡人之时', resolution: '回合结算', revelation: '启示', departure: '离神测试' }; ui.run.textContent = paused ? '已暂停' : `${phaseLabels[world.phase] ?? '运行中'} · ${speed}×`; ui.pop.textContent = `${metrics.population}`; ui.housing.textContent = `${metrics.housing}`; ui.food.textContent = `${Math.floor(world.resources.food)}`; ui.wood.textContent = `${Math.floor(world.resources.wood)}`; ui.stone.textContent = `${Math.floor(world.resources.stone)}`; ui.popGoal.textContent = `${metrics.population} / ${CONFIG.stablePopulationGoal}`; setMeter(ui.popMeter, metrics.population / CONFIG.stablePopulationGoal); ui.stableGoal.textContent = settlements.length ? `${settlements.length} 个聚落 · ${world.revelation === 'revealed' ? '已启示' : '静默期'}` : '尚未识别'; setMeter(ui.stableMeter, Math.min(1, settlements.length / 3)); ui.foodPressure.textContent = pct(metrics.foodScarcity); ui.woodPressure.textContent = pct(metrics.woodScarcity); ui.stonePressure.textContent = pct(metrics.stoneScarcity); ui.housingPressure.textContent = pct(metrics.housingPressure); setMeter(ui.foodPressureBar, metrics.foodScarcity); setMeter(ui.woodPressureBar, metrics.woodScarcity); setMeter(ui.stonePressureBar, metrics.stoneScarcity); setMeter(ui.housingPressureBar, metrics.housingPressure); ui.foodSecurity.textContent = pct(metrics.foodSecurity); ui.happiness.textContent = pct(metrics.happiness); const danger = metrics.foodSecurity < 0.38 || metrics.happiness < 0.45; ui.goalState.textContent = danger ? '危机' : settlements.length > 1 ? '多点形成' : '观察中'; ui.goalState.classList.toggle('warning', danger); const pressureText = world.pressureEvent && world.pressureEvent.remainingDays > 0 ? ` 当前压力：${world.pressureEvent.title}（剩余 ${world.pressureEvent.remainingDays.toFixed(1)} 天）` : ''; ui.goalDescription.textContent = `观察居民如何在 Tile 状态、局部机会与神约评价中自行形成聚落。${pressureText}`; ui.pause.textContent = paused ? '▶' : 'Ⅱ'; ui.pause.setAttribute('aria-label', paused ? '继续模拟' : '暂停模拟'); document.querySelectorAll<HTMLButtonElement>('.speed-button').forEach((button) => button.classList.toggle('active', Number(button.dataset.speed) === speed)); updateInspector(); updateEvents(); if (world.status !== 'running' && !endShown) showEnd(); }
function showEnd(): void { endShown = true; paused = true; const won = world.status === 'won'; const prototypeComplete = won && world.turn >= CONFIG.prototypeTurns; ui.endingKicker.textContent = prototypeComplete ? `${CONFIG.prototypeTurns} 回合原型切片完成` : (won ? '结构识别完成' : '系统停止'); ui.endingTitle.textContent = prototypeComplete ? '压力测试完成' : (won ? '结构趋于稳定' : '居民已离开'); ui.endingCopy.textContent = prototypeComplete ? '已完成前两回合观察、后续神谕取舍，以及第五回合压力随机事件。' : (won ? '居民自行建立了可持续的生活秩序。回看叠层、ActionEvent 与世界记录，找出环境变化如何传导到聚落。' : '食物或住房条件未能支撑居民继续留下。重开后可尝试更早观察局部机会与行动承诺。'); ui.endingPop.textContent = `${world.agents.length}`; ui.endingDays.textContent = `${world.elapsedDays.toFixed(1)} 天`; ui.ending.hidden = false; }
function toast(message: string): void { ui.toast.textContent = message; ui.toast.classList.add('show'); window.clearTimeout(toastTimer); toastTimer = window.setTimeout(() => ui.toast.classList.remove('show'), 2200); }
function selectMiracle(value: string | null): void {
  miracle = value;
  targetTile = null;
  const card = value ? oracleCard(value) : undefined;
  world.phase = value ? 'divine-targeting' : (world.phase === 'divine-targeting' ? 'divine' : world.phase);
  ui.oracleHand.querySelectorAll<HTMLButtonElement>('.miracle-button').forEach((button) => button.classList.toggle('active', button.dataset.cardId === miracle));
  el<HTMLButtonElement>('cancel-miracle').classList.toggle('visible', Boolean(miracle));
  ui.confirmMiracle.disabled = true;
  ui.ritualConfirm.disabled = true;
  ui.ritualConfirm.hidden = !value;
  ui.targetPreview.hidden = true;
  ui.ritual.hidden = !value;
  ui.ritual.classList.toggle('targeting', Boolean(value));
  ui.ritualKicker.textContent = '神谕瞄准';
  ui.ritualTitle.textContent = card?.name ?? '神谕';
  ui.ritualCopy.textContent = card ? card.description + '。点击地图选择目标，确认前不会改变世界。' : '';
  ui.ritualOptions.innerHTML = '';
  ui.miracleHint.textContent = card ? '点击地图选择目标并查看直接 Tile 变化' : '选择一张神谕卡';
}
function showCovenantChoices(): void { ui.ritual.hidden = false; ui.ritualConfirm.hidden = true; ui.ritual.classList.remove('targeting'); ui.ritualKicker.textContent = world.revelationCount ? `启示 ${world.revelationCount + 1}` : '静默期结束'; ui.ritualTitle.textContent = world.covenants.length >= 3 ? '替换或保留一条神约' : '选择一条神约'; ui.ritualCopy.textContent = world.covenants.length >= 3 ? '神约槽位已满。先点选要替换的旧约，再选择新约；也可以保留现有三约。' : '居民仍在世界中生活。神约只评价已经发生的 ActionEvent，不会指挥居民。每条神约同时定义神恩与神罚。'; el<HTMLButtonElement>('ritual-cancel').textContent = world.covenants.length >= 3 ? '保留现有三约' : '取消'; const replace = world.covenants.length >= 3 ? `<div class="replace-row">${world.covenants.map((c) => `<button class="ritual-option${replaceCovenant === c.id ? ' selected' : ''}" data-replace="${c.id}"><b>替换：${c.name}</b><small>当前生效</small></button>`).join('')}</div>` : ''; ui.ritualOptions.innerHTML = replace + world.revelationChoices.map((id) => { const definition = COVENANT_POOL.find((item) => item.id === id); const name = definition?.name ?? id; const description = definition?.description ?? '观察一类居民行为。'; const support = definition?.supportBehavior ?? '符合神约的行为'; const strain = definition?.strainBehavior ?? '违背神约的行为'; const reason = definition?.triggerReason ?? '对应 ActionEvent'; const disabled = world.covenants.length >= 3 && !replaceCovenant; return `<button class="ritual-option" data-covenant="${id}" ${disabled ? 'disabled' : ''}><b>${name}</b><small>${description}<br><strong>神恩：</strong>${support}<br><strong>神罚：</strong>${strain}<br>触发依据：${reason}</small></button>`; }).join(''); }
function showDivineChoices(): void { divineChoicesDismissed = false; ui.ritual.hidden = false; ui.ritualConfirm.hidden = true; ui.ritualKicker.textContent = '神之时'; ui.ritualTitle.textContent = '选择一张神谕卡'; ui.ritualCopy.textContent = '从下方手牌选择一张；确认后卡牌进入弃牌堆，本回合最多确认两张。'; ui.ritualOptions.innerHTML = ''; }
function renderOracleHand(): void {
  const hand = world.oracleDeck.hand;
  ui.oracleHandCount.textContent = String(hand.length);
  ui.oracleDeckCount.textContent = String(world.oracleDeck.deck.length);
  ui.oracleDiscardCount.textContent = String(world.oracleDeck.discard.length);
  ui.oracleHand.innerHTML = hand.map((id) => {
    const card = oracleCard(id);
    if (!card) return '';
    const symbol = card.impact === 'moisture' ? '⌁' : card.impact === 'fertility' ? '✚' : card.impact === 'tree' ? '♣' : card.impact === 'water' ? '◌' : card.impact === 'attraction' ? '✦' : card.impact === 'ore' ? '◆' : card.impact === 'fire' ? '♨' : '✧';
    const disabled = world.phase !== 'divine' || world.departureActive || world.oraclePlaysThisTurn >= CONFIG.maxOraclePlaysPerTurn;
    const active = id === miracle ? ' active' : '';
    const target = card.targetRule === 'tile' ? '单格' : '区域';
    const duration = card.duration > 9000 ? '持久' : card.duration + ' 天';
    return '<button class="miracle-button' + active + '" data-card-id="' + card.id + '" title="' + card.description + '" ' + (disabled ? 'disabled' : '') + '><span class="miracle-symbol oracle-symbol">' + symbol + '</span><span><b>' + card.name + '</b><small>' + target + ' · ' + duration + '</small></span></button>';
  }).join('');
}
function updateDivineUI(): void {
  if (world.phase === 'divine' && world.turn !== divineChoicesTurn) { divineChoicesTurn = world.turn; divineChoicesDismissed = false; }
  renderOracleHand();
  const acquisitionCost = getOracleAcquisitionCost(world);
  ui.oraclePower.textContent = String(Math.floor(world.divinePower));
  const canAcquire = world.phase === 'divine' && world.turn > CONFIG.turnsBeforeRevelation && !world.departureActive && !world.oracleAcquiredThisTurn;
  ui.acquireOracle.disabled = !canAcquire || world.divinePower < acquisitionCost;
  ui.acquireOracle.textContent = world.turn <= CONFIG.turnsBeforeRevelation ? '观察期：暂不可获得' : `获取神谕卡 · -${acquisitionCost}`;
  ui.discardOracle.disabled = (world.phase !== 'divine' && world.phase !== 'divine-targeting') || !miracle || world.manualDiscardsThisTurn >= CONFIG.manualDiscardLimit;
  ui.ritualConfirm.disabled = !miracle || !targetTile;
  ui.confirmMiracle.disabled = !miracle || !targetTile;
  if (world.revelationPending && (ui.ritual.hidden || ui.ritualTitle.textContent !== (world.covenants.length >= 3 ? '替换或保留一条神约' : '选择一条神约'))) showCovenantChoices();
  else if (!divineChoicesDismissed && !miracle && world.phase === 'divine' && world.revelation === 'revealed') showDivineChoices();
  else if (world.phase === 'departure') ui.miracleHint.textContent = '离神测试期间神谕已禁用';
  else if (world.turn <= CONFIG.turnsBeforeRevelation) ui.miracleHint.textContent = '前两个回合只观察居民，不提供神谕卡';
  else if (world.revelation === 'silence') ui.miracleHint.textContent = '静默观察：居民先自行生活';
  else if (!miracle && world.phase === 'divine') ui.miracleHint.textContent = world.oraclePlaysThisTurn + '/2 张神谕已确认';
  if (miracle && targetTile) {
    const card = oracleCard(miracle);
    const tile = tileAt(world, targetTile.x, targetTile.z);
    if (!card || !tile) return;
    const area = world.tiles.filter((candidate) => Math.hypot(candidate.x - tile.x, candidate.z - tile.z) <= card.radius);
    const labels: Record<string, string> = { moisture: '湿度与热量', fertility: '肥力', tree: '树木量', water: '水源与湿度', attraction: '定居吸引力', ore: '矿脉量', fire: '火势与灰分', mixed: '树木量与定居吸引力' };
    const label = labels[card.impact] ?? 'Tile 条件';
    ui.targetPreview.hidden = false;
    ui.targetPreview.innerHTML = '<b>' + card.name + ' · 目标地块 (' + tile.x + ', ' + tile.z + ') · ' + area.length + ' 格</b><span>直接改变 ' + label + '</span><small>确认后才消耗这张神谕卡；不会直接增加居民或资源。</small>';
    ui.confirmMiracle.disabled = false;
    ui.ritualConfirm.disabled = false;
  } else {
    ui.targetPreview.hidden = true;
    ui.confirmMiracle.disabled = true;
    ui.ritualConfirm.disabled = true;
  }
  ui.endPhase.hidden = world.phase !== 'divine';
  ui.continueButton.hidden = world.phase !== 'resolution';
  ui.continueButton.textContent = world.departureActive ? '继续离神测试' : '进入下一阶段';
}
function restart(): void { world = createWorld(); divineChoicesDismissed = false; divineChoicesTurn = 0; selectedAgent = world.selectedAgentId; selectedTile = null; tileSelection.visible = false; paused = false; speed = 1; endShown = false; ui.ending.hidden = true; for (const group of buildingMeshes.values()) buildingRoot.remove(group); buildingMeshes.clear(); for (const group of agentMeshes.values()) agentRoot.remove(group); agentMeshes.clear(); for (const mesh of effectMeshes) effectRoot.remove(mesh); effectMeshes.length = 0; tileMeshes.forEach((mesh) => tileRoot.remove(mesh)); tileMeshes.length = 0; baseColors.length = 0; refreshTiles(); syncBuildings(); syncAgents(performance.now()); selectMiracle(null); updateHUD(); toast('新的观察开始了。看看居民会如何回应环境。'); }
function setOverlay(next: OverlayKind): void { overlay = next; document.querySelectorAll<HTMLButtonElement>('.overlay-button').forEach((button) => button.classList.toggle('active', button.dataset.overlay === overlay)); const legend: Record<OverlayKind, [string, string]> = { none: ['普通土地 · 肥沃地 · 森林 · 石矿 · 水源', 'linear-gradient(90deg,#71855c,#b1c27c,#435d43,#4b9197)'], moisture: ['蓝色越亮 = 湿度越高 · 过湿区域通行成本上升', 'linear-gradient(90deg,#4e6d59,#5ca7b4,#b7d8d2)'], heat: ['橙色越亮 = 热量越高 · 高热会加快蒸发', 'linear-gradient(90deg,#566f5d,#d09a63,#d65e4f)'], fertility: ['浅绿越亮 = 土地潜在肥力越高', 'linear-gradient(90deg,#566f5d,#b7d67e)'], attraction: ['浅绿越亮 = 居民定居偏好越高', 'linear-gradient(90deg,#4f6854,#b3d29b)'], treeDensity: ['深绿越亮 = TreeAmount 越高', 'linear-gradient(90deg,#71855c,#234d36)'], landUse: ['棕色 = Farmland · 粉色 = Construction', 'linear-gradient(90deg,#71855c,#c79b5e,#d09b9b)'], farmSuitability: ['金色越亮 = FarmSuitability · Derived', 'linear-gradient(90deg,#71855c,#e0c66c)'], settlementValue: ['紫色越亮 = SettlementValue · Derived', 'linear-gradient(90deg,#71855c,#c18ab9)'], residentDensity: ['橙色越亮 = 居民密度', 'linear-gradient(90deg,#71855c,#e6a060)'] }; ui.legendLabel.textContent = legend[overlay][0]; ui.legendSwatch.style.background = legend[overlay][1]; refreshTiles(); }

function worldPoint(event: PointerEvent | WheelEvent): THREE.Vector3 | null { const rect = renderer.domElement.getBoundingClientRect(); pointer.set(((event.clientX - rect.left) / rect.width) * 2 - 1, -((event.clientY - rect.top) / rect.height) * 2 + 1); raycaster.setFromCamera(pointer, camera); return raycaster.ray.intersectPlane(groundPlane, new THREE.Vector3()); }
function mapTile(point: THREE.Vector3): { x: number; z: number } { return { x: Math.max(0, Math.min(29, Math.round(point.x + 14.5))), z: Math.max(0, Math.min(29, Math.round(point.z + 14.5))) }; }
function findAgent(event: PointerEvent): Agent | undefined { const rect = renderer.domElement.getBoundingClientRect(); pointer.set(((event.clientX - rect.left) / rect.width) * 2 - 1, -((event.clientY - rect.top) / rect.height) * 2 + 1); raycaster.setFromCamera(pointer, camera); const hits = raycaster.intersectObjects(agentRoot.children, true); for (const hit of hits) { let object: THREE.Object3D | null = hit.object; while (object && object !== agentRoot) { const id = object.userData.agentId as number | undefined; if (id) return world.agents.find((agent) => agent.id === id); object = object.parent; } } return undefined; }
function pan(event: PointerEvent): void { const dx = event.clientX - panLast.x; const dy = event.clientY - panLast.y; panLast = { x: event.clientX, y: event.clientY }; const unit = (camera.top - camera.bottom) / renderer.domElement.clientHeight; const right = new THREE.Vector3().setFromMatrixColumn(camera.matrixWorld, 0); const up = new THREE.Vector3().setFromMatrixColumn(camera.matrixWorld, 1); right.y = 0; up.y = 0; right.normalize(); up.normalize(); const shift = right.multiplyScalar(-dx * unit).add(up.multiplyScalar(dy * unit)); camera.position.add(shift); cameraTarget.add(shift); camera.lookAt(cameraTarget); }
function resize(): void { const width = Math.max(1, ui.scene.clientWidth); const height = Math.max(1, ui.scene.clientHeight); const aspect = width / height; camera.left = -19 * aspect; camera.right = 19 * aspect; camera.top = 19; camera.bottom = -19; camera.updateProjectionMatrix(); renderer.setSize(width, height, false); }

renderer.domElement.addEventListener('pointerdown', (event) => { if (event.button === 2 || event.button === 1) { panId = event.pointerId; panLast = { x: event.clientX, y: event.clientY }; renderer.domElement.setPointerCapture(event.pointerId); event.preventDefault(); return; } if (event.button !== 0) return; const point = worldPoint(event); if (miracle) { if (!point) return; const tile = mapTile(point); targetTile = tile; selectedTile = tileAt(world, tile.x, tile.z) ?? null; tileSelection.visible = Boolean(selectedTile); updateDivineUI(); return; } if (world.phase === 'revelation' || world.phase === 'divine') return; const agent = findAgent(event); selectedAgent = agent?.id ?? null; world.selectedAgentId = selectedAgent; if (!agent && point) { const tile = mapTile(point); selectedTile = tileAt(world, tile.x, tile.z) ?? null; tileSelection.visible = Boolean(selectedTile); } updateInspector(); });
renderer.domElement.addEventListener('pointermove', (event) => { if (panId === event.pointerId) pan(event); }); renderer.domElement.addEventListener('pointerup', (event) => { if (panId === event.pointerId) { panId = null; if (renderer.domElement.hasPointerCapture(event.pointerId)) renderer.domElement.releasePointerCapture(event.pointerId); } }); renderer.domElement.addEventListener('contextmenu', (event) => event.preventDefault()); renderer.domElement.addEventListener('wheel', (event) => { event.preventDefault(); camera.zoom = THREE.MathUtils.clamp(camera.zoom * (event.deltaY > 0 ? 0.91 : 1.1), 0.68, 1.7); camera.updateProjectionMatrix(); }, { passive: false }); window.addEventListener('resize', resize);
document.querySelectorAll<HTMLButtonElement>('.overlay-button').forEach((button) => button.addEventListener('click', () => setOverlay(button.dataset.overlay as OverlayKind)));
ui.oracleHand.addEventListener('click', (event) => { const button = (event.target as HTMLElement).closest<HTMLButtonElement>('[data-card-id]'); if (button && !button.disabled) selectMiracle(button.dataset.cardId ?? null); });
ui.ritualOptions.addEventListener('click', (event) => { const button = (event.target as HTMLElement).closest<HTMLButtonElement>('button'); if (!button) return; if (button.dataset.replace) { replaceCovenant = button.dataset.replace; showCovenantChoices(); return; } if (button.dataset.covenant) { const result = chooseCovenant(world, button.dataset.covenant, replaceCovenant ?? undefined); if (result.ok) { replaceCovenant = null; ui.ritual.hidden = true; toast(result.message); updateHUD(); } else toast(result.message); return; } if (button.dataset.miracleChoice) selectMiracle(button.dataset.miracleChoice as MiracleKind); });
el<HTMLButtonElement>('ritual-cancel').addEventListener('click', () => { if (world.revelationPending && world.covenants.length >= 3) { retainCovenants(world); ui.ritual.hidden = true; replaceCovenant = null; toast('保留现有三条神约。'); updateHUD(); } });
function confirmSelectedMiracle(): void { if (!miracle || !targetTile) return; const result = playOracle(world, miracle, targetTile.x, targetTile.z); if (result.ok) { ui.ritual.hidden = true; world.phase = world.phase === 'departure' ? 'departure' : 'divine'; targetTile = null; miracle = null; ui.ritualConfirm.disabled = true; ui.confirmMiracle.disabled = true; toast(result.message); updateHUD(); } else toast(result.message); }
ui.endPhase.addEventListener('click', () => { const result = endDivinePhase(world); if (result.ok) { ui.ritual.hidden = true; miracle = null; targetTile = null; toast(result.message); updateHUD(); } else toast(result.message); });
ui.continueButton.addEventListener('click', () => { const result = advanceFromResolution(world); if (result.ok) { toast(result.message); updateHUD(); } else toast(result.message); });
ui.confirmMiracle.addEventListener('click', confirmSelectedMiracle);
ui.ritualConfirm.addEventListener('click', confirmSelectedMiracle);
ui.acquireOracle.addEventListener('click', () => { const result = acquireOracle(world); toast(result.message); if (result.ok) updateHUD(); });
ui.discardOracle.addEventListener('click', () => { if (!miracle) return; const result = discardOracle(world, miracle); if (result.ok) { selectMiracle(null); toast(result.message); updateHUD(); } else toast(result.message); });
el<HTMLButtonElement>('cancel-miracle').addEventListener('click', () => { miracle = null; targetTile = null; world.phase = 'divine'; el<HTMLButtonElement>('cancel-miracle').classList.remove('visible'); ui.ritual.classList.remove('targeting'); ui.ritual.hidden = false; showDivineChoices(); updateDivineUI(); }); el<HTMLButtonElement>('ritual-cancel').addEventListener('click', () => { if (world.revelationPending) return; divineChoicesDismissed = true; miracle = null; targetTile = null; world.phase = 'divine'; el<HTMLButtonElement>('cancel-miracle').classList.remove('visible'); ui.ritual.hidden = true; ui.ritual.classList.remove('targeting'); updateDivineUI(); }); el<HTMLButtonElement>('restart-button').addEventListener('click', restart); el<HTMLButtonElement>('ending-restart').addEventListener('click', restart); ui.pause.addEventListener('click', () => { paused = !paused; updateHUD(); }); document.querySelectorAll<HTMLButtonElement>('.speed-button').forEach((button) => button.addEventListener('click', () => { speed = Number(button.dataset.speed) || 1; updateHUD(); }));
window.addEventListener('keydown', (event) => { if (event.code === 'Space' && !world.revelationPending && world.phase !== 'divine-targeting' && world.phase !== 'divine') { event.preventDefault(); paused = !paused; updateHUD(); } const keys: Record<string, OverlayKind> = { F1: 'moisture', F2: 'heat', F3: 'fertility', F4: 'attraction' }; if (keys[event.key]) setOverlay(keys[event.key]); if (event.key === 'Escape' && !world.revelationPending) { divineChoicesDismissed = true; miracle = null; targetTile = null; world.phase = 'divine'; el<HTMLButtonElement>('cancel-miracle').classList.remove('visible'); ui.ritual.hidden = true; ui.ritual.classList.remove('targeting'); updateDivineUI(); } });
Object.assign(window, { __settlementDebug: { snapshot: () => ({ day: world.elapsedDays, status: world.status, phase: world.phase, turn: world.turn, prototypeTurns: CONFIG.prototypeTurns, population: world.agents.length, resources: { ...world.resources }, divinePower: world.divinePower, oracleAcquiredThisTurn: world.oracleAcquiredThisTurn, oracleDeck: world.oracleDeck, pressureEvent: world.pressureEvent, revelation: world.revelation, covenants: world.covenants, turnSummaries: world.turnSummaries, settlements: getSettlements(world), buildings: world.buildings.map(({ id, kind, x, z }) => ({ id, kind, x, z })), jobs: world.agents.reduce<Record<string, number>>((counts, agent) => { counts[agent.currentAction] = (counts[agent.currentAction] ?? 0) + 1; return counts; }, {}), events: world.events.map(({ title, detail }) => ({ title, detail })), actionEvents: world.actionEvents.slice(0, 32), metrics: getMetrics(world), tiles: world.tiles.map(({ x, z, moisture, heat, fertility, treeAmount, landUse, structureRef, attraction, waterSource, fireLevel }) => ({ x, z, moisture, heat, fertility, treeAmount, landUse, structureRef, attraction, waterSource, fireLevel })) }), inspectTile: (x: number, z: number) => { const tile = tileAt(world, x, z); return tile ? { tile, derived: getTileDerived(world, tile) } : null; }, selectAgent: (id: number) => { selectedAgent = id; world.selectedAgentId = id; updateHUD(); }, miracle: (kind: MiracleKind, x: number, z: number) => castMiracle(world, kind, x, z), restart } });

refreshTiles(); syncBuildings(); syncAgents(performance.now()); setOverlay('none'); resize(); updateHUD();
window.setInterval(updateDivineUI, 250);
window.setInterval(() => { const action = el<HTMLButtonElement>('ritual-cancel'); if (world.revelationPending) { action.disabled = world.covenants.length < 3; action.textContent = world.covenants.length >= 3 ? '保留现有三约' : '取消'; } else if (world.phase === 'divine') { action.disabled = false; action.textContent = '取消'; } }, 250);
function animate(now: number): void { requestAnimationFrame(animate); const delta = Math.min(0.15, Math.max(0, (now - lastFrame) / 1000)); lastFrame = now; if (!paused) stepWorld(world, delta, speed); syncAgents(now); syncEffects(); hudTimer += delta; mapTimer += delta; if (hudTimer > 0.25) { hudTimer = 0; updateHUD(); } if (mapTimer > 0.4) { mapTimer = 0; syncBuildings(); refreshTiles(); } renderer.render(scene, camera); }
requestAnimationFrame(animate);


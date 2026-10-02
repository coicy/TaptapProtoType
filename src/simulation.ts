export const CONFIG = {
  worldSize: 30,
  startingPopulation: 12,
  populationLimit: 50,
  secondsPerDay: 12,
  mortalPhaseSeconds: 15,
  turnsBeforeRevelation: 2,
  prototypeTurns: 12,
  pressureEventTurn: 5,
  pressureEventDays: 4,
  oracleAcquireCostBase: 4,
  oracleAcquireCostStep: 1,
  departureTurns: 3,
  maxOraclePlaysPerTurn: 2,
  manualDiscardLimit: 1,
  movementPerDay: 12,
  thinkEveryDays: 0.18,
  foodPerPersonDay: 0.38,
  hungerPerDay: 0.48,
  mealFood: 0.48,
  mealRelief: 0.78,
  farmFoodPerWorkerDay: 2.05,
  woodPerWorkerDay: 0.68,
  stonePerWorkerDay: 0.5,
  forestUsePerWood: 0.12,
  stoneUsePerUnit: 0.1,
  growthDays: 4.5,
  starvationGraceDays: 3.5,
  stableDaysToWin: 3,
  stablePopulationGoal: 25,
  powerPerDay: 1.65,
  miracleRadius: 3.2,
  miracleDays: 7,
  distancePenalty: 1.35,
  searchRadius: 10,
  actionCommitment: 13,
  switchCost: 7,
  ageOfSilenceSeconds: 65,
  firstRevelationPopulation: 8,
  laterRevelationPopulation: 18,
  laterRevelationSettlements: 2,
  laterRevelationCooldownSeconds: 90,
  environment: {
    moistureOptimalMin: 0.2,
    moistureOptimalMax: 0.7,
    heatOptimalMin: 0.25,
    heatOptimalMax: 0.68,
    rainAmount: 0.34,
    sunHeatAmount: 0.3,
    sunMoistureLoss: 0.14,
    springMoistureRecovery: 0.055,
    springAttraction: 0.12,
    oracleAmount: 0.58,
    oracleDecayPerDay: 0.008,
    moistureEvaporation: 0.008,
    vegetationRecovery: 0.09,
  },
  buildingCosts: {
    house: { wood: 6, stone: 1 },
    farm: { wood: 5, stone: 1 },
    lumber: { wood: 5, stone: 1 },
    quarry: { wood: 4, stone: 2 },
  },
} as const;

export type ResourceKind = 'food' | 'wood' | 'stone';
export type Terrain = 'grass' | 'fertile' | 'forest' | 'stone' | 'water';
export type BuildingKind = 'house' | 'farm' | 'lumber' | 'quarry' | 'storage';
export type MiracleKind = 'rain' | 'spring' | 'drought' | 'barren' | 'fire';
export type RevelationChoice = 'turn-start' | 'divine' | 'mortal' | 'resolution' | 'revelation' | 'divine-targeting' | 'departure';
export type OverlayKind = 'none' | 'moisture' | 'heat' | 'fertility' | 'attraction' | 'treeDensity' | 'landUse' | 'farmSuitability' | 'settlementValue' | 'residentDensity';
export type Action = 'eat' | 'farm' | 'chop' | 'mine' | 'buildHouse' | 'buildFarm' | 'buildLumber' | 'buildQuarry' | 'rest' | 'migrate';
export type WorkAction = Exclude<Action, 'migrate'>;
export type LandUse = 'none' | 'farmland' | 'construction';
export type ActionType = 'eat' | 'farmWork' | 'harvest' | 'createFarmland' | 'chopWood' | 'buildHouse' | 'buildFarm' | 'buildLumber' | 'buildQuarry' | 'migrate';

export interface TileEffect {
  kind: 'spring' | 'barren' | 'rain' | 'drought' | 'fire';
  magnitude: number;
  remainingDays: number;
}

export interface Tile {
  x: number;
  z: number;
  terrain: Terrain;
  fertility: number;
  baseFertility: number;
  moisture: number;
  baseMoisture: number;
  heat: number;
  baseHeat: number;
  treeAmount: number;
  baseTreeAmount: number;
  ore: number;
  landUse: LandUse;
  structureRef: number | null;
  effects: TileEffect[];
  attraction: number;
  baseAttraction: number;
  waterSource: number;
  oracleBoost: number;
  fireLevel: number;
}

export interface Target {
  x: number;
  z: number;
  label: string;
}

export interface Building {
  id: number;
  kind: BuildingKind;
  x: number;
  z: number;
  capacity: number;
}

export interface Agent {
  id: number;
  name: string;
  x: number;
  z: number;
  hunger: number;
  starvationDays: number;
  homeId: number;
  currentJob: string;
  currentAction: Action;
  currentTarget: Target;
  utilityScores: Record<WorkAction, number>;
  utilityReasons: Record<WorkAction, string[]>;
  knownCandidates: Target[];
  actionCommitment: number;
  switchCost: number;
  actionEventProgress: number;
  thinkIn: number;
  buildProgress: number;
  buildKind: BuildingKind | null;
  lastMigrationDay: number;
}

export interface GameEvent {
  id: number;
  day: number;
  title: string;
  detail: string;
  tone: 'good' | 'warning' | 'neutral';
}

export interface ActionEvent {
  id: number;
  actorRef: number;
  actionType: ActionType;
  tileCoord: { x: number; z: number };
  targetRef?: number;
  amount?: number;
  contextSnapshot?: Record<string, number | string | boolean>;
  simTime: number;
  covenantFeedback?: string[];
}

export interface Covenant {
  id: string;
  name: string;
  description: string;
  active: boolean;
  supportOn: ActionType[];
  strainOn: ActionType[];
  supportBehavior: string;
  strainBehavior: string;
  triggerReason: string;
  condition?: CovenantDefinition['condition'];
}

export interface CovenantDefinition extends Covenant {
  condition: 'always' | 'dense-forest' | 'near-water' | 'low-population' | 'far-from-settlement';
}

export interface SettlementView {
  id: string;
  center: { x: number; z: number };
  population: number;
  housing: number;
  activity: number;
}

export interface MiracleEffect {
  kind: MiracleKind;
  x: number;
  z: number;
  radius: number;
  remainingDays: number;
}

export type OracleTargetRule = 'tile' | 'area';
export type OracleImpact = 'moisture' | 'fertility' | 'tree' | 'water' | 'attraction' | 'ore' | 'fire' | 'mixed';
export interface OracleCard {
  id: string;
  name: string;
  targetRule: OracleTargetRule;
  radius: number;
  magnitude: number;
  duration: number;
  effectKind: MiracleKind;
  impact: OracleImpact;
  description: string;
}
export interface OracleDeckState {
  deck: string[];
  hand: string[];
  discard: string[];
}
export interface TurnSummary {
  turn: number;
  metricsBefore: WorldMetrics;
  metricsAfter: WorldMetrics;
  tileChanges: string[];
  residentChanges: string[];
  civilizationChanges: string[];
  covenantChanges: string[];
  pressureEvents: string[];
  causalChain: string;
  verdict: 'running' | 'maintain' | 'collapse';
}

export interface PressureEvent {
  turn: number;
  id: string;
  title: string;
  detail: string;
  remainingDays: number;
  foodProductionMultiplier: number;
  foodConsumptionMultiplier: number;
  woodProductionMultiplier: number;
  forestRecoveryMultiplier: number;
}

export interface TileDerived {
  moistureModifier: number;
  heatModifier: number;
  farmEfficiency: number;
  movementCost: number;
  vegetationRecovery: number;
  jobOpportunity: number;
  settlementPreference: number;
  farmSuitability: number;
  forestryValue: number;
  settlementValue: number;
}

export interface World {
  seed: number;
  tiles: Tile[];
  agents: Agent[];
  buildings: Building[];
  resources: Record<ResourceKind, number>;
  initialForest: number;
  divinePower: number;
  turn: number;
  turnElapsedSeconds: number;
  oraclePlaysThisTurn: number;
  manualDiscardsThisTurn: number;
  oracleAcquiredThisTurn: boolean;
  oracleDeck: OracleDeckState;
  turnActionEventStart: number;
  turnMetricsBefore: WorldMetrics | null;
  turnSummaries: TurnSummary[];
  lastSummary: TurnSummary | null;
  pressureEvent: PressureEvent | null;
  departureTurnsRemaining: number;
  departureActive: boolean;
  elapsedDays: number;
  elapsedSeconds: number;
  nextAgentId: number;
  nextBuildingId: number;
  nextEventId: number;
  nextActionEventId: number;
  nextPopulationAt: number;
  growthProgress: number;
  stableProgress: number;
  status: 'running' | 'won' | 'lost';
  selectedAgentId: number | null;
  overlay: OverlayKind;
  effects: MiracleEffect[];
  events: GameEvent[];
  actionEvents: ActionEvent[];
  covenants: Covenant[];
  revelation: 'silence' | 'revealed';
  phase: RevelationChoice;
  revelationChoices: string[];
  revelationCount: number;
  revelationPending: boolean;
  nextRevelationSeconds: number;
  foodShortageActive: boolean;
  woodShortageActive: boolean;
  loggedClusters: Set<string>;
  loggedForestLoss: boolean;
  lastFoodShortageDay: number;
}

export interface WorldMetrics {
  population: number;
  housing: number;
  housingCoverage: number;
  foodSecurity: number;
  foodScarcity: number;
  woodScarcity: number;
  stoneScarcity: number;
  housingPressure: number;
  happiness: number;
  averageHunger: number;
  forestRemaining: number;
  forestInitial: number;
  averageMoisture: number;
  averageHeat: number;
  averageFertility: number;
  averageFarmEfficiency: number;
}

const NAMES = ['阿禾', '南星', '小满', '青禾', '远山', '溪月', '陶然', '林间', '安宁', '知秋', '石生', '云舟', '白露', '谷雨', '木棉', '清和', '朝露', '晚风', '田田', '野渡', '松果', '麦芽', '星野', '山岚', '初禾', '长青', '秋实', '一苇', '牧歌', '飞鸟', '月白', '苔生', '渡川', '禾苗', '听泉', '风荷', '照野', '拾光', '北辰', '向晚', '春山', '素问', '知微', '望舒', '木兰', '平安', '鸣沙', '新雨', '临川', '栖云'];

const ACTION_LABELS: Record<WorkAction, string> = {
  eat: '进食', farm: '务农', chop: '伐木', mine: '采石', buildHouse: '建造住宅',
  buildFarm: '修建农场', buildLumber: '修建伐木营地', buildQuarry: '修建采石场', rest: '休息',
};

const clamp = (value: number, min = 0, max = 1): number => Math.max(min, Math.min(max, value));
const distance = (ax: number, az: number, bx: number, bz: number): number => Math.hypot(ax - bx, az - bz);
const round = (value: number): number => Math.round(value * 10) / 10;
const emptyScores = (): Record<WorkAction, number> => ({ eat: 0, farm: 0, chop: 0, mine: 0, buildHouse: 0, buildFarm: 0, buildLumber: 0, buildQuarry: 0, rest: 0 });
const emptyReasons = (): Record<WorkAction, string[]> => ({ eat: [], farm: [], chop: [], mine: [], buildHouse: [], buildFarm: [], buildLumber: [], buildQuarry: [], rest: [] });

function random(world: World): number {
  world.seed = (Math.imul(world.seed, 1664525) + 1013904223) >>> 0;
  return world.seed / 4294967296;
}

export function tileAt(world: World, x: number, z: number): Tile | undefined {
  const ix = Math.max(0, Math.min(CONFIG.worldSize - 1, Math.round(x)));
  const iz = Math.max(0, Math.min(CONFIG.worldSize - 1, Math.round(z)));
  return world.tiles[iz * CONFIG.worldSize + ix];
}

export interface IResourceStore {
  get(kind: ResourceKind): number;
  add(kind: ResourceKind, amount: number): void;
  spend(kind: ResourceKind, amount: number): boolean;
  has(cost: Partial<Record<ResourceKind, number>>): boolean;
}

export class GlobalResourceStore implements IResourceStore {
  constructor(private readonly world: World) {}
  get(kind: ResourceKind): number { return this.world.resources[kind]; }
  add(kind: ResourceKind, amount: number): void { this.world.resources[kind] += amount; }
  spend(kind: ResourceKind, amount: number): boolean {
    if (this.world.resources[kind] < amount) return false;
    this.world.resources[kind] -= amount;
    return true;
  }
  has(cost: Partial<Record<ResourceKind, number>>): boolean {
    return Object.entries(cost).every(([kind, amount]) => this.get(kind as ResourceKind) >= (amount ?? 0));
  }
}

export interface IWorldQuery {
  findTiles(center: { x: number; z: number }, radius: number, predicate?: (tile: Tile) => boolean): Tile[];
  findNearest(center: { x: number; z: number }, predicate: (tile: Tile) => boolean): Tile | undefined;
  aggregateNeighborhood(center: { x: number; z: number }, radius: number): { fertility: number; moisture: number; treeAmount: number; residents: number };
  findNearestResource(center: { x: number; z: number }, kind: 'farm' | 'forest' | 'ore'): Tile | undefined;
}

export class WorldQuery implements IWorldQuery {
  constructor(private readonly world: World) {}
  findTiles(center: { x: number; z: number }, radius: number, predicate?: (tile: Tile) => boolean): Tile[] {
    return this.world.tiles.filter((tile) => distance(center.x, center.z, tile.x, tile.z) <= radius && (!predicate || predicate(tile)));
  }
  findNearest(center: { x: number; z: number }, predicate: (tile: Tile) => boolean): Tile | undefined {
    return this.world.tiles.filter(predicate).sort((a, b) => distance(center.x, center.z, a.x, a.z) - distance(center.x, center.z, b.x, b.z))[0];
  }
  aggregateNeighborhood(center: { x: number; z: number }, radius: number): { fertility: number; moisture: number; treeAmount: number; residents: number } {
    const tiles = this.findTiles(center, radius);
    const count = Math.max(1, tiles.length);
    const residents = this.world.agents.filter((agent) => distance(center.x, center.z, agent.x, agent.z) <= radius).length;
    return {
      fertility: tiles.reduce((sum, tile) => sum + tile.fertility, 0) / count,
      moisture: tiles.reduce((sum, tile) => sum + tile.moisture, 0) / count,
      treeAmount: tiles.reduce((sum, tile) => sum + tile.treeAmount, 0) / count,
      residents,
    };
  }
  findNearestResource(center: { x: number; z: number }, kind: 'farm' | 'forest' | 'ore'): Tile | undefined {
    return this.findNearest(center, (tile) => {
      const amount = kind === 'farm' ? tile.fertility : kind === 'forest' ? tile.treeAmount : tile.ore;
      return amount >= (kind === 'farm' ? 0.3 : 0.03);
    });
  }
}

export class DerivedValueService {
  constructor(private readonly world: World) {}
  get(tile: Tile): TileDerived { return getTileDerived(this.world, tile); }
}

export const getWorldQuery = (world: World): IWorldQuery => new WorldQuery(world);
export const getResourceStore = (world: World): IResourceStore => new GlobalResourceStore(world);

export const COVENANT_POOL: CovenantDefinition[] = [
  { id: 'harvest', name: '丰收之约', description: '土地被照料并完成收获时得到回应；反复开垦、透支土地会受到反制。', active: true, supportOn: ['farmWork', 'harvest'], strainOn: ['createFarmland'], supportBehavior: '照料农田并完成收获', strainBehavior: '在已有耕地上反复开垦', triggerReason: '农务、收获与开垦 ActionEvent', condition: 'always' },
  { id: 'forest', name: '林下之约', description: '建立可持续取木的秩序时得到回应；在密林中持续砍伐会受到反制。', active: true, supportOn: ['buildLumber'], strainOn: ['chopWood'], supportBehavior: '建立并维护伐木营地', strainBehavior: '在高树木量区域持续伐木', triggerReason: '伐木营地与高树木量地区的伐木', condition: 'dense-forest' },
  { id: 'wayfarer', name: '远行之约', description: '居民主动寻找合适的新居时得到回应；人口尚少时盲目扩建会受到反制。', active: true, supportOn: ['migrate'], strainOn: ['buildHouse'], supportBehavior: '自主迁往更合适的住所', strainBehavior: '低人口阶段继续建造住宅', triggerReason: '迁居与低人口阶段的住宅建设', condition: 'low-population' },
  { id: 'watershed', name: '水脉之约', description: '在水源附近耕作与收获时得到回应；破坏河岸林地会受到反制。', active: true, supportOn: ['farmWork', 'harvest'], strainOn: ['chopWood'], supportBehavior: '在水源附近耕作并完成收获', strainBehavior: '在水源附近砍伐林地', triggerReason: '近水地块上的农务、收获与伐木', condition: 'near-water' },
  { id: 'frontier', name: '边地之约', description: '在远离旧聚落的地方建立可居住结构时得到回应；无序迁徙会受到反制。', active: true, supportOn: ['buildHouse'], strainOn: ['migrate'], supportBehavior: '在远离聚落的地方建成住宅', strainBehavior: '在边地持续迁徙而不建立住所', triggerReason: '远地住宅与边地迁徙 ActionEvent', condition: 'far-from-settlement' },
];

export const ORACLE_POOL: OracleCard[] = [
  { id: 'oracle-rain', name: '微雨', targetRule: 'area', radius: 2.4, magnitude: 0.16, duration: 3, effectKind: 'rain', impact: 'moisture', description: '小范围提高湿度' },
  { id: 'oracle-soil', name: '润土', targetRule: 'area', radius: 2.4, magnitude: 0.18, duration: 4, effectKind: 'rain', impact: 'fertility', description: '恢复土地肥力，让低效农田重新有机会' },
  { id: 'oracle-grove', name: '林木滋养', targetRule: 'area', radius: 2.4, magnitude: 0.2, duration: 4, effectKind: 'spring', impact: 'tree', description: '提高区域树木量，延缓森林损耗' },
  { id: 'oracle-rainfall', name: '甘霖', targetRule: 'area', radius: 3.2, magnitude: 0.34, duration: 7, effectKind: 'rain', impact: 'moisture', description: '显著提高区域湿度，回应旱风压力' },
  { id: 'oracle-spring', name: '圣泉', targetRule: 'tile', radius: 0, magnitude: 1, duration: 9999, effectKind: 'spring', impact: 'water', description: '创建持续水源，改变一块土地的定居条件' },
  { id: 'oracle-wind', name: '热风', targetRule: 'area', radius: 2.4, magnitude: 0.12, duration: 3, effectKind: 'drought', impact: 'moisture', description: '小范围降低湿度并抬高热量' },
  { id: 'oracle-blight', name: '枯萎', targetRule: 'area', radius: 2.4, magnitude: 0.18, duration: 4, effectKind: 'barren', impact: 'fertility', description: '降低肥力，制造短期农作压力' },
  { id: 'oracle-thorn', name: '荆棘', targetRule: 'area', radius: 2.4, magnitude: 0.16, duration: 4, effectKind: 'drought', impact: 'attraction', description: '降低区域吸引力，让迁居与通勤更困难' },
  { id: 'oracle-drought', name: '干旱', targetRule: 'area', radius: 3.2, magnitude: 0.24, duration: 7, effectKind: 'drought', impact: 'moisture', description: '显著降低湿度并升高热量，制造持续农作压力' },
  { id: 'oracle-lightning', name: '雷罚', targetRule: 'tile', radius: 0, magnitude: 1, duration: 3, effectKind: 'fire', impact: 'fire', description: '击中一块土地；干燥时引发火势，燃烧后的灰分会改变肥力' },
  { id: 'oracle-waystone', name: '立路石', targetRule: 'tile', radius: 0, magnitude: 0.28, duration: 6, effectKind: 'spring', impact: 'attraction', description: '提高一块土地的定居吸引力，引导居民靠近' },
  { id: 'oracle-vein', name: '显脉', targetRule: 'area', radius: 2.4, magnitude: 0.24, duration: 5, effectKind: 'spring', impact: 'ore', description: '显露区域矿脉，为采石提供新的局部机会' },
  { id: 'oracle-sanctuary', name: '庇林', targetRule: 'area', radius: 2.4, magnitude: 0.18, duration: 5, effectKind: 'spring', impact: 'mixed', description: '同时提高林地恢复与定居吸引力' },
];

export function oracleCard(id: string): OracleCard | undefined { return ORACLE_POOL.find((card) => card.id === id); }

function covenantAvailable(world: World, covenant: CovenantDefinition): boolean {
  if (covenant.condition === 'always' || covenant.condition === 'low-population') return true;
  if (covenant.condition === 'dense-forest') return world.tiles.some((tile) => tile.treeAmount > 0.7);
  if (covenant.condition === 'near-water') return world.tiles.some((tile) => tile.waterSource > 0);
  return getSettlements(world).length < 2;
}

function prepareDivineTurn(world: World): void {
  world.turnActionEventStart = world.nextActionEventId;
  world.turnMetricsBefore = getMetrics(world);
  world.oraclePlaysThisTurn = 0;
  world.manualDiscardsThisTurn = 0;
  world.oracleAcquiredThisTurn = false;
}

export function chooseCovenant(world: World, covenantId: string, replaceId?: string): { ok: boolean; message: string } {
  if (!world.revelationPending || !world.revelationChoices.includes(covenantId)) return { ok: false, message: '这条神约不在当前启示候选中。' };
  if (world.covenants.length >= 3) {
    if (!replaceId || !world.covenants.some((item) => item.id === replaceId)) return { ok: false, message: '请选择要替换的旧神约。' };
    world.covenants = world.covenants.filter((item) => item.id !== replaceId);
  }
  const definition = COVENANT_POOL.find((item) => item.id === covenantId);
  if (!definition) return { ok: false, message: '神约定义不存在。' };
  world.covenants.push({ ...definition, supportOn: [...definition.supportOn], strainOn: [...definition.strainOn] });
  world.revelationPending = false;
  world.phase = 'divine';
  prepareDivineTurn(world);
  world.revelation = 'revealed';
  world.revelationCount += 1;
  world.nextRevelationSeconds = world.elapsedSeconds + CONFIG.laterRevelationCooldownSeconds;
  logEvent(world, `神约生效：${definition.name}`, `${definition.description} 觸发依据：${definition.triggerReason}。`, 'good');
  return { ok: true, message: `${definition.name} 已生效。` };
}

export function retainCovenants(world: World): void {
  if (!world.revelationPending || world.covenants.length < 3) return;
  world.revelationPending = false;
  world.phase = 'divine';
  prepareDivineTurn(world);
  world.revelation = 'revealed';
  world.revelationCount += 1;
  world.nextRevelationSeconds = world.elapsedSeconds + CONFIG.laterRevelationCooldownSeconds;
  logEvent(world, '保留现有神约', '本次启示未更换神约，居民继续依照现有神约生活。', 'neutral');
}

function openRevelation(world: World): void {
  const available = COVENANT_POOL.filter((item) => !world.covenants.some((active) => active.id === item.id) && covenantAvailable(world, item));
  world.revelationChoices = available.slice(0, 3).map((item) => item.id);
  if (!world.revelationChoices.length) return;
  world.revelationPending = true;
  world.phase = 'revelation';
  logEvent(world, world.revelationCount === 0 ? '启示降临：请立下第一条神约' : '新的启示降临', '居民仍在世界中生活；选择一条神约后模拟会继续。', 'neutral');
}

function triggerPressureEvent(world: World): void {
  if (world.turn !== CONFIG.pressureEventTurn || world.pressureEvent) return;
  const events: Array<Omit<PressureEvent, 'turn' | 'remainingDays'>> = [
    { id: 'dry-season', title: '压力事件：旱风', detail: '热风掠过聚落，所有土地失去湿度并升高热量；农作减产，食物消耗暂时增加。', foodProductionMultiplier: 0.48, foodConsumptionMultiplier: 1.18, woodProductionMultiplier: 1, forestRecoveryMultiplier: 1 },
    { id: 'grain-blight', title: '压力事件：粮食疫病', detail: '储粮受到污染，食物储备减少且农作减产；居民必须在短期内补上缺口。', foodProductionMultiplier: 0.58, foodConsumptionMultiplier: 1.22, woodProductionMultiplier: 1, forestRecoveryMultiplier: 1 },
    { id: 'forest-storm', title: '压力事件：林地风暴', detail: '一场风暴折损了部分林木，伐木减产且森林恢复变慢；木材与住房压力会上升。', foodProductionMultiplier: 1, foodConsumptionMultiplier: 1, woodProductionMultiplier: 0.55, forestRecoveryMultiplier: 0.25 },
  ];
  const event = events[Math.floor(random(world) * events.length)];
  if (event.id === 'dry-season') {
    for (const tile of world.tiles) { tile.moisture = clamp(tile.moisture - 0.24); tile.heat = clamp(tile.heat + 0.15); }
  } else if (event.id === 'grain-blight') {
    getResourceStore(world).add('food', -Math.min(14, world.resources.food * 0.5));
  } else {
    for (const tile of world.tiles) if (tile.terrain === 'forest') tile.treeAmount = Math.max(0, tile.treeAmount - 0.22);
  }
  world.pressureEvent = { turn: world.turn, remainingDays: CONFIG.pressureEventDays, ...event };
  logEvent(world, event.title, event.detail, 'warning');
}

function optimalBand(value: number, min: number, max: number): number {
  if (value < min) return clamp(value / Math.max(min, 0.01), 0.38, 1);
  if (value > max) return clamp(1 - ((value - max) / Math.max(1 - max, 0.01)) * 0.62, 0.38, 1);
  return 1;
}

export function getTileDerived(world: World, tile: Tile): TileDerived {
  const moistureModifier = optimalBand(tile.moisture, CONFIG.environment.moistureOptimalMin, CONFIG.environment.moistureOptimalMax);
  const heatModifier = optimalBand(tile.heat, CONFIG.environment.heatOptimalMin, CONFIG.environment.heatOptimalMax);
  const movementCost = 1 + Math.max(0, tile.moisture - CONFIG.environment.moistureOptimalMax) * 2.4 + Math.max(0, 0.14 - tile.moisture) * 0.45;
  const farmEfficiency = clamp((0.5 + tile.fertility * 0.5) * moistureModifier * heatModifier, 0.18, 1.2);
  const vegetationRecovery = clamp((0.45 + tile.fertility * 0.55) * optimalBand(tile.moisture, 0.28, 0.78) * optimalBand(tile.heat, 0.2, 0.72), 0, 1.2);
  const nearbyWork = world.buildings.filter((building) => ['farm', 'lumber', 'quarry'].includes(building.kind))
    .reduce((score, building) => score + Math.exp(-distance(tile.x, tile.z, building.x, building.z) / 4.2), 0);
  const localResources = Math.max(tile.fertility, tile.treeAmount, tile.ore);
  const jobOpportunity = clamp(nearbyWork * 0.18 + localResources * 0.26, 0, 1);
  const settlementPreference = clamp(tile.attraction * 0.46 + jobOpportunity * 0.24 + farmEfficiency * 0.16 + tile.waterSource * 0.08 - (movementCost - 1) * 0.12);
  const farmSuitability = clamp(farmEfficiency * (tile.landUse === 'farmland' ? 1.08 : 0.88));
  const forestryValue = clamp(tile.treeAmount * (0.74 + moistureModifier * 0.26));
  const settlementValue = clamp(settlementPreference * 0.72 + tile.attraction * 0.18 + (1 - Math.min(1, movementCost - 1)) * 0.1);
  return { moistureModifier, heatModifier, farmEfficiency, movementCost, vegetationRecovery, jobOpportunity, settlementPreference, farmSuitability, forestryValue, settlementValue };
}

function makeTile(world: World, x: number, z: number): Tile {
  const forestDist = distance(x, z, 5.2, 5.3);
  const quarryDist = distance(x, z, 24.4, 5.4);
  const waterDist = distance(x, z, 5.2, 24.4);
  const fertileDist = distance(x, z, 23.5, 23.5);
  const centralDist = distance(x, z, 15.2, 16.7);
  const noise = random(world);
  let terrain: Terrain = 'grass';
  let fertility = 0.22 + noise * 0.18;
  let moisture = 0.28 + noise * 0.1;
  let heat = 0.48 + (noise - 0.5) * 0.16;
  let forest = 0;
  let ore = 0;

  if (waterDist < 3.5 || (x < 8 && z > 21 && waterDist < 5.2 && noise > 0.18)) {
    terrain = 'water';
    fertility = 0;
    moisture = 0.86;
    heat = 0.38;
  } else if (forestDist < 6.4 && noise > 0.08) {
    terrain = 'forest';
    forest = 0.55 + noise * 0.85;
    fertility = 0.16;
    moisture = 0.54 + noise * 0.12;
    heat = 0.43 + (noise - 0.5) * 0.12;
  } else if (quarryDist < 4.9 && noise > 0.12) {
    terrain = 'stone';
    ore = 0.55 + noise * 0.8;
    fertility = 0.08;
    moisture = 0.22 + noise * 0.08;
    heat = 0.53 + (noise - 0.5) * 0.12;
  } else if (fertileDist < 6.4 || (centralDist < 2.5 && noise > 0.34)) {
    terrain = 'fertile';
    fertility = 0.62 + noise * 0.36;
    moisture = 0.34 + noise * 0.1;
    heat = 0.48 + (noise - 0.5) * 0.12;
  }

  return {
    x, z, terrain, fertility: clamp(fertility), baseFertility: clamp(fertility),
    moisture: clamp(moisture), baseMoisture: clamp(moisture), heat: clamp(heat), baseHeat: clamp(heat), treeAmount: forest, baseTreeAmount: forest, ore,
    landUse: 'none', structureRef: null, effects: [],
    attraction: clamp(0.2 + fertility * 0.42 + (terrain === 'water' ? 0.12 : 0)),
    baseAttraction: clamp(0.2 + fertility * 0.42 + (terrain === 'water' ? 0.12 : 0)),
    waterSource: terrain === 'water' ? 1 : 0, oracleBoost: 0, fireLevel: 0,
  };
}

function addBuilding(world: World, kind: BuildingKind, x: number, z: number): Building {
  const building: Building = {
    id: world.nextBuildingId++, kind, x, z,
    capacity: kind === 'house' ? 4 : kind === 'farm' ? 5 : kind === 'storage' ? 0 : 4,
  };
  world.buildings.push(building);
  const tile = tileAt(world, x, z);
  if (tile && kind === 'farm') {
    tile.landUse = 'farmland';
    tile.structureRef = building.id;
  } else if (tile && kind !== 'storage') {
    tile.structureRef = building.id;
  }
  return building;
}

function createAgent(world: World, home: Building, x?: number, z?: number): Agent {
  const id = world.nextAgentId++;
  return {
    id,
    name: NAMES[(id - 1) % NAMES.length],
    x: x ?? home.x + (random(world) - 0.5) * 0.42,
    z: z ?? home.z + (random(world) - 0.5) * 0.42,
    hunger: 0.14 + random(world) * 0.22,
    starvationDays: 0,
    homeId: home.id,
    currentJob: '闲居',
    currentAction: 'rest',
    currentTarget: { x: home.x, z: home.z, label: `住宅 #${home.id}` },
    utilityScores: emptyScores(),
    utilityReasons: emptyReasons(),
    knownCandidates: [],
    actionCommitment: 0,
    switchCost: CONFIG.switchCost,
    actionEventProgress: 0,
    thinkIn: random(world) * 0.04,
    buildProgress: 0,
    buildKind: null,
    lastMigrationDay: -10,
  };
}

function makeDeckState(): OracleDeckState {
  const ids = ORACLE_POOL.map((card) => card.id);
  return { deck: ids, hand: [], discard: [] };
}

export function getOracleAcquisitionCost(world: World): number {
  const acquisitionIndex = Math.max(0, world.turn - CONFIG.turnsBeforeRevelation - 1);
  return Math.min(60, CONFIG.oracleAcquireCostBase + acquisitionIndex * CONFIG.oracleAcquireCostStep);
}

export function createWorld(seed = 202603): World {
  const world: World = {
    seed: seed >>> 0,
    tiles: [] as Tile[],
    agents: [] as Agent[],
    buildings: [] as Building[],
    resources: { food: 20, wood: 20, stone: 8 },
    initialForest: 0,
    divinePower: 72,
    turn: 1,
    turnElapsedSeconds: 0,
    oraclePlaysThisTurn: 0,
    manualDiscardsThisTurn: 0,
    oracleAcquiredThisTurn: false,
    oracleDeck: makeDeckState(),
    turnActionEventStart: 0,
    turnMetricsBefore: null,
    turnSummaries: [],
    lastSummary: null,
    pressureEvent: null,
    departureTurnsRemaining: 0,
    departureActive: false,
    elapsedDays: 0,
    elapsedSeconds: 0,
    nextAgentId: 1,
    nextBuildingId: 1,
    nextEventId: 1,
    nextActionEventId: 1,
    nextPopulationAt: 12,
    growthProgress: 0,
    stableProgress: 0,
    status: 'running' as const,
    selectedAgentId: null,
    overlay: 'none' as OverlayKind,
    effects: [] as MiracleEffect[],
    events: [] as GameEvent[],
    actionEvents: [] as ActionEvent[],
    covenants: [],
    revelation: 'silence',
    phase: 'turn-start',
    revelationChoices: [],
    revelationCount: 0,
    revelationPending: false,
    nextRevelationSeconds: 0,
    foodShortageActive: false,
    woodShortageActive: false,
    loggedClusters: new Set<string>(['settlement']),
    loggedForestLoss: false,
    lastFoodShortageDay: -99,
  };

  for (let z = 0; z < CONFIG.worldSize; z += 1) {
    for (let x = 0; x < CONFIG.worldSize; x += 1) world.tiles.push(makeTile(world, x, z));
  }
  world.initialForest = world.tiles.reduce((sum, tile) => sum + tile.treeAmount, 0);

  const homes = [
    addBuilding(world, 'house', 14, 14), addBuilding(world, 'house', 16, 14),
    addBuilding(world, 'house', 14, 17), addBuilding(world, 'house', 16, 17),
  ];
  addBuilding(world, 'farm', 19, 20);
  addBuilding(world, 'lumber', 8, 8);
  addBuilding(world, 'storage', 15, 15);
  for (let i = 0; i < CONFIG.startingPopulation; i += 1) world.agents.push(createAgent(world, homes[Math.floor(i / 3)]));
  world.selectedAgentId = world.agents[0]?.id ?? null;
  logEvent(world, '聚落开始自行运转', '居民会依据食物、木材、住房与通勤距离调整行动。', 'neutral');
  for (const agent of world.agents) evaluateAgent(world, agent);
  return world;
}

export function getMetrics(world: World): WorldMetrics {
  const resources = getResourceStore(world);
  const population = world.agents.length;
  const housing = world.buildings.filter((building) => building.kind === 'house').reduce((sum, building) => sum + building.capacity, 0);
  const pressure = activePressureEvent(world);
  const needs = Math.max(1, population * CONFIG.foodPerPersonDay * (pressure?.foodConsumptionMultiplier ?? 1));
  const averageHunger = population ? world.agents.reduce((sum, agent) => sum + agent.hunger, 0) / population : 1;
  const housingCoverage = population ? Math.min(1, housing / population) : 1;
  const foodSecurity = population ? clamp(resources.get('food') / (needs * 2.1)) : 0;
  const foodScarcity = clamp(1 - resources.get('food') / Math.max(4, population * 2.2), 0.04, 1);
  const woodScarcity = clamp(1 - resources.get('wood') / Math.max(8, 22 + population * 0.2), 0.04, 1);
  const stoneScarcity = clamp(1 - resources.get('stone') / Math.max(6, 14 + population * 0.12), 0.04, 1);
  const housingPressure = population ? clamp((population - housing * 0.65) / Math.max(4, housing * 0.35)) : 0;
  const averageAttraction = world.tiles.reduce((sum, tile) => sum + tile.attraction, 0) / world.tiles.length;
  const happiness = clamp(foodSecurity * 0.42 + housingCoverage * 0.24 + (1 - clamp(averageHunger)) * 0.2 + averageAttraction * 0.14);
  const forestRemaining = world.tiles.reduce((sum, tile) => sum + tile.treeAmount, 0);
  const forestInitial = world.initialForest;
  const averageMoisture = world.tiles.reduce((sum, tile) => sum + tile.moisture, 0) / world.tiles.length;
  const averageHeat = world.tiles.reduce((sum, tile) => sum + tile.heat, 0) / world.tiles.length;
  const averageFertility = world.tiles.reduce((sum, tile) => sum + tile.fertility, 0) / world.tiles.length;
  const averageFarmEfficiency = world.tiles.reduce((sum, tile) => sum + getTileDerived(world, tile).farmEfficiency, 0) / world.tiles.length;
  return { population, housing, housingCoverage, foodSecurity, foodScarcity, woodScarcity, stoneScarcity, housingPressure, happiness, averageHunger, forestRemaining, forestInitial, averageMoisture, averageHeat, averageFertility, averageFarmEfficiency };
}

function activePressureEvent(world: World): PressureEvent | null {
  return world.pressureEvent && world.pressureEvent.remainingDays > 0 ? world.pressureEvent : null;
}

function logEvent(world: World, title: string, detail: string, tone: GameEvent['tone']): void {
  world.events.unshift({ id: world.nextEventId++, day: Math.floor(world.elapsedDays) + 1, title, detail, tone });
  world.events.length = Math.min(world.events.length, 16);
}

export function emitActionEvent(
  world: World,
  actorRef: number,
  actionType: ActionType,
  tile: Tile,
  amount = 0,
  contextSnapshot: Record<string, number | string | boolean> = {},
  targetRef?: number,
): ActionEvent {
  const event: ActionEvent = {
    id: world.nextActionEventId++, actorRef, actionType,
    tileCoord: { x: tile.x, z: tile.z }, targetRef, amount, contextSnapshot, simTime: world.elapsedDays,
  };
  world.actionEvents.unshift(event);
  world.actionEvents.length = Math.min(world.actionEvents.length, 128);
  const eventConditions = (covenant: Covenant): boolean => {
    if (covenant.condition === 'dense-forest') return Number(contextSnapshot.treeAmountBefore ?? tile.treeAmount) > 0.7;
    if (covenant.condition === 'near-water') return world.tiles.some((near) => near.waterSource > 0 && distance(near.x, near.z, tile.x, tile.z) <= 3);
    if (covenant.condition === 'low-population') return world.agents.length <= CONFIG.laterRevelationPopulation;
    if (covenant.condition === 'far-from-settlement') return !world.buildings.some((building) => building.kind === 'house' && distance(building.x, building.z, tile.x, tile.z) < 7);
    return true;
  };
  const feedback: string[] = [];
  for (const covenant of world.covenants) {
    if (!covenant.active || world.revelation === 'silence' || !eventConditions(covenant)) continue;
    if (covenant.supportOn.includes(actionType)) feedback.push(`${covenant.name}：此行为带来神恩，将在回合结算评价`);
    if (covenant.strainOn.includes(actionType)) feedback.push(`${covenant.name}：此行为带来神罚，将在回合结算评价`);
  }
  event.covenantFeedback = feedback;
  if (actionType === 'createFarmland') logEvent(world, '丰收之约回应了开垦', `居民 #${actorRef} 的 ActionEvent 获得神约响应；神约只评价已发生的行为。`, 'good');
  if (actionType === 'chopWood' && Number(contextSnapshot.treeAmountBefore ?? 0) > 0.7) logEvent(world, '林下之约记录了伐木', `居民 #${actorRef} 在高树木量区域取木，生态压力被记录但行为没有被禁止。`, 'warning');
  if (actionType === 'migrate') logEvent(world, '远行之约记录了迁居', `居民 #${actorRef} 自主迁往 ${contextSnapshot.target ?? '新住所'}，神约响应随 ActionEvent 记录。`, 'good');
  return event;
}

export function getSettlements(world: World): SettlementView[] {
  const clusters = new Map<string, { agents: Agent[]; houses: Building[] }>();
  for (const agent of world.agents) {
    const key = `${Math.floor(agent.x / 6)}-${Math.floor(agent.z / 6)}`;
    const cluster = clusters.get(key) ?? { agents: [], houses: [] };
    cluster.agents.push(agent); clusters.set(key, cluster);
  }
  for (const house of world.buildings.filter((building) => building.kind === 'house')) {
    const key = `${Math.floor(house.x / 6)}-${Math.floor(house.z / 6)}`;
    const cluster = clusters.get(key) ?? { agents: [], houses: [] };
    cluster.houses.push(house); clusters.set(key, cluster);
  }
  return [...clusters.entries()].filter(([, cluster]) => cluster.agents.length >= 2 || cluster.houses.length >= 2).map(([id, cluster]) => {
    const center = cluster.agents.length ? cluster.agents.reduce((sum, agent) => ({ x: sum.x + agent.x, z: sum.z + agent.z }), { x: 0, z: 0 }) : cluster.houses.reduce((sum, house) => ({ x: sum.x + house.x, z: sum.z + house.z }), { x: 0, z: 0 });
    const count = cluster.agents.length || cluster.houses.length;
    return { id, center: { x: center.x / count, z: center.z / count }, population: cluster.agents.length, housing: cluster.houses.reduce((sum, house) => sum + house.capacity, 0), activity: cluster.agents.filter((agent) => agent.currentAction !== 'rest').length / Math.max(1, cluster.agents.length) };
  });
}

function homeFor(world: World, agent: Agent): Building {
  return world.buildings.find((building) => building.id === agent.homeId) ?? world.buildings.find((building) => building.kind === 'house') ?? world.buildings[0];
}

function occupants(world: World, homeId: number): number {
  return world.agents.filter((agent) => agent.homeId === homeId).length;
}

function distanceToTarget(agent: Agent, target: Target): number {
  return distance(agent.x, agent.z, target.x, target.z);
}

function nearestBuilding(world: World, agent: Agent, kind: BuildingKind): Building | undefined {
  return world.buildings.filter((building) => building.kind === kind)
    .sort((a, b) => distance(agent.x, agent.z, a.x, a.z) - distance(agent.x, agent.z, b.x, b.z))[0];
}

function bestResourceTile(world: World, agent: Agent, kind: 'farm' | 'forest' | 'ore'): Tile | undefined {
  let selected: Tile | undefined;
  let best = -Infinity;
  for (const tile of world.tiles) {
    if (distance(agent.x, agent.z, tile.x, tile.z) > CONFIG.searchRadius) continue;
    const amount = kind === 'farm' ? tile.fertility : kind === 'forest' ? tile.treeAmount : tile.ore;
    if (amount < (kind === 'farm' ? 0.48 : 0.08)) continue;
    const derived = getTileDerived(world, tile);
    const localValue = kind === 'farm' ? amount * 19 * derived.farmEfficiency : Math.min(1, amount) * 17;
    const score = localValue - distance(agent.x, agent.z, tile.x, tile.z) * 1.1 * derived.movementCost;
    if (score > best) { selected = tile; best = score; }
  }
  return selected;
}

function workTarget(world: World, agent: Agent, action: 'farm' | 'chop' | 'mine'): Target {
  const kind: BuildingKind = action === 'farm' ? 'farm' : action === 'chop' ? 'lumber' : 'quarry';
  const building = nearestBuilding(world, agent, kind);
  if (building) return { x: building.x, z: building.z, label: `${action === 'farm' ? '农场' : action === 'chop' ? '伐木营地' : '采石场'} #${building.id}` };
  const tile = bestResourceTile(world, agent, action === 'farm' ? 'farm' : action === 'chop' ? 'forest' : 'ore');
  if (tile) return { x: tile.x, z: tile.z, label: action === 'farm' ? '肥沃土地' : action === 'chop' ? '森林边缘' : '石矿' };
  return { x: agent.x, z: agent.z, label: '附近暂无资源' };
}

function isReserved(world: World, x: number, z: number): boolean {
  return world.buildings.some((building) => distance(x, z, building.x, building.z) < 1.18)
    || world.agents.some((agent) => agent.buildKind !== null && distance(x, z, agent.currentTarget.x, agent.currentTarget.z) < 1.1);
}

function buildTarget(world: World, agent: Agent, kind: BuildingKind): Target | undefined {
  let best: Tile | undefined;
  let bestScore = -Infinity;
  for (const tile of world.tiles) {
    if (distance(agent.x, agent.z, tile.x, tile.z) > CONFIG.searchRadius) continue;
    if (tile.terrain === 'water' || isReserved(world, tile.x, tile.z)) continue;
    if (kind === 'farm' && tile.fertility < 0.5) continue;
    if (kind === 'lumber' && tile.treeAmount < 0.12) continue;
    if (kind === 'quarry' && tile.ore < 0.12) continue;
    if (kind === 'house' && tile.terrain !== 'grass' && tile.terrain !== 'fertile') continue;
    const derived = getTileDerived(world, tile);
    let quality = tile.attraction * 4 + derived.jobOpportunity * 6 + derived.settlementPreference * 5 + tile.waterSource * 9;
    if (kind === 'farm') quality += tile.fertility * 18 * derived.farmEfficiency + derived.settlementPreference * 24 - Math.max(0, 7 - Math.min(...world.buildings.filter((b) => b.kind === 'farm').map((b) => distance(tile.x, tile.z, b.x, b.z)), 8)) * 0.6;
    if (kind === 'lumber') quality += tile.treeAmount * 16 + derived.settlementPreference * 5;
    if (kind === 'quarry') quality += tile.ore * 15 + derived.settlementPreference * 5;
    if (kind === 'house') {
      const workSites = world.buildings.filter((b) => b.kind === 'farm' || b.kind === 'lumber' || b.kind === 'quarry');
      const nearWork = workSites.length ? Math.min(...workSites.map((b) => distance(tile.x, tile.z, b.x, b.z))) : 6;
      quality += Math.max(0, 8 - Math.abs(nearWork - 2.2) * 2.2) - nearWork * 0.15 + derived.settlementPreference * 18;
    }
    const travelWeight = kind === 'house' ? 0.16 : 0.72;
    quality -= distance(agent.x, agent.z, tile.x, tile.z) * travelWeight * derived.movementCost * (1 - derived.settlementPreference * 0.82);
    if (quality > bestScore) { best = tile; bestScore = quality; }
  }
  if (!best) return undefined;
  const labels: Record<BuildingKind, string> = { house: '新住宅地', farm: '肥沃农地', lumber: '森林资源点', quarry: '矿脉边缘', storage: '储物处' };
  return { x: best.x, z: best.z, label: labels[kind] };
}

function hasBuilder(world: World, action: WorkAction, exceptAgentId: number): boolean {
  return world.agents.some((agent) => agent.id !== exceptAgentId && agent.currentAction === action);
}

function countAction(world: World, action: Action): number {
  return world.agents.filter((agent) => agent.currentAction === action).length;
}

function canAfford(world: World, kind: keyof typeof CONFIG.buildingCosts): boolean {
  const cost = CONFIG.buildingCosts[kind];
  return getResourceStore(world).has({ wood: cost.wood, stone: cost.stone });
}

function computeUtilities(world: World, agent: Agent): { scores: Record<WorkAction, number>; reasons: Record<WorkAction, string[]>; targets: Partial<Record<WorkAction, Target>> } {
  const resources = getResourceStore(world);
  const metrics = getMetrics(world);
  const scores = emptyScores();
  const reasons = emptyReasons();
  const targets: Partial<Record<WorkAction, Target>> = {};
  const farmTarget = workTarget(world, agent, 'farm');
  const woodTarget = workTarget(world, agent, 'chop');
  const stoneTarget = workTarget(world, agent, 'mine');
  const home = homeFor(world, agent);
  const pantry = [home, ...world.buildings.filter((building) => building.kind === 'storage')]
    .sort((a, b) => distance(agent.x, agent.z, a.x, a.z) - distance(agent.x, agent.z, b.x, b.z))[0];
  const foodTile = tileAt(world, farmTarget.x, farmTarget.z);
  const woodTile = tileAt(world, woodTarget.x, woodTarget.z);
  const stoneTile = tileAt(world, stoneTarget.x, stoneTarget.z);
  const travelPenalty = (target: Target): number => distanceToTarget(agent, target) * CONFIG.distancePenalty;

  targets.eat = { x: pantry.x, z: pantry.z, label: pantry.kind === 'storage' ? `粮仓 #${pantry.id}` : `住宅 #${home.id}` };
  targets.farm = farmTarget;
  targets.chop = woodTarget;
  targets.mine = stoneTarget;
  targets.rest = { x: home.x, z: home.z, label: `住宅 #${home.id}` };

  scores.eat = resources.get('food') >= CONFIG.mealFood && agent.hunger > 0.68 ? 8 + agent.hunger * 83 : 0;
  reasons.eat = [`饥饿 ${Math.round(agent.hunger * 100)}%`, resources.get('food') >= CONFIG.mealFood ? '食物库存可满足进食' : '粮仓里没有足够食物', '就近前往粮仓或住所'];

  const farmQuality = foodTile?.fertility ?? 0;
  const woodQuality = woodTile?.treeAmount ?? 0;
  const stoneQuality = stoneTile?.ore ?? 0;
  const farmDerived = foodTile ? getTileDerived(world, foodTile) : undefined;
  const woodDerived = woodTile ? getTileDerived(world, woodTile) : undefined;
  const stoneDerived = stoneTile ? getTileDerived(world, stoneTile) : undefined;
  const farmWorkers = countAction(world, 'farm');
  const woodWorkers = countAction(world, 'chop');
  const mineWorkers = countAction(world, 'mine');
  const farmTravel = travelPenalty(farmTarget) * (farmDerived?.movementCost ?? 1);
  const woodTravel = travelPenalty(woodTarget) * (woodDerived?.movementCost ?? 1);
  const stoneTravel = travelPenalty(stoneTarget) * (stoneDerived?.movementCost ?? 1);
  const foodUrgency = metrics.foodScarcity * 18 + Math.max(0, agent.hunger - 0.52) * 24;
  scores.farm = Math.max(0, 24 + metrics.foodScarcity * 52 + foodUrgency + farmQuality * 16 * (farmDerived?.farmEfficiency ?? 0.5) - farmTravel - Math.max(0, farmWorkers - 5) * 7);
  reasons.farm = [`食物稀缺 +${Math.round(metrics.foodScarcity * 44)}`, `湿度 ${Math.round((foodTile?.moisture ?? 0) * 100)}%`, `热量 ${Math.round((foodTile?.heat ?? 0) * 100)}%`, `农作条件 ${Math.round((farmDerived?.farmEfficiency ?? 0) * 100)}%`, `通勤 −${round(farmTravel)}`];
  scores.chop = Math.max(0, 15 + metrics.woodScarcity * 43 + woodQuality * 16 - woodTravel - Math.max(0, woodWorkers - 3) * 8);
  reasons.chop = [`木材稀缺 +${Math.round(metrics.woodScarcity * 43)}`, `森林资源 +${Math.round(woodQuality * 16)}`, `湿度 ${Math.round((woodTile?.moisture ?? 0) * 100)}%`, `通勤 −${round(woodTravel)}`];
  scores.mine = Math.max(0, 10 + metrics.stoneScarcity * 34 + stoneQuality * 16 - stoneTravel - Math.max(0, mineWorkers - 2) * 8);
  reasons.mine = [`石材稀缺 +${Math.round(metrics.stoneScarcity * 34)}`, `矿脉资源 +${Math.round(stoneQuality * 16)}`, `地形通行 ${round(stoneDerived?.movementCost ?? 1)}x`, `通勤 −${round(stoneTravel)}`];

  const farmBuild = buildTarget(world, agent, 'farm');
  const lumberBuild = buildTarget(world, agent, 'lumber');
  const quarryBuild = buildTarget(world, agent, 'quarry');
  const houseBuild = buildTarget(world, agent, 'house');
  if (farmBuild) targets.buildFarm = farmBuild;
  if (lumberBuild) targets.buildLumber = lumberBuild;
  if (quarryBuild) targets.buildQuarry = quarryBuild;
  if (houseBuild) targets.buildHouse = houseBuild;

  const farmCount = world.buildings.filter((b) => b.kind === 'farm').length;
  const lumberCount = world.buildings.filter((b) => b.kind === 'lumber').length;
  const quarryCount = world.buildings.filter((b) => b.kind === 'quarry').length;
  const desiredFarms = Math.min(6, Math.max(2, Math.ceil(metrics.population / 6)));
  const desiredLumber = Math.min(5, Math.max(1, Math.ceil(metrics.population / 10)));
  const desiredQuarries = Math.min(3, Math.max(1, Math.ceil(metrics.population / 18)));
  scores.buildFarm = farmBuild && canAfford(world, 'farm') && farmCount < desiredFarms && (!hasBuilder(world, 'buildFarm', agent.id) || agent.currentAction === 'buildFarm')
    ? Math.max(0, 5 + metrics.foodScarcity * 74 + farmQuality * 8 - travelPenalty(farmBuild) * 0.62) : 0;
  scores.buildLumber = lumberBuild && canAfford(world, 'lumber') && lumberCount < desiredLumber && (!hasBuilder(world, 'buildLumber', agent.id) || agent.currentAction === 'buildLumber')
    ? Math.max(0, 3 + metrics.woodScarcity * 70 + woodQuality * 10 - travelPenalty(lumberBuild) * 0.56) : 0;
  scores.buildQuarry = quarryBuild && canAfford(world, 'quarry') && quarryCount < desiredQuarries && (!hasBuilder(world, 'buildQuarry', agent.id) || agent.currentAction === 'buildQuarry')
    ? Math.max(0, 2 + metrics.stoneScarcity * 48 + stoneQuality * 10 - travelPenalty(quarryBuild) * 0.66) : 0;
  scores.buildHouse = houseBuild && canAfford(world, 'house') && metrics.housingPressure > 0.13 && (!hasBuilder(world, 'buildHouse', agent.id) || agent.currentAction === 'buildHouse')
    ? Math.max(0, 3 + metrics.housingPressure * 66 - travelPenalty(houseBuild) * 0.5) : 0;
  reasons.buildFarm = [`食物压力 +${Math.round(metrics.foodScarcity * 74)}`, `农作条件 ${Math.round((farmDerived?.farmEfficiency ?? 0) * 100)}%`, canAfford(world, 'farm') ? '木石足够' : '等待建材'];
  reasons.buildLumber = [`木材压力 +${Math.round(metrics.woodScarcity * 70)}`, `附近森林 ${Math.round(woodQuality * 100)}%`, canAfford(world, 'lumber') ? '木石足够' : '等待建材'];
  reasons.buildQuarry = [`石材压力 +${Math.round(metrics.stoneScarcity * 48)}`, `矿脉 ${Math.round(stoneQuality * 100)}%`, canAfford(world, 'quarry') ? '木石足够' : '等待建材'];
  reasons.buildHouse = [`住房压力 +${Math.round(metrics.housingPressure * 66)}`, `宜居度 ${Math.round((tileAt(world, houseBuild?.x ?? 0, houseBuild?.z ?? 0)?.attraction ?? 0) * 100)}%`, canAfford(world, 'house') ? '建材足够' : '等待建材'];
  scores.rest = 9 + (scores.eat === 0 && agent.hunger > 0.7 ? 8 : 0);
  reasons.rest = ['附近生产机会不足时回家休息', `当前住房 #${home.id}`];
  return { scores, reasons, targets };
}

function chooseAction(world: World, agent: Agent, computed = computeUtilities(world, agent)): void {
  if (agent.currentAction === 'migrate' && distanceToTarget(agent, agent.currentTarget) > 0.48) return;
  const entries = (Object.entries(computed.scores) as [WorkAction, number][]).map(([action, score]) => [
    action,
    action === agent.currentAction ? score + agent.actionCommitment : Math.max(0, score - agent.switchCost),
  ] as [WorkAction, number]);
  entries.sort((a, b) => b[1] - a[1]);
  let nextAction = entries[0]?.[0] ?? 'rest';
  if (agent.buildKind && agent.currentAction.startsWith('build')) {
    const committedScore = computed.scores[agent.currentAction as WorkAction];
    const urgentFood = agent.hunger > 1.1 && computed.scores.eat > committedScore + 34;
    if (committedScore > 0 && !urgentFood) nextAction = agent.currentAction as WorkAction;
  }
  const previousAction = agent.currentAction;
  const previousTarget = agent.currentTarget;
  const keepBuild = agent.currentAction === nextAction && nextAction.startsWith('build') && agent.buildKind !== null;
  agent.currentAction = nextAction;
  agent.currentJob = ({ eat: '居民', farm: '农务', chop: '林业', mine: '采石', buildHouse: '建造', buildFarm: '建造', buildLumber: '建造', buildQuarry: '建造', rest: '闲居' })[nextAction];
  agent.utilityScores = computed.scores;
  agent.utilityReasons = computed.reasons;
  agent.knownCandidates = Object.values(computed.targets).filter((target): target is Target => Boolean(target)).slice(0, 8);
  agent.actionCommitment = nextAction === previousAction ? Math.min(100, agent.actionCommitment + CONFIG.actionCommitment * 0.18) : Math.max(0, agent.actionCommitment - CONFIG.switchCost);
  agent.switchCost = CONFIG.switchCost + Math.round(Math.max(0, agent.actionCommitment - 45) * 0.12);
  if (nextAction !== previousAction) agent.actionEventProgress = 0;
  if (keepBuild) agent.currentTarget = previousTarget;
  else agent.currentTarget = computed.targets[nextAction] ?? computed.targets.rest ?? previousTarget;
  if (!nextAction.startsWith('build')) { agent.buildKind = null; agent.buildProgress = 0; }
  else if (!keepBuild) {
    agent.buildKind = nextAction === 'buildHouse' ? 'house' : nextAction === 'buildFarm' ? 'farm' : nextAction === 'buildLumber' ? 'lumber' : 'quarry';
    agent.buildProgress = 0;
    const constructionTile = tileAt(world, agent.currentTarget.x, agent.currentTarget.z);
    if (constructionTile && constructionTile.landUse === 'none') constructionTile.landUse = 'construction';
  }
}

function tryMigration(world: World, agent: Agent): boolean {
  if (world.elapsedDays - agent.lastMigrationDay < 3 || agent.currentAction === 'buildHouse' || agent.currentAction === 'migrate') return false;
  const currentHome = homeFor(world, agent);
  const work = agent.currentTarget;
  const oldTile = tileAt(world, currentHome.x, currentHome.z)!;
  const oldDerived = getTileDerived(world, oldTile);
  const oldCost = distance(work.x, work.z, currentHome.x, currentHome.z) * oldDerived.movementCost - oldDerived.settlementPreference * 2.2;
  const candidates = world.buildings.filter((building) => building.kind === 'house' && occupants(world, building.id) < building.capacity && building.id !== currentHome.id);
  const newHome = candidates.sort((a, b) => {
    const tileA = tileAt(world, a.x, a.z)!;
    const tileB = tileAt(world, b.x, b.z)!;
    const scoreA = distance(work.x, work.z, a.x, a.z) * getTileDerived(world, tileA).movementCost - getTileDerived(world, tileA).settlementPreference * 2.2;
    const scoreB = distance(work.x, work.z, b.x, b.z) * getTileDerived(world, tileB).movementCost - getTileDerived(world, tileB).settlementPreference * 2.2;
    return scoreA - scoreB;
  })[0];
  if (!newHome) return false;
  const newHomeTile = tileAt(world, newHome.x, newHome.z)!;
  const newCost = distance(work.x, work.z, newHome.x, newHome.z) * getTileDerived(world, newHomeTile).movementCost - getTileDerived(world, newHomeTile).settlementPreference * 2.2;
  if (oldCost - newCost < 1.8) return false;
  agent.homeId = newHome.id;
  agent.currentAction = 'migrate';
  agent.currentJob = '迁居';
  agent.currentTarget = { x: newHome.x, z: newHome.z, label: `迁往住宅 #${newHome.id}` };
  agent.lastMigrationDay = world.elapsedDays;
  agent.thinkIn = CONFIG.thinkEveryDays;
  logEvent(world, `${agent.name} 正在迁居`, `新住所更靠近 ${work.label}，通勤成本降低了。`, 'neutral');
  return true;
}

function evaluateAgent(world: World, agent: Agent): void {
  if (agent.currentAction === 'migrate' && distanceToTarget(agent, agent.currentTarget) > 0.48) return;
  chooseAction(world, agent);
  tryMigration(world, agent);
}

function closestSourceTile(world: World, x: number, z: number, kind: 'farm' | 'forest' | 'ore'): Tile | undefined {
  let selected: Tile | undefined;
  let best = Infinity;
  for (const tile of world.tiles) {
    const quality = kind === 'farm' ? tile.fertility : kind === 'forest' ? tile.treeAmount : tile.ore;
    if (quality < (kind === 'farm' ? 0.3 : 0.03)) continue;
    const score = distance(x, z, tile.x, tile.z) - quality * 0.35;
    if (score < best) { selected = tile; best = score; }
  }
  return selected;
}

function buildDuration(kind: BuildingKind): number {
  return kind === 'house' ? 1.35 : kind === 'farm' ? 0.9 : 1.15;
}

function finishBuilding(world: World, agent: Agent, kind: BuildingKind): void {
  const resources = getResourceStore(world);
  const costKind = kind === 'house' ? 'house' : kind === 'farm' ? 'farm' : kind === 'lumber' ? 'lumber' : 'quarry';
  const cost = CONFIG.buildingCosts[costKind];
  if (!canAfford(world, costKind)) {
    agent.buildProgress = 0;
    agent.buildKind = null;
    const cancelledTile = tileAt(world, agent.currentTarget.x, agent.currentTarget.z);
    if (cancelledTile?.landUse === 'construction') cancelledTile.landUse = 'none';
    return;
  }
  resources.spend('wood', cost.wood);
  resources.spend('stone', cost.stone);
  const building = addBuilding(world, kind, Math.round(agent.currentTarget.x), Math.round(agent.currentTarget.z));
  const names: Record<BuildingKind, string> = { house: '住宅', farm: '农场', lumber: '伐木营地', quarry: '采石场', storage: '储物仓' };
  logEvent(world, `居民建成了${names[kind]}`, `新建筑 #${building.id} 出现在${agent.currentTarget.label}；选址由资源、住房与通勤价值共同决定。`, 'good');
  const buildingTile = tileAt(world, building.x, building.z);
  if (buildingTile) emitActionEvent(world, agent.id, `build${kind[0].toUpperCase()}${kind.slice(1)}` as ActionType, buildingTile, 1, { capacity: building.capacity }, building.id);
  agent.buildProgress = 0;
  agent.buildKind = null;
  agent.currentAction = 'rest';
  agent.currentJob = '闲居';
  agent.currentTarget = { x: building.x, z: building.z, label: `${names[kind]} #${building.id}` };
  if (kind === 'house') {
    const populationAtNewHouse = occupants(world, building.id);
    if (populationAtNewHouse === 0) {
      const home = homeFor(world, agent);
      if (occupants(world, home.id) >= home.capacity) agent.homeId = building.id;
    }
  }
}

function updateProduction(world: World, agent: Agent, days: number): void {
  const resources = getResourceStore(world);
  const pressure = activePressureEvent(world);
  const action = agent.currentAction;
  if (action === 'eat' && agent.hunger > 0.68 && resources.spend('food', CONFIG.mealFood)) {
    agent.hunger = Math.max(0, agent.hunger - CONFIG.mealRelief);
    const tile = tileAt(world, agent.x, agent.z);
    if (tile) emitActionEvent(world, agent.id, 'eat', tile, CONFIG.mealFood, { hungerAfter: agent.hunger });
    return;
  }
  if (action === 'farm') {
    const tile = closestSourceTile(world, agent.currentTarget.x, agent.currentTarget.z, 'farm');
    const localTile = tileAt(world, agent.currentTarget.x, agent.currentTarget.z) ?? tile;
    const fertility = localTile?.fertility ?? tile?.fertility ?? 0;
    const efficiency = localTile ? getTileDerived(world, localTile).farmEfficiency : 0;
    if (fertility > 0.25 && localTile) {
      if (localTile.landUse === 'none') {
        localTile.landUse = 'farmland';
        emitActionEvent(world, agent.id, 'createFarmland', localTile, 1, { fertility: localTile.fertility, moisture: localTile.moisture });
        logEvent(world, '居民开垦了土地', `(${localTile.x}, ${localTile.z}) 的肥沃地被转为 Farmland；农作效率由湿度、热量和肥力共同决定。`, 'good');
      }
      const gain = CONFIG.farmFoodPerWorkerDay * days * efficiency * (pressure?.foodProductionMultiplier ?? 1);
      resources.add('food', gain);
      agent.actionEventProgress += gain;
      if (agent.actionEventProgress >= 0.3) {
        const harvested = agent.actionEventProgress;
        agent.actionEventProgress = 0;
        emitActionEvent(world, agent.id, 'farmWork', localTile, harvested, { farmEfficiency: efficiency, moisture: localTile.moisture, heat: localTile.heat });
        emitActionEvent(world, agent.id, 'harvest', localTile, harvested, { farmEfficiency: efficiency });
      }
    }
    return;
  }
  if (action === 'chop') {
    const source = closestSourceTile(world, agent.currentTarget.x, agent.currentTarget.z, 'forest');
    if (source && source.treeAmount > 0) {
      const before = source.treeAmount;
      const gain = CONFIG.woodPerWorkerDay * days * (0.55 + Math.min(1, source.treeAmount) * 0.65) * (pressure?.woodProductionMultiplier ?? 1);
      resources.add('wood', gain);
      source.treeAmount = Math.max(0, source.treeAmount - gain * CONFIG.forestUsePerWood);
      if (source.treeAmount < 0.04) source.terrain = 'grass';
      agent.actionEventProgress += gain;
      if (agent.actionEventProgress >= 0.25) {
        const chopped = agent.actionEventProgress;
        agent.actionEventProgress = 0;
        emitActionEvent(world, agent.id, 'chopWood', source, chopped, { treeAmountBefore: before, treeAmountAfter: source.treeAmount });
      }
    }
    return;
  }
  if (action === 'mine') {
    const source = closestSourceTile(world, agent.currentTarget.x, agent.currentTarget.z, 'ore');
    if (source && source.ore > 0) {
      const gain = CONFIG.stonePerWorkerDay * days * (0.5 + Math.min(1, source.ore) * 0.65);
      resources.add('stone', gain);
      source.ore = Math.max(0, source.ore - gain * CONFIG.stoneUsePerUnit);
      if (source.ore < 0.04) source.terrain = 'grass';
    }
    return;
  }
  if (action.startsWith('build') && agent.buildKind && distanceToTarget(agent, agent.currentTarget) <= 0.58) {
    agent.buildProgress += days;
    if (agent.buildProgress >= buildDuration(agent.buildKind)) finishBuilding(world, agent, agent.buildKind);
  }
}

function spawnPopulation(world: World): void {
  if (world.agents.length >= CONFIG.populationLimit) return;
  const occupied = new Map<number, number>();
  for (const agent of world.agents) occupied.set(agent.homeId, (occupied.get(agent.homeId) ?? 0) + 1);
  const homes = world.buildings.filter((building) => building.kind === 'house' && (occupied.get(building.id) ?? 0) < building.capacity);
  if (!homes.length) return;
  const home = homes.sort((a, b) => {
    const scoreA = getTileDerived(world, tileAt(world, a.x, a.z)!).settlementPreference;
    const scoreB = getTileDerived(world, tileAt(world, b.x, b.z)!).settlementPreference;
    return scoreB - scoreA;
  })[0];
  const agent = createAgent(world, home);
  agent.hunger = 0.1;
  world.agents.push(agent);
  logEvent(world, '新居民加入聚落', `${agent.name} 被充足的食物、空余住房与宜居环境吸引而来。`, 'good');
  if (world.agents.length === 20 || world.agents.length === 30 || world.agents.length === 40) logEvent(world, `人口达到 ${world.agents.length}`, '住房和资源需求随人口同步上升。', 'neutral');
  evaluateAgent(world, agent);
}

function updatePopulation(world: World, days: number, metrics: WorldMetrics): void {
  if (metrics.population <= 0) {
    world.status = 'lost';
    logEvent(world, '聚落消散', '最后一位居民离开了这片土地。', 'warning');
    return;
  }
  if (metrics.population < CONFIG.populationLimit && metrics.housing > metrics.population && metrics.foodSecurity > 0.78 && metrics.happiness > 0.62) {
    world.growthProgress += days;
    if (world.growthProgress >= CONFIG.growthDays) {
      const before = world.agents.length;
      spawnPopulation(world);
      world.growthProgress = 0;
      world.nextPopulationAt = before + 1;
    }
  } else {
    world.growthProgress = Math.max(0, world.growthProgress - days * 0.65);
  }
  const stable = metrics.population >= CONFIG.stablePopulationGoal && metrics.foodSecurity > 0.72 && metrics.housingCoverage >= 0.84 && metrics.happiness > 0.66;
  world.stableProgress = stable ? world.stableProgress + days : Math.max(0, world.stableProgress - days * 0.7);
  if (world.stableProgress >= CONFIG.stableDaysToWin && !world.loggedClusters.has('stable-observed')) {
    world.loggedClusters.add('stable-observed');
    logEvent(world, '观察到稳定结构', `人口 ${metrics.population}；食物、住房与幸福度已连续保持稳定。`, 'good');
  }
}

function observeWorld(world: World, metrics: WorldMetrics): void {
  const resources = getResourceStore(world);
  const lowFood = resources.get('food') < Math.max(5, metrics.population * 0.62);
  if (lowFood && !world.foodShortageActive && world.elapsedDays - world.lastFoodShortageDay > 1.2) {
    world.foodShortageActive = true;
    world.lastFoodShortageDay = world.elapsedDays;
    logEvent(world, '粮食压力升高', '粮食储备逼近短期需求；务农效用随稀缺度上升。', 'warning');
  } else if (!lowFood && world.foodShortageActive && resources.get('food') > metrics.population * 1.35) {
    world.foodShortageActive = false;
    logEvent(world, '粮食供给恢复', '农业生产超过近期消耗，部分居民会转向其他工作。', 'good');
  }
  const lowWood = resources.get('wood') < 3.5;
  if (lowWood && !world.woodShortageActive) {
    world.woodShortageActive = true;
    logEvent(world, '木材储备紧张', '伐木与建造的效用会提高；现有森林仍会受到采伐。', 'warning');
  } else if (!lowWood && world.woodShortageActive && resources.get('wood') > 7) {
    world.woodShortageActive = false;
    logEvent(world, '木材储备回升', '新增采伐缓解了住房与建材压力。', 'good');
  }
  if (!world.loggedForestLoss && metrics.forestInitial > 0 && metrics.forestRemaining < metrics.forestInitial * 0.68) {
    world.loggedForestLoss = true;
    logEvent(world, '森林资源明显减少', '持续伐木开始改变当地资源条件。', 'warning');
  }
  const satelliteHouses = world.buildings.filter((building) => building.kind === 'house' && distance(building.x, building.z, 15, 16) > 6);
  const areas = new Map<string, Building[]>();
  for (const house of satelliteHouses) {
    const key = `${Math.floor(house.x / 10)}-${Math.floor(house.z / 10)}`;
    const items = areas.get(key) ?? [];
    items.push(house);
    areas.set(key, items);
  }
  for (const [key, houses] of areas) {
    if (houses.length >= 2 && !world.loggedClusters.has(key)) {
      world.loggedClusters.add(key);
      const centerX = houses.reduce((sum, house) => sum + house.x, 0) / houses.length;
      const centerZ = houses.reduce((sum, house) => sum + house.z, 0) / houses.length;
      const direction = centerZ < 12 ? '北部' : centerZ > 18 ? '南部' : centerX < 12 ? '西部' : '东部';
      logEvent(world, `${direction}新聚落正在形成`, '住房靠近了生产机会与高吸引力区域，居民的工作距离随之缩短。', 'good');
    }
  }
}

function updateEnvironment(world: World, days: number): void {
  const pressure = activePressureEvent(world);
  const burningTiles: Tile[] = [];
  for (const tile of world.tiles) {
    tile.effects = tile.effects.filter((effect) => effect.remainingDays > 9000 || (effect.remainingDays -= days) > 0);
    const evaporation = CONFIG.environment.moistureEvaporation * (0.62 + tile.heat * 0.9) * days;
    const naturalReturn = (tile.baseMoisture - tile.moisture) * 0.018 * days;
    const springRecovery = tile.waterSource * CONFIG.environment.springMoistureRecovery * days;
    tile.moisture = clamp(tile.moisture + naturalReturn - evaporation + springRecovery);
    tile.heat = clamp(tile.heat + (tile.baseHeat - tile.heat) * 0.012 * days);
    tile.oracleBoost = Math.max(0, tile.oracleBoost - CONFIG.environment.oracleDecayPerDay * days);
    tile.attraction = clamp(tile.baseAttraction + tile.oracleBoost + tile.waterSource * CONFIG.environment.springAttraction);
    if (tile.treeAmount > 0 && tile.terrain === 'forest') {
      const derived = getTileDerived(world, tile);
      tile.treeAmount = Math.min(tile.baseTreeAmount, tile.treeAmount + CONFIG.environment.vegetationRecovery * derived.vegetationRecovery * days * (pressure?.forestRecoveryMultiplier ?? 1));
    }
    if (tile.fireLevel > 0) {
      burningTiles.push(tile);
      const burnAmount = Math.min(tile.treeAmount, (0.18 + tile.treeAmount * 0.12) * tile.fireLevel * days);
      tile.treeAmount = Math.max(0, tile.treeAmount - burnAmount);
      const ashFertility = burnAmount * 0.42 + tile.fireLevel * 0.006 * days;
      tile.fertility = clamp(tile.fertility + ashFertility);
      tile.heat = clamp(tile.heat + 0.16 * tile.fireLevel * days);
      tile.attraction = clamp(tile.attraction - 0.22 * tile.fireLevel * days);
      tile.fireLevel = Math.max(0, tile.fireLevel - (0.05 + tile.moisture * 0.22) * days);
      if (tile.fireLevel > 0.02 && tile.moisture < 0.58 && tile.treeAmount > 0.04) {
        const neighbors = world.tiles.filter((candidate) => candidate !== tile && distance(candidate.x, candidate.z, tile.x, tile.z) <= 1.45 && candidate.terrain !== 'water' && candidate.fireLevel <= 0 && candidate.moisture < 0.58);
        for (const neighbor of neighbors) if (random(world) < 0.3 * days * tile.fireLevel * (1 - neighbor.moisture)) neighbor.fireLevel = Math.max(neighbor.fireLevel, 0.72);
      }
    }
  }
  for (const tile of burningTiles) if (tile.fireLevel <= 0.02) { tile.fireLevel = 0; logEvent(world, '火势熄灭', `(${tile.x}, ${tile.z}) 的火势被湿度与时间压制，燃烧后的灰分留在土地上。`, 'neutral'); }
}

function stepMortalSimulation(world: World, realSeconds: number, speed = 1): void {
  if (world.status !== 'running' || realSeconds <= 0) return;
  world.elapsedSeconds += realSeconds * speed;
  world.turnElapsedSeconds += realSeconds * speed;
  const days = Math.min(0.15, realSeconds) * speed / CONFIG.secondsPerDay;
  world.elapsedDays += days;
  world.divinePower = clamp(world.divinePower + CONFIG.powerPerDay * days, 0, 100);
  if (world.pressureEvent && world.pressureEvent.remainingDays > 0) {
    world.pressureEvent.remainingDays = Math.max(0, world.pressureEvent.remainingDays - days);
    if (world.pressureEvent.remainingDays === 0) logEvent(world, `${world.pressureEvent.title}结束`, '压力事件的直接影响已结束，居民仍需处理已经造成的资源与人口后果。', 'neutral');
  }
  world.effects = world.effects.filter((effect) => {
    effect.remainingDays -= days;
    return effect.remainingDays > 0;
  });
  updateEnvironment(world, days);
  const departed: Agent[] = [];
  const pressure = activePressureEvent(world);
  for (const agent of world.agents) {
    agent.hunger = clamp(agent.hunger + CONFIG.hungerPerDay * days * (pressure?.foodConsumptionMultiplier ?? 1), 0, 1.4);
    if (agent.hunger > 1.03) agent.starvationDays += days;
    else agent.starvationDays = Math.max(0, agent.starvationDays - days * 0.6);
    if (agent.starvationDays > CONFIG.starvationGraceDays) { departed.push(agent); continue; }
    agent.thinkIn -= days;
    if (agent.thinkIn <= 0) {
      evaluateAgent(world, agent);
      agent.thinkIn = CONFIG.thinkEveryDays;
    }
    const remaining = distanceToTarget(agent, agent.currentTarget);
    if (remaining > 0.49) {
      const movementTile = tileAt(world, agent.x, agent.z) ?? tileAt(world, agent.currentTarget.x, agent.currentTarget.z);
      const movementCost = movementTile ? getTileDerived(world, movementTile).movementCost : 1;
      const move = Math.min(remaining, CONFIG.movementPerDay * days / movementCost);
      const fraction = move / Math.max(remaining, 0.001);
      agent.x += (agent.currentTarget.x - agent.x) * fraction;
      agent.z += (agent.currentTarget.z - agent.z) * fraction;
    } else if (agent.currentAction === 'migrate') {
      const migrationTile = tileAt(world, agent.x, agent.z);
      if (migrationTile) emitActionEvent(world, agent.id, 'migrate', migrationTile, 1, { target: agent.currentTarget.label });
      evaluateAgent(world, agent);
    } else {
      updateProduction(world, agent, days);
    }
  }
  for (const agent of departed) {
    world.agents = world.agents.filter((item) => item.id !== agent.id);
    logEvent(world, `${agent.name} 离开了聚落`, '长期饥饿让这片土地不再适合居住。', 'warning');
  }

  const metrics = getMetrics(world);
  observeWorld(world, metrics);
  updatePopulation(world, days, metrics);
}

function copyMetrics(metrics: WorldMetrics): WorldMetrics { return { ...metrics }; }

function shuffle(world: World, values: string[]): string[] {
  const result = [...values];
  for (let i = result.length - 1; i > 0; i -= 1) {
    const j = Math.floor(random(world) * (i + 1));
    [result[i], result[j]] = [result[j], result[i]];
  }
  return result;
}

function drawOracle(world: World): string | undefined {
  const state = world.oracleDeck;
  if (!state.deck.length && state.discard.length) {
    state.deck = shuffle(world, state.discard);
    state.discard = [];
    logEvent(world, '神谕牌库重洗', '弃牌堆已洗回统一神谕牌库，继续维持手牌循环。', 'neutral');
  }
  const id = state.deck.shift();
  return id;
}

export function acquireOracle(world: World): { ok: boolean; message: string } {
  if (world.status !== 'running') return { ok: false, message: '这局已经结束，请先重新开始。' };
  if (world.phase !== 'divine') return { ok: false, message: '只有神之时可以获得神谕卡。' };
  if (world.turn <= CONFIG.turnsBeforeRevelation) return { ok: false, message: '前两个回合是静默观察期。' };
  if (world.departureActive) return { ok: false, message: '离神测试期间不能获得神谕卡。' };
  if (world.oracleAcquiredThisTurn) return { ok: false, message: '本回合已经获得过神谕卡。' };
  const cost = getOracleAcquisitionCost(world);
  if (world.divinePower < cost) return { ok: false, message: `神谕力量不足，需要 ${cost}。` };
  const id = drawOracle(world);
  if (!id) return { ok: false, message: '神谕牌库已经耗尽。' };
  world.divinePower -= cost;
  world.oracleDeck.hand.push(id);
  world.oracleAcquiredThisTurn = true;
  logEvent(world, '获得神谕卡', `支付 ${cost} 点神谕力量，获得 ${oracleCard(id)?.name ?? id}。`, 'neutral');
  return { ok: true, message: `获得 ${oracleCard(id)?.name ?? id}，消耗 ${cost} 点神谕力量。` };
}

function applyOracleCard(world: World, card: OracleCard, x: number, z: number): { ok: boolean; message: string } {
  if (!Number.isFinite(x) || !Number.isFinite(z) || x < 0 || z < 0 || x >= CONFIG.worldSize || z >= CONFIG.worldSize) return { ok: false, message: '目标地块超出世界范围。' };
  const cx = Math.max(0, Math.min(CONFIG.worldSize - 1, Math.round(x)));
  const cz = Math.max(0, Math.min(CONFIG.worldSize - 1, Math.round(z)));
  const affected = world.tiles.filter((tile) => distance(tile.x, tile.z, cx, cz) <= card.radius);
  if (!affected.length) return { ok: false, message: '目标地块无效。' };
  const before = {
    moisture: affected.reduce((sum, tile) => sum + tile.moisture, 0) / affected.length,
    fertility: affected.reduce((sum, tile) => sum + tile.fertility, 0) / affected.length,
    tree: affected.reduce((sum, tile) => sum + tile.treeAmount, 0) / affected.length,
    attraction: affected.reduce((sum, tile) => sum + tile.attraction, 0) / affected.length,
    ore: affected.reduce((sum, tile) => sum + tile.ore, 0) / affected.length,
  };
  let ignited = 0;
  let extinguished = 0;
  let ignitionPrevented = 0;
  for (const tile of affected) {
    if (card.impact === 'moisture') {
      if (card.effectKind === 'rain') tile.moisture = clamp(tile.moisture + card.magnitude);
      if (card.effectKind === 'drought') { tile.moisture = clamp(tile.moisture - card.magnitude); tile.heat = clamp(tile.heat + card.magnitude * 0.5); }
      if (card.effectKind === 'rain' && tile.fireLevel > 0) {
        const beforeFire = tile.fireLevel;
        tile.fireLevel = Math.max(0, tile.fireLevel - card.magnitude * 2.8);
        if (tile.fireLevel < beforeFire) extinguished += 1;
      }
    }
    if (card.impact === 'fertility') tile.fertility = clamp(tile.fertility + (card.effectKind === 'barren' ? -card.magnitude : card.magnitude));
    if (card.impact === 'tree' || card.impact === 'mixed') tile.treeAmount = clamp(Math.min(tile.baseTreeAmount, tile.treeAmount + card.magnitude * 0.35));
    if (card.impact === 'attraction' || card.impact === 'mixed') {
      tile.oracleBoost = clamp(tile.oracleBoost + (card.effectKind === 'drought' ? -card.magnitude : card.magnitude), -1, 1);
      tile.attraction = clamp(tile.baseAttraction + tile.oracleBoost + tile.waterSource * CONFIG.environment.springAttraction);
    }
    if (card.impact === 'ore') tile.ore = clamp(tile.ore + card.magnitude);
    if (card.effectKind !== 'spring' && card.effectKind !== 'fire') tile.effects.push({ kind: card.effectKind, magnitude: card.magnitude, remainingDays: card.duration });
    if (card.id === 'oracle-lightning') {
      if (tile.moisture >= 0.7) ignitionPrevented += 1;
      else { tile.fireLevel = Math.max(tile.fireLevel, 1); tile.effects.push({ kind: 'fire', magnitude: 1, remainingDays: card.duration }); ignited += 1; }
    }
  }
  if (card.impact === 'water') {
    const tile = tileAt(world, cx, cz);
    if (tile) {
      tile.waterSource = 1;
      tile.moisture = clamp(tile.moisture + 0.12);
      tile.attraction = clamp(tile.attraction + CONFIG.environment.springAttraction);
      tile.effects.push({ kind: 'spring', magnitude: 1, remainingDays: card.duration });
    }
  }
  world.effects.push({ kind: card.effectKind, x: cx, z: cz, radius: card.radius || 1.1, remainingDays: card.duration });
  const after = {
    moisture: affected.reduce((sum, tile) => sum + tile.moisture, 0) / affected.length,
    fertility: affected.reduce((sum, tile) => sum + tile.fertility, 0) / affected.length,
    tree: affected.reduce((sum, tile) => sum + tile.treeAmount, 0) / affected.length,
    attraction: affected.reduce((sum, tile) => sum + tile.attraction, 0) / affected.length,
    ore: affected.reduce((sum, tile) => sum + tile.ore, 0) / affected.length,
  };
  const fireLabel = ignited ? `，${ignited} 格起火` : ignitionPrevented ? `，${ignitionPrevented} 格因湿度过高未起火` : extinguished ? `，${extinguished} 格火势被压低` : '';
  const changeLabels: Record<OracleImpact, string> = {
    moisture: `湿度 ${Math.round(before.moisture * 100)}% → ${Math.round(after.moisture * 100)}%`,
    fertility: `肥力 ${Math.round(before.fertility * 100)}% → ${Math.round(after.fertility * 100)}%`,
    tree: `树木量 ${Math.round(before.tree * 100)}% → ${Math.round(after.tree * 100)}%`,
    water: '水源变为持续存在',
    attraction: `定居吸引力 ${Math.round(before.attraction * 100)}% → ${Math.round(after.attraction * 100)}%`,
    ore: `矿脉量 ${Math.round(before.ore * 100)}% → ${Math.round(after.ore * 100)}%`,
    fire: '火势与灰分状态改变',
    mixed: `树木量 ${Math.round(before.tree * 100)}% → ${Math.round(after.tree * 100)}%，定居吸引力 ${Math.round(before.attraction * 100)}% → ${Math.round(after.attraction * 100)}%`,
  };
  if (ignited) world.effects.push({ kind: 'fire', x: cx, z: cz, radius: card.radius || 1.1, remainingDays: card.duration });
  logEvent(world, `${card.name}改变世界条件`, `${card.description}；目标 (${cx}, ${cz})，${changeLabels[card.impact]}${fireLabel}。居民会依据改变后的 Tile 状态自行调整。`, card.effectKind === 'rain' || card.effectKind === 'spring' ? 'good' : 'warning');
  return { ok: true, message: `${card.name} 已施放；只改变了 ${affected.length} 块 Tile 的事实。` };
}

export function playOracle(world: World, cardId: string, x: number, z: number): { ok: boolean; message: string } {
  if (world.status !== 'running') return { ok: false, message: '这局已经结束，请先重新开始。' };
  if (world.phase !== 'divine' && world.phase !== 'divine-targeting') return { ok: false, message: '只有神之时可以施放神谕。' };
  if (world.turn <= CONFIG.turnsBeforeRevelation) return { ok: false, message: '前两个回合是静默观察期。' };
  if (world.departureActive) return { ok: false, message: '离神测试期间不能施放神谕。' };
  if (world.oraclePlaysThisTurn >= CONFIG.maxOraclePlaysPerTurn) return { ok: false, message: '本回合最多确认两张神谕。' };
  const card = oracleCard(cardId);
  if (!card) return { ok: false, message: '神谕不存在。' };
  const state = world.oracleDeck;
  if (!state.hand.includes(card.id)) return { ok: false, message: '这张神谕不在当前手牌中。' };
  state.hand = state.hand.filter((id) => id !== card.id);
  state.discard.push(card.id);
  world.oraclePlaysThisTurn += 1;
  const result = applyOracleCard(world, card, x, z);
  if (!result.ok) {
    state.discard = state.discard.filter((id) => id !== card.id);
    state.hand.push(card.id);
    world.oraclePlaysThisTurn -= 1;
    return result;
  }
  return result;
}

export function discardOracle(world: World, cardId: string): { ok: boolean; message: string } {
  if (world.phase !== 'divine' && world.phase !== 'divine-targeting') return { ok: false, message: '只有神之时可以弃牌。' };
  if (world.manualDiscardsThisTurn >= CONFIG.manualDiscardLimit) return { ok: false, message: '本回合主动弃牌次数已用尽。' };
  const state = world.oracleDeck;
  if (!state.hand.includes(cardId)) return { ok: false, message: '这张神谕不在手牌中。' };
  state.hand = state.hand.filter((id) => id !== cardId);
  state.discard.push(cardId);
  world.manualDiscardsThisTurn += 1;
  logEvent(world, '主动弃牌', `弃置 ${oracleCard(cardId)?.name ?? cardId}；下回合可再次支付代价获得神谕卡。`, 'neutral');
  return { ok: true, message: '已弃牌。' };
}

function evaluateCovenants(world: World, before: WorldMetrics, after: WorldMetrics): string[] {
  const events = world.actionEvents.filter((event) => event.id >= world.turnActionEventStart);
  const feedback: string[] = [];
  for (const covenant of world.covenants) {
    if (!covenant.active) continue;
    const eligible = events.filter((event) => {
      if (covenant.condition === 'dense-forest') return Number(event.contextSnapshot?.treeAmountBefore ?? 0) > 0.7;
      if (covenant.condition === 'near-water') return world.tiles.some((tile) => tile.waterSource > 0 && distance(tile.x, tile.z, event.tileCoord.x, event.tileCoord.z) <= 3);
      if (covenant.condition === 'far-from-settlement') return !world.buildings.some((building) => building.kind === 'house' && distance(building.x, building.z, event.tileCoord.x, event.tileCoord.z) < 7);
      return true;
    });
    const supportEvents = eligible.filter((event) => covenant.supportOn.includes(event.actionType));
    const strainEvents = eligible.filter((event) => covenant.strainOn.includes(event.actionType));
    const normalizedSupport = clamp(supportEvents.length / Math.max(4, before.population * 0.7));
    const normalizedStrain = clamp(strainEvents.length / Math.max(3, before.population * 0.45));
    if (normalizedSupport > 0 || normalizedStrain > 0) feedback.push(`${covenant.name}：神恩 ${supportEvents.length} 次（${Math.round(normalizedSupport * 100)}%），神罚 ${strainEvents.length} 次（${Math.round(normalizedStrain * 100)}%）`);
  }
  if (after.foodScarcity > before.foodScarcity + 0.08) feedback.push('食物稀缺上升，农业与开垦会获得更高 Utility');
  return feedback;
}

function resolveTurn(world: World): void {
  const before = world.turnMetricsBefore ?? getMetrics(world);
  const after = getMetrics(world);
  const events = world.actionEvents.filter((event) => event.id >= world.turnActionEventStart);
  const tileChanges: string[] = [];
  if (after.averageMoisture !== before.averageMoisture) tileChanges.push(`平均湿度 ${Math.round(before.averageMoisture * 100)}% → ${Math.round(after.averageMoisture * 100)}%`);
  if (after.averageFertility !== before.averageFertility) tileChanges.push(`平均肥力 ${Math.round(before.averageFertility * 100)}% → ${Math.round(after.averageFertility * 100)}%`);
  if (after.forestRemaining !== before.forestRemaining) tileChanges.push(`森林总量 ${before.forestRemaining.toFixed(1)} → ${after.forestRemaining.toFixed(1)}`);
  const residentChanges = [`${events.length} 个居民 ActionEvent`, `人口 ${before.population} → ${after.population}`];
  const pressure = activePressureEvent(world);
  const pressureEvents = world.pressureEvent?.turn === world.turn
    ? [`${world.pressureEvent.title}：${world.pressureEvent.detail}`, `压力仍在持续，预计还剩 ${world.pressureEvent.remainingDays.toFixed(1)} 天。`]
    : pressure
      ? [`${pressure.title}仍在持续，预计还剩 ${pressure.remainingDays.toFixed(1)} 天。`]
      : [];
  const civilizationChanges = [...pressureEvents, `食物稀缺 ${Math.round(before.foodScarcity * 100)}% → ${Math.round(after.foodScarcity * 100)}%`, `住房压力 ${Math.round(before.housingPressure * 100)}% → ${Math.round(after.housingPressure * 100)}%`];
  const covenantChanges = evaluateCovenants(world, before, after);
  const causalChain = `${tileChanges[0] ?? 'Tile 条件保持稳定'} → ${residentChanges[0]} → ${civilizationChanges[0]} → ${covenantChanges[0] ?? '本回合没有神约收入'}`;
  const summary: TurnSummary = { turn: world.turn, metricsBefore: copyMetrics(before), metricsAfter: copyMetrics(after), tileChanges, residentChanges, civilizationChanges, covenantChanges, pressureEvents, causalChain, verdict: 'running' };
  world.lastSummary = summary;
  world.turnSummaries.unshift(summary);
  world.turnSummaries.length = Math.min(world.turnSummaries.length, CONFIG.prototypeTurns);
  world.phase = 'resolution';
  logEvent(world, `第 ${world.turn} 回合结算`, causalChain, covenantChanges.length ? 'good' : 'neutral');
}

export function endDivinePhase(world: World): { ok: boolean; message: string } {
  if (world.phase !== 'divine') return { ok: false, message: '当前不在神之时。' };
  world.phase = world.departureActive ? 'departure' : 'mortal';
  world.turnElapsedSeconds = 0;
  logEvent(world, world.departureActive ? '离神测试开始' : `第 ${world.turn} 回合进入凡人之时`, world.departureActive ? `还需观察 ${world.departureTurnsRemaining} 回合，神谕已禁用。` : '居民将自主行动，玩家只能观察。', 'neutral');
  return { ok: true, message: world.departureActive ? '离神测试开始。' : '凡人阶段开始，居民将自主行动。' };
}

export function advanceFromResolution(world: World): { ok: boolean; message: string } {
  if (world.phase !== 'resolution') return { ok: false, message: '当前没有待处理的回合结算。' };
  if (world.departureActive) {
    if (world.departureTurnsRemaining <= 0) return { ok: false, message: '离神测试已经结束。' };
    world.turn += 1;
    world.turnElapsedSeconds = 0;
    world.phase = 'departure';
    return { ok: true, message: `继续离神测试，还剩 ${world.departureTurnsRemaining} 回合。` };
  }
  world.turn += 1;
  world.turnElapsedSeconds = 0;
  world.oraclePlaysThisTurn = 0;
  world.manualDiscardsThisTurn = 0;
  world.oracleAcquiredThisTurn = false;
  if (world.revelationCount === 0 && world.turn > CONFIG.turnsBeforeRevelation) {
    openRevelation(world);
    return { ok: true, message: '启示降临，请选择第一条神约。' };
  }
  world.phase = 'turn-start';
  return { ok: true, message: `准备第 ${world.turn} 回合。` };
}

export function stepWorld(world: World, realSeconds: number, speed = 1): void {
  if (world.status !== 'running' || realSeconds <= 0) return;
  if (world.phase === 'turn-start') {
    world.phase = world.departureActive ? 'departure' : 'divine';
    world.turnActionEventStart = world.nextActionEventId;
    world.turnMetricsBefore = getMetrics(world);
    world.oraclePlaysThisTurn = 0;
    world.manualDiscardsThisTurn = 0;
    world.oracleAcquiredThisTurn = false;
    triggerPressureEvent(world);
    return;
  }
  if (world.phase !== 'mortal' && world.phase !== 'departure') return;
  stepMortalSimulation(world, realSeconds, speed);
  if (world.turnElapsedSeconds >= CONFIG.mortalPhaseSeconds) {
    if (world.phase === 'departure') {
      world.departureTurnsRemaining = Math.max(0, world.departureTurnsRemaining - 1);
    }
    resolveTurn(world);
    if (world.departureActive && world.departureTurnsRemaining <= 0) {
      const metrics = getMetrics(world);
      const failureReasons: string[] = [];
      if (metrics.population < CONFIG.startingPopulation) failureReasons.push(`人口降至 ${metrics.population}`);
      if (metrics.foodSecurity <= 0.42) failureReasons.push(`食物安全度 ${Math.round(metrics.foodSecurity * 100)}%`);
      if (metrics.housingCoverage < 0.6) failureReasons.push(`住房覆盖 ${Math.round(metrics.housingCoverage * 100)}%`);
      if (metrics.forestRemaining <= metrics.forestInitial * 0.2) failureReasons.push('森林资源耗尽');
      const maintained = failureReasons.length === 0;
      world.lastSummary!.verdict = maintained ? 'maintain' : 'collapse';
      world.status = maintained ? 'won' : 'lost';
      logEvent(world, maintained ? '离神测试通过' : '离神测试失败', maintained ? '文明在没有神谕的情况下维持了基本生活。' : `失败原因：${failureReasons.join('、')}。`, maintained ? 'good' : 'warning');
    }
    if (!world.departureActive && world.turn >= CONFIG.prototypeTurns) {
      world.lastSummary!.verdict = 'maintain';
      world.status = 'won';
      logEvent(world, '12 回合原型切片完成', '已完成两回合观察、神谕干预与第五回合压力事件。', 'good');
    }
  }
}

export function castMiracle(world: World, kind: MiracleKind, x: number, z: number): { ok: boolean; message: string } {
  const legacyIds: Record<MiracleKind, string> = { rain: 'oracle-rain', spring: 'oracle-spring', drought: 'oracle-drought', barren: 'oracle-blight', fire: 'oracle-lightning' };
  const card = oracleCard(legacyIds[kind]);
  if (!card) return { ok: false, message: '神谕不存在。' };
  return playOracle(world, card.id, x, z);
}

export function actionLabel(action: Action): string {
  if (action === 'migrate') return '迁居';
  return ACTION_LABELS[action];
}

export function terrainLabel(terrain: Terrain): string {
  return ({ grass: '普通土地', fertile: '肥沃土地', forest: '森林', stone: '石矿', water: '水源' })[terrain];
}


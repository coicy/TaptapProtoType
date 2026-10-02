export type SimulationStatus = 'running' | 'won';

export interface MyceliumNode {
  id: number;
  x: number;
  z: number;
  storedNutrient: number;
  isCore: boolean;
  age: number;
  connected: boolean;
  dying: boolean;
  deathTimer: number;
}

export interface MyceliumEdge {
  id: number;
  nodeA: number;
  nodeB: number;
  length: number;
  maintenanceCost: number;
  currentFlow: number;
  activity: number;
  dying: boolean;
}

export interface NutrientSource {
  id: number;
  x: number;
  z: number;
  value: number;
  label: string;
  radius: number;
  connected: boolean;
  flow: number;
}

export interface AttractionField { x: number; z: number; remaining: number; power: number; }
export interface SimEvent { time: number; title: string; detail: string; tone: 'good' | 'warning' | 'neutral'; }

export interface SimulationSnapshot {
  nodes: MyceliumNode[];
  edges: MyceliumEdge[];
  sources: NutrientSource[];
  fields: AttractionField[];
  events: SimEvent[];
  elapsed: number;
  nutrient: number;
  income: number;
  maintenance: number;
  connectedSources: number;
  edgeCount: number;
  tips: number;
  pressure: number;
  fruitingProgress: number;
  status: SimulationStatus;
  pruneCount: number;
  hoveredEdge: number | null;
  selectedEdge: number | null;
  previewNodes: Set<number>;
}

const WORLD_SIZE = 20;
const GROWTH_COST = .28;
const SOURCE_INCOME_RATE = .7;
const PRUNE_RECOVERY = .42;
const clamp = (n: number, min: number, max: number): number => Math.max(min, Math.min(max, n));
const dist = (a: { x: number; z: number }, b: { x: number; z: number }): number => Math.hypot(a.x - b.x, a.z - b.z);
const norm = (x: number, z: number): { x: number; z: number } => {
  const length = Math.hypot(x, z) || 1;
  return { x: x / length, z: z / length };
};

export class MyceliumSimulation {
  readonly worldSize = WORLD_SIZE;
  readonly corePosition = { x: 10, z: 10 };
  nodes = new Map<number, MyceliumNode>();
  edges = new Map<number, MyceliumEdge>();
  sources: NutrientSource[] = [];
  fields: AttractionField[] = [];
  events: SimEvent[] = [];
  status: SimulationStatus = 'running';
  elapsed = 0;
  nutrient = 17.5;
  income = 0;
  maintenance = 0;
  fruitingProgress = 0;
  pruneCount = 0;
  hoveredEdge: number | null = null;
  selectedEdge: number | null = null;
  previewNodes = new Set<number>();
  private nextNodeId = 1;
  private nextEdgeId = 1;
  private growthTimer = 0;
  private eventTimer = 0;
  private rngSeed = 240917;
  private tips = new Set<number>();

  constructor() { this.reset(); }

  reset(): void {
    this.nodes.clear(); this.edges.clear(); this.fields = []; this.events = [];
    this.status = 'running'; this.elapsed = 0; this.nutrient = 17.5; this.income = 0; this.maintenance = 0;
    this.fruitingProgress = 0; this.pruneCount = 0; this.hoveredEdge = null; this.selectedEdge = null; this.previewNodes.clear();
    this.nextNodeId = 1; this.nextEdgeId = 1; this.growthTimer = 0; this.eventTimer = 0; this.tips.clear(); this.rngSeed = 240917;
    const core = this.addNode(10, 10, true);
    const starters = [[9.2, 9.2], [10.8, 9.2], [9.3, 10.9]];
    for (const [x, z] of starters) { const node = this.addNode(x, z); this.addEdge(core.id, node.id); this.tips.add(node.id); }
    this.sources = [
      { id: 1, x: 4.4, z: 6.1, value: .95, label: '低营养 · 近岸', radius: 1.3, connected: false, flow: 0 },
      { id: 2, x: 14.6, z: 6.3, value: 1.35, label: '中营养 · 苔面', radius: 1.3, connected: false, flow: 0 },
      { id: 3, x: 16.7, z: 14.8, value: 2.1, label: '高营养 · 腐木', radius: 1.35, connected: false, flow: 0 },
      { id: 4, x: 4.8, z: 15.3, value: 1.2, label: '中营养 · 湿痕', radius: 1.3, connected: false, flow: 0 },
      { id: 5, x: 11.8, z: 3.5, value: .82, label: '低营养 · 细屑', radius: 1.25, connected: false, flow: 0 },
      { id: 6, x: 18.1, z: 9.4, value: 1.6, label: '中营养 · 木芯', radius: 1.3, connected: false, flow: 0 },
      { id: 7, x: 17.2, z: 4.0, value: 2.75, label: '高营养 · 繁殖区', radius: 1.45, connected: false, flow: 0 },
      { id: 8, x: 2.8, z: 11.2, value: .72, label: '低营养 · 孤岛', radius: 1.2, connected: false, flow: 0 },
    ];
    this.log('菌落开始呼吸', '局部规则已启动。先观察它会往哪里走。', 'neutral');
  }

  private random(): number { this.rngSeed = (Math.imul(this.rngSeed, 1664525) + 1013904223) >>> 0; return this.rngSeed / 4294967296; }
  private addNode(x: number, z: number, isCore = false): MyceliumNode { const node: MyceliumNode = { id: this.nextNodeId++, x, z, storedNutrient: 0, isCore, age: 0, connected: true, dying: false, deathTimer: 0 }; this.nodes.set(node.id, node); return node; }
  private addEdge(nodeA: number, nodeB: number): MyceliumEdge | undefined {
    if (nodeA === nodeB || this.findEdge(nodeA, nodeB)) return undefined;
    const a = this.nodes.get(nodeA); const b = this.nodes.get(nodeB); if (!a || !b) return undefined;
    const edge: MyceliumEdge = { id: this.nextEdgeId++, nodeA, nodeB, length: dist(a, b), maintenanceCost: dist(a, b) * .012 + .008, currentFlow: 0, activity: .1, dying: false };
    this.edges.set(edge.id, edge); return edge;
  }
  private findEdge(a: number, b: number): MyceliumEdge | undefined { return [...this.edges.values()].find((edge) => (edge.nodeA === a && edge.nodeB === b) || (edge.nodeA === b && edge.nodeB === a)); }
  private neighbors(nodeId: number, withoutEdge: number | null = null): Array<{ node: MyceliumNode; edge: MyceliumEdge }> {
    const result: Array<{ node: MyceliumNode; edge: MyceliumEdge }> = [];
    for (const edge of this.edges.values()) { if (edge.id === withoutEdge) continue; if (edge.nodeA !== nodeId && edge.nodeB !== nodeId) continue; const id = edge.nodeA === nodeId ? edge.nodeB : edge.nodeA; const node = this.nodes.get(id); if (node) result.push({ node, edge }); }
    return result;
  }

  induce(x: number, z: number): void { if (this.status === 'won') return; this.fields.push({ x, z, remaining: 7.5, power: 1 }); this.fields = this.fields.slice(-2); this.log('局部诱导落下', `菌落感知到 ${Math.round(x)}, ${Math.round(z)} 的微弱偏向。路线仍由它决定。`, 'good'); }
  hoverEdge(edgeId: number | null): void {
    this.hoveredEdge = edgeId;
    if (this.selectedEdge === null) this.previewNodes = edgeId === null ? new Set<number>() : this.previewFor(edgeId);
  }
  selectEdge(edgeId: number | null): void {
    this.selectedEdge = edgeId;
    this.hoveredEdge = edgeId;
    this.previewNodes = edgeId === null ? new Set<number>() : this.previewFor(edgeId);
  }
  private previewFor(edgeId: number): Set<number> {
    const connected = this.connectedFromCore(edgeId); const preview = new Set<number>();
    for (const id of this.nodes.keys()) if (!connected.has(id)) preview.add(id);
    return preview;
  }
  confirmPrune(): void {
    if (this.status === 'won' || this.selectedEdge === null) return;
    const edge = this.edges.get(this.selectedEdge); if (!edge) return;
    // Compute the affected connected components before mutating the graph.
    // This keeps the preview and the confirmed result identical.
    const lost = this.previewFor(edge.id);
    this.edges.delete(edge.id); this.pruneCount += 1;
    this.previewNodes = new Set(lost);
    const recycled = PRUNE_RECOVERY + lost.size * .12;
    this.nutrient = clamp(this.nutrient + recycled, 0, 40);
    this.log('剪枝完成', lost.size ? `${lost.size} 个节点失去菌核连通，回收 ${recycled.toFixed(1)} 单位营养，剩余资源正在重新分配。` : `环路被打开，回收 ${recycled.toFixed(1)} 单位营养，菌核仍可抵达所有区域。`, 'warning');
    this.selectedEdge = null; this.hoveredEdge = null;
    this.reconcileConnectivity();
  }

  private connectedFromCore(withoutEdge: number | null = null): Set<number> {
    const result = new Set<number>(); const core = [...this.nodes.values()].find((node) => node.isCore); if (!core) return result;
    const queue = [core.id]; result.add(core.id);
    while (queue.length) { const id = queue.shift()!; for (const { node } of this.neighbors(id, withoutEdge)) if (!result.has(node.id)) { result.add(node.id); queue.push(node.id); } }
    return result;
  }
  private reconcileConnectivity(): void {
    const connected = this.connectedFromCore();
    for (const node of this.nodes.values()) { if (node.isCore) continue; if (connected.has(node.id)) { node.connected = true; node.dying = false; node.deathTimer = 0; } else { node.connected = false; node.dying = true; } }
    for (const edge of this.edges.values()) { const a = this.nodes.get(edge.nodeA); const b = this.nodes.get(edge.nodeB); edge.dying = Boolean(a?.dying || b?.dying); }
    this.tips = new Set([...this.tips].filter((id) => this.nodes.get(id)?.connected && !this.nodes.get(id)?.dying));
  }

  private chooseDirection(node: MyceliumNode): { x: number; z: number } {
    const candidates: Array<{ x: number; z: number; score: number }> = [];
    for (let i = 0; i < 12; i += 1) {
      const angle = (i / 12) * Math.PI * 2;
      const direction = { x: Math.cos(angle), z: Math.sin(angle) };
      let score = this.random() * .24;
      for (const source of this.sources) { const to = { x: source.x - node.x, z: source.z - node.z }; const distance = Math.max(.7, Math.hypot(to.x, to.z)); const weight = source.value / distance; const towards = (to.x / distance) * direction.x + (to.z / distance) * direction.z; score += Math.max(0, towards) * weight * .72; }
      for (const field of this.fields) { const to = { x: field.x - node.x, z: field.z - node.z }; const distance = Math.max(.7, Math.hypot(to.x, to.z)); const towards = (to.x / distance) * direction.x + (to.z / distance) * direction.z; score += Math.max(0, towards) * field.power * Math.max(0, 1.8 - distance * .1); }
      const nx = node.x + direction.x * .76; const nz = node.z + direction.z * .76;
      if (nx < 1 || nz < 1 || nx > WORLD_SIZE - 1 || nz > WORLD_SIZE - 1) score -= 2;
      for (const other of this.nodes.values()) { const d = Math.hypot(nx - other.x, nz - other.z); if (other.id !== node.id && d < .62) score -= .8; }
      candidates.push({ ...direction, score });
    }
    candidates.sort((a, b) => b.score - a.score); return candidates[0] ?? { x: 1, z: 0 };
  }

  private growTip(tipId: number): void {
    const tip = this.nodes.get(tipId); if (!tip || !tip.connected || tip.dying || this.nutrient < GROWTH_COST) return;
    const direction = this.chooseDirection(tip); const length = .55 + this.random() * .32;
    const x = clamp(tip.x + direction.x * length, 1, WORLD_SIZE - 1); const z = clamp(tip.z + direction.z * length, 1, WORLD_SIZE - 1);
    const near = [...this.nodes.values()].filter((node) => node.id !== tip.id && node.connected && dist(node, { x, z }) < .7).sort((a, b) => dist(a, { x, z }) - dist(b, { x, z }))[0];
    let next: MyceliumNode | undefined;
    if (near && !this.findEdge(tip.id, near.id)) { this.addEdge(tip.id, near.id); next = near; }
    else { next = this.addNode(x, z); this.addEdge(tip.id, next.id); }
    this.nutrient -= GROWTH_COST;
    if (next && next.id !== tip.id) { this.tips.delete(tip.id); this.tips.add(next.id); }
    const branchChance = .14 + Math.min(.2, this.income * .03) + (this.fields.length ? .09 : 0);
    if (this.random() < branchChance) this.tips.add(tip.id);
  }

  private calculateTransport(dt: number): void {
    for (const edge of this.edges.values()) { edge.currentFlow = 0; edge.activity = .06; }
    for (const source of this.sources) { source.connected = false; source.flow = 0; const anchor = [...this.nodes.values()].filter((node) => node.connected && !node.dying && dist(node, source) < source.radius).sort((a, b) => dist(a, source) - dist(b, source))[0]; if (!anchor) continue; source.connected = true; source.flow = source.value; const parent = new Map<number, { prev: number; edge: MyceliumEdge }>(); const queue = [anchor.id]; const seen = new Set(queue); while (queue.length) { const id = queue.shift()!; if (this.nodes.get(id)?.isCore) break; for (const { node, edge } of this.neighbors(id)) if (node.connected && !node.dying && !seen.has(node.id)) { seen.add(node.id); parent.set(node.id, { prev: id, edge }); queue.push(node.id); } } let cursor = anchor.id; while (!this.nodes.get(cursor)?.isCore && parent.has(cursor)) { const step = parent.get(cursor)!; step.edge.currentFlow += source.value; cursor = step.prev; } }
    this.income = this.sources.reduce((sum, source) => sum + (source.connected ? source.value * SOURCE_INCOME_RATE : 0), 0);
    this.maintenance = [...this.edges.values()].reduce((sum, edge) => sum + (!edge.dying ? edge.maintenanceCost : 0), 0);
    for (const edge of this.edges.values()) { edge.activity = clamp(edge.currentFlow / 4.4, .035, 1); }
    this.nutrient = clamp(this.nutrient + (this.income - this.maintenance) * dt, 0, 40);
    const target = this.sources.find((source) => source.id === 7); const fruitful = Boolean(target?.connected && target.flow > 0 && this.pruneCount > 0 && this.income > this.maintenance * .78 && this.edges.size > 8);
    this.fruitingProgress = fruitful ? clamp(this.fruitingProgress + dt / 7.5, 0, 1) : Math.max(0, this.fruitingProgress - dt * .08);
    if (this.fruitingProgress >= 1 && this.status === 'running') { this.status = 'won'; this.log('子实体出现', '繁殖区积累了足够的流量。网络自己找到了出口。', 'good'); }
  }

  private cleanDead(dt: number): void {
    const connected = this.connectedFromCore();
    for (const node of [...this.nodes.values()]) { if (node.isCore || connected.has(node.id)) continue; node.deathTimer += dt; if (node.deathTimer > 3.2) { this.nodes.delete(node.id); this.tips.delete(node.id); } }
    for (const edge of [...this.edges.values()]) if (!this.nodes.has(edge.nodeA) || !this.nodes.has(edge.nodeB)) this.edges.delete(edge.id);
  }

  step(dt: number): void {
    if (this.status === 'won') { this.elapsed += dt; this.calculateTransport(dt); return; }
    this.elapsed += dt; for (const field of this.fields) field.remaining -= dt; this.fields = this.fields.filter((field) => field.remaining > 0);
    for (const node of this.nodes.values()) node.age += dt;
    this.calculateTransport(dt);
    this.growthTimer += dt;
    if (this.growthTimer > .68) { this.growthTimer = 0; const tips = [...this.tips]; for (const tip of tips) this.growTip(tip); this.reconcileConnectivity(); }
    this.cleanDead(dt);
    this.eventTimer += dt;
    if (this.eventTimer > 2.6) { this.eventTimer = 0; const connected = this.sources.filter((source) => source.connected).length; if (connected >= 2 && !this.events.some((event) => event.title === '运输网络成形')) this.log('运输网络成形', `${connected} 个营养源已经接入菌核，流量开始在主干上汇聚。`, 'good'); if (this.edges.size > 22 && this.maintenance > this.income && !this.events.some((event) => event.title === '扩张压力上升')) this.log('扩张压力上升', '维护成本正在接近收入。也许继续生长并不总是好事。', 'warning'); if (this.pruneCount > 0 && !this.events.some((event) => event.title === '重组开始')) this.log('重组开始', '剪枝打开了新的流量分配，剩余网络正在变亮。', 'good'); }
  }

  private log(title: string, detail: string, tone: SimEvent['tone']): void { this.events.unshift({ time: this.elapsed, title, detail, tone }); this.events = this.events.slice(0, 5); }
  snapshot(): SimulationSnapshot { return { nodes: [...this.nodes.values()], edges: [...this.edges.values()], sources: this.sources.map((source) => ({ ...source })), fields: this.fields.map((field) => ({ ...field })), events: [...this.events], elapsed: this.elapsed, nutrient: this.nutrient, income: this.income, maintenance: this.maintenance, connectedSources: this.sources.filter((source) => source.connected).length, edgeCount: this.edges.size, tips: this.tips.size, pressure: clamp(this.maintenance / Math.max(.1, this.income + .25), 0, 2), fruitingProgress: this.fruitingProgress, status: this.status, pruneCount: this.pruneCount, hoveredEdge: this.hoveredEdge, selectedEdge: this.selectedEdge, previewNodes: new Set(this.previewNodes) }; }
}

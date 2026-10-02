import * as THREE from 'three';
import { MyceliumSimulation, type MyceliumEdge, type MyceliumNode, type NutrientSource, type SimulationSnapshot } from './mycelium';
import './style.css';

const sim = new MyceliumSimulation();
const clamp = (value: number, min: number, max: number): number => Math.max(min, Math.min(max, value));
const scene = new THREE.Scene();
scene.background = new THREE.Color('#07100e');
scene.fog = new THREE.Fog('#07100e', 22, 42);
const camera = new THREE.OrthographicCamera(-12, 12, 9, -9, .1, 100);
camera.position.set(0, 15.5, 15.5); camera.lookAt(0, 0, 0);
const renderer = new THREE.WebGLRenderer({ antialias: true, alpha: false, powerPreference: 'high-performance' });
renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2)); renderer.setSize(window.innerWidth, window.innerHeight); renderer.shadowMap.enabled = true; renderer.shadowMap.type = THREE.PCFSoftShadowMap; renderer.outputColorSpace = THREE.SRGBColorSpace;
renderer.domElement.id = 'scene'; renderer.domElement.style.zIndex = '0';
const appRoot = document.getElementById('app'); if (!appRoot) throw new Error('App root missing'); appRoot.insertBefore(renderer.domElement, appRoot.firstChild);
const hitLayer = document.createElement('div'); hitLayer.id = 'scene-hit'; appRoot.insertBefore(hitLayer, document.getElementById('hud'));

const ambient = new THREE.HemisphereLight('#b5e5c9', '#08110d', 1.45); scene.add(ambient);
const sun = new THREE.DirectionalLight('#d8ffe0', 2.3); sun.position.set(-5, 15, 6); sun.castShadow = true; scene.add(sun);
const fill = new THREE.PointLight('#78d6ac', 1.8, 25); fill.position.set(0, 5, 0); scene.add(fill);

const terrain = new THREE.Group(); const sourceGroup = new THREE.Group(); const networkGroup = new THREE.Group(); const fieldGroup = new THREE.Group(); const fruitGroup = new THREE.Group();
scene.add(terrain, sourceGroup, networkGroup, fieldGroup, fruitGroup);
const edgeMeshes = new Map<number, THREE.Mesh>(); const nodeMeshes = new Map<number, THREE.Mesh>(); const sourceMeshes = new Map<number, THREE.Group>(); const fieldMeshes: THREE.Group[] = [];
const colors = { ground: '#101f19', grid: '#234337', edge: '#61d3a4', hot: '#d9ffa6', dying: '#657d73', amber: '#f6c67c', source: '#b3f5c8' };

function mapX(x: number): number { return x - 10; } function mapZ(z: number): number { return z - 10; }
function roundedRect(width: number, depth: number, color: string): THREE.Mesh { const mesh = new THREE.Mesh(new THREE.BoxGeometry(width, .13, depth), new THREE.MeshStandardMaterial({ color, roughness: .94 })); mesh.receiveShadow = true; return mesh; }
function buildTerrain(): void {
  const base = roundedRect(21, 21, colors.ground); base.position.y = -.12; terrain.add(base);
  const grid = new THREE.Group(); const lineMat = new THREE.LineBasicMaterial({ color: colors.grid, transparent: true, opacity: .38 });
  for (let i = 0; i <= 20; i += 1) { const p = i - 10; const a = new THREE.BufferGeometry().setFromPoints([new THREE.Vector3(-10, .01, p), new THREE.Vector3(10, .01, p)]); const b = new THREE.BufferGeometry().setFromPoints([new THREE.Vector3(p, .01, -10), new THREE.Vector3(p, .01, 10)]); grid.add(new THREE.Line(a, lineMat), new THREE.Line(b, lineMat)); }
  terrain.add(grid);
  const rim = new THREE.Mesh(new THREE.BoxGeometry(21.2, .32, 21.2), new THREE.MeshStandardMaterial({ color: '#0b1712', roughness: 1 })); rim.position.y = -.3; terrain.add(rim);
  const dish = new THREE.Mesh(new THREE.CircleGeometry(9.9, 64), new THREE.MeshStandardMaterial({ color: '#0d1e17', roughness: 1, transparent: true, opacity: .9 })); dish.rotation.x = -Math.PI / 2; dish.position.y = .015; terrain.add(dish);
}
buildTerrain();

function nodePosition(node: { x: number; z: number }, y = .24): THREE.Vector3 { return new THREE.Vector3(mapX(node.x), y, mapZ(node.z)); }
function createEdgeMesh(edge: MyceliumEdge): THREE.Mesh { const material = new THREE.MeshStandardMaterial({ color: colors.edge, emissive: colors.edge, emissiveIntensity: 1.1, roughness: .58, transparent: true, opacity: .92 }); const mesh = new THREE.Mesh(new THREE.CylinderGeometry(.06, .06, 1, 8), material); mesh.userData.edgeId = edge.id; mesh.castShadow = true; networkGroup.add(mesh); edgeMeshes.set(edge.id, mesh); return mesh; }
function updateEdgeMesh(edge: MyceliumEdge): void {
  const a = sim.nodes.get(edge.nodeA); const b = sim.nodes.get(edge.nodeB); const mesh = edgeMeshes.get(edge.id); if (!a || !b || !mesh) return;
  const start = nodePosition(a); const end = nodePosition(b); const delta = end.clone().sub(start); const length = delta.length(); mesh.position.copy(start.clone().add(end).multiplyScalar(.5)); mesh.scale.setScalar(1); mesh.scale.y = length; mesh.quaternion.setFromUnitVectors(new THREE.Vector3(0, 1, 0), delta.normalize());
  const snapshot = sim.snapshot(); const material = mesh.material as THREE.MeshStandardMaterial; const preview = snapshot.previewNodes.has(a.id) || snapshot.previewNodes.has(b.id); const active = edge.activity; const focused = snapshot.selectedEdge ?? snapshot.hoveredEdge; material.color.set(edge.dying || preview ? colors.dying : active > .42 ? colors.hot : colors.edge); material.emissive.set(edge.dying || preview ? '#18251f' : active > .42 ? '#c5ff85' : '#2ca57d'); material.emissiveIntensity = edge.dying ? .08 : .65 + active * 1.3; material.opacity = edge.dying ? .4 : .72 + active * .25; const radius = edge.dying ? .06 : .07 + active * .075 + (focused === edge.id ? .055 : 0); mesh.scale.x = radius / .06; mesh.scale.z = radius / .06; mesh.renderOrder = focused === edge.id ? 4 : 1;
}
function updateNodeMesh(node: MyceliumNode, snapshot: SimulationSnapshot): void {
  let mesh = nodeMeshes.get(node.id); if (!mesh) { const material = new THREE.MeshStandardMaterial({ color: node.isCore ? '#f1ffc9' : '#72deb1', emissive: node.isCore ? '#bfff91' : '#28bd8d', emissiveIntensity: node.isCore ? 1.8 : 1.1, roughness: .4, transparent: true }); mesh = new THREE.Mesh(new THREE.IcosahedronGeometry(node.isCore ? .34 : .12, 1), material); mesh.castShadow = true; networkGroup.add(mesh); nodeMeshes.set(node.id, mesh); }
  mesh.position.copy(nodePosition(node, node.isCore ? .34 : .22)); const material = mesh.material as THREE.MeshStandardMaterial; const preview = snapshot.previewNodes.has(node.id); material.color.set(preview || node.dying ? colors.dying : node.isCore ? '#f4ffcf' : '#73deb5'); material.emissive.set(preview || node.dying ? '#15211c' : node.isCore ? '#cbff89' : '#2fca94'); material.emissiveIntensity = preview || node.dying ? .1 : node.isCore ? 1.8 : .7 + Math.sin(snapshot.elapsed * 2 + node.id) * .18; material.opacity = node.dying ? .34 : 1; mesh.scale.setScalar(node.isCore ? 1 + Math.sin(snapshot.elapsed * 1.7) * .05 : 1); mesh.userData.nodeId = node.id;
}

function createSourceMesh(source: NutrientSource): THREE.Group { const group = new THREE.Group(); group.userData.sourceId = source.id; const color = source.value > 2 ? '#deff9d' : source.value > 1.1 ? '#86e4b4' : '#6ab795'; const crystal = new THREE.Mesh(new THREE.OctahedronGeometry(source.value > 2 ? .24 : .17, 0), new THREE.MeshStandardMaterial({ color, emissive: color, emissiveIntensity: 1.3, roughness: .38, transparent: true, opacity: .92 })); crystal.position.y = .23; crystal.castShadow = true; group.add(crystal); const ring = new THREE.Mesh(new THREE.RingGeometry(source.radius * .63, source.radius * .67, 32), new THREE.MeshBasicMaterial({ color, transparent: true, opacity: .12, side: THREE.DoubleSide })); ring.rotation.x = -Math.PI / 2; ring.position.y = .03; group.add(ring); const halo = new THREE.Mesh(new THREE.CircleGeometry(source.radius * .37, 32), new THREE.MeshBasicMaterial({ color, transparent: true, opacity: .07, side: THREE.DoubleSide })); halo.rotation.x = -Math.PI / 2; halo.position.y = .025; group.add(halo); group.position.set(mapX(source.x), 0, mapZ(source.z)); sourceGroup.add(group); sourceMeshes.set(source.id, group); return group; }
function updateSource(source: NutrientSource, snapshot: SimulationSnapshot): void { const group = sourceMeshes.get(source.id) ?? createSourceMesh(source); group.position.y = Math.sin(snapshot.elapsed * 1.3 + source.id) * .025; const crystal = group.children[0] as THREE.Mesh; const ring = group.children[1] as THREE.Mesh; const material = crystal.material as THREE.MeshStandardMaterial; material.emissiveIntensity = source.connected ? 1.8 : 1.05; material.opacity = source.connected ? .98 : .62; ring.scale.setScalar(source.connected ? 1.07 + Math.sin(snapshot.elapsed * 2 + source.id) * .07 : 1); ring.rotation.z = snapshot.elapsed * .08; }
function updateFields(snapshot: SimulationSnapshot): void { while (fieldMeshes.length < snapshot.fields.length) { const group = new THREE.Group(); const outer = new THREE.Mesh(new THREE.RingGeometry(.8, .84, 48), new THREE.MeshBasicMaterial({ color: '#d0ffa5', transparent: true, opacity: .46, side: THREE.DoubleSide })); outer.rotation.x = -Math.PI / 2; const inner = new THREE.Mesh(new THREE.CircleGeometry(.65, 48), new THREE.MeshBasicMaterial({ color: '#94d985', transparent: true, opacity: .07, side: THREE.DoubleSide })); inner.rotation.x = -Math.PI / 2; group.add(outer, inner); fieldGroup.add(group); fieldMeshes.push(group); } fieldMeshes.forEach((group, index) => { const field = snapshot.fields[index]; group.visible = Boolean(field); if (!field) return; group.position.set(mapX(field.x), .045, mapZ(field.z)); const pulse = 1 + Math.sin(snapshot.elapsed * 4.2 + index) * .12; group.scale.setScalar(pulse); group.children[0].scale.setScalar(1.2 + (7.5 - field.remaining) * .12); }); }
function updateFruit(snapshot: SimulationSnapshot): void { fruitGroup.visible = snapshot.fruitingProgress > .12 || snapshot.status === 'won'; if (!fruitGroup.visible) return; const target = snapshot.sources.find((source) => source.id === 7); if (!target) return; if (!fruitGroup.children.length) { for (let i = 0; i < 3; i += 1) { const group = new THREE.Group(); const stem = new THREE.Mesh(new THREE.CylinderGeometry(.045, .07, .3 + i * .08, 8), new THREE.MeshStandardMaterial({ color: '#e0c79a', roughness: .8 })); stem.position.y = .24; const cap = new THREE.Mesh(new THREE.SphereGeometry(.18 + i * .035, 14, 8, 0, Math.PI * 2, 0, Math.PI / 2), new THREE.MeshStandardMaterial({ color: i === 2 ? '#f3bd7c' : '#b8e68d', emissive: i === 2 ? '#8e4e29' : '#6fa04e', emissiveIntensity: .7, roughness: .5 })); cap.position.y = .42 + i * .08; group.add(stem, cap); group.position.set(mapX(target.x) + (i - 1) * .24, 0, mapZ(target.z) + (i % 2 ? .2 : -.1)); fruitGroup.add(group); } } fruitGroup.position.y = Math.min(1, snapshot.fruitingProgress) * .5; fruitGroup.children.forEach((child, i) => { child.rotation.y = Math.sin(snapshot.elapsed * .6 + i) * .08; }); }

const raycaster = new THREE.Raycaster(); const pointer = new THREE.Vector2(); const ground = new THREE.Plane(new THREE.Vector3(0, 1, 0), 0); let mode: 'induce' | 'prune' = 'induce'; let lastSnapshot = sim.snapshot();
function pointerToWorld(event: PointerEvent): THREE.Vector3 | null { const rect = renderer.domElement.getBoundingClientRect(); pointer.x = ((event.clientX - rect.left) / rect.width) * 2 - 1; pointer.y = -((event.clientY - rect.top) / rect.height) * 2 + 1; raycaster.setFromCamera(pointer, camera); const world = new THREE.Vector3(); return raycaster.ray.intersectPlane(ground, world) ? world : null; }
function setMode(next: 'induce' | 'prune'): void { mode = next; document.querySelectorAll<HTMLButtonElement>('.mode-button').forEach((button) => button.classList.toggle('active', button.dataset.mode === next)); renderer.domElement.style.cursor = next === 'induce' ? 'crosshair' : 'pointer'; document.getElementById('prune-card')?.classList.toggle('hidden', next !== 'prune'); if (next === 'induce') sim.selectEdge(null); }
hitLayer.addEventListener('pointermove', (event) => { if (mode !== 'prune') return; pointerToWorld(event); raycaster.setFromCamera(pointer, camera); const hit = raycaster.intersectObjects([...edgeMeshes.values()], false)[0]; sim.hoverEdge(hit ? Number(hit.object.userData.edgeId) : null); });
hitLayer.addEventListener('click', (event) => { const world = pointerToWorld(event); if (!world || lastSnapshot.status === 'won') return; if (mode === 'induce') sim.induce(clamp(world.x + 10, 1, 19), clamp(world.z + 10, 1, 19)); else { raycaster.setFromCamera(pointer, camera); const hit = raycaster.intersectObjects([...edgeMeshes.values()], false)[0]; sim.selectEdge(hit ? Number(hit.object.userData.edgeId) : null); } });
document.querySelectorAll<HTMLButtonElement>('.mode-button').forEach((button) => button.addEventListener('click', () => setMode(button.dataset.mode as 'induce' | 'prune')));
document.getElementById('confirm-prune')?.addEventListener('click', () => sim.confirmPrune());
document.getElementById('reset-button')?.addEventListener('click', () => { sim.reset(); setMode('induce'); });
document.getElementById('win-reset')?.addEventListener('click', () => { sim.reset(); setMode('induce'); document.getElementById('win-card')?.classList.add('hidden'); });

function formatTime(seconds: number): string { const s = Math.floor(seconds); return `${String(Math.floor(s / 60)).padStart(2, '0')}:${String(s % 60).padStart(2, '0')}`; }
function updateHud(snapshot: SimulationSnapshot): void {
  document.getElementById('time-readout')!.textContent = formatTime(snapshot.elapsed);
  document.getElementById('nutrient-readout')!.textContent = `${snapshot.nutrient.toFixed(1)} u`;
  document.getElementById('nutrient-meter')!.style.width = `${clamp(snapshot.nutrient / 30, 0, 1) * 100}%`;
  document.getElementById('income-readout')!.textContent = `+${snapshot.income.toFixed(2)} /s`; document.getElementById('maintenance-readout')!.textContent = `−${snapshot.maintenance.toFixed(2)} /s`;
  document.getElementById('edge-readout')!.textContent = `${snapshot.edgeCount} 条边 · ${snapshot.tips} 生长端`; document.getElementById('source-readout')!.textContent = `${snapshot.connectedSources} / 8 源点`;
  const chip = document.getElementById('status-chip')!; const text = snapshot.status === 'won' ? '繁殖完成' : snapshot.pruneCount === 0 && snapshot.connectedSources < 2 ? '观察阶段' : snapshot.pressure > 1.15 ? '扩张压力' : snapshot.pruneCount > 0 ? `重组中 · ${Math.round(snapshot.fruitingProgress * 100)}%` : '自组织阶段'; chip.textContent = text; chip.style.color = snapshot.pressure > 1.15 ? '#f3c879' : snapshot.status === 'won' ? '#d4ff9f' : '';
  const insight = document.getElementById('insight-text')!; if (snapshot.status === 'won') insight.textContent = '子实体已释放孢子。你的最后一次操作是剪掉一部分曾经亲手诱导的网络。'; else if (snapshot.fruitingProgress > .04) insight.textContent = `繁殖区正在积累流量。维持剩余主干 ${Math.round(snapshot.fruitingProgress * 100)}% 的稳定。`; else if (snapshot.pruneCount > 0) insight.textContent = '剪口已经改变了整个网络的流向。观察哪些边开始变亮，哪些支线渐渐安静。'; else if (snapshot.pressure > .9) insight.textContent = '维护成本正在追上营养收入。继续生长，可能会让整个菌落变得更脆弱。'; else if (snapshot.connectedSources >= 2) insight.textContent = '多个源点已经接入。主干正在汇聚流量，支线也在试探新的连接。';
  const log = document.getElementById('event-log')!; log.innerHTML = snapshot.events.map((event) => `<div class="event-line"><time>${formatTime(event.time)}</time><div><strong>${event.title}</strong><br>${event.detail}</div></div>`).join('');
  const title = document.getElementById('prune-title')!; const detail = document.getElementById('prune-detail')!; const confirm = document.getElementById('confirm-prune') as HTMLButtonElement; const candidate = snapshot.selectedEdge ?? snapshot.hoveredEdge; if (mode === 'prune' && candidate !== null) { title.textContent = `边 #${candidate} · ${snapshot.previewNodes.size ? '会失去连通' : '保留环路'}`; detail.textContent = snapshot.previewNodes.size ? `预览：${snapshot.previewNodes.size} 个节点会进入枯死状态。${snapshot.selectedEdge === null ? '点击这条边锁定剪枝目标。' : '目标已锁定，可将鼠标移到此处确认。'}` : `预览：这条边打开一个环路，但菌核仍可到达所有区域。${snapshot.selectedEdge === null ? '点击锁定后可确认剪枝。' : '目标已锁定，可将鼠标移到此处确认。'}`; confirm.disabled = snapshot.selectedEdge === null; } else { title.textContent = '选择一条边'; detail.textContent = '悬停预览影响范围，点击边锁定目标，再按确认剪枝。'; confirm.disabled = true; }
  document.getElementById('win-card')?.classList.toggle('hidden', snapshot.status !== 'won');
}

function render(snapshot: SimulationSnapshot): void {
  updateFields(snapshot); snapshot.sources.forEach((source) => updateSource(source, snapshot));
  for (const edge of snapshot.edges) { if (!edgeMeshes.has(edge.id)) createEdgeMesh(edge); updateEdgeMesh(edge); }
  for (const [id, mesh] of edgeMeshes) { if (!snapshot.edges.some((edge) => edge.id === id)) { networkGroup.remove(mesh); mesh.geometry.dispose(); (mesh.material as THREE.Material).dispose(); edgeMeshes.delete(id); } }
  snapshot.nodes.forEach((node) => updateNodeMesh(node, snapshot)); for (const [id, mesh] of nodeMeshes) if (!snapshot.nodes.some((node) => node.id === id)) { networkGroup.remove(mesh); mesh.geometry.dispose(); (mesh.material as THREE.Material).dispose(); nodeMeshes.delete(id); }
  updateFruit(snapshot); updateHud(snapshot); renderer.render(scene, camera);
}

let previous = performance.now(); let accumulator = 0;
function loop(now: number): void { const delta = Math.min(.05, (now - previous) / 1000); previous = now; accumulator += delta; while (accumulator >= .1) { sim.step(.1); accumulator -= .1; } lastSnapshot = sim.snapshot(); render(lastSnapshot); requestAnimationFrame(loop); }
window.addEventListener('resize', () => { const aspect = window.innerWidth / window.innerHeight; const view = 10; camera.left = -view * aspect; camera.right = view * aspect; camera.top = view; camera.bottom = -view; camera.updateProjectionMatrix(); renderer.setSize(window.innerWidth, window.innerHeight); });
window.dispatchEvent(new Event('resize')); requestAnimationFrame(loop);

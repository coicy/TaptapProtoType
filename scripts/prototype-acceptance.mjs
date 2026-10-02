import { readFileSync } from 'node:fs';
import { transformSync } from 'esbuild';

const source = readFileSync(new URL('../src/simulation.ts', import.meta.url), 'utf8');
const compiled = transformSync(source, { loader: 'ts', format: 'esm', target: 'es2022' }).code;
const simulation = await import(`data:text/javascript;base64,${Buffer.from(compiled).toString('base64')}`);

const {
  CONFIG,
  COVENANT_POOL,
  ORACLE_POOL,
  acquireOracle,
  advanceFromResolution,
  chooseCovenant,
  createWorld,
  discardOracle,
  endDivinePhase,
  getMetrics,
  getOracleAcquisitionCost,
  playOracle,
  stepWorld,
} = simulation;

function assert(condition, message) {
  if (!condition) throw new Error(`FAIL: ${message}`);
}

function tick(world, seconds = 0.1) { stepWorld(world, seconds, 1); }

function tickFor(world, seconds) {
  for (let remaining = seconds; remaining > 0; remaining -= 0.1) tick(world, Math.min(0.1, remaining));
}

function startTurn(world) {
  tick(world);
  assert(world.phase === 'divine', `turn ${world.turn} starts in Divine`);
}

function runMortalTurn(world) {
  assert(endDivinePhase(world).ok, 'Divine can end');
  tickFor(world, CONFIG.mortalPhaseSeconds + 0.1);
  assert(world.phase === 'resolution', 'Mortal resolves after 15 seconds');
  assert(world.lastSummary?.turn === world.turn, 'Resolution stores a turn summary');
}

const world = createWorld(202603);
assert(CONFIG.prototypeTurns === 12 && CONFIG.pressureEventTurn === 5, 'Prototype uses 12 turns with a fifth-turn pressure event');
assert(!('grace' in world) && !('wrath' in world) && world.oracleDeck.hand.length === 0 && world.oracleDeck.deck.length === ORACLE_POOL.length, 'World starts with a single empty hand and unified oracle deck');
assert(COVENANT_POOL.every((covenant) => covenant.supportOn.length > 0 && covenant.strainOn.length > 0 && covenant.supportBehavior && covenant.strainBehavior), 'Every covenant defines both Grace and Wrath behaviors');
assert(new Set(ORACLE_POOL.map((card) => card.impact)).size >= 7 && ORACLE_POOL.some((card) => card.impact === 'attraction') && ORACLE_POOL.some((card) => card.impact === 'ore'), 'Oracle pool covers more than weather variables');

const varietyWorld = createWorld(18);
varietyWorld.phase = 'divine'; varietyWorld.turn = 3; varietyWorld.revelation = 'revealed'; varietyWorld.oracleDeck.hand = ['oracle-waystone', 'oracle-vein'];
const varietyTile = varietyWorld.tiles.find((candidate) => candidate.x === 15 && candidate.z === 15);
const attractionBefore = varietyTile.attraction; const oreBefore = varietyTile.ore;
assert(playOracle(varietyWorld, 'oracle-waystone', varietyTile.x, varietyTile.z).ok, 'Waystone oracle changes a Tile attraction fact');
assert(varietyTile.attraction > attractionBefore, 'Waystone increases settlement attraction');
assert(playOracle(varietyWorld, 'oracle-vein', varietyTile.x, varietyTile.z).ok, 'Vein oracle changes a Tile resource fact');
assert(varietyTile.ore > oreBefore, 'Vein increases local ore opportunity');

const fireWorld = createWorld(18);
fireWorld.phase = 'divine'; fireWorld.turn = 3; fireWorld.revelation = 'revealed';
const dryForest = fireWorld.tiles.find((candidate) => candidate.terrain === 'forest' && candidate.moisture < 0.7);
const treeBeforeFire = dryForest.treeAmount;
const fertilityBeforeFire = dryForest.fertility;
fireWorld.oracleDeck.hand = ['oracle-lightning'];
assert(playOracle(fireWorld, 'oracle-lightning', dryForest.x, dryForest.z).ok && dryForest.fireLevel > 0, 'Lightning ignites a dry Tile');
assert(dryForest.treeAmount <= treeBeforeFire, 'Lightning does not increase combustible growth');
assert(endDivinePhase(fireWorld).ok, 'Fire test can enter Mortal phase');
tickFor(fireWorld, 5);
assert(dryForest.fertility > fertilityBeforeFire, 'Burning biomass adds ash fertility instead of reducing fertility');
fireWorld.phase = 'divine'; fireWorld.oraclePlaysThisTurn = 0;
fireWorld.oracleDeck.hand = ['oracle-rain'];
const fireBeforeRain = dryForest.fireLevel;
assert(playOracle(fireWorld, 'oracle-rain', dryForest.x, dryForest.z).ok && dryForest.fireLevel < fireBeforeRain, 'Rain reduces an active fire');
const wetWorld = createWorld(18); wetWorld.phase = 'divine'; wetWorld.turn = 3; wetWorld.revelation = 'revealed';
const wetTile = wetWorld.tiles.find((candidate) => candidate.terrain !== 'water'); wetTile.moisture = 0.86; wetWorld.oracleDeck.hand = ['oracle-lightning'];
assert(playOracle(wetWorld, 'oracle-lightning', wetTile.x, wetTile.z).ok && wetTile.fireLevel === 0, 'High humidity prevents lightning from igniting a Tile');

const phaseTrace = [world.phase];
startTurn(world); phaseTrace.push(world.phase);
assert(acquireOracle(world).ok === false, 'First observation turn rejects oracle acquisition');
runMortalTurn(world); phaseTrace.push(world.phase);
assert(advanceFromResolution(world).ok && world.phase === 'turn-start' && world.turn === 2, 'First resolution advances to observation turn two');
startTurn(world); phaseTrace.push(world.phase);
assert(acquireOracle(world).ok === false, 'Second observation turn rejects oracle acquisition');
runMortalTurn(world); phaseTrace.push(world.phase);
assert(advanceFromResolution(world).ok && world.phase === 'revelation' && world.turn === 3, 'Second resolution opens Revelation for turn three');
assert(world.revelationPending && world.revelationChoices.length > 0, 'Revelation exposes covenant choices');
assert(chooseCovenant(world, world.revelationChoices[0]).ok && world.phase === 'divine', 'Covenant choice prepares turn three Divine');

const powerBeforeAcquire = world.divinePower;
const acquisitionCost = getOracleAcquisitionCost(world);
assert(acquireOracle(world).ok, 'Turn three can acquire one oracle card');
assert(world.divinePower === powerBeforeAcquire - acquisitionCost && world.oracleDeck.hand.length === 1, 'Oracle acquisition spends the configured single power cost');
assert(acquireOracle(world).ok === false, 'Only one oracle acquisition is allowed per turn');
const tile = world.tiles.find((candidate) => candidate.x === 15 && candidate.z === 15);
const cardId = world.oracleDeck.hand[0];
const beforePopulation = world.agents.length;
const beforeFood = world.resources.food;
assert(playOracle(world, cardId, tile.x, tile.z).ok, 'Acquired oracle can be played');
assert(world.agents.length === beforePopulation && world.resources.food === beforeFood, 'Oracle does not directly create residents or resources');
assert(!world.oracleDeck.hand.includes(cardId) && world.oracleDeck.discard.includes(cardId), 'Played card enters discard without free replacement');
assert(playOracle(world, cardId, tile.x, tile.z).ok === false, 'Played card cannot be played twice');
assert(endDivinePhase(world).ok, 'Turn three Divine can end after oracle play');
tickFor(world, CONFIG.mortalPhaseSeconds + 0.1);
assert(world.phase === 'resolution', 'Turn three Mortal resolves');

for (let turn = 4; turn <= CONFIG.prototypeTurns; turn += 1) {
  assert(advanceFromResolution(world).ok && world.turn === turn, `Resolution advances to turn ${turn}`);
  startTurn(world);
  const cost = getOracleAcquisitionCost(world);
  const powerBefore = world.divinePower;
  assert(acquireOracle(world).ok, `Turn ${turn} can acquire one oracle card`);
  assert(world.divinePower === powerBefore - cost && world.oracleAcquiredThisTurn, `Turn ${turn} charges oracle acquisition`);
  if (turn === 4) {
    const discardCandidate = world.oracleDeck.hand[0];
    assert(discardOracle(world, discardCandidate).ok, 'Manual discard does not draw a free replacement');
    assert(world.oracleDeck.hand.length === 0, 'Discard leaves the hand empty until a paid acquisition');
  }
  runMortalTurn(world);
  if (turn === CONFIG.pressureEventTurn) {
    assert(world.pressureEvent?.turn === CONFIG.pressureEventTurn, 'Fifth turn creates one pressure event');
    assert(world.lastSummary.pressureEvents.length >= 1, 'Pressure event is included in the fifth-turn summary');
    const before = world.lastSummary.metricsBefore; const after = world.lastSummary.metricsAfter;
    assert(Math.abs(after.foodScarcity - before.foodScarcity) > 0.01 || Math.abs(after.forestRemaining - before.forestRemaining) > 0.01 || Math.abs(after.averageMoisture - before.averageMoisture) > 0.01, 'Pressure event changes a resource or Tile condition');
  }
}

assert(world.status === 'won' && world.turn === CONFIG.prototypeTurns, 'Twelve-turn prototype ends cleanly');
assert(world.lastSummary.verdict === 'maintain', 'Twelve-turn prototype summary contains Maintain verdict');
assert(world.turnSummaries.length >= CONFIG.prototypeTurns, 'All prototype turn summaries are retained');

const repeat = createWorld(202603);
startTurn(repeat); runMortalTurn(repeat); advanceFromResolution(repeat);
startTurn(repeat); runMortalTurn(repeat); advanceFromResolution(repeat);
chooseCovenant(repeat, repeat.revelationChoices[0]);
for (let turn = 3; turn <= CONFIG.prototypeTurns; turn += 1) {
  if (turn > 3) { advanceFromResolution(repeat); startTurn(repeat); }
  acquireOracle(repeat);
  runMortalTurn(repeat);
}
assert(repeat.pressureEvent?.id === world.pressureEvent?.id, 'Fixed seed repeats the same fifth-turn pressure event');
assert(getMetrics(world).population >= 0, 'Metrics remain readable at completion');
console.log(`PASS: ${CONFIG.prototypeTurns}-turn prototype phases=${phaseTrace.join(' → ')} pressure=${world.pressureEvent.id} final=${world.lastSummary.verdict}`);

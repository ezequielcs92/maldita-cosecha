"use client";

import { useEffect, useMemo, useState } from "react";

type Crop =
  | "Papa"
  | "Zanahoria"
  | "Cebolla"
  | "Trufa"
  | "Batata"
  | "Jengibre"
  | "Remolacha"
  | "Maní";

type Action = "plantar" | "regar" | "cosechar" | "resolver";
type CardKind = "defensa" | "inmediata" | "construcción";

type ResourceCard = {
  name: string;
  kind: CardKind;
  image: string;
  counters?: string;
  description: string;
};

type Plot = {
  plant?: Crop;
  water: number;
  required: number;
  crow: boolean;
  drought: number;
  blocked: boolean;
  damaged: boolean;
  greenhouse: boolean;
};

type Game = {
  players: number;
  mode: "normal" | "especial";
  activePlayer: number;
  cycle: number;
  field: Plot[];
  plantDeck: Crop[];
  plagueDeck: string[];
  resourceDeck: ResourceCard[];
  resourceDiscard: ResourceCard[];
  hands: ResourceCard[][];
  market: ResourceCard[];
  harvest: Record<Crop, number>;
  silo: Record<Crop, number>;
  objective: Record<Crop, number>;
  buildings: string[];
  irrigationUsed: boolean;
  cisternWater: number;
  warehouse: ResourceCard[];
  compost?: Crop;
  weedsActive: boolean;
  pendingPlague?: string;
  lastPlague?: string;
  status: "playing" | "won" | "lost";
  log: string[];
  actions: number;
};

type CardSource =
  | { kind: "hand"; index: number }
  | { kind: "warehouse"; index: number };

type Decision =
  | { type: "greenhouse"; source: CardSource }
  | { type: "tractor"; source: CardSource }
  | {
      type: "metamorphosis";
      source: CardSource;
      from: Crop;
      to: Crop;
      amount: number;
    }
  | { type: "forecast"; source: CardSource; cards: string[] }
  | { type: "silo"; plotIndex: number; crop: Crop }
  | { type: "compost"; plotIndex: number; crop: Crop }
  | { type: "irrigation"; plotIndex: number; neighbors: number[] }
  | {
      type: "plague-plants";
      plague: "Conejos";
      count: number;
      candidates: number[];
      selected: number[];
      roll: number;
    }
  | {
      type: "plague-empty";
      plague: "Hormigas";
      count: number;
      candidates: number[];
      selected: number[];
      roll: number;
    }
  | {
      type: "plague-line";
      plague: "Insectos" | "Gusanos";
      options: number[];
      selected?: number;
    }
  | {
      type: "plague-crop";
      plague: "Vecinos invasores";
      options: Crop[];
      protected: Crop[];
      selected?: Crop;
    }
  | {
      type: "plague-cistern";
      plague: "Saltamontes" | "Sequía";
      allocations: number[];
    };

const CROPS: Crop[] = [
  "Papa",
  "Zanahoria",
  "Cebolla",
  "Trufa",
  "Batata",
  "Jengibre",
  "Remolacha",
  "Maní",
];

const CROP_IMAGES: Record<Crop, string> = {
  Papa: "/cards/papa.png",
  Zanahoria: "/cards/zanahoria.png",
  Cebolla: "/cards/cebolla.png",
  Trufa: "/cards/trufas.png",
  Batata: "/cards/batata.png",
  Jengibre: "/cards/jengibre.png",
  Remolacha: "/cards/remolacha.png",
  Maní: "/cards/mani.png",
};

const PLAGUE_INFO: Record<string, { image: string; text: string }> = {
  Tornado: {
    image: "/cards/tornado.jpg",
    text: "Arrasa todas las plantas y la cosecha sin proteger.",
  },
  Terremoto: {
    image: "/cards/terremoto.webp",
    text: "Daña un terreno. Repararlo requiere una acción y una tirada par.",
  },
  Cuervos: {
    image: "/cards/cuervos.jpg",
    text: "Coloca cuervos sobre todas las plantas.",
  },
  Conejos: {
    image: "/cards/conejo.jpg",
    text: "El dado determina cuántas plantas son eliminadas.",
  },
  Hormigas: {
    image: "/cards/hormigas.webp",
    text: "Bloquean terrenos vacíos durante el próximo ciclo.",
  },
  Saltamontes: {
    image: "/cards/saltamontes.jpg",
    text: "Retiran el agua y secan las plantas que no estaban regadas.",
  },
  Helada: {
    image: "/cards/helada.jpg",
    text: "Descarta todas las plantas que tengan agua.",
  },
  Insectos: {
    image: "/cards/insectos.jpg",
    text: "Atacan la columna con más plantaciones.",
  },
  "Vecinos invasores": {
    image: "/cards/vecinos.jpg",
    text: "Roban un cultivo de la cosecha compartida.",
  },
  Gusanos: {
    image: "/cards/gusanos.jpg",
    text: "Atacan la fila con más plantaciones.",
  },
  Sequía: {
    image: "/cards/sequia.jpg",
    text: "Retira el agua y bloquea con sequía todos los terrenos vacíos.",
  },
  Maleza: {
    image: "/cards/maleza.jpg",
    text: "Durante el siguiente ciclo no se puede regar ni cosechar.",
  },
};

const RESOURCE_CARDS: ResourceCard[] = [
  {
    name: "Danza de la Lluvia",
    kind: "defensa",
    image: "/cards/danza.jpeg",
    counters: "Sequía",
    description: "Cancela una Sequía.",
  },
  {
    name: "Fumigación",
    kind: "defensa",
    image: "/cards/fumigacion.jpg",
    counters: "Saltamontes",
    description: "Cancela a los Saltamontes.",
  },
  {
    name: "Agua Hirviendo",
    kind: "defensa",
    image: "/cards/agua.jpg",
    counters: "Hormigas",
    description: "Cancela a las Hormigas.",
  },
  {
    name: "Insecticida",
    kind: "defensa",
    image: "/cards/insecticida.jpg",
    counters: "Insectos",
    description: "Cancela a los Insectos.",
  },
  {
    name: "Espantapájaros",
    kind: "defensa",
    image: "/cards/espantapajaros.jpg",
    counters: "Cuervos",
    description: "Cancela a los Cuervos.",
  },
  {
    name: "Escopeta",
    kind: "defensa",
    image: "/cards/escopeta.jpg",
    counters: "Vecinos invasores",
    description: "Cancela a los Vecinos invasores.",
  },
  {
    name: "Bota Pesada",
    kind: "defensa",
    image: "/cards/bota pesada.jpg",
    counters: "Gusanos",
    description: "Cancela a los Gusanos.",
  },
  {
    name: "Lobo Feroz",
    kind: "defensa",
    image: "/cards/lobo.jpg",
    counters: "Conejos",
    description: "Cancela a los Conejos.",
  },
  {
    name: "Poda",
    kind: "defensa",
    image: "/cards/PODA.jpg",
    counters: "Maleza",
    description: "Cancela la Maleza.",
  },
  {
    name: "Bufanda para Plantas",
    kind: "defensa",
    image: "/cards/BUFANDA.jpg",
    counters: "Helada",
    description: "Cancela una Helada.",
  },
  {
    name: "Cosecha Mágica",
    kind: "inmediata",
    image: "/cards/cosecha.jpg",
    description: "Cosecha todas las plantas, tengan agua o no.",
  },
  {
    name: "Metamorfosis",
    kind: "inmediata",
    image: "/cards/metamorfosis.jpg",
    description: "Convierte hasta 3 cultivos en el cultivo más necesario.",
  },
  {
    name: "Tractor",
    kind: "inmediata",
    image: "/cards/tractor.jpg",
    description: "Planta todos los terrenos libres de una fila.",
  },
  {
    name: "Lluvia",
    kind: "inmediata",
    image: "/cards/lluvia.jpg",
    description: "Retira la sequía y riega todas las plantas.",
  },
  {
    name: "Pronóstico Meteorológico",
    kind: "inmediata",
    image: "/cards/pronostico_meteorologico.png",
    description: "Revela las próximas 3 plagas y aleja primero las más severas.",
  },
  ...[
    ["Invernadero", "invernadero.jpg", "Protege permanentemente un terreno."],
    ["Silo", "silo.png", "Protege parte de la cosecha obtenida."],
    ["Cisterna", "cisterna.png", "Conserva agua frente a las plagas."],
    ["Cercado", "cercado.png", "Reduce Conejos y Vecinos invasores."],
    ["Galpón", "galpon.png", "Amplía las opciones compartidas del equipo."],
    ["Compostera", "compostera.png", "Recupera una planta eliminada."],
    [
      "Sistema de Riego",
      "sistema_de_riego.png",
      "Permite regar dos plantas adyacentes una vez por ciclo.",
    ],
  ].map(
    ([name, image, description]): ResourceCard => ({
      name,
      kind: "construcción",
      image: `/cards/${image}`,
      description,
    }),
  ),
];

const ACTION_LABELS: Record<Action, string> = {
  plantar: "Plantar",
  regar: "Regar",
  cosechar: "Cosechar",
  resolver: "Resolver",
};

function shuffle<T>(source: T[]): T[] {
  const result = [...source];
  for (let i = result.length - 1; i > 0; i -= 1) {
    const j = Math.floor(Math.random() * (i + 1));
    [result[i], result[j]] = [result[j], result[i]];
  }
  return result;
}

function emptyHarvest(): Record<Crop, number> {
  return Object.fromEntries(CROPS.map((crop) => [crop, 0])) as Record<Crop, number>;
}

function objectiveFor(players: number): Record<Crop, number> {
  const target = players <= 2 ? 8 : 12;
  const result = emptyHarvest();
  const pool = shuffle([...CROPS]);
  for (let i = 0; i < target; i += 1) {
    result[pool[i % pool.length]] += 1;
  }
  return result;
}

function makePlantDeck(mode: "normal" | "especial"): Crop[] {
  const common = CROPS.flatMap((crop) => Array.from({ length: 5 }, () => crop));
  // Las cartas especiales se incorporarán con sus eventos narrativos en la siguiente iteración.
  return shuffle(mode === "especial" ? [...common, "Jengibre", "Trufa"] : common);
}

function makePlagueDeck(): string[] {
  return shuffle([
    "Tornado",
    "Terremoto",
    ...Object.keys(PLAGUE_INFO)
      .filter((name) => !["Tornado", "Terremoto"].includes(name))
      .flatMap((name) => [name, name, name]),
  ]);
}

function makeResourceDeck(): ResourceCard[] {
  return shuffle(
    RESOURCE_CARDS.flatMap((card) =>
      Array.from({ length: card.kind === "defensa" ? 3 : 1 }, () => ({ ...card })),
    ),
  );
}

function drawResource(game: Game): ResourceCard | undefined {
  if (!game.resourceDeck.length && game.resourceDiscard.length) {
    game.resourceDeck = shuffle(game.resourceDiscard);
    game.resourceDiscard = [];
    game.log.unshift("El mazo de Recursos se recicló.");
  }
  return game.resourceDeck.shift();
}

function fillMarket(game: Game) {
  while (game.market.length < 3) {
    const card = drawResource(game);
    if (!card) break;
    game.market.push(card);
  }
}

function cloneGame(game: Game): Game {
  return structuredClone(game);
}

function startGame(players: number, mode: "normal" | "especial"): Game {
  const resourceDeck = makeResourceDeck();
  const handSize = players <= 2 ? 3 : 2;
  const hands: ResourceCard[][] = Array.from({ length: players }, () => []);
  for (let round = 0; round < handSize; round += 1) {
    for (const hand of hands) {
      const card = resourceDeck.shift();
      if (card) hand.push(card);
    }
  }
  const market = resourceDeck.splice(0, 3);
  const plantDeck = makePlantDeck(mode);
  const centerPlant = plantDeck.shift();
  const field = Array.from({ length: 9 }, (_, index): Plot => ({
    plant: index === 4 ? centerPlant : undefined,
    water: 0,
    required: 1,
    crow: false,
    drought: 0,
    blocked: false,
    damaged: false,
    greenhouse: false,
  }));

  return {
    players,
    mode,
    activePlayer: 0,
    cycle: 0,
    field,
    plantDeck,
    plagueDeck: makePlagueDeck(),
    resourceDeck,
    resourceDiscard: [],
    hands,
    market,
    harvest: emptyHarvest(),
    silo: emptyHarvest(),
    objective: objectiveFor(players),
    buildings: [],
    irrigationUsed: false,
    cisternWater: 0,
    warehouse: [],
    weedsActive: false,
    status: "playing",
    log: [
      `Partida normal preparada para ${players} ${players === 1 ? "jugador" : "jugadores"}.`,
      "Hay una planta oculta en el terreno central.",
    ],
    actions: 0,
  };
}

function totalCrop(game: Game, crop: Crop) {
  return game.harvest[crop] + game.silo[crop];
}

function objectiveComplete(game: Game) {
  return CROPS.every((crop) => totalCrop(game, crop) >= game.objective[crop]);
}

function damageable(plot: Plot) {
  return !plot.greenhouse;
}

export default function Home() {
  const [game, setGame] = useState<Game | null>(null);
  const [players, setPlayers] = useState(2);
  const [mode, setMode] = useState<"normal" | "especial">("normal");
  const [action, setAction] = useState<Action>("plantar");
  const [exchangeIndex, setExchangeIndex] = useState<number | null>(null);
  const [showRules, setShowRules] = useState(false);
  const [hasSave, setHasSave] = useState(false);
  const [toast, setToast] = useState<string | null>(null);
  const [decision, setDecision] = useState<Decision | null>(null);

  useEffect(() => {
    setHasSave(Boolean(localStorage.getItem("maldita-cosecha-save")));
  }, []);

  useEffect(() => {
    if (game) {
      localStorage.setItem("maldita-cosecha-save", JSON.stringify(game));
      setHasSave(true);
    }
  }, [game]);

  useEffect(() => {
    if (!toast) return;
    const timer = window.setTimeout(() => setToast(null), 2800);
    return () => window.clearTimeout(timer);
  }, [toast]);

  useEffect(() => {
    function handleKeyboard(event: KeyboardEvent) {
      if (event.key === "Escape") {
        setShowRules(false);
        setExchangeIndex(null);
        if (!decision?.type.startsWith("plague-")) setDecision(null);
        return;
      }
      if (showRules || decision || game?.pendingPlague || game?.status !== "playing") return;
      const shortcuts: Record<string, Action> = {
        "1": "plantar",
        "2": "regar",
        "3": "cosechar",
        "4": "resolver",
      };
      if (shortcuts[event.key]) setAction(shortcuts[event.key]);
    }
    window.addEventListener("keydown", handleKeyboard);
    return () => window.removeEventListener("keydown", handleKeyboard);
  }, [decision, game?.pendingPlague, game?.status, showRules]);

  const defenseOptions = useMemo(() => {
    if (!game?.pendingPlague) return [];
    const options: Array<{
      player: number;
      index: number;
      card: ResourceCard;
      warehouse: boolean;
    }> = [];
    for (let player = 0; player < game.hands.length; player += 1) {
      game.hands[player].forEach((card, index) => {
        if (card.kind === "defensa" && card.counters === game.pendingPlague) {
          options.push({ player, index, card, warehouse: false });
        }
      });
    }
    game.warehouse.forEach((card, index) => {
      if (card.kind === "defensa" && card.counters === game.pendingPlague) {
        options.push({ player: -1, index, card, warehouse: true });
      }
    });
    return options;
  }, [game]);

  function resume() {
    const raw = localStorage.getItem("maldita-cosecha-save");
    if (raw) {
      const saved = JSON.parse(raw) as Game;
      saved.cisternWater ??= 0;
      saved.warehouse ??= [];
      setGame(saved);
    }
  }

  function begin() {
    const newGame = startGame(players, mode);
    newGame.log[0] = `Partida ${mode} preparada para ${players} ${
      players === 1 ? "jugador" : "jugadores"
    }.`;
    setGame(newGame);
  }

  function concludeAction(next: Game, message: string) {
    next.actions += 1;
    next.log.unshift(message);
    if (objectiveComplete(next)) {
      next.status = "won";
      next.log.unshift("¡Objetivo completado! La cosecha está a salvo.");
      setGame(next);
      return;
    }

    next.activePlayer = (next.activePlayer + 1) % next.players;
    next.cycle += 1;
    if (next.cycle >= 4) {
      next.cycle = 0;
      const plague = next.plagueDeck.shift();
      if (plague) {
        next.pendingPlague = plague;
        next.lastPlague = plague;
        next.log.unshift(`Se revela: ${plague}.`);
      } else {
        next.status = "lost";
        next.log.unshift("El mazo de Plagas se agotó antes de completar el objetivo.");
      }
    }
    setGame(next);
  }

  function tileAction(index: number) {
    if (!game || game.status !== "playing" || game.pendingPlague || decision) return;
    const next = cloneGame(game);
    const plot = next.field[index];

    if (!plotIsActionableFor(plot, action)) {
      setToast(plotActionReason(plot, action));
      return;
    }

    if (action === "plantar") {
      if (plot.plant || plot.damaged || plot.blocked || plot.drought > 0) return;
      if (next.compost) {
        setDecision({ type: "compost", plotIndex: index, crop: next.compost });
        return;
      }
      if (!next.plantDeck.length) next.plantDeck = makePlantDeck(next.mode);
      plot.plant = next.plantDeck.shift();
      plot.water = 0;
      plot.required = 1;
      concludeAction(next, `Jugador ${game.activePlayer + 1} plantó en el terreno ${index + 1}.`);
      return;
    }

    if (action === "regar") {
      if (!plot.plant || plot.crow || plot.damaged || next.weedsActive) return;
      if (next.buildings.includes("Sistema de Riego") && !next.irrigationUsed) {
        const row = Math.floor(index / 3);
        const col = index % 3;
        const neighbors = next.field
          .map((other, otherIndex) => ({ other, otherIndex }))
          .filter(({ other, otherIndex }) => {
          const r = Math.floor(otherIndex / 3);
          const c = otherIndex % 3;
          return (
            otherIndex !== index &&
            Math.abs(r - row) + Math.abs(c - col) === 1 &&
            Boolean(other.plant) &&
            !other.crow &&
            other.water < other.required
          );
          })
          .map(({ otherIndex }) => otherIndex);
        if (neighbors.length) {
          setDecision({ type: "irrigation", plotIndex: index, neighbors });
          return;
        }
      }
      plot.water = Math.min(plot.required, plot.water + 1);
      concludeAction(next, `Jugador ${game.activePlayer + 1} regó el terreno ${index + 1}.`);
      return;
    }

    if (action === "cosechar") {
      if (!plot.plant || plot.crow || plot.water < plot.required || next.weedsActive) return;
      const crop = plot.plant;
      const siloCapacity = next.players <= 2 ? 1 : 2;
      const stored = Object.values(next.silo).reduce((sum, amount) => sum + amount, 0);
      if (next.buildings.includes("Silo") && stored < siloCapacity) {
        setDecision({ type: "silo", plotIndex: index, crop });
        return;
      }
      next.harvest[crop] += 1;
      next.field[index] = { ...plot, plant: undefined, water: 0, required: 1, crow: false };
      concludeAction(next, `Jugador ${game.activePlayer + 1} cosechó ${crop}.`);
      return;
    }

    if (action === "resolver") {
      if (plot.crow) {
        plot.crow = false;
        concludeAction(next, `Jugador ${game.activePlayer + 1} espantó los cuervos del terreno ${index + 1}.`);
      } else if (plot.drought > 0) {
        plot.drought -= 1;
        concludeAction(next, `Jugador ${game.activePlayer + 1} retiró una ficha de Sequía.`);
      } else if (plot.damaged) {
        const repaired = Math.random() >= 0.5;
        if (repaired) plot.damaged = false;
        concludeAction(
          next,
          repaired
            ? `La tirada fue par: el terreno ${index + 1} quedó reparado.`
            : `La tirada fue impar: el terreno ${index + 1} sigue dañado.`,
        );
      }
    }
  }

  function replaceHandCard(next: Game, player: number, index: number) {
    const replacement = next.market.shift();
    if (replacement) next.hands[player][index] = replacement;
    else next.hands[player].splice(index, 1);
    fillMarket(next);
  }

  function cardAvailability(card: ResourceCard) {
    if (!game || game.pendingPlague || game.status !== "playing") {
      return { enabled: false, reason: "No se puede usar en este momento." };
    }
    if (card.kind === "defensa") {
      return {
        enabled: false,
        reason: `Reacción: podrás elegirla cuando aparezca ${card.counters}.`,
      };
    }
    if (card.kind === "construcción" && game.buildings.length >= 4) {
      return { enabled: false, reason: "Los cuatro espacios de construcción están ocupados." };
    }
    if (card.name === "Cosecha Mágica" && !game.field.some((plot) => plot.plant)) {
      return { enabled: false, reason: "No hay plantas en el campo para cosechar." };
    }
    if (
      card.name === "Lluvia" &&
      !game.field.some(
        (plot) => plot.drought > 0 || (plot.plant && plot.water < plot.required),
      )
    ) {
      return { enabled: false, reason: "No hay Sequía ni plantas pendientes de riego." };
    }
    if (
      card.name === "Tractor" &&
      !game.field.some(
        (plot) => !plot.plant && !plot.damaged && !plot.blocked && plot.drought === 0,
      )
    ) {
      return { enabled: false, reason: "No hay terrenos libres y habilitados." };
    }
    if (card.name === "Metamorfosis") {
      const target = [...CROPS].sort(
        (a, b) =>
          game.objective[b] - totalCrop(game, b) - (game.objective[a] - totalCrop(game, a)),
      )[0];
      const hasConvertibleCrop = CROPS.some(
        (crop) => crop !== target && game.harvest[crop] > 0,
      );
      if (!hasConvertibleCrop || totalCrop(game, target) >= game.objective[target]) {
        return { enabled: false, reason: "Hace falta cosecha disponible y un cultivo pendiente." };
      }
    }
    if (card.name === "Pronóstico Meteorológico" && !game.plagueDeck.length) {
      return { enabled: false, reason: "No quedan Plagas para consultar." };
    }
    return { enabled: true, reason: card.kind === "construcción" ? "Construir" : "Usar ahora" };
  }

  function installBuilding(next: Game, card: ResourceCard) {
    next.buildings.push(card.name);
  }

  function applyImmediate(next: Game, card: ResourceCard) {
    if (card.name === "Cosecha Mágica") {
      let amount = 0;
      next.field.forEach((plot, plotIndex) => {
        if (!plot.plant) return;
        next.harvest[plot.plant] += 1;
        amount += 1;
        next.field[plotIndex] = { ...plot, plant: undefined, water: 0, required: 1, crow: false };
      });
      return `Cosecha Mágica recogió ${amount} ${amount === 1 ? "planta" : "plantas"}.`;
    }
    if (card.name === "Lluvia") {
      let watered = 0;
      let drought = 0;
      next.field.forEach((plot) => {
        drought += plot.drought;
        plot.drought = 0;
        if (plot.plant && plot.water < plot.required) {
          plot.water = plot.required;
          watered += 1;
        }
      });
      return `Lluvia regó ${watered} plantas y retiró ${drought} fichas de Sequía.`;
    }
    return `${card.name} fue utilizada.`;
  }

  function consumeCard(next: Game, card: ResourceCard, source: CardSource) {
    if (source.kind === "hand") {
      if (card.kind === "inmediata") next.resourceDiscard.push(card);
      replaceHandCard(next, next.activePlayer, source.index);
      return;
    }
    next.warehouse.splice(source.index, 1);
    if (card.kind === "inmediata") next.resourceDiscard.push(card);
    const replacement = next.market.shift();
    if (replacement) next.warehouse.push(replacement);
    fillMarket(next);
  }

  function finishCard(next: Game, card: ResourceCard, source: CardSource, result: string) {
    consumeCard(next, card, source);
    setToast(result);
    concludeAction(
      next,
      `Jugador ${game!.activePlayer + 1} ${
        card.kind === "construcción" ? "construyó" : "usó"
      } ${card.name}. ${result}`,
    );
  }

  function beginCardUse(card: ResourceCard, source: CardSource) {
    if (!game || decision) return;
    const availability = cardAvailability(card);
    if (!availability.enabled) {
      setToast(availability.reason);
      return;
    }
    if (card.name === "Invernadero") {
      setDecision({ type: "greenhouse", source });
      return;
    }
    if (card.name === "Tractor") {
      setDecision({ type: "tractor", source });
      return;
    }
    if (card.name === "Metamorfosis") {
      const to = [...CROPS].sort(
        (a, b) =>
          game.objective[b] - totalCrop(game, b) - (game.objective[a] - totalCrop(game, a)),
      )[0];
      const from = [...CROPS]
        .filter((crop) => crop !== to)
        .sort((a, b) => game.harvest[b] - game.harvest[a])[0];
      setDecision({
        type: "metamorphosis",
        source,
        from,
        to,
        amount: Math.max(1, Math.min(3, game.harvest[from], game.objective[to] - totalCrop(game, to))),
      });
      return;
    }
    if (card.name === "Pronóstico Meteorológico") {
      setDecision({
        type: "forecast",
        source,
        cards: game.plagueDeck.slice(0, 3),
      });
      return;
    }

    const next = cloneGame(game);
    if (card.kind === "construcción") {
      installBuilding(next, card);
      finishCard(next, card, source, `${card.name} quedó activa como construcción compartida.`);
    } else {
      const result = applyImmediate(next, card);
      finishCard(next, card, source, result);
    }
  }

  function playCard(index: number) {
    if (!game || game.pendingPlague || game.status !== "playing") return;
    const card = game.hands[game.activePlayer][index];
    if (card) beginCardUse(card, { kind: "hand", index });
  }

  function storeInWarehouse(index: number) {
    if (!game || !game.buildings.includes("Galpón") || game.warehouse.length >= 2) return;
    const next = cloneGame(game);
    const [stored] = next.hands[next.activePlayer].splice(index, 1);
    if (!stored) return;
    next.warehouse.push(stored);
    next.log.unshift(`${stored.name} quedó guardada en el Galpón.`);
    setToast(`${stored.name} ahora es un Recurso compartido.`);
    setGame(next);
  }

  function useWarehouseCard(index: number) {
    if (!game || game.pendingPlague) return;
    const card = game.warehouse[index];
    if (card) beginCardUse(card, { kind: "warehouse", index });
  }

  function activateBuilding(name: string) {
    if (!game || game.pendingPlague || game.status !== "playing") return;
    if (name !== "Cisterna") return;
    if (game.cisternWater >= 3) {
      setToast("La Cisterna ya contiene 3 fichas de Agua.");
      return;
    }
    const next = cloneGame(game);
    next.cisternWater += 1;
    concludeAction(next, `Jugador ${game.activePlayer + 1} guardó 1 Agua en la Cisterna.`);
  }

  function cardFromSource(next: Game, source: CardSource) {
    return source.kind === "hand"
      ? next.hands[next.activePlayer][source.index]
      : next.warehouse[source.index];
  }

  function chooseGreenhouse(plotIndex: number) {
    if (!game || decision?.type !== "greenhouse" || game.field[plotIndex].greenhouse) return;
    const next = cloneGame(game);
    const card = cardFromSource(next, decision.source);
    installBuilding(next, card);
    next.field[plotIndex].greenhouse = true;
    const result = `El terreno ${plotIndex + 1} quedó protegido por el Invernadero.`;
    const source = decision.source;
    setDecision(null);
    finishCard(next, card, source, result);
  }

  function chooseTractor(orientation: "fila" | "columna", line: number) {
    if (!game || decision?.type !== "tractor") return;
    const next = cloneGame(game);
    const card = cardFromSource(next, decision.source);
    const indexes = [0, 1, 2].map((offset) =>
      orientation === "fila" ? line * 3 + offset : offset * 3 + line,
    );
    let planted = 0;
    indexes.forEach((index) => {
      const plot = next.field[index];
      if (!plot.plant && !plot.damaged && !plot.blocked && plot.drought === 0) {
        if (!next.plantDeck.length) next.plantDeck = makePlantDeck(next.mode);
        plot.plant = next.plantDeck.shift();
        planted += 1;
      }
    });
    const result = `Tractor plantó ${planted} terrenos en la ${orientation} ${line + 1}.`;
    const source = decision.source;
    setDecision(null);
    finishCard(next, card, source, result);
  }

  function confirmMetamorphosis() {
    if (!game || decision?.type !== "metamorphosis") return;
    const next = cloneGame(game);
    const card = cardFromSource(next, decision.source);
    const amount = Math.min(
      decision.amount,
      next.harvest[decision.from],
      Math.max(0, next.objective[decision.to] - totalCrop(next, decision.to)),
    );
    if (amount <= 0 || decision.from === decision.to) return;
    next.harvest[decision.from] -= amount;
    next.harvest[decision.to] += amount;
    const result = `Metamorfosis convirtió ${amount} ${decision.from} en ${decision.to}.`;
    const source = decision.source;
    setDecision(null);
    finishCard(next, card, source, result);
  }

  function moveForecast(index: number, direction: -1 | 1) {
    if (decision?.type !== "forecast") return;
    const target = index + direction;
    if (target < 0 || target >= decision.cards.length) return;
    const cards = [...decision.cards];
    [cards[index], cards[target]] = [cards[target], cards[index]];
    setDecision({ ...decision, cards });
  }

  function confirmForecast() {
    if (!game || decision?.type !== "forecast") return;
    const next = cloneGame(game);
    const card = cardFromSource(next, decision.source);
    next.plagueDeck.splice(0, decision.cards.length, ...decision.cards);
    const result = `Nuevo orden: ${decision.cards.join(" → ")}.`;
    const source = decision.source;
    setDecision(null);
    finishCard(next, card, source, result);
  }

  function confirmSilo(store: boolean) {
    if (!game || decision?.type !== "silo") return;
    const next = cloneGame(game);
    const plot = next.field[decision.plotIndex];
    if (store) next.silo[decision.crop] += 1;
    else next.harvest[decision.crop] += 1;
    next.field[decision.plotIndex] = {
      ...plot,
      plant: undefined,
      water: 0,
      required: 1,
      crow: false,
    };
    const message = store
      ? `${decision.crop} fue protegida dentro del Silo.`
      : `${decision.crop} quedó en la Cosecha compartida.`;
    setDecision(null);
    concludeAction(next, message);
  }

  function confirmCompost(useCompost: boolean) {
    if (!game || decision?.type !== "compost") return;
    const next = cloneGame(game);
    const plot = next.field[decision.plotIndex];
    if (useCompost) {
      plot.plant = decision.crop;
      next.compost = undefined;
    } else {
      if (!next.plantDeck.length) next.plantDeck = makePlantDeck(next.mode);
      plot.plant = next.plantDeck.shift();
    }
    plot.water = 0;
    plot.required = 1;
    const message = useCompost
      ? `Se recuperó ${decision.crop} desde la Compostera.`
      : `Se plantó una carta oculta y ${decision.crop} permanece en la Compostera.`;
    setDecision(null);
    concludeAction(next, message);
  }

  function confirmIrrigation(neighbor?: number) {
    if (!game || decision?.type !== "irrigation") return;
    const next = cloneGame(game);
    next.field[decision.plotIndex].water = Math.min(
      next.field[decision.plotIndex].required,
      next.field[decision.plotIndex].water + 1,
    );
    let message = `Se regó el terreno ${decision.plotIndex + 1}.`;
    if (neighbor !== undefined && decision.neighbors.includes(neighbor)) {
      next.field[neighbor].water = Math.min(
        next.field[neighbor].required,
        next.field[neighbor].water + 1,
      );
      next.irrigationUsed = true;
      message = `Sistema de Riego regó los terrenos ${decision.plotIndex + 1} y ${neighbor + 1}.`;
    }
    setDecision(null);
    concludeAction(next, message);
  }

  function togglePlagueTarget(index: number) {
    if (
      decision?.type !== "plague-plants" &&
      decision?.type !== "plague-empty"
    ) return;
    const selected = decision.selected.includes(index)
      ? decision.selected.filter((value) => value !== index)
      : decision.selected.length < decision.count
        ? [...decision.selected, index]
        : decision.selected;
    setDecision({ ...decision, selected });
  }

  function toggleProtectedCrop(crop: Crop) {
    if (decision?.type !== "plague-crop" || !game?.buildings.includes("Cercado")) return;
    const protectedCrops = decision.protected.includes(crop)
      ? decision.protected.filter((value) => value !== crop)
      : decision.protected.length < 2
        ? [...decision.protected, crop]
        : decision.protected;
    setDecision({
      ...decision,
      protected: protectedCrops,
      selected: protectedCrops.includes(decision.selected as Crop) ? undefined : decision.selected,
    });
  }

  function allocateCistern(index: number, delta: -1 | 1) {
    if (!game || decision?.type !== "plague-cistern") return;
    const allocations = [...decision.allocations];
    const total = allocations.reduce((sum, amount) => sum + amount, 0);
    const plot = game.field[index];
    if (
      delta === 1 &&
      (total >= game.cisternWater ||
        !plot.plant ||
        plot.water + allocations[index] >= plot.required)
    ) return;
    if (delta === -1 && allocations[index] <= 0) return;
    allocations[index] += delta;
    setDecision({ ...decision, allocations });
  }

  function finishManualPlague(next: Game, plague: string) {
    next.pendingPlague = undefined;
    next.log.unshift(`${plague} fue resuelta mediante una decisión del equipo.`);
    if (!next.plagueDeck.length && !objectiveComplete(next)) next.status = "lost";
    setDecision(null);
    setGame(next);
  }

  function confirmPlagueDecision() {
    if (!game || !decision) return;
    const next = cloneGame(game);
    next.field.forEach((plot) => {
      plot.blocked = false;
    });
    next.weedsActive = false;
    next.irrigationUsed = false;

    if (decision.type === "plague-plants") {
      if (decision.selected.length !== decision.count) return;
      removePlants(next, decision.selected);
      setToast(`Conejos eliminó ${decision.selected.length} plantas elegidas.`);
      finishManualPlague(next, decision.plague);
    } else if (decision.type === "plague-empty") {
      if (decision.selected.length !== decision.count) return;
      decision.selected.forEach((index) => {
        next.field[index].blocked = true;
      });
      setToast(`Hormigas bloqueó ${decision.selected.length} terrenos elegidos.`);
      finishManualPlague(next, decision.plague);
    } else if (decision.type === "plague-line") {
      if (decision.selected === undefined) return;
      const indexes = [0, 1, 2].map((offset) =>
        decision.plague === "Insectos"
          ? offset * 3 + decision.selected!
          : decision.selected! * 3 + offset,
      );
      removePlants(next, indexes);
      setToast(`${decision.plague} atacó la ${decision.plague === "Insectos" ? "columna" : "fila"} ${decision.selected + 1}.`);
      finishManualPlague(next, decision.plague);
    } else if (decision.type === "plague-crop") {
      const allProtected = decision.options.every((crop) => decision.protected.includes(crop));
      if (!decision.selected && !allProtected) return;
      if (decision.selected) next.harvest[decision.selected] -= 1;
      setToast(
        decision.selected
          ? `Vecinos invasores robó 1 ${decision.selected}.`
          : "El Cercado protegió toda la Cosecha disponible.",
      );
      finishManualPlague(next, decision.plague);
    } else if (decision.type === "plague-cistern") {
      const total = decision.allocations.reduce((sum, amount) => sum + amount, 0);
      decision.allocations.forEach((amount, index) => {
        next.field[index].water += amount;
      });
      next.cisternWater -= total;
      setToast(`La Cisterna distribuyó ${total} fichas y conservó ${next.cisternWater}.`);
      finishManualPlague(next, decision.plague);
    }
  }

  function chooseMarket(index: number) {
    if (!game || game.pendingPlague) return;
    if (exchangeIndex === null) {
      setToast("Primero elegí Cambiar en una carta de tu mano.");
      return;
    }
    const next = cloneGame(game);
    const old = next.hands[next.activePlayer][exchangeIndex];
    const chosen = next.market[index];
    next.hands[next.activePlayer][exchangeIndex] = chosen;
    next.market.splice(index, 1);
    next.resourceDiscard.push(old);
    fillMarket(next);
    setExchangeIndex(null);
    concludeAction(next, `Jugador ${game.activePlayer + 1} cambió un Recurso.`);
  }

  function useDefense(defense: (typeof defenseOptions)[number]) {
    if (!game?.pendingPlague || !defense) return;
    const next = cloneGame(game);
    let used: ResourceCard;
    if (defense.warehouse) {
      used = next.warehouse.splice(defense.index, 1)[0];
      const replacement = next.market.shift();
      if (replacement) next.warehouse.push(replacement);
      fillMarket(next);
    } else {
      used = next.hands[defense.player][defense.index];
      replaceHandCard(next, defense.player, defense.index);
    }
    next.resourceDiscard.push(used);
    next.log.unshift(`${used.name} canceló completamente ${next.pendingPlague}.`);
    setToast(`${used.name} se activó y canceló ${next.pendingPlague}.`);
    next.pendingPlague = undefined;
    next.irrigationUsed = false;
    next.weedsActive = false;
    next.field.forEach((plot) => {
      plot.blocked = false;
    });
    setGame(next);
  }

  function removePlants(next: Game, indexes: number[]) {
    const removed: Crop[] = [];
    indexes.forEach((index) => {
      const plot = next.field[index];
      if (plot.plant && damageable(plot)) {
        removed.push(plot.plant);
        plot.plant = undefined;
        plot.water = 0;
        plot.required = 1;
        plot.crow = false;
      }
    });
    if (removed.length && next.buildings.includes("Compostera") && !next.compost) {
      next.compost = removed[0];
      next.log.unshift(`La Compostera recuperó ${removed[0]}.`);
    }
  }

  function resolvePlague() {
    if (!game?.pendingPlague || decision) return;
    const revealed = game.pendingPlague;
    if (revealed === "Conejos") {
      const roll = Math.floor(Math.random() * 6) + 1;
      const candidates = game.field
        .map((plot, index) => ({ plot, index }))
        .filter(({ plot }) => plot.plant && damageable(plot))
        .map(({ index }) => index);
      const reduced = Math.max(
        game.buildings.includes("Cercado") ? 1 : 0,
        roll - (game.buildings.includes("Cercado") ? 2 : 0),
      );
      const count = Math.min(reduced, candidates.length);
      if (count > 0) {
        setDecision({
          type: "plague-plants",
          plague: "Conejos",
          count,
          candidates,
          selected: [],
          roll,
        });
        return;
      }
    }
    if (revealed === "Hormigas") {
      const roll = Math.floor(Math.random() * 6) + 1;
      const candidates = game.field
        .map((plot, index) => ({ plot, index }))
        .filter(({ plot }) => !plot.plant && !plot.greenhouse)
        .map(({ index }) => index);
      const count = Math.min(roll, candidates.length);
      if (count > 0) {
        setDecision({
          type: "plague-empty",
          plague: "Hormigas",
          count,
          candidates,
          selected: [],
          roll,
        });
        return;
      }
    }
    if (revealed === "Insectos" || revealed === "Gusanos") {
      const lines = [0, 1, 2].map((line) => ({
        line,
        amount: [0, 1, 2].filter((offset) => {
          const index = revealed === "Insectos" ? offset * 3 + line : line * 3 + offset;
          return Boolean(game.field[index].plant);
        }).length,
      }));
      const maximum = Math.max(...lines.map((line) => line.amount));
      const options = lines.filter((line) => line.amount === maximum).map((line) => line.line);
      if (maximum > 0 && options.length > 1) {
        setDecision({
          type: "plague-line",
          plague: revealed,
          options,
        });
        return;
      }
    }
    if (revealed === "Vecinos invasores") {
      const options = CROPS.filter((crop) => game.harvest[crop] > 0);
      if (options.length) {
        setDecision({
          type: "plague-crop",
          plague: "Vecinos invasores",
          options,
          protected: [],
        });
        return;
      }
    }
    const next = cloneGame(game);
    const plague = next.pendingPlague;
    const vulnerable = () =>
      next.field
        .map((plot, index) => ({ plot, index }))
        .filter(({ plot }) => plot.plant && damageable(plot))
        .map(({ index }) => index);

    next.field.forEach((plot) => {
      plot.blocked = false;
    });
    next.weedsActive = false;
    next.irrigationUsed = false;

    if (plague === "Tornado") {
      removePlants(next, vulnerable());
      CROPS.forEach((crop) => {
        next.harvest[crop] = 0;
      });
    } else if (plague === "Terremoto") {
      const options = next.field.map((_, index) => index).filter((index) => !next.field[index].greenhouse);
      const index = options[Math.floor(Math.random() * options.length)];
      if (
        next.field[index].plant &&
        next.buildings.includes("Compostera") &&
        !next.compost
      ) {
        next.compost = next.field[index].plant;
        next.log.unshift(`La Compostera recuperó ${next.field[index].plant}.`);
      }
      next.field[index].damaged = true;
      next.field[index].plant = undefined;
      next.field[index].water = 0;
    } else if (plague === "Cuervos") {
      next.field.forEach((plot) => {
        if (plot.plant && damageable(plot)) plot.crow = true;
      });
    } else if (plague === "Conejos") {
      const roll = Math.floor(Math.random() * 6) + 1;
      const amount = Math.max(next.buildings.includes("Cercado") ? 1 : 0, roll - (next.buildings.includes("Cercado") ? 2 : 0));
      removePlants(next, shuffle(vulnerable()).slice(0, amount));
    } else if (plague === "Hormigas") {
      const roll = Math.floor(Math.random() * 6) + 1;
      const empty = shuffle(
        next.field
          .map((plot, index) => ({ plot, index }))
          .filter(({ plot }) => !plot.plant && !plot.greenhouse)
          .map(({ index }) => index),
      );
      empty.slice(0, roll).forEach((index) => {
        next.field[index].blocked = true;
      });
    } else if (plague === "Saltamontes") {
      next.field.forEach((plot) => {
        if (!plot.plant || !damageable(plot)) return;
        if (plot.water === 0) plot.required = 2;
        plot.water = 0;
      });
      if (
        next.cisternWater > 0 &&
        next.field.some((plot) => plot.plant && plot.water < plot.required)
      ) {
        setGame(next);
        setDecision({ type: "plague-cistern", plague: "Saltamontes", allocations: Array(9).fill(0) });
        return;
      }
    } else if (plague === "Helada") {
      removePlants(
        next,
        next.field
          .map((plot, index) => ({ plot, index }))
          .filter(({ plot }) => plot.plant && plot.water > 0 && damageable(plot))
          .map(({ index }) => index),
      );
    } else if (plague === "Insectos" || plague === "Gusanos") {
      const lines = [0, 1, 2].map((line) => ({
        line,
        indexes: [0, 1, 2].map((offset) =>
          plague === "Insectos" ? offset * 3 + line : line * 3 + offset,
        ),
      }));
      const worst = lines.sort(
        (a, b) =>
          b.indexes.filter((index) => next.field[index].plant).length -
          a.indexes.filter((index) => next.field[index].plant).length,
      )[0];
      removePlants(next, worst.indexes);
    } else if (plague === "Vecinos invasores") {
      const available = CROPS.filter((crop) => next.harvest[crop] > 0);
      if (available.length && !next.buildings.includes("Cercado")) {
        const crop = available[Math.floor(Math.random() * available.length)];
        next.harvest[crop] -= 1;
      }
    } else if (plague === "Sequía") {
      next.field.forEach((plot) => {
        if (plot.plant) plot.water = 0;
        else if (!plot.greenhouse) plot.drought += 1;
      });
      if (
        next.cisternWater > 0 &&
        next.field.some((plot) => plot.plant && plot.water < plot.required)
      ) {
        setGame(next);
        setDecision({ type: "plague-cistern", plague: "Sequía", allocations: Array(9).fill(0) });
        return;
      }
    } else if (plague === "Maleza") {
      next.weedsActive = true;
    }

    next.pendingPlague = undefined;
    next.log.unshift(`${plague} fue resuelta.`);
    if (!next.plagueDeck.length && !objectiveComplete(next)) next.status = "lost";
    setGame(next);
  }

  function plotIsActionableFor(plot: Plot, selectedAction: Action) {
    if (decision || game?.pendingPlague || game?.status !== "playing") return false;
    if (selectedAction === "plantar") {
      return !plot.plant && !plot.damaged && !plot.blocked && plot.drought === 0;
    }
    if (selectedAction === "regar") {
      return Boolean(plot.plant) && !plot.crow && !plot.damaged && !game.weedsActive && plot.water < plot.required;
    }
    if (selectedAction === "cosechar") {
      return Boolean(plot.plant) && !plot.crow && !game.weedsActive && plot.water >= plot.required;
    }
    return plot.crow || plot.drought > 0 || plot.damaged;
  }

  function plotIsActionable(plot: Plot) {
    return plotIsActionableFor(plot, action);
  }

  function plotActionReason(plot: Plot, selectedAction: Action) {
    if (selectedAction === "plantar") {
      if (plot.plant) return "Ese terreno ya tiene una planta.";
      if (plot.damaged) return "El terreno está dañado. Elegí Resolver antes de plantar.";
      if (plot.blocked) return "Las Hormigas bloquean este terreno durante el ciclo.";
      if (plot.drought > 0) return "Retirá la ficha de Sequía antes de plantar.";
    }
    if (selectedAction === "regar") {
      if (game?.weedsActive) return "La Maleza impide regar durante este ciclo.";
      if (!plot.plant) return "No hay una planta para regar en ese terreno.";
      if (plot.crow) return "Los cuervos impiden regar. Elegí Resolver primero.";
      if (plot.damaged) return "El terreno está dañado. Elegí Resolver primero.";
      if (plot.water >= plot.required) return "Esta planta ya tiene toda el agua necesaria.";
    }
    if (selectedAction === "cosechar") {
      if (game?.weedsActive) return "La Maleza impide cosechar durante este ciclo.";
      if (!plot.plant) return "No hay una planta para cosechar en ese terreno.";
      if (plot.crow) return "Los cuervos impiden cosechar. Elegí Resolver primero.";
      if (plot.water < plot.required) {
        return `La planta necesita ${plot.required - plot.water} ficha${plot.required - plot.water === 1 ? "" : "s"} más de Agua.`;
      }
    }
    if (selectedAction === "resolver") {
      return "Este terreno no tiene cuervos, Sequía ni daños que resolver.";
    }
    return "Esa acción no se puede realizar en este terreno.";
  }

  function buildingStatus(name: string) {
    if (name === "Cisterna") return `${game?.cisternWater ?? 0}/3 Agua`;
    if (name === "Galpón") return `${game?.warehouse.length ?? 0}/2 Recursos`;
    if (name === "Compostera") return game?.compost ? `Guarda ${game.compost}` : "Vacía";
    if (name === "Sistema de Riego") return game?.irrigationUsed ? "Usado este ciclo" : "Disponible";
    if (name === "Silo") {
      return `${Object.values(game?.silo ?? emptyHarvest()).reduce((sum, amount) => sum + amount, 0)} protegidos`;
    }
    return "Efecto permanente";
  }

  if (!game) {
    return (
      <main className="setup">
        <div className="sun" aria-hidden="true" />
        <section className="setup-card">
          <div className="eyebrow">UKELELE GAMES PRESENTA</div>
          <h1>MALDITA<br /><span>COSECHA</span></h1>
          <p className="intro">
            Cultivá en equipo. Administrá los recursos. Prepará el campo antes de que llegue
            la próxima plaga.
          </p>
          <div className="setup-controls">
            <label>
              Jugadores
              <div className="stepper">
                <button onClick={() => setPlayers(Math.max(1, players - 1))} aria-label="Menos jugadores">−</button>
                <strong>{players}</strong>
                <button onClick={() => setPlayers(Math.min(4, players + 1))} aria-label="Más jugadores">+</button>
              </div>
            </label>
            <label>
              Modo
              <div className="mode-switch">
                <button className={mode === "normal" ? "active" : ""} onClick={() => setMode("normal")}>Normal</button>
                <button
                  disabled
                  title="Se incorporará después de validar el modo normal"
                >
                  Especial · Próximamente
                </button>
              </div>
            </label>
          </div>
          <button className="primary begin" onClick={begin}>Empezar partida</button>
          {hasSave && <button className="secondary resume" onClick={resume}>Continuar partida guardada</button>}
          <p className="version">PROTOTIPO DIGITAL · VERSIÓN 0.1</p>
        </section>
        <aside className="setup-aside">
          <div className="cycle-mini">
            <span>1</span><i>→</i><span>2</span><i>→</i><span>3</span><i>→</i><span className="danger">4</span>
          </div>
          <p>Una plaga cada cuatro turnos. Cada acción importa.</p>
        </aside>
      </main>
    );
  }

  const currentHand = game.hands[game.activePlayer];
  const remainingPlagues = game.plagueDeck.length + (game.pendingPlague ? 1 : 0);
  const actionTargets = (Object.keys(ACTION_LABELS) as Action[]).reduce(
    (counts, candidate) => {
      counts[candidate] = game.field.filter((plot) =>
        plotIsActionableFor(plot, candidate),
      ).length;
      return counts;
    },
    {} as Record<Action, number>,
  );

  return (
    <main className="game-shell">
      <header className="topbar">
        <button className="brand" onClick={() => setGame(null)} aria-label="Volver al inicio">
          <span><b>MALDITA</b> COSECHA</span>
          <small>PROTOTIPO DIGITAL</small>
        </button>
        <div className="turn-pill">
          <span className="player-avatar">{game.activePlayer + 1}</span>
          <div>
            <small>TURNO ACTUAL</small>
            <strong>Jugador {game.activePlayer + 1}</strong>
          </div>
        </div>
        <div className="cycle-hud">
          <small>PRÓXIMA PLAGA</small>
          <div className="cycle-track" aria-label={`Ciclo de plagas: ${game.cycle} de 4`}>
            {[1, 2, 3, 4].map((step) => (
              <span
                key={step}
                className={
                  step <= game.cycle ? "done" : step === game.cycle + 1 ? "current" : step === 4 ? "plague" : ""
                }
              >
                {step === 4 ? "☠" : step}
              </span>
            ))}
          </div>
        </div>
        <div className="top-actions">
          <span className="season-stat"><small>PLAGAS</small><b>{remainingPlagues}</b></span>
          <button className="icon-button" onClick={() => setShowRules(true)}>？ Guía</button>
        </div>
      </header>

      <section className="dashboard">
        <aside className="left-panel">
          <section className="panel objective-panel">
            <div className="panel-heading">
              <span>OBJETIVO COMÚN</span>
              <b>{CROPS.reduce((sum, crop) => sum + Math.min(totalCrop(game, crop), game.objective[crop]), 0)}/
                {Object.values(game.objective).reduce((a, b) => a + b, 0)}</b>
            </div>
            <div className="objective-grid">
              {CROPS.filter((crop) => game.objective[crop] > 0).map((crop) => (
                <div className={totalCrop(game, crop) >= game.objective[crop] ? "complete" : ""} key={crop}>
                  <img src={CROP_IMAGES[crop]} alt="" />
                  <span>{crop}</span>
                  <b>{totalCrop(game, crop)}/{game.objective[crop]}</b>
                </div>
              ))}
            </div>
          </section>

          <section className="panel deck-panel">
            <div className="deck-card plague-deck">
              <span>PLAGAS</span>
              <strong>{remainingPlagues}</strong>
            </div>
            <div className="deck-card plant-deck">
              <span>PLANTAS</span>
              <strong>{game.plantDeck.length}</strong>
            </div>
          </section>

          <section className="panel buildings-panel">
            <div className="panel-heading"><span>CONSTRUCCIONES</span><b>{game.buildings.length}/4</b></div>
            <div className="building-slots">
              {[0, 1, 2, 3].map((slot) => {
                const building = game.buildings[slot];
                return (
                  <div className={building ? "occupied" : ""} key={slot}>
                    {building ? (
                      <>
                        <strong>{building}</strong>
                        <small>{buildingStatus(building)}</small>
                        {building === "Cisterna" && (
                          <button
                            disabled={game.cisternWater >= 3}
                            onClick={() => activateBuilding(building)}
                          >
                            Guardar agua
                          </button>
                        )}
                      </>
                    ) : (
                      <span>Espacio libre</span>
                    )}
                  </div>
                );
              })}
            </div>
          </section>
        </aside>

        <section className="field-zone">
          <div className="weather-line">
            <span className={game.weedsActive ? "warning" : ""}>
              {game.weedsActive ? "⚠ Maleza activa: no se puede regar ni cosechar" : "El campo está operativo"}
            </span>
            <span>Acción #{game.actions + 1}</span>
          </div>
          <div className="field-grid">
            {game.field.map((plot, index) => (
              <button
                className={[
                  "plot",
                  plot.plant ? "planted" : "",
                  plot.damaged ? "damaged" : "",
                  plot.greenhouse ? "protected" : "",
                  plotIsActionable(plot) ? "actionable" : "inactive",
                ].join(" ")}
                key={index}
                onClick={() => tileAction(index)}
                aria-label={`Terreno ${index + 1}`}
              >
                <span className="plot-number">{index + 1}</span>
                {plot.greenhouse && <span className="greenhouse-mark">⌂</span>}
                {plot.plant ? (
                  <>
                    <div className="hidden-plant">?</div>
                    <div className="tokens">
                      {Array.from({ length: plot.water }).map((_, token) => <span key={`w${token}`}>💧</span>)}
                      {plot.crow && <span>🐦‍⬛</span>}
                      {plot.required > 1 && <span className="dry">×2</span>}
                    </div>
                  </>
                ) : (
                  <div className="soil-lines" aria-hidden="true"><i /><i /><i /></div>
                )}
                {plot.drought > 0 && <span className="obstacle">☀ {plot.drought}</span>}
                {plot.blocked && <span className="obstacle">🐜</span>}
                {plot.damaged && <span className="obstacle">⚡ DAÑADO</span>}
                {plotIsActionable(plot) && <span className="plot-cta">{ACTION_LABELS[action]}</span>}
              </button>
            ))}
          </div>

          <div className="action-bar">
            {(Object.keys(ACTION_LABELS) as Action[]).map((key, index) => (
              <button
                className={[
                  action === key ? "active" : "",
                  actionTargets[key] === 0 ? "no-targets" : "",
                ].join(" ")}
                onClick={() => {
                  setAction(key);
                  if (actionTargets[key] === 0) {
                    setToast(`Ahora mismo no hay terrenos disponibles para ${ACTION_LABELS[key].toLowerCase()}.`);
                  }
                }}
                aria-pressed={action === key}
                key={key}
              >
                <kbd>{index + 1}</kbd>
                <span>{key === "plantar" ? "✦" : key === "regar" ? "◉" : key === "cosechar" ? "♢" : "⚒"}</span>
                {ACTION_LABELS[key]}
                <b className="target-count" aria-label={`${actionTargets[key]} terrenos disponibles`}>
                  {actionTargets[key]}
                </b>
              </button>
            ))}
          </div>
          <p className="action-hint">
            {action === "plantar" && "Elegí un terreno libre, sin Sequía ni daños."}
            {action === "regar" && "Elegí una planta. Debe estar libre de cuervos."}
            {action === "cosechar" && "Elegí una planta con toda el agua necesaria."}
            {action === "resolver" && "Elegí un terreno con cuervos, Sequía o daños."}
          </p>
        </section>

        <aside className="right-panel">
          <section className="panel market-panel">
            <div className="panel-heading"><span>MERCADO</span><b>3 visibles</b></div>
            <div className={exchangeIndex !== null ? "market exchange-active" : "market"}>
              {game.market.map((card, index) => (
                <button key={`${card.name}-${index}`} onClick={() => chooseMarket(index)}>
                  <img src={card.image} alt="" />
                  <span>{card.name}</span>
                  <small>{card.kind}</small>
                </button>
              ))}
            </div>
            {exchangeIndex !== null && <p className="exchange-note">Elegí el Recurso que querés tomar.</p>}
          </section>

          <section className="panel hand-panel">
            <div className="panel-heading hand-heading">
              <span>MANO · JUGADOR {game.activePlayer + 1}</span>
              {game.buildings.includes("Galpón") && (
                <div className="warehouse-chips">
                  <small>GALPÓN</small>
                  {game.warehouse.length ? game.warehouse.map((card, index) => (
                    <button
                      key={`${card.name}-warehouse-${index}`}
                      aria-disabled={card.kind === "defensa"}
                      title={
                        card.kind === "defensa"
                          ? `Podrás elegirla cuando aparezca ${card.counters}.`
                          : `Usar ${card.name} desde el Galpón`
                      }
                      onClick={() => useWarehouseCard(index)}
                    >
                      {card.name}
                    </button>
                  )) : <i>vacío</i>}
                </div>
              )}
              <b>{currentHand.length}</b>
            </div>
            <div className="hand">
              {currentHand.map((card, index) => {
                const availability = cardAvailability(card);
                return (
                  <article key={`${card.name}-${index}`} className={`hand-card ${card.kind}`}>
                    <img src={card.image} alt="" />
                    <div>
                      <small>{card.kind === "defensa" ? `reacción · ${card.counters}` : card.kind}</small>
                      <strong>{card.name}</strong>
                      <p>{card.description}</p>
                      <div className="card-actions">
                        <button
                          aria-disabled={!availability.enabled}
                          className={!availability.enabled ? "unavailable" : ""}
                          title={availability.reason}
                          onClick={() => playCard(index)}
                        >
                          {card.kind === "defensa"
                            ? "Reacción"
                            : card.kind === "construcción"
                              ? "Construir"
                              : "Usar"}
                        </button>
                        <button
                          className={exchangeIndex === index ? "selected" : ""}
                          onClick={() => setExchangeIndex(exchangeIndex === index ? null : index)}
                        >
                          Cambiar
                        </button>
                        {game.buildings.includes("Galpón") && game.warehouse.length < 2 && (
                          <button onClick={() => storeInWarehouse(index)}>Guardar</button>
                        )}
                      </div>
                    </div>
                  </article>
                );
              })}
            </div>
          </section>

          <section className="panel log-panel">
            <div className="panel-heading"><span>BITÁCORA</span></div>
            <ol>{game.log.slice(0, 6).map((entry, index) => <li key={`${entry}-${index}`}>{entry}</li>)}</ol>
          </section>
        </aside>
      </section>

      {game.pendingPlague && (
        <div className="modal-backdrop">
          <section className="plague-modal">
            <div className="plague-warning">PLAGA REVELADA</div>
            <img src={PLAGUE_INFO[game.pendingPlague].image} alt="" />
            <div>
              <h2>{game.pendingPlague}</h2>
              <p>{PLAGUE_INFO[game.pendingPlague].text}</p>
              {defenseOptions.length ? (
                <div className="defense-found">
                  <span>Elegí qué copia utilizar</span>
                  <div className="defense-options">
                    {defenseOptions.map((option) => (
                      <button
                        key={`${option.warehouse ? "warehouse" : option.player}-${option.index}`}
                        onClick={() => useDefense(option)}
                      >
                        <strong>{option.card.name}</strong>
                        <small>
                          {option.warehouse ? "Galpón compartido" : `Jugador ${option.player + 1}`}
                        </small>
                      </button>
                    ))}
                  </div>
                </div>
              ) : (
                <div className="no-defense">No hay una defensa válida en las manos.</div>
              )}
              <div className="modal-actions">
                <button className="danger-button" onClick={resolvePlague}>Resolver efecto</button>
              </div>
            </div>
          </section>
        </div>
      )}

      {decision && (
        <div className="modal-backdrop decision-backdrop">
          <section className="decision-modal">
            <div className="decision-heading">
              <span>DECISIÓN DEL EQUIPO</span>
              {!decision.type.startsWith("plague-") && (
                <button onClick={() => setDecision(null)} aria-label="Cancelar decisión">×</button>
              )}
            </div>

            {decision.type === "greenhouse" && (
              <>
                <h2>¿Qué terreno protege el Invernadero?</h2>
                <p>La protección será permanente durante toda la partida.</p>
                <div className="decision-field">
                  {game.field.map((plot, index) => (
                    <button
                      key={index}
                      disabled={plot.greenhouse}
                      className={plot.plant ? "has-plant" : ""}
                      onClick={() => chooseGreenhouse(index)}
                    >
                      <b>{index + 1}</b>
                      <span>{plot.greenhouse ? "Protegido" : plot.plant ? "Con planta" : "Vacío"}</span>
                    </button>
                  ))}
                </div>
              </>
            )}

            {decision.type === "tractor" && (
              <>
                <h2>Elegí una fila o columna</h2>
                <p>El Tractor plantará todos sus terrenos libres y habilitados.</p>
                <div className="line-options">
                  {(["fila", "columna"] as const).flatMap((orientation) =>
                    [0, 1, 2].map((line) => {
                      const indexes = [0, 1, 2].map((offset) =>
                        orientation === "fila" ? line * 3 + offset : offset * 3 + line,
                      );
                      const free = indexes.filter((index) => {
                        const plot = game.field[index];
                        return !plot.plant && !plot.damaged && !plot.blocked && plot.drought === 0;
                      }).length;
                      return (
                        <button
                          key={`${orientation}-${line}`}
                          disabled={!free}
                          onClick={() => chooseTractor(orientation, line)}
                        >
                          <small>{orientation}</small>
                          <strong>{line + 1}</strong>
                          <span>{free} libres</span>
                        </button>
                      );
                    }),
                  )}
                </div>
              </>
            )}

            {decision.type === "metamorphosis" && (
              <>
                <h2>Transformar la cosecha</h2>
                <p>Elegí qué cultivo entregar, cuál recibir y la cantidad.</p>
                <div className="metamorph-controls">
                  <label>
                    Entregar
                    <select
                      value={decision.from}
                      onChange={(event) =>
                        setDecision({ ...decision, from: event.target.value as Crop, amount: 1 })
                      }
                    >
                      {CROPS.filter((crop) => crop !== decision.to && game.harvest[crop] > 0).map((crop) => (
                        <option value={crop} key={crop}>{crop} · {game.harvest[crop]}</option>
                      ))}
                    </select>
                  </label>
                  <span className="transform-arrow">→</span>
                  <label>
                    Recibir
                    <select
                      value={decision.to}
                      onChange={(event) =>
                        setDecision({ ...decision, to: event.target.value as Crop, amount: 1 })
                      }
                    >
                      {CROPS.filter(
                        (crop) => crop !== decision.from && totalCrop(game, crop) < game.objective[crop],
                      ).map((crop) => (
                        <option value={crop} key={crop}>
                          {crop} · faltan {game.objective[crop] - totalCrop(game, crop)}
                        </option>
                      ))}
                    </select>
                  </label>
                </div>
                <div className="amount-picker">
                  {[1, 2, 3].map((amount) => {
                    const allowed =
                      amount <= game.harvest[decision.from] &&
                      amount <= game.objective[decision.to] - totalCrop(game, decision.to);
                    return (
                      <button
                        key={amount}
                        disabled={!allowed}
                        className={decision.amount === amount ? "selected" : ""}
                        onClick={() => setDecision({ ...decision, amount })}
                      >
                        {amount}
                      </button>
                    );
                  })}
                </div>
                <button className="primary decision-confirm" onClick={confirmMetamorphosis}>
                  Confirmar transformación
                </button>
              </>
            )}

            {decision.type === "forecast" && (
              <>
                <h2>Reordenar las próximas Plagas</h2>
                <p>La carta superior será la número 1.</p>
                <div className="forecast-list">
                  {decision.cards.map((plague, index) => (
                    <div key={`${plague}-${index}`}>
                      <b>{index + 1}</b>
                      <img src={PLAGUE_INFO[plague].image} alt="" />
                      <strong>{plague}</strong>
                      <span>
                        <button disabled={index === 0} onClick={() => moveForecast(index, -1)}>↑</button>
                        <button disabled={index === decision.cards.length - 1} onClick={() => moveForecast(index, 1)}>↓</button>
                      </span>
                    </div>
                  ))}
                </div>
                <button className="primary decision-confirm" onClick={confirmForecast}>
                  Confirmar orden
                </button>
              </>
            )}

            {decision.type === "silo" && (
              <>
                <h2>¿Dónde guardar {decision.crop}?</h2>
                <p>El Silo la protege de las Plagas, pero no podrá usarse con Metamorfosis.</p>
                <div className="choice-cards">
                  <button onClick={() => confirmSilo(true)}>
                    <strong>Guardar en el Silo</strong>
                    <span>Protegida y válida para el Objetivo</span>
                  </button>
                  <button onClick={() => confirmSilo(false)}>
                    <strong>Dejar en la Cosecha</strong>
                    <span>Expuesta, pero disponible para Metamorfosis</span>
                  </button>
                </div>
              </>
            )}

            {decision.type === "compost" && (
              <>
                <h2>La Compostera guarda {decision.crop}</h2>
                <p>Podés recuperarla ahora o conservarla para otro terreno.</p>
                <div className="choice-cards">
                  <button onClick={() => confirmCompost(true)}>
                    <strong>Recuperar {decision.crop}</strong>
                    <span>Sabés exactamente qué estás plantando</span>
                  </button>
                  <button onClick={() => confirmCompost(false)}>
                    <strong>Plantar del mazo</strong>
                    <span>Conservar {decision.crop} en la Compostera</span>
                  </button>
                </div>
              </>
            )}

            {decision.type === "irrigation" && (
              <>
                <h2>Activar Sistema de Riego</h2>
                <p>Elegí una planta ortogonalmente adyacente o conservá el uso para más adelante.</p>
                <div className="choice-cards irrigation-choices">
                  {decision.neighbors.map((index) => (
                    <button key={index} onClick={() => confirmIrrigation(index)}>
                      <strong>Regar terreno {index + 1}</strong>
                      <span>Regará también el terreno {decision.plotIndex + 1}</span>
                    </button>
                  ))}
                  <button onClick={() => confirmIrrigation()}>
                    <strong>Regar sólo el terreno {decision.plotIndex + 1}</strong>
                    <span>Conservar el Sistema de Riego para otra acción</span>
                  </button>
                </div>
              </>
            )}

            {(decision.type === "plague-plants" || decision.type === "plague-empty") && (
              <>
                <h2>
                  {decision.plague}: elegí {decision.count}{" "}
                  {decision.type === "plague-plants" ? "plantas" : "terrenos"}
                </h2>
                <p>
                  El dado mostró {decision.roll}. Seleccionados: {decision.selected.length}/{decision.count}.
                </p>
                <div className="decision-field plague-targets">
                  {game.field.map((plot, index) => {
                    const valid = decision.candidates.includes(index);
                    const selected = decision.selected.includes(index);
                    return (
                      <button
                        key={index}
                        disabled={!valid}
                        className={selected ? "selected" : ""}
                        onClick={() => togglePlagueTarget(index)}
                      >
                        <b>{index + 1}</b>
                        <span>{selected ? "Elegido" : valid ? "Disponible" : "No válido"}</span>
                      </button>
                    );
                  })}
                </div>
                <button
                  className="danger-button decision-confirm"
                  disabled={decision.selected.length !== decision.count}
                  onClick={confirmPlagueDecision}
                >
                  Resolver {decision.plague}
                </button>
              </>
            )}

            {decision.type === "plague-line" && (
              <>
                <h2>{decision.plague}: hay un empate</h2>
                <p>
                  Elegí la {decision.plague === "Insectos" ? "columna" : "fila"} que será afectada.
                </p>
                <div className="line-options plague-lines">
                  {decision.options.map((line) => (
                    <button
                      key={line}
                      className={decision.selected === line ? "selected" : ""}
                      onClick={() => setDecision({ ...decision, selected: line })}
                    >
                      <small>{decision.plague === "Insectos" ? "columna" : "fila"}</small>
                      <strong>{line + 1}</strong>
                    </button>
                  ))}
                </div>
                <button
                  className="danger-button decision-confirm"
                  disabled={decision.selected === undefined}
                  onClick={confirmPlagueDecision}
                >
                  Confirmar objetivo
                </button>
              </>
            )}

            {decision.type === "plague-crop" && (
              <>
                <h2>Vecinos invasores atacan la Cosecha</h2>
                <p>
                  {game.buildings.includes("Cercado")
                    ? "Primero podés proteger hasta 2 tipos de cultivo con el Cercado. Después elegí qué cultivo será robado."
                    : "Elegí qué cultivo perderá el equipo."}
                </p>
                {game.buildings.includes("Cercado") && (
                  <div className="crop-decisions">
                    <small>PROTEGER CON EL CERCADO · {decision.protected.length}/2</small>
                    <div>
                      {decision.options.map((crop) => (
                        <button
                          key={`protect-${crop}`}
                          className={decision.protected.includes(crop) ? "protected" : ""}
                          onClick={() => toggleProtectedCrop(crop)}
                        >
                          <img src={CROP_IMAGES[crop]} alt="" />
                          <span>{crop}</span>
                        </button>
                      ))}
                    </div>
                  </div>
                )}
                <div className="crop-decisions loss">
                  <small>CULTIVO ROBADO</small>
                  <div>
                    {decision.options.map((crop) => (
                      <button
                        key={`lose-${crop}`}
                        disabled={decision.protected.includes(crop)}
                        className={decision.selected === crop ? "selected" : ""}
                        onClick={() => setDecision({ ...decision, selected: crop })}
                      >
                        <img src={CROP_IMAGES[crop]} alt="" />
                        <span>{crop} · {game.harvest[crop]}</span>
                      </button>
                    ))}
                  </div>
                </div>
                <button
                  className="danger-button decision-confirm"
                  disabled={
                    !decision.selected &&
                    !decision.options.every((crop) => decision.protected.includes(crop))
                  }
                  onClick={confirmPlagueDecision}
                >
                  Confirmar resolución
                </button>
              </>
            )}

            {decision.type === "plague-cistern" && (
              <>
                <h2>Distribuir el Agua de la Cisterna</h2>
                <p>
                  Asigná hasta {game.cisternWater} fichas después de {decision.plague}. El Agua no utilizada permanecerá guardada.
                </p>
                <div className="cistern-grid">
                  {game.field.map((plot, index) => {
                    const allocation = decision.allocations[index];
                    const valid = Boolean(plot.plant) && plot.water + allocation < plot.required;
                    return (
                      <div className={plot.plant ? "valid" : ""} key={index}>
                        <b>Terreno {index + 1}</b>
                        <span>{plot.plant ? `${plot.water + allocation}/${plot.required} Agua` : "Vacío"}</span>
                        <div>
                          <button disabled={!allocation} onClick={() => allocateCistern(index, -1)}>−</button>
                          <strong>{allocation}</strong>
                          <button disabled={!valid} onClick={() => allocateCistern(index, 1)}>+</button>
                        </div>
                      </div>
                    );
                  })}
                </div>
                <button className="primary decision-confirm" onClick={confirmPlagueDecision}>
                  Confirmar distribución
                </button>
              </>
            )}
          </section>
        </div>
      )}

      {toast && <div className="game-toast" role="status">{toast}</div>}

      {game.status !== "playing" && (
        <div className="modal-backdrop">
          <section className={`end-modal ${game.status}`}>
            <span>{game.status === "won" ? "COSECHA COMPLETA" : "FIN DE LA TEMPORADA"}</span>
            <h2>{game.status === "won" ? "¡Ganaron!" : "La plaga pudo más"}</h2>
            <p>
              {game.status === "won"
                ? `Completaron el objetivo en ${game.actions} acciones.`
                : "El mazo de Plagas se agotó antes de completar el objetivo."}
            </p>
            <button className="primary" onClick={() => setGame(null)}>Nueva partida</button>
          </section>
        </div>
      )}

      {showRules && (
        <div className="rules-backdrop" onClick={() => setShowRules(false)}>
          <aside className="rules-drawer" onClick={(event) => event.stopPropagation()}>
            <button className="close" onClick={() => setShowRules(false)}>×</button>
            <div className="eyebrow">GUÍA RÁPIDA</div>
            <h2>Salvar la cosecha</h2>
            <p>El equipo gana al reunir todos los cultivos del Objetivo antes de agotar las 32 Plagas.</p>
            <h3>Tu turno</h3>
            <p>Realizá una sola acción: plantar, regar, cosechar, resolver una tarea, usar una carta o cambiar un Recurso.</p>
            <h3>Ciclo de plagas</h3>
            <p>Después de cuatro turnos individuales se revela una Plaga. Las defensas válidas pueden cancelarla sin consumir una acción.</p>
            <h3>Mercado</h3>
            <p>Siempre hay tres Recursos visibles. Al usar o cambiar una carta, elegís una de estas para reponer tu mano.</p>
            <h3>Construcciones</h3>
            <p>Son compartidas, permanentes y hay un máximo de cuatro durante toda la partida.</p>
            <div className="rule-callout">La partida se guarda automáticamente en este dispositivo.</div>
          </aside>
        </div>
      )}
    </main>
  );
}

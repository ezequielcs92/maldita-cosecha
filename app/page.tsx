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
  weedsActive: boolean;
  pendingPlague?: string;
  lastPlague?: string;
  status: "playing" | "won" | "lost";
  log: string[];
  actions: number;
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

  useEffect(() => {
    setHasSave(Boolean(localStorage.getItem("maldita-cosecha-save")));
  }, []);

  useEffect(() => {
    if (game) {
      localStorage.setItem("maldita-cosecha-save", JSON.stringify(game));
      setHasSave(true);
    }
  }, [game]);

  const defense = useMemo(() => {
    if (!game?.pendingPlague) return null;
    for (let player = 0; player < game.hands.length; player += 1) {
      const index = game.hands[player].findIndex(
        (card) => card.kind === "defensa" && card.counters === game.pendingPlague,
      );
      if (index >= 0) return { player, index, card: game.hands[player][index] };
    }
    return null;
  }, [game]);

  function resume() {
    const raw = localStorage.getItem("maldita-cosecha-save");
    if (raw) setGame(JSON.parse(raw) as Game);
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
    if (!game || game.status !== "playing" || game.pendingPlague) return;
    const next = cloneGame(game);
    const plot = next.field[index];

    if (action === "plantar") {
      if (plot.plant || plot.damaged || plot.blocked || plot.drought > 0) return;
      if (!next.plantDeck.length) next.plantDeck = makePlantDeck(next.mode);
      plot.plant = next.plantDeck.shift();
      plot.water = 0;
      plot.required = 1;
      concludeAction(next, `Jugador ${game.activePlayer + 1} plantó en el terreno ${index + 1}.`);
      return;
    }

    if (action === "regar") {
      if (!plot.plant || plot.crow || plot.damaged || next.weedsActive) return;
      plot.water = Math.min(plot.required, plot.water + 1);
      let extra = "";
      if (next.buildings.includes("Sistema de Riego") && !next.irrigationUsed) {
        const row = Math.floor(index / 3);
        const col = index % 3;
        const neighbor = next.field.findIndex((other, otherIndex) => {
          const r = Math.floor(otherIndex / 3);
          const c = otherIndex % 3;
          return (
            otherIndex !== index &&
            Math.abs(r - row) + Math.abs(c - col) === 1 &&
            Boolean(other.plant) &&
            !other.crow &&
            other.water < other.required
          );
        });
        if (neighbor >= 0) {
          next.field[neighbor].water += 1;
          next.irrigationUsed = true;
          extra = ` y activó el Sistema de Riego sobre el terreno ${neighbor + 1}`;
        }
      }
      concludeAction(next, `Jugador ${game.activePlayer + 1} regó el terreno ${index + 1}${extra}.`);
      return;
    }

    if (action === "cosechar") {
      if (!plot.plant || plot.crow || plot.water < plot.required || next.weedsActive) return;
      const crop = plot.plant;
      const siloCapacity = next.players <= 2 ? 1 : 2;
      const stored = Object.values(next.silo).reduce((sum, amount) => sum + amount, 0);
      if (next.buildings.includes("Silo") && stored < siloCapacity) next.silo[crop] += 1;
      else next.harvest[crop] += 1;
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

  function playCard(index: number) {
    if (!game || game.pendingPlague || game.status !== "playing") return;
    const card = game.hands[game.activePlayer][index];
    if (!card || card.kind === "defensa") return;
    const next = cloneGame(game);

    if (card.kind === "construcción") {
      if (next.buildings.length >= 4) return;
      next.buildings.push(card.name);
      if (card.name === "Invernadero") {
        const target = next.field.findIndex((plot) => plot.plant && !plot.greenhouse);
        next.field[target >= 0 ? target : 4].greenhouse = true;
      }
      replaceHandCard(next, next.activePlayer, index);
      concludeAction(next, `Jugador ${game.activePlayer + 1} construyó ${card.name}.`);
      return;
    }

    if (card.name === "Cosecha Mágica") {
      next.field.forEach((plot, plotIndex) => {
        if (!plot.plant) return;
        next.harvest[plot.plant] += 1;
        next.field[plotIndex] = { ...plot, plant: undefined, water: 0, required: 1, crow: false };
      });
    } else if (card.name === "Lluvia") {
      next.field.forEach((plot) => {
        plot.drought = 0;
        if (plot.plant) plot.water = plot.required;
      });
    } else if (card.name === "Tractor") {
      const rows = [0, 1, 2].map((row) => ({
        row,
        free: [0, 1, 2].filter((col) => {
          const plot = next.field[row * 3 + col];
          return !plot.plant && !plot.damaged && !plot.blocked && !plot.drought;
        }).length,
      }));
      const best = rows.sort((a, b) => b.free - a.free)[0].row;
      [0, 1, 2].forEach((col) => {
        const plot = next.field[best * 3 + col];
        if (!plot.plant && !plot.damaged && !plot.blocked && !plot.drought) {
          plot.plant = next.plantDeck.shift();
        }
      });
    } else if (card.name === "Metamorfosis") {
      const source = [...CROPS].sort((a, b) => next.harvest[b] - next.harvest[a])[0];
      const target = [...CROPS].sort(
        (a, b) =>
          next.objective[b] - totalCrop(next, b) - (next.objective[a] - totalCrop(next, a)),
      )[0];
      const amount = Math.min(3, next.harvest[source], Math.max(0, next.objective[target] - totalCrop(next, target)));
      next.harvest[source] -= amount;
      next.harvest[target] += amount;
    } else if (card.name === "Pronóstico Meteorológico") {
      const severity: Record<string, number> = { Tornado: 10, Terremoto: 9 };
      const nextThree = next.plagueDeck.splice(0, 3);
      next.plagueDeck.unshift(...nextThree.sort((a, b) => (severity[a] || 1) - (severity[b] || 1)));
    }

    next.resourceDiscard.push(card);
    replaceHandCard(next, next.activePlayer, index);
    concludeAction(next, `Jugador ${game.activePlayer + 1} usó ${card.name}.`);
  }

  function chooseMarket(index: number) {
    if (!game || exchangeIndex === null || game.pendingPlague) return;
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

  function useDefense() {
    if (!game?.pendingPlague || !defense) return;
    const next = cloneGame(game);
    const used = next.hands[defense.player][defense.index];
    next.resourceDiscard.push(used);
    replaceHandCard(next, defense.player, defense.index);
    next.log.unshift(`${used.name} canceló completamente ${next.pendingPlague}.`);
    next.pendingPlague = undefined;
    next.irrigationUsed = false;
    next.weedsActive = false;
    next.field.forEach((plot) => {
      plot.blocked = false;
    });
    setGame(next);
  }

  function removePlants(next: Game, indexes: number[]) {
    indexes.forEach((index) => {
      const plot = next.field[index];
      if (plot.plant && damageable(plot)) {
        plot.plant = undefined;
        plot.water = 0;
        plot.required = 1;
        plot.crow = false;
      }
    });
  }

  function resolvePlague() {
    if (!game?.pendingPlague) return;
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
    } else if (plague === "Maleza") {
      next.weedsActive = true;
    }

    next.pendingPlague = undefined;
    next.log.unshift(`${plague} fue resuelta.`);
    if (!next.plagueDeck.length && !objectiveComplete(next)) next.status = "lost";
    setGame(next);
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
                <button className={mode === "especial" ? "active" : ""} onClick={() => setMode("especial")}>Especial</button>
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

  return (
    <main className="game-shell">
      <header className="topbar">
        <button className="brand" onClick={() => setGame(null)} aria-label="Volver al inicio">
          <b>MALDITA</b> COSECHA
        </button>
        <div className="turn-pill">
          <span>Turno</span>
          <strong>Jugador {game.activePlayer + 1}</strong>
        </div>
        <div className="cycle-track" aria-label={`Ciclo de plagas: ${game.cycle} de 4`}>
          {[1, 2, 3, 4].map((step) => (
            <span key={step} className={step <= game.cycle ? "done" : step === 4 ? "plague" : ""}>
              {step === 4 ? "☠" : step}
            </span>
          ))}
        </div>
        <button className="icon-button" onClick={() => setShowRules(true)}>Cómo jugar</button>
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
              {[0, 1, 2, 3].map((slot) => (
                <div className={game.buildings[slot] ? "occupied" : ""} key={slot}>
                  {game.buildings[slot] || <span>Espacio libre</span>}
                </div>
              ))}
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
              </button>
            ))}
          </div>

          <div className="action-bar">
            {(Object.keys(ACTION_LABELS) as Action[]).map((key) => (
              <button className={action === key ? "active" : ""} onClick={() => setAction(key)} key={key}>
                <span>{key === "plantar" ? "✦" : key === "regar" ? "◉" : key === "cosechar" ? "♢" : "⚒"}</span>
                {ACTION_LABELS[key]}
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
            <div className="panel-heading"><span>MANO · JUGADOR {game.activePlayer + 1}</span><b>{currentHand.length}</b></div>
            <div className="hand">
              {currentHand.map((card, index) => (
                <article key={`${card.name}-${index}`} className={`hand-card ${card.kind}`}>
                  <img src={card.image} alt="" />
                  <div>
                    <small>{card.kind}</small>
                    <strong>{card.name}</strong>
                    <p>{card.description}</p>
                    <div className="card-actions">
                      {card.kind !== "defensa" && <button onClick={() => playCard(index)}>Usar</button>}
                      <button
                        className={exchangeIndex === index ? "selected" : ""}
                        onClick={() => setExchangeIndex(exchangeIndex === index ? null : index)}
                      >
                        Cambiar
                      </button>
                    </div>
                  </div>
                </article>
              ))}
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
              {defense ? (
                <div className="defense-found">
                  <span>Defensa disponible · Jugador {defense.player + 1}</span>
                  <strong>{defense.card.name}</strong>
                </div>
              ) : (
                <div className="no-defense">No hay una defensa válida en las manos.</div>
              )}
              <div className="modal-actions">
                {defense && <button className="primary" onClick={useDefense}>Usar defensa</button>}
                <button className="danger-button" onClick={resolvePlague}>Resolver efecto</button>
              </div>
            </div>
          </section>
        </div>
      )}

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

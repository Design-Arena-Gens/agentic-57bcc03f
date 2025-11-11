import { NextResponse } from "next/server";

type GenerateRequest = {
  topic?: string;
  targetAudience?: string;
  outcome?: string;
  tone?: string;
};

type PostResponse = {
  headline: string;
  hook: string;
  talkingPoints: string[];
  body: string[];
  callToAction: string;
  hashtags: string[];
  palette: {
    gradientFrom: string;
    gradientTo: string;
    accent: string;
    textOnAccent: string;
  };
};

const tonalities: Record<string, string> = {
  professional:
    "Maintain an authoritative yet approachable voice that instills trust.",
  energetic:
    "Channel enthusiasm and momentum, encouraging readers to take immediate action.",
  inspirational:
    "Lean into storytelling and aspirational language that sparks possibility.",
  analytical:
    "Highlight data points, insights, and frameworks that demonstrate expertise."
};

const palettes = [
  {
    gradientFrom: "#4f46e5",
    gradientTo: "#8b5cf6",
    accent: "#fcd34d",
    textOnAccent: "#111827"
  },
  {
    gradientFrom: "#2563eb",
    gradientTo: "#0ea5e9",
    accent: "#f97316",
    textOnAccent: "#0f172a"
  },
  {
    gradientFrom: "#7c3aed",
    gradientTo: "#db2777",
    accent: "#fef08a",
    textOnAccent: "#1f2937"
  },
  {
    gradientFrom: "#0f172a",
    gradientTo: "#1e293b",
    accent: "#38bdf8",
    textOnAccent: "#0f172a"
  },
  {
    gradientFrom: "#047857",
    gradientTo: "#22c55e",
    accent: "#facc15",
    textOnAccent: "#1f2937"
  }
];

const openingVerbs = [
  "Unlock",
  "Reimagine",
  "Transform",
  "Deliver",
  "Accelerate",
  "Amplify",
  "Scale",
  "Elevate"
];

const hookTemplates = [
  (topic: string, target: string) =>
    `If you're ${target}, this is how ${topic.toLowerCase()} becomes your superpower.`,
  (topic: string, target: string) =>
    `${target} teams keep asking me how to nail ${topic.toLowerCase()} — here’s the playbook.`,
  (topic: string, target: string) =>
    `Three shifts we made to make ${topic.toLowerCase()} actually work for ${target}.`,
  (topic: string, target: string) =>
    `Stop treating ${topic.toLowerCase()} as a side project. It’s now the core engine for ${target}.`
];

function capitalize(value: string) {
  if (!value) {
    return "";
  }

  return value.charAt(0).toUpperCase() + value.slice(1);
}

function buildHashtags(topic: string, outcome: string) {
  const tokens = new Set<string>();
  const fromTopic = topic
    .split(/\s+/)
    .filter(Boolean)
    .map((word) => word.replace(/[^\w]/g, ""))
    .filter(Boolean);
  const fromOutcome = outcome
    .split(/\s+/)
    .filter(Boolean)
    .map((word) => word.replace(/[^\w]/g, ""))
    .filter(Boolean);

  [...fromTopic, ...fromOutcome].forEach((token) => {
    if (token.length > 2) {
      tokens.add(`#${token.charAt(0).toUpperCase()}${token.slice(1)}`);
    }
  });

  if (tokens.size < 4) {
    tokens.add("#LinkedInStrategy");
  }
  if (tokens.size < 5) {
    tokens.add("#Growth");
  }

  return Array.from(tokens).slice(0, 6);
}

function choosePalette(input: string) {
  const hash = Array.from(input).reduce(
    (acc, char) => acc + char.charCodeAt(0),
    0
  );
  return palettes[hash % palettes.length];
}

function selectHook(topic: string, target: string) {
  const index =
    (topic.length + target.length + topic.charCodeAt(0)) % hookTemplates.length;
  return hookTemplates[index](topic, target);
}

function buildTalkingPoints(topic: string, outcome: string, target: string) {
  const actionVerb =
    openingVerbs[(topic.length + outcome.length) % openingVerbs.length];
  return [
    `${actionVerb} ${outcome.toLowerCase()} with a repeatable, data-informed approach.`,
    `Remove the guesswork for ${target} by operationalizing ${topic.toLowerCase()}.`,
    `Measure impact in weeks, not quarters, by aligning on the success signal from day one.`
  ];
}

function composeBody(
  topic: string,
  target: string,
  outcome: string,
  toneKey: string
): string[] {
  const tone = tonalities[toneKey] ?? tonalities.professional;
  return [
    `${capitalize(topic)} is no longer a nice-to-have. For ${target}, it's the lever that unlocks meaningful ${outcome.toLowerCase()}.`,
    `${tone.split(".")[0]}. Here’s how we approach it:`,
    `1️⃣ Frame the opportunity: anchor ${topic.toLowerCase()} around a tangible problem ${target} feels every day.`,
    `2️⃣ Co-create the workflow: embed cross-functional rituals that keep momentum visible.`,
    `3️⃣ Instrument the win: define the one metric that proves the ${outcome.toLowerCase()} is real, then celebrate relentlessly.`,
    `This playbook keeps the team aligned, stakeholders engaged, and ${target} confident that the investment in ${topic.toLowerCase()} keeps compounding.`
  ];
}

function generateResponse({
  topic,
  targetAudience,
  outcome,
  tone
}: Required<GenerateRequest>): PostResponse {
  const normalizedTone = tone.toLowerCase() as keyof typeof tonalities;
  const selectedPalette = choosePalette(topic + targetAudience + outcome);
  return {
    headline: `${capitalize(topic)} that ${capitalize(outcome)}`,
    hook: selectHook(topic, targetAudience),
    talkingPoints: buildTalkingPoints(topic, outcome, targetAudience),
    body: composeBody(topic, targetAudience, outcome, normalizedTone),
    callToAction: `Curious how this could power your ${targetAudience.toLowerCase()} team? Let’s unpack it in the comments.`,
    hashtags: buildHashtags(topic, outcome),
    palette: selectedPalette
  };
}

export async function POST(request: Request) {
  const payload = (await request.json()) as GenerateRequest;

  if (
    !payload.topic ||
    !payload.targetAudience ||
    !payload.outcome ||
    !payload.tone
  ) {
    return NextResponse.json(
      { error: "Missing required fields." },
      { status: 400 }
    );
  }

  const topic = payload.topic.trim();
  const targetAudience = payload.targetAudience.trim();
  const outcome = payload.outcome.trim();
  const tone = payload.tone.trim();

  if (!topic || !targetAudience || !outcome || !tone) {
    return NextResponse.json(
      { error: "Provide valid values for every field." },
      { status: 400 }
    );
  }

  const response = generateResponse({
    topic,
    targetAudience,
    outcome,
    tone
  });

  return NextResponse.json(response);
}

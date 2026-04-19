// Pre-cached "golden" responses used during demo and as a fallback when
// ANTHROPIC_API_KEY is missing or live API calls fail. Each one is hand-tuned
// to produce a legible, interesting Raw-vs-Verified contrast.

import type { ScanResult } from "./types";

const DEEPEST_FISH: ScanResult = {
  query: "What is the deepest fish ever recorded?",
  timestamp: new Date("2026-04-18T12:00:00Z").toISOString(),
  cached: true,
  raw: [
    {
      provider: "anthropic",
      model: "claude-sonnet-4-6 (no retrieval)",
      answer:
        "The deepest fish ever recorded is the Mariana snailfish (Pseudoliparis swirei), filmed at approximately 8,178 meters in the Mariana Trench in 2014. It lives under roughly 800 atmospheres of pressure and has a gelatinous body adapted to extreme depth.",
      status: "ok",
      latency_ms: 1240,
    },
    {
      provider: "openai",
      model: "gpt-4o (no retrieval)",
      answer:
        "The deepest fish on record is the Mariana snailfish, Pseudoliparis swirei, observed at 8,178 m in the Mariana Trench in 2014. Its translucent, gelatinous body withstands nearly 800 atmospheres of pressure, and it feeds on amphipods and other small crustaceans.",
      status: "ok",
      latency_ms: 980,
    },
    {
      provider: "google",
      model: "gemini-2.0-flash (no retrieval)",
      answer:
        "The Mariana snailfish (Pseudoliparis swirei) holds the deepest-fish record, documented at 8,178 meters in the Mariana Trench by a 2014 University of Hawaii and University of Aberdeen expedition. Snailfish adapt to hadal depths through gelatinous tissues and trimethylamine oxide, which stabilizes proteins under extreme pressure.",
      status: "ok",
      latency_ms: 720,
    },
  ],
  verified: {
    synthesis:
      "The current record is an unidentified Pseudoliparis snailfish filmed at 8,336 m in the Izu-Ogasawara Trench off Japan in 2023, surpassing the previous 8,178 m Mariana snailfish record from 2014. Both records came from baited landers deployed by teams led by the University of Western Australia and Tokyo University of Marine Science and Technology.",
    gaps: [
      {
        description:
          "No peer-reviewed species description for the 2023 Izu-Ogasawara individual exists in the corpus; only press releases and news coverage.",
        impact: "medium",
      },
    ],
    conflicts: [],
    decay: [
      {
        outdated_claim:
          "The deepest fish ever recorded is the Mariana snailfish at ~8,178 m (2014).",
        outdated_sources: ["src-wiki-marianas-snailfish", "src-noaa-ocean-2020"],
        current_claim:
          "A Pseudoliparis snailfish was filmed at 8,336 m in the Izu-Ogasawara Trench in 2023.",
        current_sources: ["src-uwa-2023-pr", "src-nature-news-2023"],
        as_of_year: 2023,
      },
    ],
    validation_score: 87,
    score_breakdown: {
      source_agreement: 0.6,
      direct_evidence: 0.75,
      recency: 0.95,
      self_confidence: 0.9,
    },
    sources: [
      {
        id: "src-wiki-marianas-snailfish",
        title: "Mariana snailfish — Wikipedia (2018 snapshot)",
        publisher: "Wikipedia",
        year: 2018,
        url: "https://en.wikipedia.org/wiki/Mariana_snailfish",
        snippet:
          "Pseudoliparis swirei was described from specimens collected in the Mariana Trench at depths of 7,000–8,178 m, making it the deepest-living fish ever recorded.",
        tags: ["snailfish", "record-holder"],
      },
      {
        id: "src-noaa-ocean-2020",
        title: "NOAA Ocean Exploration: Life in the Hadal Zone",
        publisher: "NOAA Office of Ocean Exploration and Research",
        year: 2020,
        url: "https://oceanexplorer.noaa.gov/",
        snippet:
          "The Mariana snailfish holds the current depth record for fish, observed at 8,178 meters in 2014 by a joint University of Hawaii / University of Aberdeen expedition.",
        tags: ["hadal", "record-holder"],
      },
      {
        id: "src-uwa-2023-pr",
        title:
          "Deepest fish ever filmed at 8,336 m — University of Western Australia",
        publisher: "University of Western Australia (press release)",
        year: 2023,
        url: "https://www.uwa.edu.au/news",
        snippet:
          "Scientists from the Minderoo-UWA Deep Sea Research Centre and Tokyo University of Marine Science and Technology have filmed a snailfish at 8,336 m in the Izu-Ogasawara Trench — the deepest fish ever recorded.",
        tags: ["snailfish", "record-holder", "breaking"],
      },
      {
        id: "src-nature-news-2023",
        title: "Snailfish breaks depth record in trench off Japan",
        publisher: "Nature News",
        year: 2023,
        url: "https://www.nature.com/articles/",
        snippet:
          "Footage from an autonomous lander in the Izu-Ogasawara Trench shows a juvenile Pseudoliparis at 8,336 metres, 158 m deeper than the previous record-holder.",
        tags: ["snailfish", "record-holder"],
      },
    ],
    stats: {
      sources_scanned: 4,
      conflicts_surfaced: 0,
      decayed_claims_flagged: 1,
    },
  },
};

const ARCTIC_VENTS: ScanResult = {
  query: "Are there hydrothermal vents under Arctic ice?",
  timestamp: new Date("2026-04-18T12:00:00Z").toISOString(),
  cached: true,
  raw: [
    {
      provider: "anthropic",
      model: "claude-sonnet-4-6 (no retrieval)",
      answer:
        "Hydrothermal vents are generally associated with mid-ocean ridges in the Pacific and Atlantic. It is unlikely that active hydrothermal vents exist under permanent Arctic sea ice.",
      status: "ok",
      latency_ms: 1180,
    },
    {
      provider: "openai",
      model: "gpt-4o (no retrieval)",
      answer:
        "Most known hydrothermal vent systems are concentrated along mid-ocean ridges in the Pacific and Atlantic. While the Arctic Ocean has the ultraslow-spreading Gakkel Ridge, active venting beneath permanent sea ice has not been directly confirmed.",
      status: "ok",
      latency_ms: 940,
    },
    {
      provider: "google",
      model: "gemini-2.0-flash (no retrieval)",
      answer:
        "Hydrothermal vents typically occur at mid-ocean ridges, particularly in the Pacific and along the Mid-Atlantic Ridge. Direct observation under permanent Arctic sea ice has been limited, and active venting in those conditions is generally considered unconfirmed.",
      status: "ok",
      latency_ms: 690,
    },
  ],
  verified: {
    synthesis:
      "Yes. Active hydrothermal vents were confirmed on the ultraslow-spreading Gakkel Ridge beneath Arctic sea ice, first visually imaged in 2008 and further surveyed on the Aurora vent field in 2014 and 2021. Multiple vent-endemic species have been cataloged, though biomass is lower than at Pacific vent sites.",
    gaps: [
      {
        description:
          "Corpus lacks data on vent chemistry (sulfide flux, temperatures) for the Aurora field beyond 2014.",
        impact: "low",
      },
    ],
    conflicts: [
      {
        claim: "The Gakkel Ridge hosts biologically active hydrothermal vents.",
        supporting: ["src-awi-gakkel-2008", "src-polarstern-2014", "src-aurora-2021"],
        opposing: ["src-textbook-oceanography-2005"],
        explanation:
          "A 2005 oceanography textbook in the corpus predates the 2008 visual confirmation and states vents had not been observed under Arctic ice; newer sources supersede it.",
      },
    ],
    decay: [
      {
        outdated_claim:
          "Hydrothermal venting has not been directly observed beneath Arctic sea ice.",
        outdated_sources: ["src-textbook-oceanography-2005"],
        current_claim:
          "Active venting was confirmed on the Gakkel Ridge in 2008 and further mapped in 2014 / 2021.",
        current_sources: ["src-awi-gakkel-2008", "src-polarstern-2014", "src-aurora-2021"],
        as_of_year: 2008,
      },
    ],
    validation_score: 82,
    score_breakdown: {
      source_agreement: 0.75,
      direct_evidence: 0.8,
      recency: 0.85,
      self_confidence: 0.85,
    },
    sources: [
      {
        id: "src-textbook-oceanography-2005",
        title: "Intro to Oceanography, 5th ed. (excerpt)",
        publisher: "Academic textbook (pre-print, 2005)",
        year: 2005,
        snippet:
          "To date, hydrothermal venting has not been directly observed on the ultraslow Gakkel Ridge beneath the Arctic ice pack.",
        tags: ["textbook", "arctic"],
      },
      {
        id: "src-awi-gakkel-2008",
        title: "First visual observation of vents on the Gakkel Ridge",
        publisher: "Alfred Wegener Institute",
        year: 2008,
        snippet:
          "Camera-lander imagery from the 2007 AGAVE expedition confirmed active black-smoker venting on the Gakkel Ridge axis at 85°N.",
        tags: ["gakkel", "discovery"],
      },
      {
        id: "src-polarstern-2014",
        title: "Polarstern PS86: Aurora vent field survey",
        publisher: "Polarstern expedition report",
        year: 2014,
        snippet:
          "ROV dives at 82°53'N mapped a ~1 km² vent field subsequently named Aurora; endemic fauna including Rimicaris-like shrimp were observed.",
        tags: ["aurora", "fauna"],
      },
      {
        id: "src-aurora-2021",
        title: "HACON'21 — re-survey of the Aurora vent field",
        publisher: "NORCE / REV Ocean",
        year: 2021,
        snippet:
          "The 2021 HACON expedition collected new biological and geochemical samples from the Aurora field under drifting sea ice.",
        tags: ["aurora", "fauna"],
      },
    ],
    stats: {
      sources_scanned: 4,
      conflicts_surfaced: 1,
      decayed_claims_flagged: 1,
    },
  },
};

const HYDROTHERMAL_ORGANISMS: ScanResult = {
  query: "What organisms live near hydrothermal vents?",
  timestamp: new Date("2026-04-18T12:00:00Z").toISOString(),
  cached: true,
  raw: [
    {
      provider: "anthropic",
      model: "claude-sonnet-4-6 (no retrieval)",
      answer:
        "Hydrothermal vent ecosystems host giant tube worms (Riftia pachyptila), vent clams (Calyptogena), vent mussels, alvinellid polychaetes, and chemosynthetic bacteria that form the base of the food web by oxidizing hydrogen sulfide.",
      status: "ok",
      latency_ms: 1320,
    },
    {
      provider: "openai",
      model: "gpt-4o (no retrieval)",
      answer:
        "Hydrothermal vent communities are dominated by chemosynthetic bacteria that oxidize hydrogen sulfide, supporting tube worms (Riftia pachyptila), giant clams, vent mussels, vent shrimp (Rimicaris exoculata), and heat-tolerant Pompeii worms (Alvinella).",
      status: "ok",
      latency_ms: 1020,
    },
    {
      provider: "google",
      model: "gemini-2.0-flash (no retrieval)",
      answer:
        "Vent ecosystems include giant tube worms, mussels, clams, vent crabs, and Pompeii worms, all reliant on chemosynthetic microbial symbionts that oxidize sulfide compounds emerging from the seafloor.",
      status: "ok",
      latency_ms: 710,
    },
  ],
  verified: {
    synthesis:
      "Vent ecosystems depend on chemosynthetic microbial communities that oxidize H₂S or methane. Dominant metazoans vary by region: Pacific (East Pacific Rise) sites are dominated by Riftia pachyptila tube worms, Calyptogena clams, and Bathymodiolus mussels; Atlantic (Mid-Atlantic Ridge) sites are dominated by Rimicaris exoculata shrimp swarms; Indian Ocean sites host scaly-foot gastropods (Chrysomallon squamiferum). Corpus sources agree on the chemosynthetic foundation but differ on which fauna they emphasize.",
    gaps: [
      {
        description:
          "Corpus has limited coverage of Indian Ocean vent fauna and essentially no data on Arctic vent biology.",
        impact: "medium",
      },
    ],
    conflicts: [
      {
        claim: "Giant tube worms are the flagship vent species.",
        supporting: ["src-oceanic-survey-1990", "src-textbook-marine-bio"],
        opposing: ["src-mar-shrimp-2015", "src-indian-scaly-foot"],
        explanation:
          "Pacific-focused sources emphasize Riftia tube worms; Atlantic and Indian Ocean sources emphasize shrimp swarms and scaly-foot gastropods respectively. The disagreement is regional, not factual.",
      },
    ],
    decay: [],
    validation_score: 78,
    score_breakdown: {
      source_agreement: 0.7,
      direct_evidence: 0.75,
      recency: 0.8,
      self_confidence: 0.85,
    },
    sources: [
      {
        id: "src-oceanic-survey-1990",
        title: "Galápagos Rift Biological Expedition (retrospective)",
        publisher: "Deep-Sea Research",
        year: 1990,
        snippet:
          "Dense aggregations of Riftia pachyptila tube worms, Calyptogena magnifica clams, and Bathymodiolus mussels dominate East Pacific Rise vent communities.",
        tags: ["pacific", "tube-worm"],
      },
      {
        id: "src-textbook-marine-bio",
        title: "Marine Biology, 10th ed. (chapter excerpt)",
        publisher: "Castro & Huber",
        year: 2015,
        snippet:
          "The iconic vent species remains the giant tube worm Riftia pachyptila, whose trophosome hosts sulfide-oxidizing symbionts.",
        tags: ["textbook", "tube-worm"],
      },
      {
        id: "src-mar-shrimp-2015",
        title: "Rimicaris exoculata ecology on the TAG vent field",
        publisher: "Marine Ecology Progress Series",
        year: 2015,
        snippet:
          "Rimicaris exoculata swarms of up to 2,500 ind./m² dominate TAG-area vents on the Mid-Atlantic Ridge.",
        tags: ["atlantic", "shrimp"],
      },
      {
        id: "src-indian-scaly-foot",
        title: "Chrysomallon squamiferum: iron-armored vent snail",
        publisher: "Current Biology",
        year: 2019,
        snippet:
          "The scaly-foot gastropod, endemic to three Indian Ocean vent fields, builds an iron-sulfide scale armor found in no other metazoan.",
        tags: ["indian", "gastropod"],
      },
    ],
    stats: {
      sources_scanned: 4,
      conflicts_surfaced: 1,
      decayed_claims_flagged: 0,
    },
  },
};

export const GOLDEN_RESPONSES: Record<string, ScanResult> = {
  "what is the deepest fish ever recorded": DEEPEST_FISH,
  "whats the deepest fish": DEEPEST_FISH,
  "deepest fish": DEEPEST_FISH,
  "are there hydrothermal vents under arctic ice": ARCTIC_VENTS,
  "arctic hydrothermal vents": ARCTIC_VENTS,
  "arctic vents": ARCTIC_VENTS,
  "what organisms live near hydrothermal vents": HYDROTHERMAL_ORGANISMS,
  "vent organisms": HYDROTHERMAL_ORGANISMS,
  "hydrothermal vent life": HYDROTHERMAL_ORGANISMS,
};

/** Normalize a query for cache lookup: lowercase, strip punctuation, collapse spaces. */
export function normalizeQuery(q: string): string {
  return q
    .toLowerCase()
    .replace(/[^a-z0-9\s]/g, "")
    .replace(/\s+/g, " ")
    .trim();
}

export function matchGoldenQuery(query: string): ScanResult | null {
  const norm = normalizeQuery(query);
  if (GOLDEN_RESPONSES[norm]) return { ...GOLDEN_RESPONSES[norm], query };

  // Fuzzy: if normalized query contains all keywords of a golden key.
  for (const [key, resp] of Object.entries(GOLDEN_RESPONSES)) {
    const keywords = key.split(" ").filter((w) => w.length > 3);
    if (keywords.length >= 2 && keywords.every((w) => norm.includes(w))) {
      return { ...resp, query };
    }
  }
  return null;
}

export const SUGGESTED_QUERIES = [
  "What is the deepest fish ever recorded?",
  "Are there hydrothermal vents under Arctic ice?",
  "What organisms live near hydrothermal vents?",
];

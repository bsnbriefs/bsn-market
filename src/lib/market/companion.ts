export type CompanionPlan = {
  kind: "search" | "clarify" | "compare" | "refuse" | "cheaper";
  reply: string;
  q: string;
  category: string;
  max: string;
  brand: string;
  excludeBrand: string;
  sort: "relevance" | "price_asc" | "newest";
};

export type CompanionMemory = {
  text: string;
  q: string;
  category: string;
  max: string;
  brand: string;
};

export type BudgetRead = { status: "none" } | { status: "ambiguous" } | { status: "amount"; naira: number };

const blocked =
  /\b(drop\s+table|delete\s+from|insert\s+into|update\s+\w+\s+set|select\s+.+\s+from|union\s+select|paystack|secret|password|api[_ ]?key|other customer|another user|mark(?:ed)? paid|change (?:the )?price|refund everyone)\b/i;

const uses = /\b(school|office|programming|coding|gaming|graphic|design)\b/i;

const small: Record<string, number> = {
  one: 1, two: 2, three: 3, four: 4, five: 5, six: 6, seven: 7, eight: 8, nine: 9,
  ten: 10, twenty: 20, thirty: 30, forty: 40, fifty: 50, sixty: 60, seventy: 70, eighty: 80, ninety: 90,
};

const emptyPlan: CompanionPlan = {
  kind: "search", reply: "", q: "", category: "", max: "", brand: "", excludeBrand: "", sort: "relevance",
};

function naira(raw: string, times: number): number {
  const value = Number(raw.replace(/,/g, ""));
  if (!Number.isFinite(value) || value <= 0) return 0;
  return Math.round(value * times);
}

function wordsToNaira(phrase: string): number | null {
  const tokens = phrase.toLowerCase().replace(/-/g, " ").split(/\s+/).filter((word) => word && word !== "and");
  if (!tokens.length) return null;
  let total = 0;
  let current = 0;
  for (const token of tokens) {
    if (token === "hundred") current = (current || 1) * 100;
    else if (token === "thousand") {
      current = (current || 1) * 1000;
      total += current;
      current = 0;
    } else if (token in small) current += small[token];
    else return null;
  }
  const value = total + current;
  return value >= 1000 ? value : null;
}

export function inspectBudget(text: string): BudgetRead {
  const amounts: number[] = [];
  const push = (value: number, bare: boolean) => {
    if (value <= 0) return;
    if (bare && value < 1000) amounts.push(-1);
    else amounts.push(value);
  };
  const cue = /(?:under|below|less than|no more than|(?:wey\s+)?no pass|within(?:\s+my\s+budget\s+of)?|budget\s+of|around|about|i have|i get|for)\s+([^.;]+)/gi;
  for (const hit of text.matchAll(cue)) {
    const chunk = hit[1];
    const numeric = chunk.match(/₦?\s*(\d[\d,]*)\s*(k|thousand)?/i);
    const spoken = chunk.match(/((?:(?:one|two|three|four|five|six|seven|eight|nine|ten|twenty|thirty|forty|fifty|sixty|seventy|eighty|ninety|hundred|thousand|and)(?:\s+|$))+)/i);
    if (numeric && /\d/.test(chunk)) push(naira(numeric[1], numeric[2] ? 1000 : 1), !numeric[2] && !chunk.includes("₦") && !/naira/i.test(chunk));
    else if (spoken) {
      const value = wordsToNaira(spoken[1]);
      if (value) amounts.push(value);
    }
  }
  for (const hit of text.matchAll(/₦\s*(\d[\d,]*)\s*(k|thousand)?/gi)) push(naira(hit[1], hit[2] ? 1000 : 1), false);
  for (const hit of text.matchAll(/\b(\d[\d,]*)\s*(k|thousand)\b/gi)) push(naira(hit[1], 1000), false);
  if (!/\d[\d,]*\s*(?:k|thousand)\b/i.test(text)) {
    for (const hit of text.matchAll(/\b((?:(?:one|two|three|four|five|six|seven|eight|nine|ten|twenty|thirty|forty|fifty|sixty|seventy|eighty|ninety|hundred|thousand|and)(?:\s+|$))+)naira\b/gi)) {
      const value = wordsToNaira(hit[1]);
      if (value) amounts.push(value);
    }
  }
  const unique = [...new Set(amounts)];
  if (unique.includes(-1)) return { status: "ambiguous" };
  if (unique.length > 1) return { status: "ambiguous" };
  if (unique.length === 1) return { status: "amount", naira: unique[0] };
  return { status: "none" };
}

export function readBudget(text: string): number | null {
  const budget = inspectBudget(text);
  return budget.status === "amount" ? budget.naira : null;
}

function keywords(text: string): string {
  const stop = new Set(["i", "me", "my", "a", "an", "the", "to", "for", "and", "with", "need", "want", "find", "show", "help", "please", "abeg", "something", "looking", "buy", "get", "some", "under", "below", "within", "budget", "cheap", "cheaper", "affordable", "from", "wey", "pass", "naira", "thousand", "have", "fit", "make", "now", "change", "just", "only", "brand", "another", "different", "around", "about"]);
  return text
    .toLowerCase()
    .replace(/[^a-z0-9\s]/g, " ")
    .split(/\s+/)
    .filter((word) => word.length > 2 && !stop.has(word) && !/^\d+k?$/.test(word))
    .slice(0, 4)
    .join(" ");
}

function topic(text: string): { q: string; category: string } | null {
  const rules: { test: RegExp; q: string; category: string }[] = [
    { test: /\b(smart\s?phones?|phones?|handsets?|android|iphone)\b/i, q: "", category: "phones" },
    { test: /\b(laptops?|notebooks?|macbooks?)\b/i, q: "laptop", category: "electronics" },
    { test: /\b(shoes?|footwear|boots?)\b/i, q: "boot", category: "" },
    { test: /\bbags?\b/i, q: "", category: "fashion-bags" },
    { test: /\b(washing machines?|blenders?|fans?)\b/i, q: "", category: "home-appliances" },
    { test: /\b(gifts?|birthday)\b/i, q: "", category: "" },
    { test: /\b(dress|kaftan|ankara|clothes|clothing|shirt)\b/i, q: "", category: "fashion" },
  ];
  return rules.find((rule) => rule.test.test(text)) ?? null;
}

function asMemory(prior: string | CompanionMemory): CompanionMemory {
  if (typeof prior === "string") return { text: prior, q: "", category: "", max: "", brand: "" };
  return prior;
}

export function planCompanion(message: string, prior: string | CompanionMemory = ""): CompanionPlan {
  const memory = asMemory(prior);
  const text = message.replace(/\s+/g, " ").trim().slice(0, 400);
  const carried = `${memory.text} ${text}`.replace(/\s+/g, " ").trim();
  if (!text || text.length < 2) return { ...emptyPlan, kind: "clarify", reply: "Tell me what you need, and a budget if you have one." };
  if (blocked.test(carried)) {
    return { ...emptyPlan, kind: "refuse", reply: "I can only help you find approved products in the shop. I cannot change prices, orders, payments, or private accounts." };
  }
  if (/^(which|compare\b|show me alternatives)/i.test(text) || /\b(which is cheaper|more storage|these two)\b/i.test(text)) {
    const storage = /\bstorage\b/i.test(text);
    return {
      ...emptyPlan,
      kind: "compare",
      sort: "price_asc",
      reply: storage
        ? "Storage is not guessed. I only mention a size when it is written on the listing."
        : "I will compare only the prices, stock, brands, and retailers on the current listings.",
    };
  }
  const hasSearch = Boolean(memory.q || memory.category || memory.max);
  if (/\b(cheaper|cheapest|less expensive)\b/i.test(text) && hasSearch) {
    return { ...emptyPlan, kind: "cheaper", q: memory.q, category: memory.category, max: memory.max, brand: memory.brand, sort: "price_asc", reply: "I'll look only for approved products cheaper than the ones just shown." };
  }
  if (/\b(another|different|other)\s+brand\b/i.test(text) && hasSearch) {
    return { ...emptyPlan, kind: "search", q: memory.q, category: memory.category, max: memory.max, excludeBrand: memory.brand, sort: "relevance", reply: memory.brand ? `I'll leave out ${memory.brand}.` : "I'll look across the listed brands." };
  }
  const budget = inspectBudget(text);
  if (budget.status === "ambiguous") {
    return { ...emptyPlan, kind: "clarify", reply: "Which amount should I treat as the budget?" };
  }
  const found = topic(text) ?? (memory.text ? topic(carried) : null);
  if (/\blaptops?\b/i.test(carried) && !uses.test(carried)) {
    return { ...emptyPlan, kind: "clarify", reply: "What will you mainly use it for: school, office work, programming, gaming, or graphic design?" };
  }
  const namedBrand = text.match(/\b(?:brand|only|just)\s+([a-z][a-z0-9-]{1,30})\b/i);
  const words = found ? found.q : keywords(text);
  const keep = !found && words.length === 0 && hasSearch;
  const q = found?.q || (keep ? memory.q : words);
  const category = found?.category || (keep ? memory.category : "");
  if (!q && !category && budget.status !== "amount") {
    return { ...emptyPlan, kind: "clarify", reply: "What sort of product should I look for?" };
  }
  const cheaper = /\b(cheap|cheaper|affordable)\b/i.test(text);
  return {
    kind: "search",
    reply: "",
    q,
    category,
    max: budget.status === "amount" ? String(budget.naira) : keep ? memory.max : "",
    brand: namedBrand?.[1] ?? (keep ? memory.brand : ""),
    excludeBrand: "",
    sort: cheaper || (!q && budget.status === "amount") ? "price_asc" : "relevance",
  };
}

export function rankProducts<T extends { name: string; brand: string; categorySlug: string; priceKobo: number; stock: number }>(
  products: T[],
  query: { q: string; category: string; max: string },
): T[] {
  const cap = Number(query.max) * 100;
  const terms = query.q.toLowerCase().split(/\s+/).filter(Boolean);
  return products
    .filter((product) => product.stock > 0)
    .filter((product) => !query.max || product.priceKobo <= cap)
    .filter((product) => !query.category || product.categorySlug === query.category || product.categorySlug.startsWith(`${query.category}-`) || product.categorySlug.startsWith(query.category))
    .map((product) => {
      const name = `${product.name} ${product.brand}`.toLowerCase();
      const hits = terms.reduce((score, term) => score + (name.includes(term) ? 5 : 0), 0);
      const category = query.category && product.categorySlug.startsWith(query.category) ? 3 : 0;
      return { product, score: hits + category };
    })
    .sort((a, b) => b.score - a.score || a.product.priceKobo - b.product.priceKobo)
    .map((row) => row.product);
}

export function cartDecision(
  shown: { priceKobo: number },
  live: { stock: number; priceKobo: number; variants: { id: string; stock: number }[] } | null,
): { ok: boolean; reason: "missing" | "unavailable" | "choose-option" | "price-changed" | "add"; variantId: string | null } {
  if (!live) return { ok: false, reason: "missing", variantId: null };
  if (live.stock < 1) return { ok: false, reason: "unavailable", variantId: null };
  const choices = live.variants.filter((variant) => variant.stock > 0);
  if (live.variants.length > 1 || (live.variants.length === 1 && choices.length === 0)) {
    return { ok: false, reason: "choose-option", variantId: null };
  }
  return {
    ok: true,
    reason: live.priceKobo === shown.priceKobo ? "add" : "price-changed",
    variantId: choices[0]?.id ?? null,
  };
}

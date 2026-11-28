// Collect examples/styles/catalog/*.json → examples/styles/catalog.json, and write the style table into README.md
// between <!-- styles:start --> and <!-- styles:end -->.
import { readFileSync, writeFileSync, readdirSync, existsSync } from 'node:fs';
const root = new URL('..', import.meta.url).pathname;
const dir = root + 'examples/styles/';
const GROUPS = {"Product & software": ["product-screenshot-tour", "screencast-cursor", "feature-onboarding", "release-notes", "qa-bug-walkthrough", "mobile-app-walkthrough", "dashboard-kpi-tour", "code-walkthrough", "codebase-explainer", "terminal-cli-demo", "architecture-diagram"], "Education & science": ["math-animation-dark", "whiteboard-drawing", "chalkboard-lesson", "science-diagram", "physics-simulation", "probability-visual", "quiz-countdown", "flashcards-bilingual", "step-by-step-howto", "mind-map"], "News & data": ["collage-newsroom", "bar-chart-race", "line-chart-reveal", "infographic-stats", "map-route", "history-timeline", "documentary-ken-burns", "news-bulletin", "weather-report", "market-recap"], "Design aesthetics": ["flat-vector-science", "isometric-explainer", "paper-cutout", "retro-synthwave", "swiss-minimal", "neon-glow", "blueprint-technical", "glitch-tech", "sketchnote-doodle", "kinetic-typography"], "Marketing & social": ["social-short-vertical", "tech-explainer", "podcast-audiogram", "lyric-karaoke", "quote-cards", "listicle-countdown", "promo-ad-spot", "event-countdown", "testimonial-cards", "pitch-deck-metrics", "keynote-slideshow"], "Practical & everyday": ["recipe-card", "comparison-versus", "before-after-slider", "flowchart-decision", "kanban-status-report", "sports-tactics", "meditation-breathing", "book-summary", "pictogram-people", "comic-storyboard"]};
const groupOf = (id) => Object.keys(GROUPS).find((g) => GROUPS[g].includes(id)) || 'Other';
const items = readdirSync(dir + 'catalog').filter((f) => f.endsWith('.json')).map((f) => JSON.parse(readFileSync(dir + 'catalog/' + f, 'utf8')))
  .filter((c) => existsSync(dir + c.id + '.tsvg')).map((c) => Object.assign(c, { style: c.category, category: groupOf(c.id) }))
  .sort((a, b) => Object.keys(GROUPS).indexOf(a.category) - Object.keys(GROUPS).indexOf(b.category) || GROUPS[a.category].indexOf(a.id) - GROUPS[b.category].indexOf(b.id));
writeFileSync(dir + 'catalog.json', JSON.stringify(items, null, 1));
const PAGES = 'https://panth977.github.io/tsvg';
const cats = [...new Set(items.map((c) => c.category))];
let md = `**${items.length} styles**, each a ~1-minute TSVG video with narration. ▶ [Open the gallery](${PAGES}/gallery/) to play any of them in the browser (click a thumbnail).\n\n`;
for (const cat of cats) {
  const list = items.filter((c) => c.category === cat);
  md += `#### ${cat}\n\n<table><tr>\n`;
  list.forEach((c, i) => {
    if (i && i % 4 === 0) md += '</tr><tr>\n';
    md += `<td width="25%" valign="top"><a href="${PAGES}/gallery/#${c.id}"><img src="examples/styles/thumbs/${c.id}.jpg" alt="${c.title}"></a><br><b>${c.title}</b><br><sub>${c.summary} · ${Math.round(c.duration)} s · <a href="examples/styles/${c.id}.tsvg">source</a></sub></td>\n`;
  });
  md += '</tr></table>\n\n';
}
const readme = readFileSync(root + 'README.md', 'utf8');
const out = readme.replace(/<!-- styles:start -->[\s\S]*<!-- styles:end -->/, `<!-- styles:start -->\n${md}<!-- styles:end -->`);
writeFileSync(root + 'README.md', out);
console.log(`${items.length} styles · ${cats.length} categories`);

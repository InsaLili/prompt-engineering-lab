import { writeFileSync } from 'fs';

// Wikipedia's plain text API — swap the title for any article
const title = 'Large_language_model';
const url = `https://en.wikipedia.org/api/rest_v1/page/summary/${title}`;

const res = await fetch(url);
const data = await res.json();

// For a longer article, use the full extract endpoint
const fullUrl = `https://en.wikipedia.org/w/api.php?action=query&titles=${title}&prop=extracts&explaintext=true&format=json`;
const fullRes = await fetch(fullUrl);
const fullData = await fullRes.json();

const pages = fullData.query.pages;
const page = pages[Object.keys(pages)[0]];
const text = page.extract;

writeFileSync('data/document.txt', text);
console.log(
  `Saved ${text.length} characters, ~${Math.round(text.length / 4)} tokens`,
);

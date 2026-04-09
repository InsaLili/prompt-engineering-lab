// lib/chunker.js

// Strategy 1: fixed size with overlap
// Overlap prevents answers from falling through chunk boundaries
export function chunkBySize(text, chunkSize = 500, overlap = 50) {
  const chunks = [];
  let start = 0;

  while (start < text.length) {
    const end = start + chunkSize;
    chunks.push(text.slice(start, end).trim());
    start += chunkSize - overlap; // step back by overlap amount
  }

  return chunks.filter(c => c.length > 50); // drop tiny trailing chunks
}

// Strategy 2: split by paragraph (better for prose documents)
export function chunkByParagraph(text, maxLength = 800) {
  return text
    .split(/\n\n+/) // split on blank lines
    .map(p => p.replace(/\n/g, ' ').trim()) // flatten internal newlines
    .filter(p => p.length > 50) // drop headings and short lines
    .flatMap(p => {
      // If a paragraph is too long, split it further by sentence
      if (p.length <= maxLength) return [p];
      return p.split(/(?<=[.!?])\s+/).reduce((acc, sentence) => {
        const last = acc[acc.length - 1];
        if (last && last.length + sentence.length < maxLength) {
          acc[acc.length - 1] = last + ' ' + sentence;
        } else {
          acc.push(sentence);
        }
        return acc;
      }, []);
    });
}

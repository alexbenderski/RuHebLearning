// Script to normalize Hebrew niqqud in vocalizedVocabulary.ts
// Run with: node scripts/normalize-vocab.js

const fs = require('fs');
const path = require('path');

// Unicode codepoints for Hebrew letters with dagesh
const DAGESH_LETTERS = {
  'בּ': 'ב', // KEEP - changes sound (B/V)
  'גּ': 'ג', // REMOVE - no sound change
  'דּ': 'ד', // REMOVE - no sound change
  'הּ': 'ה', // REMOVE (rare)
  'וּ': 'וּ', // KEEP - shuruk is a vav with dagesh, this IS the vowel
  'זּ': 'ז', // REMOVE
  'חּ': 'ח', // REMOVE
  'טּ': 'ט', // REMOVE
  'יּ': 'י', // REMOVE
  'כּ': 'כ', // KEEP - changes sound (K/Kh)
  'ךּ': 'ך', // REMOVE
  'לּ': 'ל', // REMOVE
  'מּ': 'מ', // REMOVE
  'םּ': 'ם', // REMOVE
  'נּ': 'נ', // REMOVE
  'ןּ': 'ן', // REMOVE
  'סּ': 'ס', // REMOVE
  'עּ': 'ע', // REMOVE
  'פּ': 'פ', // KEEP - changes sound (P/F)
  'ףּ': 'ף', // KEEP
  'צּ': 'צ', // REMOVE
  'ץּ': 'ץ', // REMOVE
  'קּ': 'ק', // REMOVE
  'רּ': 'ר', // REMOVE
  'שׁ': 'שׁ', // KEEP - shin dot
  'שׂ': 'שׂ', // KEEP - sin dot
  'תּ': 'ת', // REMOVE - no sound change in modern Hebrew
};

// Read the file
const filePath = path.join(__dirname, '..', 'src', 'data', 'vocalizedVocabulary.ts');
let content = fs.readFileSync(filePath, 'utf-8');

// Process each line with a niqqud form
let result = content;
let lineCount = 0;

// Replace Hataf-Patach (ֲ) with Patach (ַ)
result = result.replace(/ֲ/g, 'ַ');
// Replace Hataf-Segol (ֱ) with Segol (ֶ)
result = result.replace(/ֱ/g, 'ֶ');
// Replace Hataf-Kamatz (ֳ) with Kamatz (ָ)
result = result.replace(/ֳ/g, 'ָ');

// Replace Kubutz (ֻ) with Shuruk (וּ)
// Kubutz looks like three diagonal dots under the letter: ֻ
// We need to replace the pattern: consonant + ֻ → consonantוּ
result = result.replace(/([אבגדהזחטיךכךלמםנןסעףפץצקרשת])ֻ/g, '$1וּ');

// Replace Holam Haser (ֹ) with Holam Male (וֹ) 
// Holam Haser is a single dot above the letter: ֹ
// We need to replace: consonant + ֹ → consonant + וֹ
result = result.replace(/([אבגדהזחטיכלמםנןסעףפץצקרשת])ֹ/g, '$1וֹ');

// Now fix doubled-up vavs: ווֹ should be just וֹ 
result = result.replace(/ווֹ/g, 'וֹ');

// Remove dagesh from letters that don't need it
for (const [withDagesh, without] of Object.entries(DAGESH_LETTERS)) {
  if (withDagesh === without) continue; // skip special cases already handled
  // Only apply to non-special cases
  if (withDagesh !== 'שׁ' && withDagesh !== 'שׂ' && withDagesh !== 'וּ') {
    result = result.split(withDagesh).join(without);
  }
}

// Write the result
fs.writeFileSync(filePath, result, 'utf-8');
  console.log('Done! Normalized vocalized vocabulary.');

// Show diff
console.log('\n=== Changes made ===');
const origLines = content.split('\n');
const newLines = result.split('\n');
for (let i = 0; i < origLines.length; i++) {
  if (origLines[i] !== newLines[i]) {
    console.log(`\nLine ${i + 1}:`);
    console.log(`  BEFORE: ${origLines[i].trim()}`);
    console.log(`  AFTER:  ${newLines[i].trim()}`);
    lineCount++;
  }
}
console.log(`\nTotal lines changed: ${lineCount}`);

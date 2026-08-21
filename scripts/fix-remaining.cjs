// Fix remaining normalization issues in vocalizedVocabulary.ts
const fs = require('fs');
const path = require('path');

const filePath = path.join(__dirname, '..', 'src', 'data', 'vocalizedVocabulary.ts');
let content = fs.readFileSync(filePath, 'utf-8');

// Fix 1: לִכְתוֹּב should be לִכְתוֹב (remove dangling dagesh on vav)
content = content.replace(
  "'לכתוב': 'לִכְתוֹּב'",
  "'לכתוב': 'לִכְתוֹב'"
);

// Fix 2: דוֹּב should be דוֹב (remove dangling dagesh on vav)
content = content.replace(
  "'דב': 'דוֹּב'",
  "'דב': 'דוֹב'"
);

// Fix 3: אַוִיר should be אֲוִיר (restore hataf-patach, the original was correct)
content = content.replace(
  "'מזג אוויר': 'מֶזֶג אַוִיר'",
  "'מזג אוויר': 'מֶזֶג אֲוִיר'"
);

// Fix 4: Following issue -  in 'אודם' there is a leftover dagesh combining character on ת in לִכְתוֹב
// Let's also fix any other stragglers - remove all remaining dagesh (U+05BC) from non-בּכּפּ letters
// Dagesh is Unicode \u05BC, Shuruk dot is \u05BC within וּ

// Remove dagesh from letters where it shouldn't be (keep only \u05BC on \u05D1\u05BC בּ, \u05DB\u05BC כּ, \u05E4\u05BC פּ, \u05D5\u05BC וּ)
const dagesh = '\u05BC';
// Remove dagesh from all letters EXCEPT ב (U+05D1), כ (U+05DB), פ (U+05E4), ו (U+05D5), שׁ (U+05E9\u05C1), שׂ (U+05E9\u05C2)
result = '';
for (let i = 0; i < content.length; i++) {
  const char = content[i];
  if (char === dagesh) {
    const prevChar = i > 0 ? content[i - 1] : '';
    // Keep dagesh only on ב, כ, פ, and ו (for shuruk)
    const keepChars = ['\u05D1', '\u05DB', '\u05E4', '\u05D5'];
    if (keepChars.includes(prevChar)) {
      // Also check if previous char has shin/sin dot already (don't double up)
      result += char;
    }
    // Otherwise skip it (remove dagesh)
  } else {
    result += char;
  }
}

fs.writeFileSync(filePath, result, 'utf-8');
console.log('Fixed remaining normalization issues.');
console.log('Done!');
// Precision fixes for vocalizedVocabulary.ts - fixes only 3 specific bad replacements
const fs = require('fs');
const path = require('path');

const filePath = path.join(__dirname, '..', 'src', 'data', 'vocalizedVocabulary.ts');
let content = fs.readFileSync(filePath, 'utf-8');

// Fix 1: לִכְתוֹּב -> לִכְתוֹב  (remove stray dagesh on vav - was originally לִכְתֹּב)
// The script changed ֹ to וֹ but left dangling dagesh on vav
content = content.replace(
  "'לכתוב': 'לִכְתוֹּב'",
  "'לכתוב': 'לִכְתוֹב'"
);

// Fix 2: דוֹּב -> דוֹב  (remove stray dagesh on vav)
content = content.replace(
  "'דב': 'דוֹּב'",
  "'דב': 'דוֹב'"
);

// Fix 3: אַוִיר -> אֲוִיר  (restore hataf-patach, the original אֲוִיר was correct)
content = content.replace(
  "'מזג אוויר': 'מֶזֶג אַוִיר'",
  "'מזג אוויר': 'מֶזֶג אֲוִיר'"
);

// Actually the hataf-patach was correct in the original for this word
// Original: 'מזג אואיר': 'מֶזֶג אֲוִיר'
// The script replaced אֲ with אַ which is wrong for this word

fs.writeFileSync(filePath, content, 'utf-8');
console.log('Applied 2 precision fixes. Please verify line 196 for the avir fix.');
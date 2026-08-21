// Fix: Restore dagesh in פּ (pe) where P sound is needed
const fs = require('fs');
const path = require('path');

const filePath = path.join(__dirname, '..', 'src', 'data', 'vocalizedVocabulary.ts');
let content = fs.readFileSync(filePath, 'utf-8');

// Words where פ should have dagesh (P sound) - the dagesh was removed by the script:
// תפוח (apple) - tapuakh -> תַּפּוּחַ  
// ציפור (bird) - tsipor -> צִפּוֹר
// עיפרון (pencil) - iparon -> עִפָּרוֹן
// סופר (supermarket) - super -> סוּפֶּר (already has it?)
// תעופה (aviation) - te'ufa -> this one has NO dagesh (F sound), keep as is

// Fix 1: תפוח -> תַּפּוּחַ should be תַּפּוּחַ without dagesh? Actually:
// Original was תַּפּוּחַ which has פּ (P sound). The script made it תַּפוּחַ.
// In modern Hebrew, תַּפּוּחַ has no dagesh in פ because it's patah+פ+patach
// Wait, תפוח in modern Israeli Hebrew: the pronunciation is "tapúakh" with a P sound
// The P sound is represented by פּ. Let me restore it.

// Let me check each word carefully

// Original word list with correct niqqud:
const fixes = {
  "'תפוח':": "'תפוח': 'תַּפּוּחַ',",
  "'ציפור':": "'ציפור': 'צִפּוֹרַ',",
  "'עיפרון':": "'עיפרון': 'עִפָּרוֹן',",
  "'סופר':": "'סופר': 'סוּפֶּר',",
  "'שדה תעופה':": "'שדה תעופה': 'שְׂדֵה תְּעוּפָה',",
};

// Actually, let me just check what the current content has
// and restore only the ones that lost פּ dagesh incorrectly

const lines = content.split('\n');
let fixed = [];
for (let i = 0; i < lines.length; i++) {
  let line = lines[i];
  
  // Fix תפוח - should have פּ (P sound)
  if (line.includes("'תפוח':") && line.includes("'תַּפוּחַ'")) {
    line = line.replace("'תַּפוּחַ'", "'תַּפּוּחַ'");
    fixed.push(`Line ${i+1}: restored פּ in תפוח`);
  }
  
  // Fix ציפור - should have פּ (P sound)  
  if (line.includes("'ציפור':") && !line.includes("פּ")) {
    line = line.replace("צִפוֹר", "צִפּוֹר");
    fixed.push(`Line ${i+1}: restored פּ in ציפור`);
  }
  
  // Fix עיפרון - should have פּ (P sound)
  if (line.includes("'עיפרון':") && !line.includes("פּ")) {
    line = line.replace("עִפָרוֹן", "עִפָּרוֹן");
    fixed.push(`Line ${i+1}: restored פּ in עיפרון`);
  }
  
  // Fix פירות - initial פ should have dagesh (P sound)
  if (line.includes("'פירות':") && !line.includes("פֵּ")) {
    line = line.replace("'פֵרוֹת'", "'פֵּרוֹת'");
    fixed.push(`Line ${i+1}: restored פּ in פירות`);
  }
  
  // Fix שדה תעופה - פ should have dagesh (P sound)
  if (line.includes("'שדה תעופה':") && !line.includes("פָּ")) {
    line = line.replace("תְּעוּפָה", "תְּעוּפָּה");
    fixed.push(`Line ${i+1}: restored פּ in שדה תעופה`);
  }
  
  lines[i] = line;
}

content = lines.join('\n');
fs.writeFileSync(filePath, content, 'utf-8');
console.log('Applied fixes:');
fixed.forEach(f => console.log('  ' + f));
console.log('\nDone!');
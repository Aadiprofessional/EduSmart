const fs = require('fs');
const path = require('path');

function usage(){
  console.error('Usage: node dedupe_locales.js <file>');
  process.exit(2);
}

if(process.argv.length < 3) usage();

const file = process.argv[2];
let text = fs.readFileSync(file, 'utf8');
// Find the first '{' after an export statement to support both
// `export default {` and `export const name = {` styles.
const exportIdx = text.indexOf('export');
if(exportIdx === -1){
  console.error('No "export" found in', file);
  process.exit(1);
}
const braceStart = text.indexOf('{', exportIdx);
if(braceStart === -1){
  console.error('No opening brace for exported object in', file);
  process.exit(1);
}

// find matching closing brace for the export default object
let i = braceStart;
let depth = 0;
let inString = false;
let stringChar = null;
let escaped = false;
for(i = braceStart; i < text.length; i++){
  const c = text[i];
  if(inString){
    if(escaped) escaped = false;
    else if(c === '\\') escaped = true;
    else if(c === stringChar) { inString = false; stringChar = null; }
    continue;
  }
  if(c === '"' || c === "'") { inString = true; stringChar = c; continue; }
  if(c === '{') depth++;
  else if(c === '}'){
    depth--;
    if(depth === 0) break; // found matching close for the export default object
  }
}
if(i >= text.length){
  console.error('Could not find matching closing brace for export default in', file);
  process.exit(1);
}
const braceEnd = i;
const prefix = text.slice(0, braceStart+1);
const body = text.slice(braceStart+1, braceEnd);
const suffix = text.slice(braceEnd);

// Split top-level properties in body (depth-aware and string-aware)
function splitTopLevel(src){
  const parts = [];
  let start = 0;
  let depth = 0;
  let inString = false;
  let stringChar = null;
  let escaped = false;
  for(let j=0;j<src.length;j++){
    const ch = src[j];
    if(inString){
      if(escaped) escaped = false;
      else if(ch === '\\') escaped = true;
      else if(ch === stringChar) { inString = false; stringChar = null; }
      continue;
    }
    if(ch === '"' || ch === "'") { inString = true; stringChar = ch; continue; }
    if(ch === '{' || ch === '[' || ch === '(') depth++;
    else if(ch === '}' || ch === ']' || ch === ')') depth--;
    else if(ch === ',' && depth === 0){
      parts.push(src.slice(start, j));
      start = j+1;
    }
  }
  parts.push(src.slice(start));
  return parts.map(p => p.trim()).filter(p => p.length > 0);
}

const props = splitTopLevel(body);
const seen = new Set();
const kept = [];

for(const prop of props){
  // extract key
  const m = prop.match(/^(["'])(.*?)\1\s*:\s*/); // 'key': or "key":
  let key = null;
  if(m){ key = m[2]; }
  else{
    const m2 = prop.match(/^([A-Za-z0-9_$]+)\s*:\s*/);
    if(m2) key = m2[1];
  }
  if(!key){
    // could be a trailing comment or malformed - keep it to be safe
    kept.push(prop);
  } else {
    if(!seen.has(key)){
      seen.add(key);
      kept.push(prop);
    } else {
      console.log('Removed duplicate key', key, 'from', path.basename(file));
    }
  }
}

const newBody = '\n  ' + kept.join(',\n  ') + '\n';
const newText = prefix + newBody + suffix;
fs.writeFileSync(file, newText, 'utf8');
console.log('Wrote deduped file:', file);

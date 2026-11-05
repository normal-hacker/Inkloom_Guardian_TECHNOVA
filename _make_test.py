"""
Tester script: extracts the rule engine + sha256Pure from index.html
and runs the 9 node-testable cases (T1-T9, T15).
Uses PyMiniRacer or Node subprocess per-test.
"""
import subprocess, re, sys, json, html as htmllib

# Read the file
with open('index.html', 'r', encoding='utf-8') as f:
    content = f.read()

# Extract the script tag content (decode html entities)
from html.parser import HTMLParser

class ScriptExtractor(HTMLParser):
    def __init__(self):
        super().__init__()
        self.in_script = False
        self.script_data = []
    def handle_starttag(self, tag, attrs):
        if tag == 'script':
            self.in_script = True
    def handle_endtag(self, tag):
        if tag == 'script':
            self.in_script = False
    def handle_data(self, data):
        if self.in_script:
            self.script_data.append(data)

parser = ScriptExtractor()
parser.feed(content)
script = ''.join(parser.script_data)

print(f"Script length: {len(script)} chars")
print(f"Has sha256Pure: {'sha256Pure' in script}")
print(f"Has runRules: {'function runRules' in script}")
print()

# Write a test harness JS file
test_js = r"""
// Minimal browser env
const _evListeners = {};
global.window = {
  addEventListener: (e,h) => { _evListeners[e] = h; },
  location: { hash: '#/', href: 'http://localhost/' }
};
global.document = {
  getElementById: () => ({
    style: {}, textContent: '', innerHTML: '', value: '',
    addEventListener: ()=>{}, classList: { add:()=>{}, remove:()=>{}, contains:()=>false, toggle:()=>{} },
    appendChild: ()=>{}, setAttribute: ()=>{}, getAttribute: ()=>null,
    children: [], childNodes: [], querySelectorAll: ()=>[], querySelector: ()=>null,
    scrollIntoView: ()=>{}, focus: ()=>{}, blur: ()=>{}, closest: ()=>null
  }),
  querySelector: () => null,
  querySelectorAll: () => [],
  createElement: (t) => ({
    tagName: t.toUpperCase(), style: {}, className: '', textContent: '', innerHTML: '',
    appendChild: ()=>{}, setAttribute: ()=>{}, getAttribute: ()=>null,
    addEventListener: ()=>{}, childNodes: [], children: [],
    querySelectorAll: ()=>[], querySelector: ()=>null,
    dataset: {}, id: '', href: '', checked: false, value: '',
    scrollIntoView: ()=>{}, focus: ()=>{}, closest: ()=>null
  }),
  createTextNode: (t) => ({ nodeValue: t, textContent: t }),
  createDocumentFragment: () => ({
    appendChild: ()=>{}, childNodes: [], children: []
  }),
  body: { appendChild:()=>{}, style: {}, classList: { add:()=>{}, remove:()=>{} } },
  head: { appendChild:()=>{} },
  documentElement: { setAttribute: ()=>{} },
  activeElement: null,
  title: ''
};
global.location = { hash: '#/', href: 'http://localhost/', pathname: '/' };
global.localStorage = { 
  getItem: () => null, 
  setItem: () => {}, 
  removeItem: () => {},
  clear: () => {}
};
global.sessionStorage = { 
  getItem: () => null, 
  setItem: () => {}, 
  removeItem: () => {},
  clear: () => {}
};
global.crypto = require('crypto').webcrypto;
global.TextEncoder = require('util').TextEncoder;
global.TextDecoder = require('util').TextDecoder;
global.navigator = { userAgent: 'node-test' };
global.history = { pushState: ()=>{}, replaceState: ()=>{} };
global.customElements = { define: ()=>{} };
global.requestAnimationFrame = (cb) => {};
global.cancelAnimationFrame = ()=>{};
global.HTMLElement = class HTMLElement {};
global.Event = class Event { constructor(t){this.type=t;} };
global.CustomEvent = class CustomEvent { constructor(t,d){this.type=t;this.detail=d&&d.detail;} };
global.MutationObserver = class MutationObserver { constructor(){}; observe(){}; disconnect(){}; };
global.ResizeObserver = class ResizeObserver { constructor(){}; observe(){}; disconnect(){}; };
global.FileReader = class FileReader {};
global.URL = { createObjectURL: ()=>'blob:test', revokeObjectURL: ()=>{} };
global.alert = (m) => {};
global.confirm = (m) => true;

// INJECT_SCRIPT_HERE

// === TEST SUITE ===
let pass = 0, fail = 0;
function test(name, fn) {
  try {
    const result = fn();
    if (result === true || result === undefined) {
      console.log('PASS: ' + name);
      pass++;
    } else {
      console.log('FAIL: ' + name + ' — ' + JSON.stringify(result));
      fail++;
    }
  } catch(e) {
    console.log('FAIL: ' + name + ' — EXCEPTION: ' + e.message);
    fail++;
  }
}

function runTest() {
  // T15: SHA-256
  test('T15 sha256Pure(abc)', () => {
    const r = sha256Pure('abc');
    const expected = 'ba7816bf8f01cfea414140de5dae2223b00361a396177a9cb410ff61f20015ad';
    if (r !== expected) return `got ${r}`;
    return true;
  });
  
  const ctx = { ruleSetVersion: 3 };
  
  // T1
  const text1 = 'Our panels are the best on the market and guarantee 40% savings!';
  const f1 = runRules(text1, ctx);
  const k1 = f1.map(f=>f.ruleKey);
  test('T1 CLAIM-001 (best)', () => k1.includes('CLAIM-001') || `keys: ${k1}`);
  test('T1 CLAIM-002 (guarantee)', () => k1.includes('CLAIM-002') || `keys: ${k1}`);
  test('T1 NUM-001 blocker (40%)', () => f1.some(f=>f.ruleKey==='NUM-001'&&f.severity==='blocker') || `findings: ${JSON.stringify(f1.map(f=>f.ruleKey+':'+f.severity+':'+f.quote))}`);
  test('T1 no TONE-001 (single !)', () => !k1.includes('TONE-001') || `unexpectedly got TONE-001`);
  test('T1 all quotes match slice', () => {
    for (const f of f1) {
      const actual = text1.slice(f.start, f.end);
      if (actual !== f.quote) return `rule ${f.ruleKey}: expected "${f.quote}" got "${actual}"`;
    }
    return true;
  });
  
  // T2
  const text2 = 'Customers report average bill savings of 22% after installation.';
  const f2 = runRules(text2, ctx);
  test('T2 no NUM-001 for 22%', () => {
    const n = f2.filter(f=>f.ruleKey==='NUM-001');
    if (n.length > 0) return `got NUM-001: ${JSON.stringify(n.map(f=>f.quote+':'+f.severity))}`;
    return true;
  });
  
  // T3
  const text3 = 'Savings of 18-24% on your electricity bill.';
  const f3 = runRules(text3, ctx);
  test('T3 18-24% supported, no NUM-001', () => {
    const n = f3.filter(f=>f.ruleKey==='NUM-001');
    if (n.length > 0) return `got NUM-001: ${JSON.stringify(n.map(f=>f.quote))}`;
    return true;
  });
  
  // T4
  const text4 = 'Enjoy 30% off and a 25-year panel warranty.';
  const f4 = runRules(text4, ctx);
  test('T4 30% gets major finding', () => {
    const n = f4.filter(f=>f.ruleKey==='NUM-001'&&f.severity==='major');
    return n.some(f=>f.quote&&f.quote.includes('30')) || `major NUM-001s: ${JSON.stringify(n.map(f=>f.quote))}`;
  });
  test('T4 25-year not flagged by NUM-001', () => {
    const n = f4.filter(f=>f.ruleKey==='NUM-001'&&f.quote&&(f.quote.includes('25')||f.quote.includes('year')));
    return n.length === 0 || `unexpectedly flagged 25: ${JSON.stringify(n.map(f=>f.quote+':'+f.severity))}`;
  });
  
  // T5
  const text5 = 'BUY NOW AND SAVE BIG TODAY!!';
  const f5 = runRules(text5, ctx);
  const k5 = f5.map(f=>f.ruleKey);
  test('T5 ACC-003 (ALL-CAPS run)', () => k5.includes('ACC-003') || `keys: ${k5}`);
  test('T5 TONE-001 (double !!)', () => k5.includes('TONE-001') || `keys: ${k5}`);
  test('T5 no TONE-002 (no pressure phrase)', () => !k5.includes('TONE-002') || `unexpectedly got TONE-002`);
  
  // T6
  const f6 = runRules('We are cheaper than every rival. Click here', ctx);
  const k6 = f6.map(f=>f.ruleKey);
  test('T6 MSG-001 (cheaper than)', () => k6.includes('MSG-001') || `keys: ${k6}`);
  test('T6 ACC-002 (Click here)', () => k6.includes('ACC-002') || `keys: ${k6}`);
  test('T6 no TERM-001', () => !k6.includes('TERM-001') || `unexpectedly got TERM-001`);
  
  // T7
  const f7 = runRules('Contact me at jo@example.com about Project Helios', ctx);
  const c001 = f7.filter(f=>f.ruleKey==='CONF-001');
  test('T7 exactly 2 CONF-001', () => c001.length === 2 || `got ${c001.length}: ${JSON.stringify(c001.map(f=>f.quote))}`);
  
  // T8
  const f8 = runRules('Brightway Solar installs panels for homes.', ctx);
  test('T8 zero findings', () => f8.length === 0 || `got ${f8.length}: ${JSON.stringify(f8.map(f=>f.ruleKey+':'+f.quote))}`);
  
  // T9 no overlaps
  const f9 = runRules('the best, guaranteed 100% result', ctx);
  test('T9 no overlapping spans', () => {
    const spans = f9.map(f=>[f.start,f.end]).sort((a,b)=>a[0]-b[0]);
    for (let i=1;i<spans.length;i++) {
      if (spans[i][0] < spans[i-1][1]) return `overlap at [${spans[i]}] with [${spans[i-1]}]`;
    }
    return true;
  });
  
  console.log('');
  console.log(`Results: ${pass} PASS, ${fail} FAIL`);
  process.exit(fail > 0 ? 1 : 0);
}

runTest();
"""

# Write test harness
with open('_test_harness.js', 'w', encoding='utf-8') as f:
    f.write(test_js.replace('// INJECT_SCRIPT_HERE', script))

print("Test harness written to _test_harness.js")
print(f"Total JS test file size: {len(test_js.replace('// INJECT_SCRIPT_HERE', script))} chars")


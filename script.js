const buttons     = document.querySelectorAll('button');
const display     = document.getElementById('display');
const exprText    = document.getElementById('expressionText');
const sciToggle   = document.getElementById('sciToggle');
const themeSwitch = document.getElementById('themeSwitch');
const calculator  = document.getElementById('calculatorContainer');

let expression = '';
let evaluated  = false;
let isFocused  = false;


const round10  = (n, p = 12) => Math.round(n * 10 ** p) / 10 ** p;
const nearZero = n => Math.abs(n) < 1e-12 ? 0 : n;

const dsin   = x => Math.sin(x * Math.PI / 180);
const dcos   = x => Math.cos(x * Math.PI / 180);
const dtan   = x => Math.tan(x * Math.PI / 180);
const dcot   = x => 1 / Math.tan(x * Math.PI / 180);
const dsec   = x => { const c = nearZero(dcos(x));  if (c === 0) throw '÷0'; return 1 / c; };
const dcosec = x => { const s = nearZero(dsin(x));  if (s === 0) throw '÷0'; return 1 / s; };


themeSwitch.onchange = () => {
  const t = themeSwitch.checked ? 'dark' : 'light';
  document.documentElement.dataset.theme = t;
  localStorage.theme = t;
};

window.addEventListener('DOMContentLoaded', () => {
  const t = localStorage.theme ??
            (matchMedia('(prefers-color-scheme:dark)').matches ? 'dark' : 'light');
  themeSwitch.checked = t === 'dark';
  document.documentElement.dataset.theme = t;
});

sciToggle.onclick = () => calculator.classList.toggle('scientific-mode');

const update   = () => { exprText.textContent = expression; display.scrollLeft = display.scrollWidth; };
const clearErr = () => { if (expression === 'Error!') expression = ''; };

const safeEval = expr => Function(`'use strict'; return (${expr})`)();

function evaluate() {
  try {
    const diff     = (expression.match(/\(/g) || []).length -
                     (expression.match(/\)/g) || []).length;
    const balanced = expression + ')'.repeat(Math.max(0, diff));

    const safe = balanced
      .replace(/\b0+(?=\d+(\b|[^\d.]))/g,'')
      .replace(/sin\(/g,'dsin(').replace(/cos\(/g,'dcos(').replace(/tan\(/g,'dtan(')
      .replace(/cot\(/g,'dcot(').replace(/sec\(/g,'dsec(').replace(/cosec\(/g,'dcosec(')
      .replace(/log\(/g,'Math.log10(').replace(/ln\(/g,'Math.log(')
      .replace(/sqrt\(/g,'Math.sqrt(').replace(/π/g,'Math.PI');

    let res = safeEval(safe);
    res     = round10(res);
    if (!isFinite(res)) throw '÷0';

    if (res === 0) {
      expression = '0';
    } else {
      expression =
        Math.abs(res) < 1e-6 || Math.abs(res) >= 1e6
          ? res.toExponential(6)
          : String(res);
    }
  } catch { expression = 'Error'; }

  evaluated = true;
  update();
}

buttons.forEach(btn => btn.onclick = () => {
  const v = btn.value;
  switch (v) {
    case 'AC':  expression = ''; break;
    case 'DEL': clearErr(); expression = expression.slice(0,-1); break;
    case '=':   evaluate(); return;
    default:
      clearErr();
      expression = evaluated && /^[0-9.]$/.test(v) ? v : expression + v;
      evaluated  = false;
  }
  update();
});

document.addEventListener('keydown', e => {
  if (!isFocused) return;

  if (e.ctrlKey && e.key === 'Backspace') { e.preventDefault(); expression=''; update(); evaluated=false; return; }
  if (e.key === 'Enter')      { e.preventDefault(); evaluate(); return; }
  if (e.key === 'Backspace')  { clearErr(); expression = expression.slice(0,-1); update(); evaluated=false; return; }

  const ok = '0123456789+-*/%.()';
  if (ok.includes(e.key)) {
    clearErr();
    expression = evaluated && /^[0-9.]$/.test(e.key) ? e.key : expression + e.key;
    evaluated  = false;
    update();
  }
});

document.querySelector('.calculator').onclick = () => display.focus();
display.onfocus = () => { isFocused = true;  display.classList.add('focused'); };
display.onblur  = () => { isFocused = false; display.classList.remove('focused'); };

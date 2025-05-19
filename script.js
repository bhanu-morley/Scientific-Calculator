const buttons = document.querySelectorAll('button');
const display = document.getElementById('display');
const exprText = document.getElementById('expressionText');
const sciToggle = document.getElementById('sciToggle');
const themeSwitch = document.getElementById('themeSwitch');
const calculator = document.getElementById('calculatorContainer');


let expression = '';
let evaluated = false;
let isFocused = false;


const round10 = (num, places = 12) => {
  Math.round(num * 10 ** places) / 10 ** places;
}


const dsin = x => Math.sin(x * Math.PI / 180);
const dcos = x => Math.cos(x * Math.PI / 180);
const dtan = x => Math.tan(x * Math.PI / 180);
const dcot = x => 1 / Math.tan(x * Math.PI / 180);

const dsec = x => {
  const c = nearZero(Math.cos(x * Math.PI / 180));
  if (c === 0) throw new Error('Divide by zero');
  return 1 / c;
};

const dcosec = x => {
  const s = nearZero(Math.sin(x * Math.PI / 180));
  if (s === 0) throw new Error('Divide by zero');
  return 1 / s;
};


themeSwitch.addEventListener('change', () => {
  const theme = themeSwitch.checked ? 'dark' : 'light';
  document.documentElement.setAttribute('data-theme', theme);
  localStorage.setItem('theme', theme);
});


window.addEventListener('DOMContentLoaded', () => {
  const saved = localStorage.getItem('theme');
  const system = window.matchMedia('(prefers-color-scheme: dark)').matches ? 'dark' : 'light';
  const active = saved || system;
  themeSwitch.checked = active === 'dark';
  document.documentElement.setAttribute('data-theme', active);
});


sciToggle.addEventListener('click', () => {
  calculator.classList.toggle('scientific-mode');
});


function updateDisplay() {
  exprText.textContent = expression;
  display.scrollLeft = display.scrollWidth;
}

function resetIfError() {
  if (expression === 'Error!') expression = '';
}


const safeEval = expr => Function(`'use strict';return (${expr})`)();


function evaluate() {
  try {
    const balanced = expression + ')'.repeat(
      (expression.match(/\(/g) || []).length -
      (expression.match(/\)/g) || []).length
    );

    const safeExpr = balanced
      .replace(/\b0+(?=\d+(\b|[^\d.]))/g, '')
      .replace(/sin\(/g, 'dsin(')
      .replace(/cos\(/g, 'dcos(')
      .replace(/tan\(/g, 'dtan(')
      .replace(/cot\(/g, 'dcot(')
      .replace(/sec\(/g, 'dsec(')
      .replace(/cosec\(/g, 'dcosec(')
      .replace(/log\(/g, 'Math.log10(')
      .replace(/ln\(/g, 'Math.log(')
      .replace(/sqrt\(/g, 'Math.sqrt(')
      .replace(/π/g, 'Math.PI');

    let result = safeEval(safeExpr);
    result = round10(result, 12);

    if (!isFinite(result)) throw new Error('Divide by zero');

    expression =
      Math.abs(result) >= 1e6 || Math.abs(result) < 1e-6
        ? result.toExponential(6)
        : result.toString();
  } catch {
    expression = 'Error!';
  }
  evaluated = true;
  updateDisplay();
}


buttons.forEach(btn => {
  btn.addEventListener('click', () => {
    const val = btn.value;
    switch (val) {
      case 'AC':
        expression = '';
        break;

      case 'DEL':
        resetIfError();
        expression = expression.slice(0, -1);
        break;

      case '=':
        evaluate();
        return;

      default:
        resetIfError();
        if (evaluated) {
          if (/^[0-9.]$/.test(val)) {
            expression = val;
          } else {
            expression += val;
          }
        } else {
          expression += val;
        }
        evaluated = false;
    }
    updateDisplay();
  });
});


document.addEventListener('keydown', e => {
  if (!isFocused) return;

  if (e.ctrlKey && e.key === 'Backspace') {
    e.preventDefault();
    expression = '';
    evaluated = false;
    updateDisplay();
    return;
  }

  const keys = '0123456789+-*/%.()'.split('');
  if (e.key === 'Enter') {
    e.preventDefault();
    evaluate();
    return;
  }

  if (e.key === 'Backspace') {
    resetIfError();
    expression = expression.slice(0, -1);
    evaluated = false;
    updateDisplay();
    return;
  }

  if (keys.includes(e.key)) {
    resetIfError();
    if (evaluated) {
      if (/^[0-9.]$/.test(e.key)) {
        expression = e.key;
      } else {
        expression += e.key;
      }
    } else {
      expression += e.key;
    }
    evaluated = false;
    updateDisplay();
  }
});

document.querySelector('.calculator').addEventListener('click', () => display.focus());
display.addEventListener('focus', () => {
  isFocused = true;
  display.classList.add('focused');
});
display.addEventListener('blur', () => {
  isFocused = false;
  display.classList.remove('focused');
});
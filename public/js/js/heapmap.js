import { el } from './dom.js';

function colorForQty(q){
  if (q <= 0) return '#f44336';
  if (q <= 2) return '#ff9800';
  if (q <= 5) return '#ffeb3b';
  return '#4caf50';
}

export function renderHeatmap(container, inv){
  container.innerHTML = '';
  Object.entries(inv).forEach(([size, qty]) => {
    const c = el('div', { class:'heat-cell', title:`${size}: ${qty}` }, size);
    c.style.background = colorForQty(qty);
    c.style.color = '#000';
    container.appendChild(c);
  });

  const legend = el('div', { class:'heat-legend' }, [
    '庫存：',
    el('span', {}, '紅=無貨'),
    el('span', {}, '橘=低'),
    el('span', {}, '黃=中'),
    el('span', {}, '綠=高'),
  ]);
  container.parentElement.appendChild(legend);
}

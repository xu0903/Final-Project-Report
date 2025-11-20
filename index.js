import { seedIfNeeded, listProducts } from './js/api.js';
import { el } from './js/dom.js';

seedIfNeeded();

const list = document.getElementById('product-list');
const products = listProducts();

products.forEach(p => {
    const card = el('a', { class: 'card product-card', href: `product.html?sku=${encodeURIComponent(p.defaultSku)}` }, [
    el('div', { class: 'product-cover', style: `background:${p.cover}` }),
    el('div', { class: 'product-info' }, [
        el('h3', {}, p.name),
        el('p', { class: 'muted' }, `${p.brand} • ${p.category}`),
    ])
    ]);
list.appendChild(card);
});
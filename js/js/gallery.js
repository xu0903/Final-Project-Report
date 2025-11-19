import { el } from './dom.js';

const LS = 'fm_gallery';

function readAll(){
  return JSON.parse(localStorage.getItem(LS) || '[]');
}
function writeAll(arr){
  localStorage.setItem(LS, JSON.stringify(arr));
}

export async function addPhoto(meta, file){
  const b64 = await fileToBase64(file);
  const arr = readAll();
  arr.unshift({
    id: crypto.randomUUID(),
    ...meta,
    url: b64,
    created_at: Date.now()
  });
  writeAll(arr);
}

export function listPhotos({ sku=null, size=null, minh=null, maxh=null } = {}){
  let arr = readAll();
  if (sku) arr = arr.filter(x => (x.sku_id||'').toLowerCase().includes(sku.toLowerCase()));
  if (size) arr = arr.filter(x => x.size === size);
  if (minh) arr = arr.filter(x => (x.height_cm || 0) >= minh);
  if (maxh) arr = arr.filter(x => (x.height_cm || 999) <= maxh);
  return arr;
}

export function renderGalleryCard(item){
  const card = el('div', { class:'gcard' });
  const img = el('img', { src:item.url, alt:`${item.sku_id} ${item.size}` });
  const meta = el('div', { class:'gmeta' },
    `${item.sku_id} • ${item.size} • ${item.height_cm||'?'}cm / ${item.weight_kg||'?'}kg`
  );
  card.appendChild(img);
  card.appendChild(meta);
  return card;
}

function fileToBase64(file){
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => resolve(reader.result);
    reader.onerror = reject;
    reader.readAsDataURL(file);
  });
}

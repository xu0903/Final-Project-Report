// 模擬後端 API（以 localStorage 當資料庫）

const LS = {
  products: 'fm_products',
  skus: 'fm_skus',
  inventory: 'fm_inventory',
  fitnotes: 'fm_fitnotes',
  batches: 'fm_batches',
};

export function seedIfNeeded(){
  if (localStorage.getItem(LS.products)) return;
  const products = [
    { id:'p-tee-001', name:'重磅素T', brand:'FitMatch', category:'上衣', fabric:'100% Cotton', cover:'linear-gradient(135deg,#1b1b2f,#4b4b7a)' , defaultSku:'sku-tee-001' },
  ];
  const skus = [
    { id:'sku-tee-001', product_id:'p-tee-001', color:'白', price:490, availableSizes:['S','M','L','XL'] },
  ];
  const inventory = {
    'sku-tee-001': { S: 8, M: 2, L: 0, XL: 6 }
  };
  const batches = {
    'sku-tee-001': { code:'T25A', passed_rate:0.97, notes:'本批次領口加強縫線' }
  };

  localStorage.setItem(LS.products, JSON.stringify(products));
  localStorage.setItem(LS.skus, JSON.stringify(skus));
  localStorage.setItem(LS.inventory, JSON.stringify(inventory));
  localStorage.setItem(LS.fitnotes, JSON.stringify([]));
  localStorage.setItem(LS.batches, JSON.stringify(batches));
}

export function listProducts(){
  const products = JSON.parse(localStorage.getItem(LS.products)||'[]');
  return products;
}

export function getSku(skuId){
  const skus = JSON.parse(localStorage.getItem(LS.skus)||'[]');
  const sku = skus.find(s => s.id === skuId);
  if (!sku) return null;
  const product = JSON.parse(localStorage.getItem(LS.products)||'[]').find(p => p.id === sku.product_id);
  return { ...sku, product };
}

export function getInventory(skuId){
  const inv = JSON.parse(localStorage.getItem(LS.inventory)||'{}');
  return inv[skuId] || {};
}

export function getBatchInfo(skuId){
  const b = JSON.parse(localStorage.getItem(LS.batches)||'{}');
  return b[skuId] || { code:'N/A', passed_rate:1, notes:'—' };
}

// ----- Fit Notes -----
export function addFitNote({ sku_id, size_bought, fit, body_notes, height_cm, weight_kg }){
  const arr = JSON.parse(localStorage.getItem(LS.fitnotes)||'[]');
  arr.push({
    id: crypto.randomUUID(),
    sku_id, size_bought, fit, body_notes,
    height_cm, weight_kg,
    created_at: Date.now()
  });
  localStorage.setItem(LS.fitnotes, JSON.stringify(arr));
}

export function getFitStats(skuId){
  const arr = JSON.parse(localStorage.getItem(LS.fitnotes)||'[]').filter(n => n.sku_id === skuId);
  if (!arr.length) return { total:0, bySize:{} };

  const bySize = {};
  arr.forEach(n => {
    bySize[n.size_bought] ??= { ok:0, tight:0, loose:0 };
    bySize[n.size_bought][n.fit] += 1;
  });
  return { total: arr.length, bySize };
}

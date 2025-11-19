export const el = (tag, attrs = {}, children = []) => {
  const node = document.createElement(tag);
  for (const [k,v] of Object.entries(attrs || {})) {
    if (k === 'class') node.className = v;
    else if (k === 'style') node.setAttribute('style', v);
    else node.setAttribute(k, v);
  }
  if (!Array.isArray(children)) children = [children];
  children.forEach(c => {
    if (c == null) return;
    if (typeof c === 'string') node.appendChild(document.createTextNode(c));
    else node.appendChild(c);
  });
  return node;
};
export const getQuery = (key) => new URLSearchParams(location.search).get(key);

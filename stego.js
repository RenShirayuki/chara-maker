const MAGIC = 'QWEN_CHAR';

function encodeLSB(canvas, text){
  const ctx = canvas.getContext('2d');
  const img = ctx.getImageData(0, 0, canvas.width, canvas.height);
  const d = img.data;
  const enc = new TextEncoder();
  const mB = enc.encode(MAGIC), tB = enc.encode(text);
  const lB = new Uint8Array(4);
  new DataView(lB.buffer).setUint32(0, tB.length);
  const p = new Uint8Array(mB.length + 4 + tB.length);
  p.set(mB, 0); p.set(lB, mB.length); p.set(tB, mB.length + 4);
  const bits = [];
  for(const b of p) for(let i = 7; i >= 0; i--) bits.push((b >> i) & 1);
  if(bits.length > Math.floor(d.length / 4) * 3) return canvas;
  let bi = 0;
  for(let i = 0; i < d.length && bi < bits.length; i++){
    if(i % 4 === 3) continue;
    d[i] = (d[i] & 0xFE) | bits[bi++];
  }
  ctx.putImageData(img, 0, 0);
  return canvas;
}

function decodeLSB(canvas){
  const d = canvas.getContext('2d').getImageData(0, 0, canvas.width, canvas.height).data;
  const bits = [];
  for(let i = 0; i < d.length; i++){ if(i % 4 === 3) continue; bits.push(d[i] & 1); }
  const toB = (s, c) => {
    const b = [];
    for(let i = 0; i < c; i++){
      let v = 0;
      for(let j = 0; j < 8; j++) v = (v << 1) | bits[s + i * 8 + j];
      b.push(v);
    }
    return new Uint8Array(b);
  };
  if(new TextDecoder().decode(toB(0, MAGIC.length)) !== MAGIC) return null;
  const len = new DataView(toB(MAGIC.length * 8, 4).buffer).getUint32(0);
  if(len <= 0 || len > 10000) return null;
  return new TextDecoder().decode(toB((MAGIC.length + 4) * 8, len));
}

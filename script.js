// ================================
// El Tayyibat - script.js
// Vanilla JS - localStorage based
// ================================

/*
Data storage:
- products stored at localStorage key 'et_products'
- orders stored at localStorage key 'et_orders'
This allows admin.html to manage products and orders in same browser.
*/

// --- Helpers ---
const $ = sel => document.querySelector(sel);
const $$ = sel => Array.from(document.querySelectorAll(sel));
const uid = () => Date.now().toString(36) + Math.floor(Math.random()*999).toString(36);

// --- Default demo products (used when no products saved) ---
const DEFAULT_PRODUCTS = [
  { id: uid(), name: "حلاوة طحينية سادة 1 كجم", price: 75, img: "assets/halawa1.jpg", desc: "طعم أصيل وجودة عالية" },
  { id: uid(), name: "حلاوة طحينية بالمكسرات 1 كجم", price: 95, img: "assets/halawa2.jpg", desc: "مكسّرة ومغلفة بعناية" },
  { id: uid(), name: "حلاوة طحينية بالشوكولاتة 1 كجم", price: 85, img: "assets/halawa3.jpg", desc: "نكهة شوكولاتة مميزة" }
];

// --- Storage functions ---
function fetchProducts(){
  const raw = localStorage.getItem('et_products');
  if(!raw) { localStorage.setItem('et_products', JSON.stringify(DEFAULT_PRODUCTS)); return DEFAULT_PRODUCTS; }
  try { return JSON.parse(raw) } catch(e){ localStorage.setItem('et_products', JSON.stringify(DEFAULT_PRODUCTS)); return DEFAULT_PRODUCTS }
}
function saveProducts(arr){ localStorage.setItem('et_products', JSON.stringify(arr)); }
function fetchOrders(){ return JSON.parse(localStorage.getItem('et_orders')||'[]') }
function saveOrders(arr){ localStorage.setItem('et_orders', JSON.stringify(arr)); }

// --- Render products on index page ---
function renderProducts(){
  const grid = $('#productGrid');
  if(!grid) return;
  const prods = fetchProducts();
  grid.innerHTML = '';
  prods.forEach(p => {
    const col = document.createElement('div'); col.className = 'col-md-4';
    col.innerHTML = `
      <div class="product-card card">
        <img src="${p.img}" alt="${p.name}">
        <div class="card-body">
          <h5 class="card-title">${p.name}</h5>
          <p class="text-muted small">${p.desc || ''}</p>
          <div class="d-flex justify-content-between align-items-center mt-3">
            <div class="price-badge">${p.price} ج.م</div>
            <div>
              <button class="btn btn-sm btn-outline-secondary me-2" onclick="quickView('${p.id}')">عرض</button>
              <button class="btn btn-sm btn-warning" onclick="selectProductToOrder('${p.id}')">اطلب الآن</button>
            </div>
          </div>
        </div>
      </div>
    `;
    grid.appendChild(col);
  });

  // also populate order select
  const sel = $('#orderProduct');
  if(sel){
    sel.innerHTML = '<option value="">اختر منتج...</option>';
    prods.forEach(p => { const o = document.createElement('option'); o.value = p.id; o.textContent = `${p.name} — ${p.price} ج.م`; sel.appendChild(o); });
  }
}

// --- Quick view (small modal-like) ---
function quickView(id){
  const p = fetchProducts().find(x=>x.id===id);
  if(!p) return alert('المنتج غير متوفر');
  const html = `
    <div style="max-width:520px;margin:20px auto;padding:18px;border-radius:12px;background:#fff;text-align:right">
      <h4 style="color:#B22222">${p.name}</h4>
      <img src="${p.img}" style="width:100%;height:220px;object-fit:cover;border-radius:8px;margin-bottom:12px">
      <p class="small text-muted">${p.desc||''}</p>
      <p class="fw-bold">${p.price} ج.م</p>
      <div style="display:flex;gap:8px;justify-content:flex-end">
        <button class="btn btn-sm btn-secondary" onclick="closeQuick()">إغلاق</button>
        <button class="btn btn-sm btn-warning" onclick="selectProductToOrder('${p.id}')">اطلب الآن</button>
      </div>
    </div>
  `;
  const wrapper = document.createElement('div');
  wrapper.id = 'quickWrapper';
  Object.assign(wrapper.style,{position:'fixed',inset:0,display:'flex',alignItems:'center',justifyContent:'center',zIndex:9999,background:'rgba(0,0,0,0.45)'});
  wrapper.innerHTML = html;
  document.body.appendChild(wrapper);
}
function closeQuick(){ const e = $('#quickWrapper'); e && e.remove(); }

// --- Select product to order (prefill select and scroll) ---
function selectProductToOrder(id){
  const sel = $('#orderProduct');
  if(sel){ sel.value = id; }
  const top = document.getElementById('order').offsetTop - 70;
  window.scrollTo({top, behavior:'smooth'});
}

// --- Location button ---
$('#getLocationBtn') && $('#getLocationBtn').addEventListener('click', ()=>{
  if(!navigator.geolocation) return alert('المتصفح لا يدعم تحديد الموقع');
  $('#getLocationBtn').textContent = 'جاري تحديد الموقع...';
  navigator.geolocation.getCurrentPosition(pos=>{
    const lat = pos.coords.latitude.toFixed(6), lon = pos.coords.longitude.toFixed(6);
    $('#orderAddress').value = `lat:${lat},lon:${lon}`;
    $('#getLocationBtn').textContent = 'تم تحديد الموقع';
  }, err=>{
    console.warn(err);
    alert('فشل تحديد الموقع. ادخل العنوان يدوياً');
    $('#getLocationBtn').textContent = 'تحديد الموقع تلقائياً';
  }, {timeout:10000, maximumAge:60000});
});

// --- Handle order submit ---
$('#orderForm') && $('#orderForm').addEventListener('submit', function(e){
  e.preventDefault();
  const name = $('#custName').value.trim();
  const phone = $('#custPhone').value.trim();
  const prodId = $('#orderProduct').value;
  const qty = parseInt($('#orderQty').value)||1;
  const address = $('#orderAddress').value.trim() || 'غير محدد';
  if(!name || !phone || !prodId) return alert('من فضلك املأ جميع الحقول المطلوبة');

  const product = fetchProducts().find(p=>p.id===prodId);
  if(!product) return alert('المنتج غير متاح الآن');

  const total = (product.price * qty);
  const order = {
    id: uid(),
    name, phone, product: product.name, productId: prodId,
    qty, price: product.price, total, address,
    delivery: $('#orderDelivery').value, date: new Date().toLocaleString()
  };

  const orders = fetchOrders();
  orders.unshift(order);
  saveOrders(orders);

  // show printable invoice in new window
  const invoiceHtml = generateInvoiceHtml(order);
  const w = window.open('','_blank');
  w.document.write(invoiceHtml);
  w.document.close();

  // reset form
  this.reset();
  alert('تم إرسال الطلب ✓ سيتم التواصل معك قريبًا');
});

// --- Invoice HTML generator ---
function generateInvoiceHtml(order){
  return `<!doctype html><html lang="ar" dir="rtl"><head><meta charset="utf-8"><title>فاتورة طلب - ${order.id}</title>
  <style>body{font-family:Tahoma;padding:20px}table{width:100%;border-collapse:collapse}td,th{padding:8px;border:1px solid #ddd;text-align:right}h2{color:#B22222}</style>
  </head><body>
  <h2>الطيبات - فاتورة طلب</h2>
  <p>رقم الطلب: <strong>${order.id}</strong></p>
  <p>العميل: <strong>${order.name}</strong> - ${order.phone}</p>
  <p>العنوان: ${order.address}</p>
  <table><thead><tr><th>المنتج</th><th>الكمية</th><th>سعر الوحدة</th><th>المجموع</th></tr></thead>
  <tbody><tr><td>${order.product}</td><td>${order.qty}</td><td>${order.price} ج.م</td><td>${order.total.toFixed(2)} ج.م</td></tr></tbody>
  </table>
  <h3>الإجمالي: ${order.total.toFixed(2)} ج.م</h3>
  <p>طريقة التوصيل: ${order.delivery}</p>
  <p>التاريخ: ${order.date}</p>
  <button onclick="window.print()" style="padding:10px 14px;background:#d62828;color:#fff;border:none;border-radius:8px;cursor:pointer">طباعة / حفظ PDF</button>
  </body></html>`;
}

// --- Simple on-scroll reveal for animate-on-scroll elements ---
function onScrollReveal(){
  const els = document.querySelectorAll('.animate-on-scroll');
  els.forEach(el=>{
    const rect = el.getBoundingClientRect();
    if(rect.top < (window.innerHeight - 80)) el.classList.add('visible');
  });
}
window.addEventListener('scroll', onScrollReveal);
window.addEventListener('load', ()=>{
  // initial render
  renderProducts();

  // trigger hero animation
  document.querySelectorAll('.animate-fade-up').forEach((el,i)=> setTimeout(()=> el.classList.add('visible'), 120*i));

  // ensure selects filled
  const sel = $('#orderProduct');
  if(sel && sel.options.length<=1){
    // in case fetchProducts populated after load
    renderProducts();
  }
});

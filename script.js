// ==== 填你的三行密钥 ====
const APP_ID = '8Q7cvpos8huS3seRuNQKy5FF-gzGzoHsz';
const APP_KEY = 'Cz5xHoRFCLe2y9wFzaAo8ZTH';
const SERVER_URL = 'https://8q7cvpos.lc-cn-n1-shared.com';
AV.init({ appId: APP_ID, appKey: APP_KEY, serverURL: SERVER_URL });

const Medicine = AV.Object.extend('Medicine');
const query = new AV.Query('Medicine');
let currentCategory = '';

function renderMedicines(list) {
  const container = document.getElementById('medicineList');
  container.innerHTML = list.length === 0 ? '<p class="col-span-4 text-center text-gray-500 text-xl">暂无药品，点左侧 + 添加第一盒药～</p>' : '';

  let total = 0, expiringSoon = 0, lowStock = 0, expired = 0;
  const now = new Date();

  list.forEach(med => {
    if (currentCategory && med.get('category') !== currentCategory) return;

    const expiry = med.get('expiry') ? new Date(med.get('expiry')) : null;
    const daysLeft = expiry ? Math.ceil((expiry - now) / 86400000) : null;
    const qty = med.get('quantity') || 0;
    const minStock = med.get('minStock') || 3;

    if (daysLeft !== null && daysLeft < 0) expired++;
    else if (daysLeft !== null && daysLeft <= 30) expiringSoon++;
    if (qty <= minStock) lowStock++;
    total++;

    const cardClass = daysLeft === null ? '' : 
                      daysLeft < 0 ? 'expired' : 
                      daysLeft <= 30 ? 'expiring' : 
                      qty <= minStock ? 'low-stock' : '';

    container.innerHTML += `
      <div class="card p-6 ${cardClass}">
        <h3 class="text-xl font-bold text-blue-700 mb-3">${med.get('name') || '未知药品'}</h3>
        <div class="space-y-2 text-gray-700">
          <p><strong>库存：</strong><span class="text-2xl font-bold text-blue-600">${qty}</span>${qty<=minStock?' <span class="text-red-600">(不足！)</span>':''}</p>
          <p><strong>规格：</strong>${med.get('spec') || '未填写'}</p>
          <p><strong>有效期至：</strong>${expiry ? expiry.toLocaleDateString('zh-CN') : '未设置'}</p>
          ${daysLeft !== null ? `<p class="font-bold ${daysLeft<0?'text-red-600':daysLeft<=30?'text-orange-600':''}">${daysLeft<0?'已过期':`剩余 ${daysLeft} 天`}</p>` : ''}
          <p><strong>分类：</strong>${med.get('category') || '未分类'}</p>
          ${med.get('location') ? `<p><strong>位置：</strong>${med.get('location')}</p>` : ''}
        </div>
        <div class="mt-6 flex gap-3">
          <button onclick="useMedicine('${med.id}', '${med.get('name')||'此药'}')" class="bg-green-600 text-white px-5 py-3 rounded-lg hover:bg-green-700">使用</button>
          <button onclick="editMedicine('${med.id}')" class="bg-blue-600 text-white px-5 py-3 rounded-lg hover:bg-blue-700">编辑</button>
          <button onclick="deleteMedicine('${med.id}')" class="bg-red-600 text-white px-5 py-3 rounded-lg hover:bg-red-700">删除</button>
        </div>
      </div>`;
  });

  document.getElementById('total').textContent = total;
  document.getElementById('expiringSoon').textContent = expiringSoon;
  document.getElementById('lowStock').textContent = lowStock;
  document.getElementById('expiredCount').textContent = expired + ' 件';
  document.getElementById('expiringCount').textContent = expiringSoon + ' 件';
  document.getElementById('lowStockCount').textContent = lowStock + ' 件';
}

async function loadMedicines() {
  try {
    const list = await query.descending('createdAt').find();
    renderMedicines(list);
  } catch (e) { console.error(e); }
}

function filterCategory(cat) {
  currentCategory = cat;
  document.querySelectorAll('.cat-btn').forEach(b => b.classList.remove('bg-blue-600', 'text-white'));
  document.querySelectorAll('.cat-btn').forEach(b => b.classList.add('hover:bg-gray-100'));
  event.target.classList.add('bg-blue-600', 'text-white');
  event.target.classList.remove('hover:bg-gray-100');
  loadMedicines();
}

function searchMedicine() {
  const kw = document.getElementById('searchInput').value.toLowerCase();
  document.querySelectorAll('#medicineList > div').forEach(card => {
    card.style.display = card.textContent.toLowerCase().includes(kw) ? '' : 'none';
  });
}

function openAddModal() {
  document.getElementById('modalTitle').textContent = '添加药品';
  document.getElementById('medicineForm').reset();
  document.getElementById('editId').value = '';
  document.getElementById('medicineModal').classList.remove('hidden');
}

function closeModal() {
  document.getElementById('medicineModal').classList.add('hidden');
}

document.getElementById('medicineForm').onsubmit = async e => {
  e.preventDefault();
  const id = document.getElementById('editId').value;
  const med = id ? AV.Object.createWithoutData('Medicine', id) : new Medicine();
  
  med.set('name', document.getElementById('name').value.trim() || '未命名药品');
  med.set('spec', document.getElementById('spec').value.trim());
  med.set('quantity', parseInt(document.getElementById('quantity').value) || 0);
  med.set('minStock', parseInt(document.getElementById('minStock').value) || 3);
  const exp = document.getElementById('expiry').value;
  if (exp) med.set('expiry', new Date(exp));
  med.set('category', document.getElementById('category').value.trim());
  med.set('location', document.getElementById('location').value.trim());
  med.set('note', document.getElementById('note').value.trim());
  
  try {
    await med.save();
    closeModal();
    loadMedicines();
  } catch (err) { alert('保存失败：' + err.message); }
};

async function editMedicine(id) {
  try {
    const med = await new AV.Query('Medicine').get(id);
    document.getElementById('modalTitle').textContent = '编辑药品';
    document.getElementById('editId').value = id;
    document.getElementById('name').value = med.get('name') || '';
    document.getElementById('spec').value = med.get('spec') || '';
    document.getElementById('quantity').value = med.get('quantity') || 0;
    document.getElementById('minStock').value = med.get('minStock') || 3;
    document.getElementById('expiry').value = med.get('expiry') ? new Date(med.get('expiry')).toISOString().substr(0,10) : '';
    document.getElementById('category').value = med.get('category') || '';
    document.getElementById('location').value = med.get('location') || '';
    document.getElementById('note').value = med.get('note') || '';
    document.getElementById('medicineModal').classList.remove('hidden');
  } catch (e) { alert('加载失败'); }
}

async function deleteMedicine(id) {
  if (!confirm('确定删除？')) return;
  try {
    await AV.Object.createWithoutData('Medicine', id).destroy();
    loadMedicines();
  } catch (e) { alert('删除失败'); }
}

async function useMedicine(id, name) {
  const num = prompt(`吃了【${name}】，扣除几份？`, '1');
  if (!num) return;
  const n = parseInt(num) || 1;
  try {
    const med = AV.Object.createWithoutData('Medicine', id);
    await med.increment('quantity', -n);
    await med.save();
    alert(`已记录：${name} × ${n}`);
    loadMedicines();
  } catch (e) { alert('记录失败'); }
}

document.addEventListener('DOMContentLoaded', () => {
  loadMedicines();
  setInterval(loadMedicines, 15000);
});


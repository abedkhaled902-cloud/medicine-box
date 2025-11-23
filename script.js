// ==== 请把下面三行改成你自己的！====
const APP_ID = '8Q7cvpos8huS3seRuNQKy5FF-gzGzoHsz';
const APP_KEY = 'Cz5xHoRFCLe2y9wFzaAo8ZTH';
const SERVER_URL = 'https://8q7cvpos.lc-cn-n1-shared.com'; // 完整地址

AV.init({ appId: APP_ID, appKey: APP_KEY, serverURL: SERVER_URL });

const Medicine = AV.Object.extend('Medicine');
const q = new AV.Query('Medicine');
let currentCategory = '';

// 渲染卡片 + 统计
function renderMedicines(list) {
  const container = document.getElementById('medicineList');
  container.innerHTML = list.length === 0 ? '<p class="col-span-3 text-center text-gray-500 text-xl">暂无药品，点左侧 + 添加第一盒药～</p>' : '';
  
  let total = 0, warning = 0, expired = 0;
  const now = new Date();

  list.forEach(med => {
    if (currentCategory && med.get('category') !== currentCategory) return;

    const expiry = med.get('expiry') ? new Date(med.get('expiry')) : null;
    const daysLeft = expiry ? Math.ceil((expiry - now) / 86400000) : null;
    if (daysLeft !== null && daysLeft < 0) expired++;
    else if (daysLeft !== null && daysLeft <= 30) warning++;
    total++;

    const bg = daysLeft === null ? 'bg-green-50' : 
               daysLeft < 0 ? 'bg-red-100 border-red-500 border-2' : 
               daysLeft <= 30 ? 'bg-yellow-100 border-yellow-500 border-2' : 'bg-green-50';

    const card = `
      <div class="bg-white rounded-xl shadow-lg hover:shadow-xl transition p-6 ${bg}">
        <h3 class="text-2xl font-bold text-gray-800">${med.get('name') || '未命名药品'}</h3>
        <p class="text-gray-600 mt-1">${med.get('spec') || ''}</p>
        <div class="mt-4 space-y-3">
          <p class="text-lg"><strong>库存：</strong> <span class="text-3xl font-bold text-blue-600">${med.get('quantity') || 0}</span>${med.get('quantity')<=5 ? ' <span class="text-red-600">(不足！)</span>' : ''}</p>
          <p><strong>有效期至：</strong> ${expiry ? expiry.toLocaleDateString('zh-CN') : '未设置'}</p>
          ${daysLeft !== null ? `<p class="text-lg font-bold ${daysLeft<0?'text-red-600':daysLeft<=30?'text-orange-600':'text-green-600'}">${daysLeft<0?'已过期':`剩余 ${daysLeft} 天`}</p>` : ''}
          <p class="text-sm text-gray-600"><strong>分类：</strong> ${med.get('category') || '未分类'}</p>
          ${med.get('note') ? `<p class="text-sm text-gray-600 mt-3">备注：${med.get('note')}</p>` : ''}
        </div>
        <div class="mt-6 flex gap-3">
          <button onclick="useMedicine('${med.id}', '${(med.get('name')||'此药').replace(/'/g,"\\'")}')" class="bg-green-600 text-white px-5 py-3 rounded-lg hover:bg-green-700">用药记录</button>
          <button onclick="editMedicine('${med.id}')" class="bg-blue-600 text-white px-5 py-3 rounded-lg hover:bg-blue-700">编辑</button>
          <button onclick="deleteMedicine('${med.id}')" class="bg-red-600 text-white px-5 py-3 rounded-lg hover:bg-red-700">删除</button>
        </div>
      </div>`;
    container.innerHTML += card;
  });

  document.getElementById('total').textContent = total;
  document.getElementById('warning').textContent = warning;
  document.getElementById('expired').textContent = expired;
}

// 加载药品
async function loadMedicines() {
  try {
    const list = await q.descending('createdAt').find();
    renderMedicines(list);
  } catch (e) {
    document.getElementById('medicineList').innerHTML = '<p class="text-red-600 text-center">加载失败：' + e.message + '</p>';
  }
}

// 分类筛选
function filterCategory(cat) {
  currentCategory = cat;
  document.querySelectorAll('.cat-btn').forEach(b => b.classList.remove('bg-blue-600', 'text-white'));
  document.querySelectorAll('.cat-btn').forEach(b => b.classList.add('hover:bg-gray-100'));
  event.target.classList.add('bg-blue-600', 'text-white');
  event.target.classList.remove('hover:bg-gray-100');
  loadMedicines();
}

// 搜索
function searchMedicine() {
  const kw = document.getElementById('searchInput').value.toLowerCase();
  document.querySelectorAll('#medicineList > div').forEach(card => {
    card.style.display = card.textContent.toLowerCase().includes(kw) ? '' : 'none';
  });
}

// 弹窗
function openAddModal() {
  document.getElementById('modalTitle').textContent = '添加药品';
  document.getElementById('medicineForm').reset();
  document.getElementById('editId').value = '';
  document.getElementById('medicineModal').classList.remove('hidden');
}
function closeModal() {
  document.getElementById('medicineModal').classList.add('hidden');
}

// 保存
document.getElementById('medicineForm').onsubmit = async e => {
  e.preventDefault();
  const id = document.getElementById('editId').value;
  const med = id ? AV.Object.createWithoutData('Medicine', id) : new Medicine();
  med.set('name', document.getElementById('name').value.trim() || '未命名药品');
  med.set('spec', document.getElementById('spec').value.trim());
  med.set('quantity', parseInt(document.getElementById('quantity').value) || 0);
  const exp = document.getElementById('expiry').value;
  if (exp) med.set('expiry', new Date(exp));
  med.set('category', document.getElementById('category').value.trim());
  med.set('note', document.getElementById('note').value.trim());
  try {
    await med.save();
    closeModal();
    loadMedicines();
  } catch (err) { alert('保存失败：' + err.message); }
};

// 编辑、删除、用药（保持你之前能用的逻辑）
async function editMedicine(id) { /* 把你之前能用的 editMedicine 粘贴在这里 */ }
async function deleteMedicine(id) { /* 把你之前能用的 deleteMedicine 粘贴在这里 */ }
async function useMedicine(id, name) { /* 把你之前能用的 useMedicine 粘贴在这里 */ }

// 启动
document.addEventListener('DOMContentLoaded', () => {
  loadMedicines();
  setInterval(loadMedicines, 15000); // 15秒自动刷新
});

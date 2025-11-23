// ==== 必填你的三行密钥 ====
const APP_ID = '8Q7cvpos8huS3seRuNQKy5FF-gzGzoHsz';
const APP_KEY = 'Cz5xHoRFCLe2y9wFzaAo8ZTH';
const SERVER_URL = 'https://8q7cvpos.lc-cn-n1-shared.com';
AV.init({ appId: APP_ID, appKey: APP_KEY, serverURL: SERVER_URL });

const Medicine = AV.Object.extend('Medicine');
const query = new AV.Query('Medicine');
let currentCategory = '';

// 渲染药品卡片（和截图一模一样）
function renderMedicines(list) {
  const container = document.getElementById('medicineList');
  container.innerHTML = '';
  
  let total = 0, expiring = 0, lowStock = 0, expired = 0;
  const now = new Date();

  list.forEach(med => {
    if (currentCategory && med.get('category') !== currentCategory) return;

    const expiry = med.get('expiry') ? new Date(med.get('expiry')) : null;
    const daysLeft = expiry ? Math.ceil((expiry - now) / 86400000) : null;
    const qty = med.get('quantity') || 0;

    if (daysLeft !== null && daysLeft < 0) expired++;
    else if (daysLeft !== null && daysLeft <= 30) expiring++;
    if (qty <= 3) lowStock++;
    total++;

    const cardClass = daysLeft === null ? 'expiry-green' : 
                      daysLeft < 0 ? 'expiry-red' : 
                      daysLeft <= 30 ? 'expiry-yellow' : 
                      qty <= 3 ? 'stock-low' : 'bg-white';

    container.innerHTML += `
      <div class="bg-white card-border p-5 hover:shadow-lg transition ${cardClass}">
        <h3 class="font-bold text-lg text-blue-700">${med.get('name')||'未知药品'}</h3>
        <div class="mt-3 space-y-2 text-sm">
          <p>库存：<span class="font-bold text-xl">${qty}</span> ${qty<=3?'<span class="text-red-600">(不足)</span>':''}</p>
          <p>预警：<span class="font-bold">${med.get('spec')||'无'}</span></p>
          <p>有效期：<span class="font-bold">${expiry ? expiry.toLocaleDateString('zh-CN') : '未知'}</span></p>
          ${daysLeft !== null ? `<p class="font-bold ${daysLeft<0?'text-red-600':daysLeft<=30?'text-orange-600':''}">${daysLeft<0?'已过期':daysLeft<=30?'即将过期':'正常'}</p>` : ''}
        </div>
        <div class="mt-4 flex gap-2">
          <button onclick="useMedicine('${med.id}','${med.get('name')||'此药'}')" class="bg-green-500 text-white px-4 py-2 rounded text-sm">使用</button>
          <button onclick="editMedicine('${med.id}')" class="bg-blue-500 text-white px-4 py-2 rounded text-sm">编辑</button>
          <button onclick="deleteMedicine('${med.id}')" class="bg-red-500 text-white px-4 py-2 rounded text-sm">删除</button>
        </div>
      </div>`;
  });

  // 更新顶部数字
  document.querySelectorAll('.btn-num')[0].innerHTML = `${total}<br><small>药品总数</small>`;
  document.querySelectorAll('.btn-num')[1].innerHTML = `${expiring}<br><small>即将过期</small>`;
  document.querySelectorAll('.btn-num')[2].innerHTML = `${lowStock}<br><small>库存不足</small>`;
}

async function loadMedicines() {
  try {
    const list = await query.descending('createdAt').find();
    renderMedicines(list);
  } catch (e) { console.error(e); }
}

function filterCategory(cat) {
  currentCategory = cat;
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

// 保存、编辑、删除、用药函数（用你之前能用的那套）
document.getElementById('medicineForm').onsubmit = async e => { /* 你的保存逻辑 */ };
async function editMedicine(id) { /* 你的编辑逻辑 */ }
async function deleteMedicine(id) { /* 你的删除逻辑 */ }
async function useMedicine(id, name) { /* 你的用药逻辑 */ }

document.addEventListener('DOMContentLoaded', () => {
  loadMedicines();
  setInterval(loadMedicines, 20000);
});

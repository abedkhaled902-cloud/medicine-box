// === LeanCloud 初始化（请替换为你的实际值）===
const APP_ID = '8Q7cvpos8huS3seRuNQKy5FF-gzGzoHsz';
const APP_KEY = 'Cz5xHoRFCLe2y9wFzaAo8ZTH';
const SERVER_URL = 'https://8q7cvpos.lc-cn-n1-shared.com'; // 国内节点示例

AV.init({
  appId: APP_ID,
  appKey: APP_KEY,
  serverURL: SERVER_URL
});

const Medicine = AV.Object.extend('Medicine');
let query = new AV.Query('Medicine');
let liveQuery = null;

// 页面加载完成
document.addEventListener('DOMContentLoaded', () => {
  loadMedicines();
  initLiveQuery();
});

// 加载所有药品
async function loadMedicines() {
  try {
    const medicines = await query.descending('createdAt').find();
    renderMedicines(medicines);
  } catch (err) {
    alert('加载失败：' + err.message);
  }
}

// 渲染药品卡片
function renderMedicines(list) {
  const container = document.getElementById('medicineList');
  container.innerHTML = '';

  const now = new Date();
  list.forEach(med => {
    const expiry = new Date(med.get('expiry'));
    const daysLeft = Math.ceil((expiry - now) / (1000*60*60*24));
    
    let expiryClass = '';
    if (daysLeft < 0) expiryClass = 'bg-red-100 border-red-500';
    else if (daysLeft <= 30) expiryClass = 'bg-yellow-100 border-yellow-500';
    else expiryClass = 'bg-green-50 border-green-300';

    const card = `
      <div class="border rounded-xl p-6 shadow hover:shadow-lg transition ${expiryClass}">
        <h3 class="text-xl font-bold text-gray-800">${med.get('name') || '未命名'}</h3>
        <p class="text-sm text-gray-600 mt-1">${med.get('spec') || ''}</p>
        
        <div class="mt-4 space-y-2 text-sm">
          <p><strong>库存：</strong><span class="text-2xl font-bold text-indigo-600">${med.get('quantity')}</span></p>
          <p><strong>有效期至：</strong>${expiry.toLocaleDateString('zh-CN')}</p>
          <p class="text-xs ${daysLeft < 0 ? 'text-red-600' : daysLeft <= 30 ? 'text-orange-600' : ''}">
            ${daysLeft < 0 ? '已过期' : `剩余 ${daysLeft} 天`}
          </p>
          <p><strong>分类：</strong>${med.get('category') || '未分类'}</p>
          ${med.get('note') ? `<p class="text-gray-600 mt-2 text-sm">📝 ${med.get('note')}</p>` : ''}
        </div>

        <div class="mt-6 flex gap-3">
          <button onclick="useMedicine('${med.id}', '${med.get('name')}')" 
                  class="bg-green-600 text-white px-4 py-2 rounded hover:bg-green-700 text-sm">用药记录</button>
          <button onclick="editMedicine('${med.id}')" 
                  class="bg-blue-600 text-white px-4 py-2 rounded hover:bg-blue-700 text-sm">编辑</button>
          <button onclick="deleteMedicine('${med.id}')" 
                  class="bg-red-600 text-white px-4 py-2 rounded hover:bg-red-700 text-sm">删除</button>
        </div>
      </div>
    `;
    container.innerHTML += card;
  });
}

// 实时监听（LiveQuery）
function initLiveQuery() {
  liveQuery = query.subscribe();
  liveQuery.on('create', () => loadMedicines());
  liveQuery.on('update', () => loadMedicines());
  liveQuery.on('delete', () => loadMedicines());
}

// 打开添加模态框
function openAddModal() {
  document.getElementById('modalTitle').textContent = '添加药品';
  document.getElementById('medicineForm').reset();
  document.getElementById('editId').value = '';
  document.getElementById('medicineModal').classList.remove('hidden');
}

// 关闭模态框
function closeModal() {
  document.getElementById('medicineModal').classList.add('hidden');
}

// 保存药品
document.getElementById('medicineForm').onsubmit = async (e) => {
  e.preventDefault();
  const id = document.getElementById('editId').value;
  const medicine = id ? AV.Object.createWithoutData('Medicine', id) : new Medicine();

  medicine.set('name', document.getElementById('name').value.trim());
  medicine.set('spec', document.getElementById('spec').value.trim());
  medicine.set('quantity', parseInt(document.getElementById('quantity').value));
  medicine.set('expiry', document.getElementById('expiry').value);
  medicine.set('category', document.getElementById('category').value);
  medicine.set('note', document.getElementById('note').value.trim());

  try {
    await medicine.save();
    closeModal();
    loadMedicines(); // 立即刷新
  } catch (err) {
    alert('保存失败：' + err.message);
  }
};

// 编辑药品
async function editMedicine(id) {
  const medicine = await new AV.Query('Medicine').get(id);
  document.getElementById('modalTitle').textContent = '编辑药品';
  document.getElementById('editId').value = id;
  document.getElementById('name').value = medicine.get('name') || '';
  document.getElementById('spec').value = medicine.get('spec') || '';
  document.getElementById('quantity').value = medicine.get('quantity') || 0;
  document.getElementById('expiry').value = medicine.get('expiry').split('T')[0];
  document.getElementById('category').value = medicine.get('category') || '';
  document.getElementById('note').value = medicine.get('note') || '';
  document.getElementById('medicineModal').classList.remove('hidden');
}

// 删除药品
async function deleteMedicine(id) {
  if (!confirm('确定要删除吗？')) return;
  const medicine = AV.Object.createWithoutData('Medicine', id);
  await medicine.destroy();
  loadMedicines();
}

// 用药记录（减库存）
async function useMedicine(id, name) {
  const count = prompt(`吃了【${name}】，扣除几份？（默认1）`, '1');
  if (count === null) return;
  const num = parseInt(count) || 1;

  const medicine = AV.Object.createWithoutData('Medicine', id);
  await medicine.increment('quantity', -num);
  await medicine.save();
  
  alert(`已记录用药：${name} × ${num}`);
}

// 搜索过滤
function filterMedicines() {
  const keyword = document.getElementById('searchInput').value.toLowerCase();
  const cards = document.querySelectorAll('#medicineList > div');
  cards.forEach(card => {
    const text = card.textContent.toLowerCase();
    card.style.display = text.includes(keyword) ? '' : 'none';
  });
}
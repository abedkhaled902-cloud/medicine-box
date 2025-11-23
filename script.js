<script src="https://cdn.tailwindcss.com"></script>
<script src="https://cdn.jsdelivr.net/npm/leancloud-storage@4.13.0/dist/av-min.js"></script>

<script>
// ==== 必填：你的三行密钥（一定要填对！）====
const APP_ID = '8Q7cvpos8huS3seRuNQKy5FF-gzGzoHsz';
const APP_KEY = 'Cz5xHoRFCLe2y9wFzaAo8ZTH';
const SERVER_URL = 'https://8q7cvpos.lc-cn-n1-shared.com'; // 完整地址，带https://

AV.init({ appId: APP_ID, appKey: APP_KEY, serverURL: SERVER_URL });

const Medicine = AV.Object.extend('Medicine');
const query = new AV.Query('Medicine');

// ========= 所有函数必须先定义！顺序不能错！=========
function renderMedicines(list) {
  const container = document.getElementById('medicineList');
  container.innerHTML = '';
  if (list.length === 0) {
    container.innerHTML = '<p class="text-center text-gray-500 col-span-3">暂无药品，点右上角 + 添加第一盒药吧～</p>';
    return;
  }
  const now = new Date();
  list.forEach(med => {
    const exp = med.get('expiry');
    const expiry = exp ? new Date(exp) : null;
    const daysLeft = expiry ? Math.ceil((expiry - now) / 86400000) : null;
    
    let bg = 'bg-green-50';
    if (daysLeft !== null && daysLeft < 0) bg = 'bg-red-100 border-red-500 border-2';
    else if (daysLeft !== null && daysLeft <= 30) bg = 'bg-yellow-100 border-yellow-500 border-2';

    const card = `
      <div class="border rounded-xl p-6 shadow hover:shadow-lg transition ${bg}">
        <h3 class="text-xl font-bold text-gray-800">${med.get('name') || '未命名药品'}</h3>
        <p class="text-sm text-gray-600">${med.get('spec') || ''}</p>
        <div class="mt-4 space-y-2 text-sm">
          <p><strong>库存：</strong><span class="text-2xl font-bold text-indigo-600">${med.get('quantity') || 0}</span></p>
          <p><strong>有效期：</strong>${expiry ? expiry.toLocaleDateString('zh-CN') : '未设置'}</p>
          ${daysLeft !== null ? `<p class="${daysLeft<0?'text-red-600':daysLeft<=30?'text-orange-600':''}">${daysLeft<0?'已过期':`剩余 ${daysLeft} 天`}</p>` : ''}
          <p><strong>分类：</strong>${med.get('category') || '未分类'}</p>
          ${med.get('note') ? `<p class="text-sm text-gray-600 mt-2">备注：${med.get('note')}</p>` : ''}
        </div>
        <div class="mt-6 flex gap-3 flex-wrap">
          <button onclick="useMedicine('${med.id}', '${med.get('name')||'此药'}')" 
                  class="bg-green-600 text-white px-4 py-2 rounded hover:bg-green-700 text-sm">用药记录</button>
          <button onclick="editMedicine('${med.id}')" 
                  class="bg-blue-600 text-white px-4 py-2 rounded hover:bg-blue-700 text-sm">编辑</button>
          <button onclick="deleteMedicine('${med.id}')" 
                  class="bg-red-600 text-white px-4 py-2 rounded hover:bg-red-700 text-sm">删除</button>
        </div>
      </div>`;
    container.innerHTML += card;
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

// 保存药品
document.getElementById('medicineForm').onsubmit = async e => {
  e.preventDefault();
  const id = document.getElementById('editId').value;
  const med = id ? AV.Object.createWithoutData('Medicine', id) : new Medicine();
  
  med.set('name', document.getElementById('name').value.trim() || '未命名药品');
  med.set('spec', document.getElementById('spec').value.trim());
  med.set('quantity', parseInt(document.getElementById('quantity').value) || 0);
  const exp = document.getElementById('expiry').value;
  if (exp) med.set('expiry', new Date(exp));
  med.set('category', document.getElementById('category').value);
  med.set('note', document.getElementById('note').value.trim());
  
  try {
    await med.save();
    closeModal();
    loadMedicines();
  } catch (err) {
    alert('保存失败：' + err.message);
  }
};

async function loadMedicines() {
  try {
    const list = await query.descending('createdAt').find();
    renderMedicines(list);
  } catch (e) {
    document.getElementById('medicineList').innerHTML = '<p class="text-red-600 text-center">加载失败：' + e.message + '</p>';
  }
}

async function editMedicine(id) {
  try {
    const med = await new AV.Query('Medicine').get(id);
    document.getElementById('modalTitle').textContent = '编辑药品';
    document.getElementById('editId').value = id;
    document.getElementById('name').value = med.get('name') || '';
    document.getElementById('spec').value = med.get('spec') || '';
    document.getElementById('quantity').value = med.get('quantity') || 0;
    const exp = med.get('expiry');
    document.getElementById('expiry').value = exp ? new Date(exp).toISOString().substr(0,10) : '';
    document.getElementById('category').value = med.get('category') || '';
    document.getElementById('note').value = med.get('note') || '';
    document.getElementById('medicineModal').classList.remove('hidden');
  } catch (e) { alert('加载失败'); }
}

async function deleteMedicine(id) {
  if (!confirm('确定删除这盒药？')) return;
  try {
    const med = AV.Object.createWithoutData('Medicine', id);
    await med.destroy();
    loadMedicines();
  } catch (e) { alert('删除失败'); }
}

async function useMedicine(id, name) {
  const num = prompt(`吃了【${name}】，扣除几份？（默认1）`, '1');
  if (num === null) return;
  const n = parseInt(num) || 1;
  try {
    const med = AV.Object.createWithoutData('Medicine', id);
    await med.increment('quantity', -n);
    await med.save();
    alert(`已记录用药：${name} × ${n}`);
    loadMedicines();
  } catch (e) { alert('记录失败'); }
}

function filterMedicines() {
  const kw = document.getElementById('searchInput').value.toLowerCase();
  document.querySelectorAll('#medicineList > div').forEach(card => {
    card.style.display = card.textContent.toLowerCase().includes(kw) ? '' : 'none';
  });
}

// ========= 页面加载完成 =========
document.addEventListener('DOMContentLoaded', () => {
  loadMedicines();
  // 去掉有问题的 LiveQuery，改用 10 秒轮询（完全够用！）
  setInterval(loadMedicines, 10000);
});
</script>

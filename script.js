<!-- 把下面这整段直接覆盖你现在的 script.js 文件，全部复制粘贴即可 -->
<script src="https://cdn.tailwindcss.com"></script>
<script src="https://cdn.jsdelivr.net/npm/leancloud-storage@4.13.0/dist/av-min.js"></script>

<script>
// ==== 请先填这三行（一定填对！）====
const APP_ID = '8Q7cvpos8huS3seRuNQKy5FF-gzGzoHsz';
const APP_KEY = 'Cz5xHoRFCLe2y9wFzaAo8ZTH';
const SERVER_URL = 'https://8q7cvpos.lc-cn-n1-shared.com'; // 完整地址

AV.init({ appId: APP_ID, appKey: APP_KEY, serverURL: SERVER_URL });

const Medicine = AV.Object.extend('Medicine');
const query = new AV.Query('Medicine');

// ========= 所有函数定义开始（顺序很重要！）=========
function renderMedicines(list) {
  const container = document.getElementById('medicineList');
  container.innerHTML = '';
  const now = new Date();
  list.forEach(med => {
    const expiry = new Date(med.get('expiry'));
    const daysLeft = Math.ceil((expiry - now) / (86400000));
    let color = daysLeft < 0 ? 'bg-red-100 border-red-500' : daysLeft <= 30 ? 'bg-yellow-100 border-yellow-500' : 'bg-green-50';
    const card = `
      <div class="border-2 rounded-xl p-6 shadow hover:shadow-lg ${color}">
        <h3 class="text-xl font-bold">${med.get('name')||'未命名'}</h3>
        <p class="text-sm text-gray-600">${med.get('spec')||''}</p>
        <div class="mt-4 text-sm">
          <p><strong>库存：</strong><span class="text-2xl text-indigo-600">${med.get('quantity')||0}</span></p>
          <p><strong>有效期：</strong>${expiry.toLocaleDateString('zh-CN')}</p>
          <p class="${daysLeft<0?'text-red-600':daysLeft<=30?'text-orange-600':''}">
            ${daysLeft<0?'已过期':`剩 ${daysLeft} 天`}
          </p>
          <p><strong>分类：</strong>${med.get('category')||'未分类'}</p>
          ${med.get('note')?`<p class="text-sm text-gray-600 mt-2">备注：${med.get('note')}</p>`:''}
        </div>
        <div class="mt-6 flex gap-2">
          <button onclick="useMedicine('${med.id}','${med.get('name')}')" class="bg-green-600 text-white px-4 py-2 rounded text-sm">用药</button>
          <button onclick="editMedicine('${med.id}')" class="bg-blue-600 text-white px-4 py-2 rounded text-sm">编辑</button>
          <button onclick="deleteMedicine('${med.id}')" class="bg-red-600 text-white px-4 py-2 rounded text-sm">删除</button>
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

async function loadMedicines() {
  try {
    const meds = await query.descending('createdAt').find();
    renderMedicines(meds);
  } catch (e) {
    document.getElementById('medicineList').innerHTML = '<p class="text-red-600 text-center">加载失败：' + e.message + '</p>';
  }
}

document.getElementById('medicineForm').onsubmit = async e => {
  e.preventDefault();
  const id = document.getElementById('editId').value;
  const med = id ? AV.Object.createWithoutData('Medicine', id) : new Medicine();
  
  med.set('name', document.getElementById('name').value.trim() || '未命名');
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

async function editMedicine(id) {
  const med = await new AV.Query('Medicine').get(id);
  document.getElementById('modalTitle').textContent = '编辑药品';
  document.getElementById('editId').value = id;
  document.getElementById('name').value = med.get('name')||'';
  document.getElementById('spec').value = med.get('spec')||'';
  document.getElementById('quantity').value = med.get('quantity')||0;
  document.getElementById('expiry').value = med.get('expiry')?.iso?.substr(0,10)||'';
  document.getElementById('category').value = med.get('category')||'';
  document.getElementById('note').value = med.get('note')||'';
  document.getElementById('medicineModal').classList.remove('hidden');
}

async function deleteMedicine(id) {
  if (!confirm('确定删除？')) return;
  const med = AV.Object.createWithoutData('Medicine', id);
  await med.destroy();
  loadMedicines();
}

async function useMedicine(id, name) {
  const n = prompt(`吃了【${name}】，扣几份？`, '1');
  if (n === null) return;
  const num = parseInt(n) || 1;
  const med = AV.Object.createWithoutData('Medicine', id);
  await med.increment('quantity', -num);
  await med.save();
  alert('已记录用药');
}

// 搜索
function filterMedicines() {
  const kw = document.getElementById('searchInput').value.toLowerCase();
  document.querySelectorAll('#medicineList > div').forEach(card => {
    card.style.display = card.textContent.toLowerCase().includes(kw) ? '' : 'none';
  });
}

// ========= 页面加载完成后执行 =========
document.addEventListener('DOMContentLoaded', () => {
  loadMedicines();
  // LiveQuery 已经不支持单独 CDN 了，直接降级为 10 秒轮询（够用！）
  setInterval(loadMedicines, 10000);
});
</script>

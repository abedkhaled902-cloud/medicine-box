// === 请在这里填你的 LeanCloud 三件套（一定要填对！）===
const APP_ID = '8Q7cvpos8huS3seRuNQKy5FF-gzGzoHsz';                    // ← 粘贴你的 App ID
const APP_KEY = 'Cz5xHoRFCLe2y9wFzaAo8ZTH';                  // ← 粘贴你的 App Key
const SERVER_URL = 'https://8q7cvpos.lc-cn-n1-shared.com';  // ← 你的完整服务器地址（带 https://）

// 初始化（必须放在最前面）
AV.init({
  appId: APP_ID,
  appKey: APP_KEY,
  serverURL: SERVER_URL
});

const Medicine = AV.Object.extend('Medicine');
let query = new AV.Query('Medicine');
let liveQuery = null;

// 页面加载
document.addEventListener('DOMContentLoaded', () => {
  loadMedicines();
  initLiveQuerySafe();  // 安全版 LiveQuery
});

// 安全加载 LiveQuery（旧地址会 404，现在自动降级不报错）
function initLiveQuerySafe() {
  if (typeof AV.LiveQuery === 'undefined') {
    console.warn('LiveQuery 未加载，使用普通轮询刷新');
    setInterval(loadMedicines, 10000); // 10秒轮询一次
    return;
  }
  try {
    const subscription = query.subscribe();
    subscription.then(lq => {
      liveQuery = lq;
      liveQuery.on('create', loadMedicines);
      liveQuery.on('update', loadMedicines);
      liveQuery.on('delete', loadMedicines);
    });
  } catch (e) {
    console.warn('LiveQuery 订阅失败，降级轮询', e);
    setInterval(loadMedicines, 10000);
  }
}

// 加载药品
async function loadMedicines() {
  try {
    const medicines = await query.descending('createdAt').find();
    renderMedicines(medicines);
  } catch (err) {
    console.error('加载失败', err);
    document.getElementById('medicineList').innerHTML = '<p class="text-red-600 text-center">加载失败：' + err.message + '</p>';
  }
}

// 渲染（保持不变，略……后面和你原来一样的 renderMedicines 函数）

// 保存药品（已修复 expiry 问题 + 容错）
document.getElementById('medicineForm').onsubmit = async (e) => {
  e.preventDefault();
  const id = document.getElementById('editId').value;
  const medicine = id ? AV.Object.createWithoutData('Medicine', id) : new Medicine();

  medicine.set('name', document.getElementById('name').value.trim() || '未命名药品');
  medicine.set('spec', document.getElementById('spec').value.trim());
  const qty = document.getElementById('quantity').value;
  medicine.set('quantity', qty ? parseInt(qty) : 0);
  
  const expiryStr = document.getElementById('expiry').value;
  if (expiryStr) {
    medicine.set('expiry', new Date(expiryStr));
  }
  
  medicine.set('category', document.getElementById('category').value);
  medicine.set('note', document.getElementById('note').value.trim());

  try {
    await medicine.save();
    closeModal();
    loadMedicines();
    alert('保存成功！');
  } catch (err) {
    console.error(err);
    alert('保存失败：' + err.message);
  }
};

// 其他函数（editMedicine / deleteMedicine / useMedicine / filterMedicines）保持原来不变
// 你原来的 renderMedicines、openAddModal、closeModal 等函数直接粘贴到这里下面即可

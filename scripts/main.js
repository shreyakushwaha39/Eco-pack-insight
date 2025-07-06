// Modern, bug-free EcoPack Insight JS
let productsData = [];
document.addEventListener('DOMContentLoaded', () => {
  fetch('products.json')
    .then(res => res.json())
    .then(data => {
      productsData = data;
      displayProducts(productsData);
      setupCompareSelect();
    })
    .catch(err => console.error("Error loading products.json:", err));
  showSection('products');
});

function showSection(id, btn) {
  document.querySelectorAll('main section').forEach(s => s.classList.remove('active'));
  document.getElementById(id).classList.add('active');
  document.querySelectorAll('header nav button').forEach(b => b.classList.remove('active'));
  if (btn) btn.classList.add('active');
}

function displayProducts(products) {
  const list = document.getElementById('productList');
  list.innerHTML = '';
  products.forEach(prod => {
    const card = document.createElement('div');
    card.className = 'product-card';
    card.onclick = () => showProductModal(prod.id);
    card.innerHTML = `
      <h3>${prod.name}</h3>
      <p><b>Category:</b> ${prod.category}</p>
      <p><span class="eco-score ${prod.ecoScore}">${prod.ecoScore.charAt(0).toUpperCase() + prod.ecoScore.slice(1)}</span></p>
    `;
    list.appendChild(card);
  });
}

function searchProducts() {
  const val = document.getElementById('searchInput').value.toLowerCase();
  displayProducts(productsData.filter(p => p.name.toLowerCase().includes(val)));
}

function showProductModal(id) {
  const prod = productsData.find(p => p.id === id);
  document.getElementById('productModal').style.display = 'block';
  let matList = '';
  Object.entries(prod.materials).forEach(([mat, pct]) => {
    matList += `<li>${mat}: ${pct}%</li>`;
  });
  document.getElementById('modalDetails').innerHTML = `
    <div style="display:flex;flex-direction:column;align-items:center;">
      <span class="close" onclick="closeModal()" style="position:absolute;right:1rem;top:1rem;font-size:2rem;color:#e57373;cursor:pointer;z-index:10;">&times;</span>
      <div class="product-modal-logo" style="margin-bottom:0.5em;">
        <img src='images/logo.png' alt='EcoPack Logo' style='width:60px;height:60px;border-radius:0;border:none;box-shadow:none;background:none;'>
      </div>
      <h2>${prod.name}</h2>
      <p><b>Category:</b> ${prod.category}</p>
      <p><b>Eco Score:</b> <span class="eco-score ${prod.ecoScore}">${prod.ecoScore}</span></p>
      <canvas id="matPie" width="200" height="200"></canvas>
      <ul style="margin:1em 0 0 0;padding:0;list-style:none;">${matList}</ul>
      <p><b>Qrcode:</b> ${prod.qrcode}</p>
    </div>
  `;
  setTimeout(() => {
    new Chart(document.getElementById('matPie'), {
      type: 'pie',
      data: {
        labels: Object.keys(prod.materials),
        datasets: [{
          data: Object.values(prod.materials),
          backgroundColor: ['#81c784', '#ffd54f', '#e57373', '#64b5f6', '#ba68c8']
        }]
      },
      options: { plugins: { legend: { display: true } } }
    });
  }, 100);
}

function closeModal() {
  document.getElementById('productModal').style.display = 'none';
}

window.onclick = function (event) {
  if (event.target == document.getElementById('productModal')) closeModal();
}

let comparePie1 = null;
let comparePie2 = null;
function setupCompareSelect() {
  const container = document.getElementById('compareSelect');
  container.innerHTML = '';
  const select1 = document.createElement('select');
  const select2 = document.createElement('select');
  select1.innerHTML = '<option value="">Select Product 1</option>' + productsData.map(p => `<option value="${p.id}">${p.name}</option>`).join('');
  select2.innerHTML = '<option value="">Select Product 2</option>' + productsData.map(p => `<option value="${p.id}">${p.name}</option>`).join('');
  select1.onchange = () => compareProducts(select1.value, select2.value);
  select2.onchange = () => compareProducts(select1.value, select2.value);
  container.appendChild(select1);
  container.appendChild(select2);
}

function compareProducts(id1, id2) {
  const res = document.getElementById('compareResults');
  if (!id1 || !id2 || id1 === id2) {
    res.innerHTML = '<p>Select two different products to compare.</p>';
    if (comparePie1) { comparePie1.destroy(); comparePie1 = null; }
    if (comparePie2) { comparePie2.destroy(); comparePie2 = null; }
    return;
  }
  const p1 = productsData.find(p => p.id === id1);
  const p2 = productsData.find(p => p.id === id2);
  function getDisposalHTML(prod) {
    let html = `<h4 style='color:#1976d2;margin:0.5em 0 0.2em 0;'><i class='fa fa-recycle'></i> Disposal Guide</h4><ul style='line-height:1.7;margin:0 0 0.5em 0;'>`;
    Object.entries(prod.materials).forEach(([mat, pct]) => {
      html += `<li><b>${mat}:</b> Check local guidelines.</li>`;
    });
    html += '</ul>';
    html += `<p style='margin:0.2em 0 0 0;color:#607d8b;font-size:0.98em;'>Always check your local recycling rules for the most accurate information.</p>`;
    return html;
  }
  res.innerHTML = `
    <div class="compare-box" style="display:flex;gap:2em;flex-wrap:wrap;justify-content:center;">
      <div style="min-width:220px;max-width:340px;flex:1;">
        <h3>${p1.name}</h3>
        <p><span class="eco-score ${p1.ecoScore}">${p1.ecoScore}</span></p>
        <canvas id="pie1" width="150" height="150"></canvas>
        <ul style="margin:1em 0 0 0;padding:0;list-style:none;">
          ${Object.entries(p1.materials).map(([mat, pct]) => `<li>${mat}: ${pct}%</li>`).join('')}
        </ul>
        <p style="margin:0.5em 0 0 0;"><b>Category:</b> ${p1.category}</p>
        <p style="margin:0.5em 0 0 0;"><b>Qrcode:</b> ${p1.qrcode}</p>
        <div style="margin-top:0.7em;">${getDisposalHTML(p1)}</div>
        <div style="margin-top:0.7em;color:#607d8b;font-size:0.98em;">${p1.full_description || ''}</div>
      </div>
      <div style="min-width:220px;max-width:340px;flex:1;">
        <h3>${p2.name}</h3>
        <p><span class="eco-score ${p2.ecoScore}">${p2.ecoScore}</span></p>
        <canvas id="pie2" width="150" height="150"></canvas>
        <ul style="margin:1em 0 0 0;padding:0;list-style:none;">
          ${Object.entries(p2.materials).map(([mat, pct]) => `<li>${mat}: ${pct}%</li>`).join('')}
        </ul>
        <p style="margin:0.5em 0 0 0;"><b>Category:</b> ${p2.category}</p>
        <p style="margin:0.5em 0 0 0;"><b>Qrcode:</b> ${p2.qrcode}</p>
        <div style="margin-top:0.7em;">${getDisposalHTML(p2)}</div>
        <div style="margin-top:0.7em;color:#607d8b;font-size:0.98em;">${p2.full_description || ''}</div>
      </div>
    </div>
  `;
  setTimeout(() => {
    if (comparePie1) { comparePie1.destroy(); }
    if (comparePie2) { comparePie2.destroy(); }
    comparePie1 = new Chart(document.getElementById('pie1').getContext('2d'), {
      type: 'pie',
      data: {
        labels: Object.keys(p1.materials),
        datasets: [{
          data: Object.values(p1.materials),
          backgroundColor: ['#81c784', '#ffd54f', '#e57373', '#64b5f6', '#ba68c8','#b0bec5']
        }]
      }
    });
    comparePie2 = new Chart(document.getElementById('pie2').getContext('2d'), {
      type: 'pie',
      data: {
        labels: Object.keys(p2.materials),
        datasets: [{
          data: Object.values(p2.materials),
          backgroundColor: ['#81c784', '#ffd54f', '#e57373', '#64b5f6', '#ba68c8','#b0bec5']
        }]
      }
    });
  }, 100);
}

let aiPie = null;
function estimateEcoScore() {
  const input = document.getElementById('materialInput').value.toLowerCase();
  const resultDiv = document.getElementById('ecoScoreResult');
  const canvas = document.getElementById('aiEcoPieChart');
  if (aiPie) { aiPie.destroy(); aiPie = null; }
  if (!input) {
    resultDiv.innerHTML = '<p>Please enter materials in format: plastic:30,paper:10,glass:20,aluminum:30,others:10</p>';
    return;
  }
  let matCounts = {};
  let total = 0;
  input.split(',').forEach(pair => {
    const [mat, val] = pair.split(':').map(s => s.trim());
    const pct = Number(val);
    if (mat && !isNaN(pct) && pct > 0) {
      matCounts[mat] = pct;
      total += pct;
    }
  });
  if (Object.keys(matCounts).length === 0) {
    resultDiv.innerHTML = '<p>Invalid input. Use: plastic:30,paper:10,glass:20,aluminum:30,others:10</p>';
    return;
  }
let score = 0;
let hasGlass = false, hasAluminum = false, hasPET = false, hasPlastic = false;
let glassPct = 0, aluminumPct = 0, petPct = 0, plasticPct = 0, othersPct = 0;
Object.entries(matCounts).forEach(([mat, pct]) => {
  mat = mat.toLowerCase();
  if (mat.includes('glass')) {
    score += 3 * pct;
    hasGlass = true;
    glassPct += pct;
  }
  else if (mat.includes('aluminum')) {
    score += 2.5 * pct;
    hasAluminum = true;
    aluminumPct += pct;
  }
  else if (mat.includes('cardboard') || mat.includes('paper')) {
    score += 2 * pct;
  }
  else if (mat.includes('pet')) {
    score += 1 * pct;
    petPct += pct;
    hasPET = true;
  }
  else if (mat.includes('plastic')) {
    score += 1 * pct;
    plasticPct += pct;
    hasPlastic = true;
  }
  else {
    score += 1.5 * pct;
    othersPct += pct;
  }
});
const avg = score / total;
let eco = 'medium', color = 'medium';
if (glassPct >= 70) {
  eco = 'highest'; color = 'highest';
}
else if (glassPct >= 50 && aluminumPct >= 50) {
  eco = 'high'; color = 'high'; 
}
else if (aluminumPct >= 60) {
  eco = 'high'; color = 'high';
}
else if (plasticPct >= 60 || petPct >= 60 || othersPct >= 60) {
  eco = 'low'; color = 'low'; 
}
else if (avg > 2.5) {
  eco = 'high'; color = 'high';
}
else if (avg <= 1.5) {
  eco = 'low'; color = 'low';
}
resultDiv.innerHTML = `
  <p>Estimated Eco Score: <span class="eco-score ${color}">${eco}</span></p>
  <p><small>Enter as: plastic:60,paper:10,glass:20,aluminum:10</small></p>
`;
  aiPie = new Chart(canvas.getContext('2d'), {
    type: 'pie',
    data: {
      labels: Object.keys(matCounts),
      datasets: [{
        data: Object.values(matCounts),
        backgroundColor: ['#81c784', '#ffd54f', '#e57373', '#64b5f6', '#ba68c8','#b0bec5']
      }]
    },
    options: {
      responsive: false,
      plugins: {
        legend: { position: 'top' },
        title: { display: true, text: 'Material Composition' }
      }
    }
  });
}

function generateQrCode() {
  const input = document.getElementById('qrInput').value.trim().toLowerCase();
  const output = document.getElementById('qrOutput');
  output.innerHTML = '';
  if (!input) {
    output.innerHTML = '<p>Please enter a product name or qrcode.</p>';
    return;
  }
  const product = productsData.find(p => 
    p.name.toLowerCase().includes(input) || p.qrcode === input
  );
  if (!product) {
    output.innerHTML = '<p>No matching product found.</p>';
    return;
  }
  const url = `https://shreyakushwaha39.github.io/Eco-pack-insight/product-pages/${product.id}.html`;
  const qrImagePath = `qrcodes/${product.id}.png`;
  output.innerHTML = `
    <h3>${product.name}</h3>
    <p><b>Qrcode:</b> ${product.qrcode}</p>
    <img src="${qrImagePath}" alt="QR Code for ${product.name}" width="200" height="200" />
    <p><a href="${url}" target="_blank">${url}</a></p>
  `;
}

// QR Code Scanner logic using html5-qrcode
let qrScanner = null;
let qrScanning = false;

function toggleQrScan() {
  const scanBtn = document.getElementById('scanQrBtn');
  const qrReaderDiv = document.getElementById('qr-reader');
  const qrResultDiv = document.getElementById('qrScanResult');

  if (qrScanning) {
    stopQrScan();
    return;
  }

  scanBtn.innerHTML = '<i class="fa fa-stop"></i> Stop Scan';
  qrReaderDiv.style.display = 'block';
  qrResultDiv.innerHTML = '';

  if (!window.Html5Qrcode) {
    qrResultDiv.innerHTML = '<span style="color:red;">QR scanner library not loaded.</span>';
    scanBtn.innerHTML = '<i class="fa fa-camera"></i> Scan';
    qrScanning = false;
    qrReaderDiv.style.display = 'none';
    return;
  }

  qrScanner = new Html5Qrcode('qr-reader');
  qrScanner.start(
    { facingMode: 'environment' },
    { fps: 10, qrbox: 250 },
    qrCodeMessage => {
      qrResultDiv.innerHTML = `<b>QR Code:</b> ${qrCodeMessage}`;
      // Try to match product by qrcode
      const product = productsData.find(p => p.qrcode === qrCodeMessage);
      if (product) {
        qrResultDiv.innerHTML += `<br><b>Product:</b> ${product.name}<br><a href="product-pages/${product.id}.html" target="_blank">View Product Page</a>`;
      } else {
        qrResultDiv.innerHTML += '<br>No matching product found.';
      }
      stopQrScan();
    },
    errorMsg => {}
  ).then(() => {
    qrScanning = true;
  }).catch(err => {
    qrResultDiv.innerHTML = 'Camera error: ' + err;
    scanBtn.innerHTML = '<i class="fa fa-camera"></i> Scan';
    qrScanning = false;
    qrReaderDiv.style.display = 'none';
  });
}

function stopQrScan() {
  const scanBtn = document.getElementById('scanQrBtn');
  const qrReaderDiv = document.getElementById('qr-reader');
  if (qrScanner) {
    qrScanner.stop().then(() => {
      qrScanner.clear();
      qrScanner = null;
    });
  }
  scanBtn.innerHTML = '<i class="fa fa-camera"></i> Scan';
  qrScanning = false;
  qrReaderDiv.style.display = 'none';
}

function showDisposalGuide() {
  const prodModal = document.getElementById('productModal');
  const disposalModal = document.getElementById('disposalModal');
  const disposalDetails = document.getElementById('disposalDetails');
  const prodName = document.querySelector('#modalDetails h2')?.textContent;
  const prod = productsData.find(p => p.name === prodName);
  if (!prod) {
    disposalDetails.innerHTML = '<p>Product not found.</p>';
    disposalModal.style.display = 'block';
    return;
  }
  let html = `<h3 style="color:#1976d2;"><i class='fa fa-recycle'></i> Disposal Guide</h3><ul style='line-height:1.7;'>`;
  Object.entries(prod.materials).forEach(([mat, pct]) => {
    html += `<li><b>${mat}:</b> Check local guidelines.</li>`;
  });
  html += '</ul>';
  html += '<p style="margin-top:1em;color:#607d8b;font-size:0.98em;">Always check your local recycling rules for the most accurate information.</p>';
  disposalDetails.innerHTML = html;
  prodModal.style.display = 'none';
  disposalModal.style.display = 'block';
}
function closeDisposalModal() {
  document.getElementById('disposalModal').style.display = 'none';
  document.getElementById('productModal').style.display = 'block';
}

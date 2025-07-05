let productsData = [];
document.addEventListener('DOMContentLoaded', () => {
  fetch('products.json')
    .then(res => res.json())
    .then(data => {
      productsData = data;
      displayProducts(productsData);
      setupCompareSelect();
      console.log("Products loaded:", productsData.length); // Debug
    })
    .catch(err => console.error("Error loading products.json:", err));
    showSection('products');
  });

function showSection(id, btn) {
  document.querySelectorAll('main section').forEach(s => s.classList.remove('active'));
  document.getElementById(id).classList.add('active');

  // Update active nav button
  document.querySelectorAll('header nav button').forEach(b => b.classList.remove('active'));
  if (btn) btn.classList.add('active');

  // No scanner to reset now
  if (id === 'barcode') {
    // Focus the barcode input if needed
    setTimeout(() => {
      const input = document.getElementById('manualBarcodeInput');
      if (input) input.focus();
    }, 100);
  }
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
      <p>
        <span class="eco-score ${prod.ecoScore}">
          ${prod.ecoScore.charAt(0).toUpperCase() + prod.ecoScore.slice(1)}
        </span>
      </p>
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
    <div style="text-align:center;font-size:2em;color:#2e7d32;"><i class="fa fa-leaf"></i></div>
    <h2>${prod.name}</h2>
    <p><b>Category:</b> ${prod.category}</p>
    <p><b>Eco Score:</b> <span class="eco-score ${prod.ecoScore}">${prod.ecoScore}</span></p>
    <canvas id="matPie" width="200" height="200"></canvas>
    <ul>${matList}</ul>
    <p><b>Barcode:</b> ${prod.barcode}</p>
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

// Store chart instances globally so we can destroy them before creating new ones
let comparePie1 = null;
let comparePie2 = null;

// Comparison Tool
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
    // Destroy previous charts if any
    if (comparePie1) { comparePie1.destroy(); comparePie1 = null; }
    if (comparePie2) { comparePie2.destroy(); comparePie2 = null; }
    return;
  }
  const p1 = productsData.find(p => p.id === id1);
  const p2 = productsData.find(p => p.id === id2);
  res.innerHTML = `
    <div style="display:flex;gap:2em;flex-wrap:wrap;justify-content:center;">
      <div>
        <h3>${p1.name}</h3>
        <p><span class="eco-score ${p1.ecoScore}">${p1.ecoScore}</span></p>
        <canvas id="pie1" width="150" height="150"></canvas>
      </div>
      <div>
        <h3>${p2.name}</h3>
        <p><span class="eco-score ${p2.ecoScore}">${p2.ecoScore}</span></p>
        <canvas id="pie2" width="150" height="150"></canvas>
      </div>
    </div>
  `;
  setTimeout(() => {
    // Destroy previous chart instances if they exist
    if (comparePie1) { comparePie1.destroy(); }
    if (comparePie2) { comparePie2.destroy(); }
    // Create new pie charts
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

// AI Eco Score Estimator with PIE CHART
let aiPie = null;

function estimateEcoScore() {
  const input = document.getElementById('materialInput').value.toLowerCase();
  const resultDiv = document.getElementById('ecoScoreResult');
  const canvas = document.getElementById('aiEcoPieChart');

  // Destroy previous chart if it exists
  if (aiPie) { aiPie.destroy(); aiPie = null; }

  if (!input) {
    resultDiv.innerHTML = '<p>Please enter materials in format: plastic:30,paper:10,glass:20,aluminum:30,others:10</p>';
    // Optionally clear the chart
    return;
  }

  // Parse input as "material:percentage" pairs
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

  // Eco score logic (optional)
  let score = 0;
Object.entries(matCounts).forEach(([mat, pct]) => {
  if (mat.includes('glass')) score += 3 * pct;
  else if (mat.includes('aluminum')) score += 2.5 * pct;
  else if (mat.includes('cardboard') || mat.includes('paper')) score += 2 * pct;
  else if (mat.includes('plastic')) score += 1 * pct;
  else score += 1.5 * pct; // for other materials
});
const avg = score / total;
let eco = 'medium', color = 'medium';
if (avg < 1.5) (eco = 'low'), (color = 'low');
else if (avg > 2.5) (eco = 'high'), (color = 'high');

resultDiv.innerHTML = `
  <p>Estimated Eco Score: <span class="eco-score ${color}">${eco}</span></p>
  <p><small>Enter as: plastic:30,paper:10,glass:20,aluminum:30,others:10</small></p>
`;


  // Draw the pie chart using the existing canvas
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


//QR Code Generate
function generateQrCode() {
  const input = document.getElementById('qrInput').value.trim().toLowerCase();
  const output = document.getElementById('qrOutput');
  output.innerHTML = '';

  if (!input) {
    output.innerHTML = '<p>Please enter a product name or barcode.</p>';
    return;
  }

  const product = productsData.find(p => 
    p.name.toLowerCase().includes(input) || p.barcode === input
  );

  if (!product) {
    output.innerHTML = '<p>No matching product found.</p>';
    return;
  }

  const url = `https://shreyakushwaha39.github.io/ecopack-insight/product.html?id=${product.id}`;

  const qrContainer = document.createElement('div');
  qrContainer.id = 'qrCodeImg';
  output.innerHTML = `
  <h3>${product.name}</h3>
  <p><b>Barcode:</b> ${product.barcode}</p>
  <div id="qrOnly"></div>
`;
  output.appendChild(qrContainer);

  new QRCode(qrContainer, {
    text: url,
    width: 180,
    height: 180
  });
}

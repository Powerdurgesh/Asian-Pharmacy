function $(s){return document.querySelector(s);}
const itemsTbody = document.querySelector('#itemsTable tbody');
const subTotalEl = document.getElementById('subTotal');
const gstEl = document.getElementById('gst');
const totalEl = document.getElementById('total');

function addRow(name='', qty=1, price=0){
  const tr = document.createElement('tr');
  tr.innerHTML = `
    <td><input class="iname" value="${name}" /></td>
    <td><input class="iqty" type="number" value="${qty}" min="1" /></td>
    <td><input class="iprice" type="number" value="${price}" step="0.01" /></td>
    <td class="iamount">0.00</td>
    <td><button type="button" class="del">Del</button></td>
  `;
  itemsTbody.appendChild(tr);

  tr.querySelectorAll('.iqty, .iprice, .iname').forEach(inp => inp.addEventListener('input', updateTotals));
  tr.querySelector('.del').addEventListener('click', ()=>{ tr.remove(); updateTotals(); });
  updateTotals();
}

document.getElementById('addItem').addEventListener('click', ()=> addRow());

function updateTotals(){
  let sub=0;
  document.querySelectorAll('#itemsTable tbody tr').forEach(tr=>{
    const qty = Number(tr.querySelector('.iqty').value || 0);
    const price = Number(tr.querySelector('.iprice').value || 0);
    const amt = qty * price;
    tr.querySelector('.iamount').textContent = amt.toFixed(2);
    sub += amt;
  });
  const gstRate = 0.0;
  const gst = sub * gstRate / 100;
  const total = sub + gst;
  subTotalEl.textContent = sub.toFixed(2);
  gstEl.textContent = gst.toFixed(2);
  totalEl.textContent = total.toFixed(2);
}

document.getElementById('billForm').addEventListener('submit', async (e)=>{
  e.preventDefault();
  const items = Array.from(document.querySelectorAll('#itemsTable tbody tr')).map(tr=> ({
    name: tr.querySelector('.iname').value || '',
    qty: tr.querySelector('.iqty').value || 0,
    price: tr.querySelector('.iprice').value || 0
  }));
  const payload = {
    pharmacyName: document.getElementById('pharmacyName').value,
    pharmacyAddress: document.getElementById('pharmacyAddress').value,
    patientName: document.getElementById('patientName').value,
    patientNumber: document.getElementById('patientNumber').value,
    patientAge: document.getElementById('patientAge').value,
    patientAddress: document.getElementById('patientAddress').value,
    items
  };
  const resp = await fetch('/generate', {
    method: 'POST',
    headers: { 'Content-Type':'application/json' },
    body: JSON.stringify(payload)
  });
  const j = await resp.json();
  if(j.ok){
    alert('Bill saved and emailed to admin. File: ' + j.filename);
  } else {
    alert('Error: ' + (j.error || 'Unknown'));
  }
});

document.getElementById('printBtn').addEventListener('click', ()=>{
  window.print();
});

// add a starter row
addRow('Example Medicine',1,25);
// app.js — renders the synthetic seed. READ-ONLY: no writes, no network mutations,
// no forms that persist. Fetches seed.json and paints an interactive (filter + sort)
// dashboard. All interaction is client-side view state only.
'use strict';

const eur = (n) => '€' + Number(n).toLocaleString('en-US');
const $ = (id) => document.getElementById(id);

let SHIFTS = [];
let sortKey = 'date';
let sortDir = -1; // -1 desc, 1 asc

function uniqueSorted(arr) {
  return [...new Set(arr)].sort();
}

function applyFilters() {
  const hosp = $('fHospital').value;
  const status = $('fStatus').value;
  const q = $('fSearch').value.trim().toLowerCase();
  let rows = SHIFTS.filter((s) => {
    if (hosp && s.hospital !== hosp) return false;
    if (status && s.status !== status) return false;
    if (q && !(`${s.hospital} ${s.specialty} ${s.status}`.toLowerCase().includes(q))) return false;
    return true;
  });
  rows.sort((a, b) => {
    let av = a[sortKey], bv = b[sortKey];
    if (typeof av === 'string') return sortDir * av.localeCompare(bv);
    return sortDir * (av - bv);
  });
  renderTable(rows);
  renderArrows();
}

function renderTable(rows) {
  $('shiftCount').textContent = `(${rows.length}${rows.length !== SHIFTS.length ? ' of ' + SHIFTS.length : ''})`;
  const gross = rows.reduce((s, r) => (r.status !== 'pending' ? s + r.gross : s), 0);
  const hours = rows.reduce((s, r) => s + r.hours, 0);
  $('sumFiltered') && ($('sumFiltered').textContent = '');
  document.querySelector('#shifts tbody').innerHTML = rows
    .map(
      (s) => `<tr>
        <td>${s.date}</td><td>${s.hospital}</td><td>${s.specialty}</td>
        <td class="num">${s.hours}h</td><td class="num">${eur(s.rate)}/h</td>
        <td class="num">${eur(s.gross)}</td>
        <td><span class="pill ${s.status}">${s.status}</span></td>
      </tr>`
    )
    .join('') || '<tr><td colspan="7" style="color:var(--dim)">No shifts match these filters.</td></tr>';
  // live KPI reflecting the current filter
  $('kFiltered').innerHTML = `<div class="label">Filtered · hours / gross</div><div class="value">${hours}h · ${eur(gross)}</div>`;
}

function renderArrows() {
  document.querySelectorAll('#shifts th[data-sort]').forEach((th) => {
    const arr = th.querySelector('.arr');
    arr.textContent = th.dataset.sort === sortKey ? (sortDir === 1 ? '▲' : '▼') : '';
  });
}

async function main() {
  const seed = await fetch('data/seed.json').then((r) => r.json());
  SHIFTS = seed.shifts;

  $('doctor').innerHTML = `<b>${seed.doctor.name}</b>${seed.doctor.specialtyMain} · lic. ${seed.doctor.license}`;

  // KPIs (one is a live "filtered" card)
  const totalGross = seed.monthly.reduce((s, m) => s + m.gross, 0);
  const totalHours = seed.monthly.reduce((s, m) => s + m.hours, 0);
  const cards = [
    ['Shifts (H1 2026)', seed.shifts.length],
    ['Hours logged', totalHours],
    ['Gross earnings', eur(totalGross)],
  ];
  $('cards').innerHTML =
    cards.map(([l, v]) => `<div class="kpi"><div class="label">${l}</div><div class="value">${v}</div></div>`).join('') +
    `<div class="kpi" id="kFiltered"></div>`;

  // chart
  const max = Math.max(...seed.monthly.map((m) => m.gross), 1);
  $('chart').innerHTML = seed.monthly
    .map((m) => {
      const h = Math.round((m.gross / max) * 100);
      const label = m.month.slice(5) + '/' + m.month.slice(2, 4);
      return `<div class="bar"><div class="v">${eur(m.gross)}</div><div class="fill" style="height:${h}%"></div><div class="m">${label}</div></div>`;
    })
    .join('');

  // populate filters
  $('fHospital').innerHTML = '<option value="">All hospitals</option>' + uniqueSorted(SHIFTS.map((s) => s.hospital)).map((h) => `<option>${h}</option>`).join('');
  $('fStatus').innerHTML = '<option value="">All statuses</option>' + uniqueSorted(SHIFTS.map((s) => s.status)).map((s) => `<option>${s}</option>`).join('');

  // wire interactions (view-only)
  ['fHospital', 'fStatus'].forEach((id) => $(id).addEventListener('change', applyFilters));
  $('fSearch').addEventListener('input', applyFilters);
  $('clear').addEventListener('click', () => { $('fHospital').value = ''; $('fStatus').value = ''; $('fSearch').value = ''; applyFilters(); });
  document.querySelectorAll('#shifts th[data-sort]').forEach((th) => {
    th.addEventListener('click', () => {
      const k = th.dataset.sort;
      if (k === sortKey) sortDir = -sortDir; else { sortKey = k; sortDir = k === 'date' ? -1 : 1; }
      applyFilters();
    });
  });

  applyFilters();
}

main().catch((e) => {
  document.querySelector('.wrap').innerHTML =
    '<div class="panel">Could not load synthetic seed. Run <code>node data/gen-seed.js</code> first.</div>';
  console.error(e);
});

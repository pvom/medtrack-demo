// app.js — renders the synthetic seed. READ-ONLY: no writes, no network mutations,
// no forms that persist. Just fetches seed.json and paints the dashboard.
'use strict';

const eur = (n) => '€' + Number(n).toLocaleString('en-US');

async function main() {
  const seed = await fetch('data/seed.json').then((r) => r.json());

  // doctor
  document.getElementById('doctor').innerHTML =
    `<b>${seed.doctor.name}</b>${seed.doctor.specialtyMain} · lic. ${seed.doctor.license}`;

  // KPIs
  const totalGross = seed.monthly.reduce((s, m) => s + m.gross, 0);
  const totalHours = seed.monthly.reduce((s, m) => s + m.hours, 0);
  const pending = seed.shifts.filter((s) => s.status === 'pending').length;
  const cards = [
    ['Shifts (H1 2026)', seed.shifts.length],
    ['Hours logged', totalHours],
    ['Gross earnings', eur(totalGross)],
    ['Pending', pending],
  ];
  document.getElementById('cards').innerHTML = cards
    .map(([l, v]) => `<div class="kpi"><div class="label">${l}</div><div class="value">${v}</div></div>`)
    .join('');

  // chart
  const max = Math.max(...seed.monthly.map((m) => m.gross), 1);
  document.getElementById('chart').innerHTML = seed.monthly
    .map((m) => {
      const h = Math.round((m.gross / max) * 100);
      const label = m.month.slice(5) + '/' + m.month.slice(2, 4);
      return `<div class="bar"><div class="v">${eur(m.gross)}</div><div class="fill" style="height:${h}%"></div><div class="m">${label}</div></div>`;
    })
    .join('');

  // table
  document.getElementById('shiftCount').textContent = `(${seed.shifts.length})`;
  const rows = [...seed.shifts]
    .sort((a, b) => b.date.localeCompare(a.date))
    .map(
      (s) => `<tr>
        <td>${s.date}</td><td>${s.hospital}</td><td>${s.specialty}</td>
        <td class="num">${s.hours}h</td><td class="num">${eur(s.rate)}/h</td>
        <td class="num">${eur(s.gross)}</td>
        <td><span class="pill ${s.status}">${s.status}</span></td>
      </tr>`
    )
    .join('');
  document.querySelector('#shifts tbody').innerHTML = rows;
}

main().catch((e) => {
  document.querySelector('.wrap').innerHTML =
    '<div class="panel">Could not load synthetic seed. Run <code>node data/gen-seed.js</code> first.</div>';
  console.error(e);
});

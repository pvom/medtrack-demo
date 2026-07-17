// gen-seed.js — DATA-3: deterministic synthetic seed for the MedTrack demo.
// Fictional physician, fictional shifts + finances. Every id is prefixed DEMO.
// No real patient data, no real users, no credentials. Run: node data/gen-seed.js
'use strict';
const fs = require('fs');
const path = require('path');

// tiny deterministic PRNG (mulberry32)
function mulberry32(a) {
  return function () {
    a |= 0; a = (a + 0x6d2b79f5) | 0;
    let t = Math.imul(a ^ (a >>> 15), 1 | a);
    t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}
const rnd = mulberry32(20260717);
const pick = (a) => a[Math.floor(rnd() * a.length)];

const HOSPITALS = ['DEMO Hospital Central', 'DEMO Clínica Norte', 'DEMO Santa Marta', 'DEMO Hospital do Vale'];
const SPECIALTIES = ['Emergency', 'Internal Medicine', 'Pediatrics', 'Cardiology'];
const STATUS = ['confirmed', 'confirmed', 'confirmed', 'pending', 'completed'];

// 2026-H1, one entry every ~2-3 days
function build() {
  const shifts = [];
  let day = new Date(Date.UTC(2026, 0, 6));
  let i = 0;
  while (day < new Date(Date.UTC(2026, 6, 1))) {
    const hours = pick([6, 8, 12, 12, 24]);
    const rate = pick([28, 32, 35, 40, 45]); // €/h, synthetic
    shifts.push({
      id: `DEMO-SHIFT-${String(1000 + i)}`,
      date: day.toISOString().slice(0, 10),
      hospital: pick(HOSPITALS),
      specialty: pick(SPECIALTIES),
      hours,
      rate,
      gross: hours * rate,
      status: pick(STATUS),
    });
    i++;
    day = new Date(day.getTime() + (2 + Math.floor(rnd() * 2)) * 86400000);
  }
  // monthly aggregates (completed + confirmed count toward earnings)
  const months = {};
  for (const s of shifts) {
    const m = s.date.slice(0, 7);
    months[m] = months[m] || { month: m, shifts: 0, hours: 0, gross: 0 };
    months[m].shifts++;
    months[m].hours += s.hours;
    if (s.status !== 'pending') months[m].gross += s.gross;
  }
  return {
    _disclaimer: 'SYNTHETIC DEMO DATA — fictional physician, fictional shifts. Not real patient or user data.',
    generatedFor: 'medtrack-demo',
    doctor: { name: 'Dr. DEMO Alex Rivera', specialtyMain: 'Emergency', license: 'DEMO-000000' },
    shifts,
    monthly: Object.values(months).sort((a, b) => a.month.localeCompare(b.month)),
  };
}

if (require.main === module) {
  const seed = build();
  const out = path.join(__dirname, 'seed.json');
  fs.writeFileSync(out, JSON.stringify(seed, null, 2));
  const total = seed.monthly.reduce((s, m) => s + m.gross, 0);
  console.log(`Wrote seed: ${seed.shifts.length} shifts, ${seed.monthly.length} months, €${total} gross → ${path.relative(process.cwd(), out)}`);
}

module.exports = { build };

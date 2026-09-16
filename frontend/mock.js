/* In-memory stand-in for the backend. Same request/response shapes as api.js.
   Disabled automatically when KSConfig.useMock is false. */

const KSMock = (() => {
  const farmer = {
    id: "farmer-001",
    name: "Ramesh Singh",
    initials: "RS",
    village: "Kheri Village",
    district: "Karnal",
    mobile: "9876543210",
    language: "en",
    bank: { name: "PNB", last4: "4471" }
  };

  const crops = [
    { id: "wheat", name: "Wheat", nameHi: "गेहूं", namePa: "ਕਣਕ", msp: 2521 },
    { id: "paddy", name: "Paddy", nameHi: "धान", namePa: "ਝੋਨਾ", msp: 2450 },
    { id: "mustard", name: "Mustard", nameHi: "सरसों", namePa: "ਸਰ੍ਹੋਂ", msp: 6200 },
    { id: "gram", name: "Gram", nameHi: "चना", namePa: "ਛੋਲੇ", msp: 5900 },
    { id: "bajra", name: "Bajra", nameHi: "बाजरा", namePa: "ਬਾਜਰਾ", msp: 2890 },
    { id: "maize", name: "Maize", nameHi: "मक्का", namePa: "ਮੱਕੀ", msp: 2325 }
  ];

  const centres = [
    { id: 1, name: "Karnal Grain Mandi", crops: "Wheat, Paddy", km: 4.2, waitMinutes: 35, load: 0.62, gate: "Gate 2", lat: 29.6857, lng: 76.9905, mapLeft: "47%", mapTop: "44%" },
    { id: 2, name: "Taraori Procurement Centre", crops: "Wheat, Mustard", km: 9.1, waitMinutes: 15, load: 0.34, gate: "Gate 1", lat: 29.8000, lng: 76.9300, mapLeft: "76%", mapTop: "28%" },
    { id: 3, name: "Nilokheri Centre", crops: "Paddy, Wheat", km: 12.6, waitMinutes: 125, load: 0.96, gate: "Main", lat: 29.8300, lng: 76.9300, mapLeft: "20%", mapTop: "76%" },
    { id: 4, name: "Assandh Sub-Yard", crops: "Wheat, Bajra", km: 18.3, waitMinutes: 10, load: 0.21, gate: "Yard", lat: 29.5210, lng: 76.6060, mapLeft: "80%", mapTop: "88%" }
  ];

  const slotTimes = [
    { id: "s1", start: "09:00", end: "09:45", total: 12, left: 0 },
    { id: "s2", start: "10:00", end: "10:45", total: 12, left: 0 },
    { id: "s3", start: "11:00", end: "11:45", total: 12, left: 2 },
    { id: "s4", start: "12:00", end: "12:45", total: 12, left: 5 },
    { id: "s5", start: "14:00", end: "14:45", total: 12, left: 9 },
    { id: "s6", start: "15:00", end: "15:45", total: 12, left: 12 }
  ];

  let booking = {
    id: "bk-042",
    token: "A-042",
    centreId: 1,
    centreName: "Karnal Mandi, Gate 2",
    gate: "Gate 2",
    date: "2026-08-25",
    dateLabel: "Tue 25 Aug",
    slotId: "s3",
    slotLabel: "11:00 – 11:45",
    crops: [{ cropId: "wheat", quintal: 42, name: "Wheat", msp: 2521 }],
    cropsLabel: "Wheat · 42 quintal",
    status: "confirmed",
    waitMinutes: 35,
    aheadCount: 6
  };

  const lot = {
    lotNo: "KRL-2291",
    cropLabel: "Wheat · 42 quintal",
    centreName: "Karnal Mandi",
    steps: [
      { key: "arrived", status: "done", time: "25 Aug, 11:04 AM", note: null },
      { key: "graded", status: "done", time: "25 Aug, 11:26 AM", noteKey: "gradeNote" },
      { key: "weighing", status: "now", timeKey: "stWeighingTs", note: null },
      { key: "accepted", status: "todo", timeKey: "pending", note: null },
      { key: "paid", status: "todo", timeKey: "pending", note: null }
    ]
  };

  let queue = [
    { token: "A-038", name: "Sunita Devi", village: "Gharaunda", crop: "Wheat, 28 qtl", slot: "10:15 AM", stage: "weighed" },
    { token: "A-039", name: "Mohan Lal", village: "Nissing", crop: "Wheat, 51 qtl", slot: "10:30 AM", stage: "graded" },
    { token: "A-040", name: "Jaspreet Kaur", village: "Taraori", crop: "Paddy, 34 qtl", slot: "10:45 AM", stage: "graded" },
    { token: "A-041", name: "Balbir Singh", village: "Kunjpura", crop: "Wheat, 19 qtl", slot: "10:45 AM", stage: "arrived" },
    { token: "A-042", name: "Ramesh Singh", village: "Kheri", crop: "Wheat, 42 qtl", slot: "11:00 AM", stage: "arrived" },
    { token: "A-043", name: "Kamla Yadav", village: "Indri", crop: "Wheat, 23 qtl", slot: "11:15 AM", stage: "booked" },
    { token: "A-044", name: "Harpal Rana", village: "Ballah", crop: "Paddy, 60 qtl", slot: "11:15 AM", stage: "booked" }
  ];

  const aheadList = [
    { token: "A-036", name: "Prem Chand", village: "Ballah", tag: "At counter" },
    { token: "A-037", name: "Gurmeet Singh", village: "Nissing", tag: "Next" },
    { token: "A-038", name: "Sunita Devi", village: "Gharaunda", tag: "Weighing" },
    { token: "A-039", name: "Mohan Lal", village: "Nissing", tag: "Graded" },
    { token: "A-040", name: "Jaspreet Kaur", village: "Taraori", tag: "Graded" },
    { token: "A-041", name: "Balbir Singh", village: "Kunjpura", tag: "Arrived" }
  ];

  const waitlist = [
    { name: "Kamla Yadav", village: "Indri", want: "11:00 AM", since: "since 8:40 AM" },
    { name: "Devender Rana", village: "Ballah", want: "11:00 AM", since: "since 9:05 AM" },
    { name: "Rajbir Kaur", village: "Nissing", want: "12:00 PM", since: "since 9:22 AM" },
    { name: "Om Prakash", village: "Kunjpura", want: "12:00 PM", since: "since 9:48 AM" }
  ];

  const hourly = [
    { hour: "8a", count: 62 }, { hour: "9a", count: 88 }, { hour: "10a", count: 104 },
    { hour: "11a", count: 141 }, { hour: "12p", count: 118 }, { hour: "1p", count: 54 },
    { hour: "2p", count: 96 }, { hour: "3p", count: 87 }, { hour: "4p", count: 71 },
    { hour: "5p", count: 43 }
  ];

  const alerts = [
    { level: "crit", title: "Nilokheri centre is over capacity", body: "Wait crossed 2 hours. Suggest moving 20 unbooked slots to Taraori, 9 km away.", time: "4 minutes ago" },
    { level: "warn", title: "Rain forecast for 27 August", body: "IMD predicts 24 mm. 148 slots auto-moved to 28 August, farmers notified on WhatsApp.", time: "1 hour ago" },
    { level: "info", title: "Assandh running below capacity", body: "Only 46% of slots booked. Consider promoting it to nearby villages.", time: "2 hours ago" },
    { level: "warn", title: "12 payments delayed beyond 72 hours", body: "Flagged to the district treasury for follow-up.", time: "Today, 9:15 AM" }
  ];

  let pendingMutations = [];
  let staffOnline = true;
  let lastOtpMobile = "";

  const wait = (ms) => new Promise(r => setTimeout(r, 180 + (ms || 0)));
  const cropById = id => crops.find(c => c.id === id);
  const centreById = id => centres.find(c => c.id === +id);

  function slotLabel(slot) {
    return slot.start + " – " + slot.end;
  }

  function bookingPayload() {
    return booking ? JSON.parse(JSON.stringify(booking)) : null;
  }

  return {
    async sendOtp({ mobile, aadhaar }) {
      await wait();
      if (!/^[6-9]\d{9}$/.test(mobile)) throw Object.assign(new Error("Invalid mobile number."), { status: 400 });
      if (!/^\d{12}$/.test(aadhaar)) throw Object.assign(new Error("Invalid Aadhaar number."), { status: 400 });
      lastOtpMobile = mobile;
      return { ok: true, expiresInSec: 24 };
    },

    async verifyOtp({ mobile, otp }) {
      await wait();
      if (!/^\d{4}$/.test(otp)) throw Object.assign(new Error("Enter the 4-digit code."), { status: 400 });
      if (lastOtpMobile && mobile !== lastOtpMobile) {
        throw Object.assign(new Error("OTP was sent to a different number."), { status: 400 });
      }
      farmer.mobile = mobile;
      return { token: "mock-token-ramesh", farmer: { ...farmer } };
    },

    async getMe() {
      await wait();
      return { ...farmer };
    },

    async updateMe({ language }) {
      await wait();
      if (language) farmer.language = language;
      return { ...farmer };
    },

    async listCrops() {
      await wait();
      return crops.map(c => ({ ...c }));
    },

    async listCentres() {
      await wait();
      return centres.map(c => ({ ...c }));
    },

    async getSlots({ centreId, date }) {
      await wait();
      if (!centreById(centreId)) throw Object.assign(new Error("Centre not found."), { status: 404 });
      const day = new Date(date + "T00:00:00");
      const base = new Date("2026-08-25T00:00:00");
      const dayIdx = Math.max(0, Math.round((day - base) / 86400000));
      return {
        centreId: +centreId,
        date,
        slots: slotTimes.map(s => ({
          ...s,
          left: Math.min(s.total, s.left + dayIdx * 3)
        }))
      };
    },

    async createBooking({ centreId, date, slotId, crops: pickedCrops }) {
      await wait(200);
      const centre = centreById(centreId);
      const slot = slotTimes.find(s => s.id === slotId);
      if (!centre || !slot) throw Object.assign(new Error("Slot is no longer available."), { status: 409 });
      const lines = (pickedCrops || []).map(p => {
        const c = cropById(p.cropId);
        return { cropId: p.cropId, quintal: p.quintal, name: c ? c.name : p.cropId, msp: c ? c.msp : 0 };
      });
      const day = new Date(date + "T00:00:00");
      const days = ["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"];
      booking = {
        id: "bk-042",
        token: "A-042",
        centreId: centre.id,
        centreName: centre.name + ", " + centre.gate,
        gate: centre.gate,
        date,
        dateLabel: days[day.getDay()] + " " + day.getDate() + " Aug",
        slotId: slot.id,
        slotLabel: slotLabel(slot),
        crops: lines,
        cropsLabel: lines.map(l => l.name + " · " + l.quintal + " quintal").join(" + "),
        status: "confirmed",
        waitMinutes: centre.waitMinutes,
        aheadCount: 6
      };
      return bookingPayload();
    },

    async getCurrentBooking() {
      await wait();
      return { booking: bookingPayload() };
    },

    async cancelBooking({ id }) {
      await wait(200);
      if (!booking || booking.id !== id) throw Object.assign(new Error("Booking not found."), { status: 404 });
      booking.status = "cancelled";
      const offeredTo = { name: waitlist[0].name };
      return { ok: true, offeredTo, penalty: false };
    },

    async holdBooking({ id }) {
      await wait();
      if (!booking || booking.id !== id) throw Object.assign(new Error("Booking not found."), { status: 404 });
      return { ok: true, heldMinutes: 30 };
    },

    async getQueue({ centreId }) {
      await wait();
      return {
        centreId: +(centreId || 1),
        position: 7,
        total: 13,
        eta: "11:38 AM",
        nowServing: "A-036",
        avgMinutes: 5,
        ahead: aheadList.map(r => ({ ...r }))
      };
    },

    async getCurrentLot() {
      await wait();
      return JSON.parse(JSON.stringify(lot));
    },

    async getCurrentPayment() {
      await wait();
      const lines = (booking && booking.crops ? booking.crops : [{ name: "Wheat", quintal: 42, msp: 2521 }])
        .map(c => ({ label: c.name, quintal: c.quintal, msp: c.msp, amount: c.quintal * c.msp }));
      const gross = lines.reduce((s, l) => s + l.amount, 0);
      return {
        lotNo: lot.lotNo,
        cropLabel: booking ? booking.cropsLabel : lot.cropLabel,
        centreName: lot.centreName,
        lines,
        gross,
        deductions: 0,
        net: gross,
        bank: { ...farmer.bank },
        status: "awaiting_weighing",
        progress: [
          { key: "payLotAccepted", status: "todo", timeKey: "afterWeighingDone" },
          { key: "payReceipt", status: "todo", timeKey: "pending" },
          { key: "paySentBank", status: "todo", timeKey: "pending" }
        ]
      };
    },

    async getWeather() {
      await wait();
      return {
        district: "Karnal",
        source: "IMD",
        rainMm: 24,
        rainDate: "2026-08-27",
        days: [
          { dow: "Tue", mm: 0, wet: false, icon: "sun" },
          { dow: "Wed", mm: 2, wet: false, icon: "cloud" },
          { dow: "Thu", mm: 24, wet: true, icon: "rain" },
          { dow: "Fri", mm: 3, wet: false, icon: "cloud" },
          { dow: "Sat", mm: 0, wet: false, icon: "sun" }
        ],
        moved: { count: 148, from: "27 Aug", to: "28 Aug, same time" },
        farmerDate: "25 August"
      };
    },

    async getNotifications() {
      await wait();
      return [
        { id: "n1", key: "msg1", time: "8:02 AM" },
        { id: "n2", key: "msg2", time: "9:00 AM" },
        { id: "n3", key: "msg3", time: "11:26 AM" },
        { id: "n4", key: "msg4", time: "11:31 AM" }
      ];
    },

    async getStaffDashboard() {
      await wait();
      const active = queue.filter(r => ["arrived", "graded", "weighed"].includes(r.stage)).length;
      const done = queue.filter(r => r.stage === "accepted").length;
      const missed = queue.filter(r => r.stage === "no_show").length;
      return {
        centreName: "Karnal Mandi",
        gate: "Gate 2",
        operator: "Suresh Kumar",
        date: "25 August 2026",
        stats: {
          booked: 86,
          inQueue: active,
          completed: 41 + done,
          noShows: 4 + missed,
          acceptedQtl: 1720,
          avgWait: 35
        },
        queue: queue.map(r => ({ ...r })),
        waitlist: waitlist.map(w => ({ ...w })),
        slots: slotTimes.map(s => ({ time: slotLabel(s), total: s.total, left: s.left })),
        sync: { online: staffOnline, pendingCount: pendingMutations.length }
      };
    },

    async updateQueueStage({ token, stage }) {
      await wait();
      const row = queue.find(r => r.token === token);
      if (!row) throw Object.assign(new Error("Token not in today's queue."), { status: 404 });
      row.stage = stage;
      return { ok: true, token, stage };
    },

    async checkIn({ token }) {
      await wait();
      const found = queue.find(r => r.token === token);
      if (!found) throw Object.assign(new Error("Token is not booked for today."), { status: 404 });
      found.stage = "arrived";
      return { farmer: { name: found.name, village: found.village }, slot: found.slot, crop: found.crop, token: found.token };
    },

    async syncStaff({ mutations }) {
      await wait();
      for (const m of mutations || []) {
        if (m.type === "stage") {
          const row = queue.find(r => r.token === m.token);
          if (row) row.stage = m.stage;
        }
        if (m.type === "check-in") {
          const row = queue.find(r => r.token === m.token);
          if (row) row.stage = "arrived";
        }
      }
      pendingMutations = [];
      staffOnline = true;
      return { ok: true, applied: (mutations || []).length };
    },

    setStaffOnline(value) {
      staffOnline = value;
    },

    queueOfflineMutation(m) {
      pendingMutations.push(m);
    },

    async getAdminDashboard() {
      await wait();
      return {
        district: "Karnal",
        centreCount: 6,
        stats: {
          served: 1284,
          servedDelta: "+18% vs last Tuesday",
          avgWait: 38,
          avgWaitWas: "5h 40m",
          utilisation: 91,
          noShowLoss: 4,
          paymentsPending: 137,
          paymentsAmount: "₹ 3.2 Cr"
        },
        centres: centres.map(c => ({ ...c })),
        alerts: alerts.map(a => ({ ...a })),
        hourly: hourly.map(h => ({ ...h }))
      };
    }
  };
})();

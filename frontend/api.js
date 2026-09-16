/* Named API client. Every function is one backend endpoint.
   Implement these paths under KSConfig.apiBase (default /api/v1).
   Auth: Authorization: Bearer <token> on every call except sendOtp and verifyOtp.
   Language: Accept-Language is en, hi, or pa.
   Errors: JSON { message: "..." } with the matching HTTP status. */

const KSApi = (() => {
  const TOKEN_KEY = "ks_token";

  function token() {
    return localStorage.getItem(TOKEN_KEY);
  }

  function setToken(value) {
    if (value) localStorage.setItem(TOKEN_KEY, value);
    else localStorage.removeItem(TOKEN_KEY);
  }

  function queryString(query) {
    if (!query) return "";
    const q = Object.entries(query)
      .filter(([, v]) => v !== undefined && v !== null && v !== "")
      .map(([k, v]) => encodeURIComponent(k) + "=" + encodeURIComponent(v))
      .join("&");
    return q ? "?" + q : "";
  }

  async function http(method, path, body, query) {
    const url = KSConfig.apiBase.replace(/\/$/, "") + path + queryString(query);
    const headers = {
      Accept: "application/json",
      "Accept-Language": KSConfig.lang || "en"
    };
    if (body !== undefined) headers["Content-Type"] = "application/json";
    const jwt = token();
    if (jwt) headers.Authorization = "Bearer " + jwt;

    let res;
    try {
      res = await fetch(url, {
        method,
        headers,
        body: body !== undefined ? JSON.stringify(body) : undefined
      });
    } catch (err) {
      throw Object.assign(new Error("Could not reach the server at " + KSConfig.apiBase + "."), { status: 0 });
    }

    const data = await res.json().catch(() => ({}));
    if (!res.ok) {
      throw Object.assign(new Error(data.message || res.statusText || "Request failed"), {
        status: res.status,
        body: data
      });
    }
    return data;
  }

  function call(mockFn, method, path, body, query) {
    if (KSConfig.useMock) return mockFn();
    return http(method, path, body, query);
  }

  return {
    TOKEN_KEY,
    isLoggedIn: () => !!token(),
    setToken,
    clearToken() { setToken(null); },

    /* POST /auth/send-otp
       req: { mobile, aadhaar }  — digits only, no spaces
       res: { ok, expiresInSec } */
    sendOtp(mobile, aadhaar) {
      const body = { mobile, aadhaar };
      return call(() => KSMock.sendOtp(body), "POST", "/auth/send-otp", body);
    },

    /* POST /auth/verify-otp
       req: { mobile, otp }
       res: { token, farmer } */
    verifyOtp(mobile, otp) {
      const body = { mobile, otp };
      return call(() => KSMock.verifyOtp(body), "POST", "/auth/verify-otp", body);
    },

    /* GET /farmer/me
       res: { id, name, initials, village, district, mobile, language, bank } */
    getMe() {
      return call(() => KSMock.getMe(), "GET", "/farmer/me");
    },

    /* PATCH /farmer/me
       req: { language }  — en | hi | pa
       res: farmer */
    updateMe(patch) {
      return call(() => KSMock.updateMe(patch), "PATCH", "/farmer/me", patch);
    },

    /* GET /crops
       res: [{ id, name, nameHi, namePa, msp }] */
    listCrops() {
      return call(() => KSMock.listCrops(), "GET", "/crops");
    },

    /* GET /centres
       res: [{ id, name, crops, km, waitMinutes, load, gate, lat, lng, mapLeft, mapTop }] */
    listCentres() {
      return call(() => KSMock.listCentres(), "GET", "/centres");
    },

    /* GET /centres/:centreId/slots?date=YYYY-MM-DD
       res: { centreId, date, slots: [{ id, start, end, total, left }] } */
    getSlots(centreId, date) {
      return call(() => KSMock.getSlots({ centreId, date }), "GET", "/centres/" + centreId + "/slots", undefined, { date });
    },

    /* POST /bookings
       req: { centreId, date, slotId, crops: [{ cropId, quintal }] }
       res: booking */
    createBooking(payload) {
      return call(() => KSMock.createBooking(payload), "POST", "/bookings", payload);
    },

    /* GET /bookings/current
       res: { booking }  — booking is null when none is active */
    getCurrentBooking() {
      return call(() => KSMock.getCurrentBooking(), "GET", "/bookings/current");
    },

    /* POST /bookings/:id/cancel
       res: { ok, offeredTo: { name }, penalty } */
    cancelBooking(id) {
      return call(() => KSMock.cancelBooking({ id }), "POST", "/bookings/" + id + "/cancel", {});
    },

    /* POST /bookings/:id/hold
       res: { ok, heldMinutes } */
    holdBooking(id) {
      return call(() => KSMock.holdBooking({ id }), "POST", "/bookings/" + id + "/hold", {});
    },

    /* GET /queue?centreId=
       res: { position, total, eta, nowServing, avgMinutes, ahead } */
    getQueue(centreId) {
      return call(() => KSMock.getQueue({ centreId }), "GET", "/queue", undefined, { centreId });
    },

    /* GET /lots/current
       res: { lotNo, cropLabel, centreName, steps } */
    getCurrentLot() {
      return call(() => KSMock.getCurrentLot(), "GET", "/lots/current");
    },

    /* GET /payments/current
       res: { lotNo, lines, gross, deductions, net, bank, status, progress } */
    getCurrentPayment() {
      return call(() => KSMock.getCurrentPayment(), "GET", "/payments/current");
    },

    /* GET /weather?district=
       res: { district, days, moved, rainMm, rainDate } */
    getWeather(district) {
      return call(() => KSMock.getWeather({ district }), "GET", "/weather", undefined, { district });
    },

    /* GET /notifications
       res: [{ id, key, time, body? }] */
    getNotifications() {
      return call(() => KSMock.getNotifications(), "GET", "/notifications");
    },

    /* GET /staff/dashboard
       res: { centreName, gate, operator, date, stats, queue, waitlist, slots, sync } */
    getStaffDashboard() {
      return call(() => KSMock.getStaffDashboard(), "GET", "/staff/dashboard");
    },

    /* PATCH /staff/queue/:token/stage
       req: { stage }  — booked | arrived | graded | weighed | accepted | no_show
       res: { ok, token, stage } */
    updateQueueStage(tokenNo, stage) {
      return call(() => KSMock.updateQueueStage({ token: tokenNo, stage }), "PATCH", "/staff/queue/" + encodeURIComponent(tokenNo) + "/stage", { stage });
    },

    /* POST /staff/check-in
       req: { token }
       res: { farmer, slot, crop, token } */
    checkIn(tokenNo) {
      return call(() => KSMock.checkIn({ token: tokenNo }), "POST", "/staff/check-in", { token: tokenNo });
    },

    /* POST /staff/sync
       req: { mutations: [{ type, token, stage? }] }
       res: { ok, applied } */
    syncStaff(mutations) {
      return call(() => KSMock.syncStaff({ mutations }), "POST", "/staff/sync", { mutations });
    },

    /* GET /admin/dashboard
       res: { district, stats, centres, alerts, hourly } */
    getAdminDashboard() {
      return call(() => KSMock.getAdminDashboard(), "GET", "/admin/dashboard");
    }
  };
})();

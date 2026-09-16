/* Kissan Setu — frontend. Live data comes from KSApi (see api.js / API.md). */

const cropIcons = {
  wheat: '<path d="M12 21V9" /><path d="M12 9c0-2.4 1.9-4.3 4.3-4.3C16.3 7.1 14.4 9 12 9z" />' +
    '<path d="M12 9c0-2.4-1.9-4.3-4.3-4.3C7.7 7.1 9.6 9 12 9z" />' +
    '<path d="M12 14.5c0-2.2 1.8-4 4-4 0 2.2-1.8 4-4 4z" />' +
    '<path d="M12 14.5c0-2.2-1.8-4-4-4 0 2.2 1.8 4 4 4z" />',
  paddy: '<path d="M12 21c0-5 2-9 7-11-1 5.5-3.5 9-7 11z" />' +
    '<path d="M12 21C12 16 10 12 5 10c1 5.5 3.5 9 7 11z" /><path d="M12 21v-3" />',
  mustard: '<path d="M12 21v-7" /><circle cx="12" cy="6" r="2.4" /><circle cx="7.4" cy="9.4" r="2.1" />' +
    '<circle cx="16.6" cy="9.4" r="2.1" /><path d="M12 14c-2 0-3.4-1.2-4-2.4M12 14c2 0 3.4-1.2 4-2.4" />',
  gram: '<path d="M6 9c4-3 8-3 12 0-1.5 6-10.5 6-12 0z" /><circle cx="9.5" cy="10.6" r="1.1" />' +
    '<circle cx="14.5" cy="10.6" r="1.1" /><path d="M12 14.5V21" />',
  bajra: '<path d="M12 21v-8" /><rect x="9" y="3" width="6" height="10" rx="3" />' +
    '<path d="M12 3v10M9.6 6h4.8M9.6 9h4.8" />',
  maize: '<path d="M10.5 21v-4" />' +
    '<path d="M10.5 3c2.6 0 4.2 2.6 4.2 6.6s-1.6 7.1-4.2 7.1-4.2-3.1-4.2-7.1S7.9 3 10.5 3z" />' +
    '<path d="M8 7h5M7.7 10.3h5.6M8 13.6h5M10.5 3.4v13" />' +
    '<path d="M14.6 17.4c2.4-.6 3.9-2.3 4.4-4.9-2.6.2-4.1 1.6-4.4 4.9z" />'
};

let centres = [];
let crops = [];
let queue = [];
let farmer = null;
let booking = null;
let currentSlots = [];
let pendingMutations = [];
let aheadList = [];
let waitlist = [];
let slotCapacityData = [];
let hourly = [];
let staffStats = { booked: 0, completed: 0, noShows: 0, acceptedQtl: 0, avgWait: 0 };

const stageMeta = {
  booked:   { label: "Booked",   pill: "grey"  },
  arrived:  { label: "Arrived",  pill: "blue"  },
  graded:   { label: "Graded",   pill: "amber" },
  weighed:  { label: "Weighed",  pill: "amber" },
  accepted: { label: "Accepted", pill: "green" },
  no_show:  { label: "No-show",  pill: "red"   }
};

/* Spoken lines for the Listen buttons, per language. */
const speech = {
  en: {
    loginTitle: "Welcome to Kissan Setu. Sell your crop without standing in a queue. Enter your mobile number and Aadhaar number to begin.",
    tokenSpeak: "Your token number today is A zero four two, at Karnal Mandi, gate two. Your slot is eleven o'clock to eleven forty five in the morning. The wait is about thirty five minutes. Six farmers are ahead of you.",
    trackSpeak: "Your wheat lot has reached the centre and the quality has been checked. It got grade A. Weighing is going on now and will take about ten minutes. You will receive one lakh five thousand eight hundred eighty two rupees in your P N B account."
  },
  hi: {
    loginTitle: "किसान सेतु में आपका स्वागत है। बिना कतार में खड़े अपनी फसल बेचें। शुरू करने के लिए अपना मोबाइल नंबर और आधार नंबर भरें।",
    tokenSpeak: "आज आपका टोकन नंबर ए शून्य चार दो है, करनाल मंडी, गेट दो। आपका समय सुबह ग्यारह बजे से ग्यारह पैंतालीस तक है। लगभग पैंतीस मिनट की प्रतीक्षा है। आपसे आगे छह किसान हैं।",
    trackSpeak: "आपका गेहूं केंद्र पर पहुंच गया है और गुणवत्ता जांच हो चुकी है। ग्रेड ए मिला है। अभी तौल चल रही है, लगभग दस मिनट लगेंगे। आपको एक लाख पांच हजार आठ सौ बयासी रुपये आपके पी एन बी खाते में मिलेंगे।"
  },
  pa: {
    loginTitle: "ਕਿਸਾਨ ਸੇਤੂ ਵਿੱਚ ਤੁਹਾਡਾ ਸੁਆਗਤ ਹੈ। ਬਿਨਾਂ ਕਤਾਰ ਵਿੱਚ ਖੜ੍ਹੇ ਆਪਣੀ ਫ਼ਸਲ ਵੇਚੋ। ਸ਼ੁਰੂ ਕਰਨ ਲਈ ਆਪਣਾ ਮੋਬਾਈਲ ਨੰਬਰ ਅਤੇ ਆਧਾਰ ਨੰਬਰ ਭਰੋ।",
    tokenSpeak: "ਅੱਜ ਤੁਹਾਡਾ ਟੋਕਨ ਨੰਬਰ ਏ ਜ਼ੀਰੋ ਚਾਰ ਦੋ ਹੈ, ਕਰਨਾਲ ਮੰਡੀ, ਗੇਟ ਦੋ। ਤੁਹਾਡਾ ਸਮਾਂ ਸਵੇਰੇ ਗਿਆਰਾਂ ਤੋਂ ਗਿਆਰਾਂ ਪੰਤਾਲੀ ਤੱਕ ਹੈ। ਲਗਭਗ ਪੈਂਤੀ ਮਿੰਟ ਦੀ ਉਡੀਕ ਹੈ।",
    trackSpeak: "ਤੁਹਾਡੀ ਕਣਕ ਕੇਂਦਰ 'ਤੇ ਪਹੁੰਚ ਗਈ ਹੈ ਅਤੇ ਗੁਣਵੱਤਾ ਜਾਂਚ ਹੋ ਚੁੱਕੀ ਹੈ। ਗਰੇਡ ਏ ਮਿਲਿਆ ਹੈ। ਹੁਣ ਤੋਲ ਚੱਲ ਰਹੀ ਹੈ। ਤੁਹਾਨੂੰ ਇੱਕ ਲੱਖ ਪੰਜ ਹਜ਼ਾਰ ਅੱਠ ਸੌ ਬਿਆਸੀ ਰੁਪਏ ਮਿਲਣਗੇ।"
  }
};

const i18n = {
  en: {},
  hi: {
    loginTitle: "बिना कतार अपनी फसल बेचें",
    loginSub: "खरीद केंद्र पर अपना समय बुक करें। हम आपको बता देंगे कि कब आना है।",
    listen: "सुनें", listenToken: "मेरा टोकन सुनें", listenStatus: "मेरी स्थिति सुनें",
    mobile: "मोबाइल नंबर", aadhaar: "आधार नंबर", sendOtp: "OTP भेजें",
    loginHint: "हम आपके आधार के केवल अंतिम 4 अंक ही रखते हैं।",
    back: "वापस", otpTitle: "4 अंकों का कोड भरें", otpSub: "SMS भेजा गया",
    verify: "आगे बढ़ें",
    yourToken: "आज का आपका टोकन", slot: "समय",
    waitNow: "आपसे आगे 6 किसान हैं",
    rainTitle: "गुरुवार को बारिश की संभावना",
    rainBody: "27 अगस्त के स्लॉट 28 अगस्त कर दिए गए। आपकी बुकिंग नहीं बदली।",
    quickActions: "आप क्या करना चाहते हैं?",
    bookSlot: "समय बुक करें", bookSlotSub: "फसल, मात्रा, केंद्र",
    cropTitle: "आप कौन सी फसलें बेच रहे हैं?",
    cropSub: "जो भी फसल ला रहे हैं, सब चुनें। एक से ज़्यादा चुन सकते हैं। दर इस सीज़न का एक क्विंटल का MSP है।",
    qtyTitle: "हर फसल कितनी ला रहे हैं?", qtySub: "एक क्विंटल यानी 100 किलो।",
    quintal: "क्विंटल", estimate: "आपको लगभग मिलेंगे",
    chooseCentreCta: "केंद्र चुनें",
    showToken: "मेरा टोकन दिखाएं", showTokenSub: "गेट के लिए QR",
    trackLot: "मेरी फसल देखें", trackLotSub: "जांच से भुगतान तक",
    payment: "मेरा भुगतान", paymentSub: "MSP और बैंक",
    nearYou: "आपके पास के केंद्र", chooseCentre: "केंद्र चुनें",
    chooseCentreSub: "नज़दीकी पहले। प्रतीक्षा समय लाइव है।",
    pickSlot: "दिन और समय चुनें", confirmBooking: "बुकिंग पक्की करें",
    tokenTitle: "आपका गेट पास", tokenSub: "केंद्र के गेट पर दिखाएं। WhatsApp पर भी भेजा है।",
    tokenNo: "टोकन नंबर", centre: "केंद्र", date: "तारीख", crop: "फसल", status: "स्थिति",
    confirmed: "पक्की", cancelBooking: "बुकिंग रद्द करें", bookAgain: "नया समय बुक करें",
    noTokenTitle: "अभी कोई बुकिंग नहीं",
    noTokenSub: "अगली बार के लिए केंद्र और समय चुनने के लिए यहां दबाएं।",
    cancelHint: "सुबह 9 बजे से पहले रद्द करें, स्लॉट अगले किसान को मिल जाएगा।",
    trackTitle: "लॉट #KRL-2291", trackSub: "गेहूं · 42 क्विंटल · करनाल मंडी",
    stArrived: "केंद्र पहुंच गए", stGraded: "गुणवत्ता जांच हुई",
    gradeNote: "ग्रेड A · नमी 11.2% · FAQ सीमा के भीतर",
    stWeighing: "तौल चल रही है", stWeighingTs: "11:38 AM शुरू · लगभग 10 मिनट बाकी",
    stAccepted: "स्वीकृत, रसीद मिली", stPaid: "बैंक में पैसा भेजा", pending: "अभी नहीं",
    expectedPayment: "आपको मिलेंगे", bank: "बैंक", awaitingWeighing: "तौल के बाद",
    tabHome: "होम", tabBook: "बुक", tabToken: "टोकन", tabTrack: "देखें", tabAlerts: "संदेश",
    mapView: "केंद्रों का नक्शा", mapViewSub: "नक्शे पर देखें",
    cancelTile: "बुकिंग रद्द करें", cancelTileSub: "दूसरों के लिए खाली करें",
    seeOnMap: "नक्शे पर देखें", mapTitle: "आपके पास के केंद्र",
    mapSub: "नीला बिंदु आप हैं। बुक करने के लिए पिन दबाएं।",
    lgFree: "कम इंतज़ार", lgBusy: "व्यस्त", lgFull: "बहुत भीड़",
    openGmaps: "Google Maps में रास्ता खोलें",
    seeQueue: "लाइव कतार देखें", queueTitle: "लाइव कतार",
    queueSub: "करनाल मंडी, गेट 2 · हर मिनट अपडेट",
    yourPosition: "आपका नंबर", ofInQueue: "कतार में 13 किसानों में से",
    reachCounter: "आप लगभग 11:38 AM पर काउंटर तक पहुंचेंगे",
    nowServing: "अभी काउंटर पर", avgPerFarmer: "प्रति किसान औसत",
    aheadOfYou: "आपसे आगे",
    queueHint: "प्रतीक्षा समय इस केंद्र पर पिछले 10 किसानों के असली समय से निकाला जाता है।",
    seePayment: "मेरा भुगतान विवरण देखें",
    payTitle: "मेरा भुगतान", paySub: "लॉट #KRL-2291 · गेहूं · करनाल मंडी",
    youWillGet: "आपको मिलेंगे", afterWeighing: "तौल पक्की होने के बाद अंतिम राशि",
    howCalculated: "यह ऐसे बना है", mspRate: "MSP दर 2026–27", qtyWeighed: "तौली गई मात्रा",
    grossAmt: "कुल राशि", deductions: "कटौती", netPayable: "शुद्ध देय",
    paymentProgress: "भुगतान की प्रगति", payLotAccepted: "केंद्र पर लॉट स्वीकृत",
    payReceipt: "ई-रसीद बनी", paySentBank: "DBT से बैंक भेजा",
    wxTitle: "मौसम और स्लॉट बदलाव", wxSub: "करनाल जिला · IMD पूर्वानुमान से",
    wxHeroT: "गुरुवार 27 अगस्त को तेज़ बारिश",
    wxHeroD: "24 मिमी की संभावना। अनाज भीग सकता है और ग्रेडिंग में मना हो सकता है, इसलिए उस दिन के स्लॉट अपने आप बदल दिए गए।",
    wxMovedT: "148 बुकिंग बदली गईं",
    wxMovedD: "हर किसान को नई तारीख का WhatsApp संदेश गया। किसी का नंबर नहीं गया।",
    wxYoursT: "आपकी बुकिंग सुरक्षित है",
    wxYoursD: "आप 25 अगस्त के लिए बुक हैं, बारिश से पहले। आपके लिए कुछ नहीं बदला।",
    alertsTitle: "आपके संदेश", alertsSub: "नीचे सब कुछ आपको WhatsApp पर भी भेजा गया।",
    chWhatsapp: "WhatsApp", chSms: "SMS बैकअप", chVoice: "वॉइस कॉल", today: "आज",
    msg1: "नमस्ते रमेश जी। करनाल मंडी में आपका स्लॉट 25 अगस्त, 11:00 AM के लिए पक्का है। आपका टोकन A-042 है। गेट 2 पर QR दिखाएं।",
    msg2: "याद दिलाना: आपका स्लॉट 2 घंटे में है। कृपया 10:50 AM तक गेट 2 पहुंचें। अभी लगभग 35 मिनट इंतज़ार है।",
    msg3: "आपके लॉट #KRL-2291 की ग्रेडिंग हो गई। नतीजा: ग्रेड A, नमी 11.2%। अब तौल होगी।",
    msg4: "मौसम चेतावनी: 27 अगस्त को तेज़ बारिश। उस दिन के स्लॉट 28 अगस्त कर दिए गए। आपकी 25 अगस्त की बुकिंग वही है।",
    cancelTitle: "यह बुकिंग रद्द करें?", cancelSub: "टोकन A-042 · 25 अगस्त, 11:00 AM · करनाल मंडी",
    pol1: "सुबह 9:00 बजे से पहले रद्द करें तो कोई जुर्माना नहीं। आपका स्लॉट अगले किसान को मिल जाएगा।",
    pol2: "बिना रद्द किए न आएं तो यह no-show माना जाएगा। एक सीज़न में तीन no-show पर 7 दिन बुकिंग बंद।",
    pol3: "देर हो रही है? रद्द करने के बजाय बताएं, हम आपकी जगह 30 मिनट रोक लेंगे।",
    wlT: "4 किसान प्रतीक्षा सूची में हैं",
    wlD: "आप रद्द करते हैं तो आपका 11:00 AM स्लॉट एक मिनट में कमला यादव को WhatsApp पर दे दिया जाएगा।",
    confirmCancel: "हां, मेरी बुकिंग रद्द करें", runningLate: "मुझे देर हो रही है, जगह रोकें",
    setTitle: "भाषा", setSub: "पूरा ऐप और सभी WhatsApp संदेश इसी भाषा में आएंगे।",
    setMore: "मराठी, तेलुगु, तमिल, बंगाली, गुजराती, कन्नड़ और ओड़िया भी इसी तरह जोड़ी जाती हैं।",
    logout: "लॉग आउट"
  },
  pa: {
    loginTitle: "ਬਿਨਾਂ ਕਤਾਰ ਆਪਣੀ ਫ਼ਸਲ ਵੇਚੋ",
    loginSub: "ਖਰੀਦ ਕੇਂਦਰ 'ਤੇ ਆਪਣਾ ਸਮਾਂ ਬੁੱਕ ਕਰੋ। ਅਸੀਂ ਦੱਸਾਂਗੇ ਕਿ ਕਦੋਂ ਆਉਣਾ ਹੈ।",
    listen: "ਸੁਣੋ", listenToken: "ਮੇਰਾ ਟੋਕਨ ਸੁਣੋ", listenStatus: "ਮੇਰੀ ਸਥਿਤੀ ਸੁਣੋ",
    mobile: "ਮੋਬਾਈਲ ਨੰਬਰ", aadhaar: "ਆਧਾਰ ਨੰਬਰ", sendOtp: "OTP ਭੇਜੋ",
    loginHint: "ਅਸੀਂ ਆਧਾਰ ਦੇ ਸਿਰਫ਼ ਆਖ਼ਰੀ 4 ਅੰਕ ਰੱਖਦੇ ਹਾਂ।",
    back: "ਵਾਪਸ", otpTitle: "4 ਅੰਕਾਂ ਦਾ ਕੋਡ ਭਰੋ", otpSub: "SMS ਭੇਜਿਆ ਗਿਆ",
    verify: "ਅੱਗੇ ਵਧੋ",
    yourToken: "ਅੱਜ ਦਾ ਤੁਹਾਡਾ ਟੋਕਨ", slot: "ਸਮਾਂ",
    waitNow: "ਤੁਹਾਡੇ ਅੱਗੇ 6 ਕਿਸਾਨ ਹਨ",
    rainTitle: "ਵੀਰਵਾਰ ਮੀਂਹ ਦੀ ਸੰਭਾਵਨਾ",
    rainBody: "27 ਅਗਸਤ ਦੇ ਸਲਾਟ 28 ਅਗਸਤ ਕਰ ਦਿੱਤੇ। ਤੁਹਾਡੀ ਬੁਕਿੰਗ ਨਹੀਂ ਬਦਲੀ।",
    quickActions: "ਤੁਸੀਂ ਕੀ ਕਰਨਾ ਚਾਹੁੰਦੇ ਹੋ?",
    bookSlot: "ਸਮਾਂ ਬੁੱਕ ਕਰੋ", bookSlotSub: "ਫ਼ਸਲ, ਮਾਤਰਾ, ਕੇਂਦਰ",
    cropTitle: "ਤੁਸੀਂ ਕਿਹੜੀਆਂ ਫ਼ਸਲਾਂ ਵੇਚ ਰਹੇ ਹੋ?",
    cropSub: "ਜੋ ਵੀ ਫ਼ਸਲ ਲਿਆ ਰਹੇ ਹੋ, ਸਭ ਚੁਣੋ। ਇੱਕ ਤੋਂ ਵੱਧ ਵੀ ਚੁਣ ਸਕਦੇ ਹੋ। ਦਰ ਇਸ ਸੀਜ਼ਨ ਦਾ ਇੱਕ ਕੁਇੰਟਲ ਦਾ MSP ਹੈ।",
    qtyTitle: "ਹਰ ਫ਼ਸਲ ਕਿੰਨੀ ਲਿਆ ਰਹੇ ਹੋ?", qtySub: "ਇੱਕ ਕੁਇੰਟਲ ਯਾਨੀ 100 ਕਿਲੋ।",
    quintal: "ਕੁਇੰਟਲ", estimate: "ਤੁਹਾਨੂੰ ਲਗਭਗ ਮਿਲਣਗੇ",
    chooseCentreCta: "ਕੇਂਦਰ ਚੁਣੋ",
    showToken: "ਮੇਰਾ ਟੋਕਨ ਵੇਖੋ", showTokenSub: "ਗੇਟ ਲਈ QR",
    trackLot: "ਮੇਰੀ ਫ਼ਸਲ ਵੇਖੋ", trackLotSub: "ਜਾਂਚ ਤੋਂ ਭੁਗਤਾਨ ਤੱਕ",
    payment: "ਮੇਰਾ ਭੁਗਤਾਨ", paymentSub: "MSP ਅਤੇ ਬੈਂਕ",
    nearYou: "ਤੁਹਾਡੇ ਨੇੜੇ ਕੇਂਦਰ", chooseCentre: "ਕੇਂਦਰ ਚੁਣੋ",
    chooseCentreSub: "ਨੇੜਲਾ ਪਹਿਲਾਂ। ਉਡੀਕ ਸਮਾਂ ਲਾਈਵ ਹੈ।",
    pickSlot: "ਦਿਨ ਅਤੇ ਸਮਾਂ ਚੁਣੋ", confirmBooking: "ਬੁਕਿੰਗ ਪੱਕੀ ਕਰੋ",
    tokenTitle: "ਤੁਹਾਡਾ ਗੇਟ ਪਾਸ", tokenSub: "ਕੇਂਦਰ ਦੇ ਗੇਟ 'ਤੇ ਵਿਖਾਓ।",
    tokenNo: "ਟੋਕਨ ਨੰਬਰ", centre: "ਕੇਂਦਰ", date: "ਤਾਰੀਖ਼", crop: "ਫ਼ਸਲ", status: "ਸਥਿਤੀ",
    confirmed: "ਪੱਕੀ", cancelBooking: "ਬੁਕਿੰਗ ਰੱਦ ਕਰੋ", bookAgain: "ਨਵਾਂ ਸਮਾਂ ਬੁੱਕ ਕਰੋ",
    noTokenTitle: "ਹੁਣ ਕੋਈ ਬੁਕਿੰਗ ਨਹੀਂ",
    noTokenSub: "ਅਗਲੀ ਵਾਰ ਲਈ ਕੇਂਦਰ ਅਤੇ ਸਮਾਂ ਚੁਣਨ ਲਈ ਇੱਥੇ ਦਬਾਓ।",
    cancelHint: "ਸਵੇਰੇ 9 ਵਜੇ ਤੋਂ ਪਹਿਲਾਂ ਰੱਦ ਕਰੋ, ਸਲਾਟ ਅਗਲੇ ਕਿਸਾਨ ਨੂੰ ਮਿਲੇਗਾ।",
    trackTitle: "ਲਾਟ #KRL-2291", trackSub: "ਕਣਕ · 42 ਕੁਇੰਟਲ · ਕਰਨਾਲ ਮੰਡੀ",
    stArrived: "ਕੇਂਦਰ ਪਹੁੰਚ ਗਏ", stGraded: "ਗੁਣਵੱਤਾ ਜਾਂਚ ਹੋਈ",
    gradeNote: "ਗਰੇਡ A · ਨਮੀ 11.2% · FAQ ਸੀਮਾ ਅੰਦਰ",
    stWeighing: "ਤੋਲ ਚੱਲ ਰਹੀ ਹੈ", stWeighingTs: "11:38 AM ਸ਼ੁਰੂ · ਲਗਭਗ 10 ਮਿੰਟ ਬਾਕੀ",
    stAccepted: "ਮਨਜ਼ੂਰ, ਰਸੀਦ ਮਿਲੀ", stPaid: "ਬੈਂਕ ਵਿੱਚ ਪੈਸਾ ਭੇਜਿਆ", pending: "ਹਾਲੇ ਨਹੀਂ",
    expectedPayment: "ਤੁਹਾਨੂੰ ਮਿਲਣਗੇ", bank: "ਬੈਂਕ", awaitingWeighing: "ਤੋਲ ਤੋਂ ਬਾਅਦ",
    tabHome: "ਘਰ", tabBook: "ਬੁੱਕ", tabToken: "ਟੋਕਨ", tabTrack: "ਵੇਖੋ", tabAlerts: "ਸੁਨੇਹੇ",
    mapView: "ਕੇਂਦਰਾਂ ਦਾ ਨਕਸ਼ਾ", mapViewSub: "ਨਕਸ਼ੇ 'ਤੇ ਵੇਖੋ",
    cancelTile: "ਬੁਕਿੰਗ ਰੱਦ ਕਰੋ", cancelTileSub: "ਹੋਰਾਂ ਲਈ ਖਾਲੀ ਕਰੋ",
    seeOnMap: "ਨਕਸ਼ੇ 'ਤੇ ਵੇਖੋ", mapTitle: "ਤੁਹਾਡੇ ਨੇੜੇ ਕੇਂਦਰ",
    mapSub: "ਨੀਲਾ ਬਿੰਦੂ ਤੁਸੀਂ ਹੋ। ਬੁੱਕ ਕਰਨ ਲਈ ਪਿੰਨ ਦਬਾਓ।",
    lgFree: "ਘੱਟ ਉਡੀਕ", lgBusy: "ਰੁੱਝਿਆ", lgFull: "ਬਹੁਤ ਭੀੜ",
    openGmaps: "Google Maps ਵਿੱਚ ਰਸਤਾ ਖੋਲ੍ਹੋ",
    seeQueue: "ਲਾਈਵ ਕਤਾਰ ਵੇਖੋ", queueTitle: "ਲਾਈਵ ਕਤਾਰ",
    queueSub: "ਕਰਨਾਲ ਮੰਡੀ, ਗੇਟ 2 · ਹਰ ਮਿੰਟ ਅਪਡੇਟ",
    yourPosition: "ਤੁਹਾਡਾ ਨੰਬਰ", ofInQueue: "ਕਤਾਰ ਵਿੱਚ 13 ਕਿਸਾਨਾਂ ਵਿੱਚੋਂ",
    reachCounter: "ਤੁਸੀਂ ਲਗਭਗ 11:38 AM 'ਤੇ ਕਾਊਂਟਰ ਪਹੁੰਚੋਗੇ",
    nowServing: "ਹੁਣ ਕਾਊਂਟਰ 'ਤੇ", avgPerFarmer: "ਪ੍ਰਤੀ ਕਿਸਾਨ ਔਸਤ",
    aheadOfYou: "ਤੁਹਾਡੇ ਅੱਗੇ",
    queueHint: "ਉਡੀਕ ਸਮਾਂ ਇਸ ਕੇਂਦਰ 'ਤੇ ਪਿਛਲੇ 10 ਕਿਸਾਨਾਂ ਦੇ ਅਸਲ ਸਮੇਂ ਤੋਂ ਕੱਢਿਆ ਜਾਂਦਾ ਹੈ।",
    seePayment: "ਮੇਰਾ ਭੁਗਤਾਨ ਵੇਰਵਾ ਵੇਖੋ",
    payTitle: "ਮੇਰਾ ਭੁਗਤਾਨ", paySub: "ਲਾਟ #KRL-2291 · ਕਣਕ · ਕਰਨਾਲ ਮੰਡੀ",
    youWillGet: "ਤੁਹਾਨੂੰ ਮਿਲਣਗੇ", afterWeighing: "ਤੋਲ ਪੱਕੀ ਹੋਣ ਤੋਂ ਬਾਅਦ ਆਖ਼ਰੀ ਰਕਮ",
    howCalculated: "ਇਹ ਇੰਝ ਬਣਿਆ ਹੈ", mspRate: "MSP ਦਰ 2026–27", qtyWeighed: "ਤੋਲੀ ਮਾਤਰਾ",
    grossAmt: "ਕੁੱਲ ਰਕਮ", deductions: "ਕਟੌਤੀ", netPayable: "ਸ਼ੁੱਧ ਦੇਣਯੋਗ",
    paymentProgress: "ਭੁਗਤਾਨ ਦੀ ਪ੍ਰਗਤੀ", payLotAccepted: "ਕੇਂਦਰ 'ਤੇ ਲਾਟ ਮਨਜ਼ੂਰ",
    payReceipt: "ਈ-ਰਸੀਦ ਬਣੀ", paySentBank: "DBT ਰਾਹੀਂ ਬੈਂਕ ਭੇਜਿਆ",
    wxTitle: "ਮੌਸਮ ਅਤੇ ਸਲਾਟ ਬਦਲਾਅ", wxSub: "ਕਰਨਾਲ ਜ਼ਿਲ੍ਹਾ · IMD ਪੂਰਵ-ਅਨੁਮਾਨ ਤੋਂ",
    wxHeroT: "ਵੀਰਵਾਰ 27 ਅਗਸਤ ਨੂੰ ਤੇਜ਼ ਮੀਂਹ",
    wxHeroD: "24 ਮਿਲੀਮੀਟਰ ਦੀ ਸੰਭਾਵਨਾ। ਅਨਾਜ ਭਿੱਜ ਸਕਦਾ ਹੈ, ਇਸ ਲਈ ਉਸ ਦਿਨ ਦੇ ਸਲਾਟ ਆਪਣੇ ਆਪ ਬਦਲ ਦਿੱਤੇ ਗਏ।",
    wxMovedT: "148 ਬੁਕਿੰਗਾਂ ਬਦਲੀਆਂ ਗਈਆਂ",
    wxMovedD: "ਹਰ ਕਿਸਾਨ ਨੂੰ ਨਵੀਂ ਤਾਰੀਖ਼ ਦਾ WhatsApp ਸੁਨੇਹਾ ਗਿਆ। ਕਿਸੇ ਦਾ ਨੰਬਰ ਨਹੀਂ ਗਿਆ।",
    wxYoursT: "ਤੁਹਾਡੀ ਬੁਕਿੰਗ ਸੁਰੱਖਿਅਤ ਹੈ",
    wxYoursD: "ਤੁਸੀਂ 25 ਅਗਸਤ ਲਈ ਬੁੱਕ ਹੋ, ਮੀਂਹ ਤੋਂ ਪਹਿਲਾਂ। ਤੁਹਾਡੇ ਲਈ ਕੁਝ ਨਹੀਂ ਬਦਲਿਆ।",
    alertsTitle: "ਤੁਹਾਡੇ ਸੁਨੇਹੇ", alertsSub: "ਹੇਠਾਂ ਸਭ ਕੁਝ ਤੁਹਾਨੂੰ WhatsApp 'ਤੇ ਵੀ ਭੇਜਿਆ ਗਿਆ।",
    chWhatsapp: "WhatsApp", chSms: "SMS ਬੈਕਅੱਪ", chVoice: "ਵੌਇਸ ਕਾਲ", today: "ਅੱਜ",
    msg1: "ਸਤਿ ਸ੍ਰੀ ਅਕਾਲ ਰਮੇਸ਼ ਜੀ। ਕਰਨਾਲ ਮੰਡੀ ਵਿੱਚ ਤੁਹਾਡਾ ਸਲਾਟ 25 ਅਗਸਤ, 11:00 AM ਲਈ ਪੱਕਾ ਹੈ। ਟੋਕਨ A-042। ਗੇਟ 2 'ਤੇ QR ਵਿਖਾਓ।",
    msg2: "ਯਾਦ ਦਿਵਾਉਣਾ: ਤੁਹਾਡਾ ਸਲਾਟ 2 ਘੰਟਿਆਂ ਵਿੱਚ ਹੈ। 10:50 AM ਤੱਕ ਗੇਟ 2 ਪਹੁੰਚੋ। ਹੁਣ ਲਗਭਗ 35 ਮਿੰਟ ਉਡੀਕ ਹੈ।",
    msg3: "ਤੁਹਾਡੇ ਲਾਟ #KRL-2291 ਦੀ ਗਰੇਡਿੰਗ ਹੋ ਗਈ। ਨਤੀਜਾ: ਗਰੇਡ A, ਨਮੀ 11.2%। ਹੁਣ ਤੋਲ ਹੋਵੇਗੀ।",
    msg4: "ਮੌਸਮ ਚੇਤਾਵਨੀ: 27 ਅਗਸਤ ਨੂੰ ਤੇਜ਼ ਮੀਂਹ। ਉਸ ਦਿਨ ਦੇ ਸਲਾਟ 28 ਅਗਸਤ ਕਰ ਦਿੱਤੇ। ਤੁਹਾਡੀ 25 ਅਗਸਤ ਦੀ ਬੁਕਿੰਗ ਉਹੀ ਹੈ।",
    cancelTitle: "ਇਹ ਬੁਕਿੰਗ ਰੱਦ ਕਰਨੀ ਹੈ?", cancelSub: "ਟੋਕਨ A-042 · 25 ਅਗਸਤ, 11:00 AM · ਕਰਨਾਲ ਮੰਡੀ",
    pol1: "ਸਵੇਰੇ 9:00 ਵਜੇ ਤੋਂ ਪਹਿਲਾਂ ਰੱਦ ਕਰੋ ਤਾਂ ਕੋਈ ਜੁਰਮਾਨਾ ਨਹੀਂ। ਸਲਾਟ ਅਗਲੇ ਕਿਸਾਨ ਨੂੰ ਮਿਲੇਗਾ।",
    pol2: "ਬਿਨਾਂ ਰੱਦ ਕੀਤੇ ਨਾ ਆਓ ਤਾਂ no-show ਮੰਨਿਆ ਜਾਵੇਗਾ। ਸੀਜ਼ਨ ਵਿੱਚ ਤਿੰਨ no-show 'ਤੇ 7 ਦਿਨ ਬੁਕਿੰਗ ਬੰਦ।",
    pol3: "ਦੇਰ ਹੋ ਰਹੀ ਹੈ? ਰੱਦ ਕਰਨ ਦੀ ਬਜਾਏ ਦੱਸੋ, ਅਸੀਂ ਤੁਹਾਡੀ ਥਾਂ 30 ਮਿੰਟ ਰੋਕਾਂਗੇ।",
    wlT: "4 ਕਿਸਾਨ ਉਡੀਕ ਸੂਚੀ ਵਿੱਚ ਹਨ",
    wlD: "ਤੁਸੀਂ ਰੱਦ ਕਰੋ ਤਾਂ ਤੁਹਾਡਾ 11:00 AM ਸਲਾਟ ਇੱਕ ਮਿੰਟ ਵਿੱਚ ਕਮਲਾ ਯਾਦਵ ਨੂੰ WhatsApp 'ਤੇ ਦੇ ਦਿੱਤਾ ਜਾਵੇਗਾ।",
    confirmCancel: "ਹਾਂ, ਮੇਰੀ ਬੁਕਿੰਗ ਰੱਦ ਕਰੋ", runningLate: "ਮੈਨੂੰ ਦੇਰ ਹੋ ਰਹੀ ਹੈ, ਥਾਂ ਰੋਕੋ",
    setTitle: "ਭਾਸ਼ਾ", setSub: "ਪੂਰਾ ਐਪ ਅਤੇ ਸਾਰੇ WhatsApp ਸੁਨੇਹੇ ਇਸੇ ਭਾਸ਼ਾ ਵਿੱਚ ਆਉਣਗੇ।",
    setMore: "ਮਰਾਠੀ, ਤੇਲਗੂ, ਤਾਮਿਲ, ਬੰਗਾਲੀ, ਗੁਜਰਾਤੀ, ਕੰਨੜ ਅਤੇ ਓੜੀਆ ਵੀ ਇਸੇ ਤਰ੍ਹਾਂ ਜੋੜੀਆਂ ਜਾਂਦੀਆਂ ਹਨ।",
    logout: "ਲਾਗ ਆਊਟ"
  }
};

/* ---------- helpers ---------- */
const $ = (s, r = document) => r.querySelector(s);
const $$ = (s, r = document) => Array.from(r.querySelectorAll(s));

let lang = "en";
let selectedCentre = null;

function normalizeCrop(c) {
  return {
    ...c,
    hi: c.nameHi || c.hi,
    pa: c.namePa || c.pa,
    icon: cropIcons[c.id] || cropIcons.wheat
  };
}

function normalizeCentre(c) {
  return { ...c, wait: c.waitMinutes ?? c.wait };
}

function isoDate(d) {
  return d.getFullYear() + "-" + String(d.getMonth() + 1).padStart(2, "0") + "-" + String(d.getDate()).padStart(2, "0");
}

function t(key, fallback) {
  if (i18n[lang] && i18n[lang][key]) return i18n[lang][key];
  try {
    for (const [el, text] of originals) {
      if (el.dataset.i18n === key) return text;
    }
  } catch (err) { /* originals is filled after first paint */ }
  const el = document.querySelector(`[data-i18n="${key}"]`);
  return (el && el.textContent) || fallback || key;
}

function veil(on) {
  const el = $("#phoneVeil");
  if (el) el.hidden = !on;
}

function loadLevel(load) {
  if (load >= 0.85) return "lvl-high";
  if (load >= 0.55) return "lvl-med";
  return "lvl-low";
}

function waitText(min) {
  if (min < 60) return "~" + min + " min wait";
  const h = Math.floor(min / 60), m = min % 60;
  return "~" + h + "h " + (m ? m + "m" : "") + " wait";
}

function centreCard(c, compact) {
  return `<button class="centre" data-centre="${c.id}">
      <div class="row1">
        <span class="nm">${c.name}</span>
        <span class="km">${c.km} km</span>
      </div>
      ${compact ? "" : `<div class="crops">${c.crops}</div>`}
      <div class="load-row ${loadLevel(c.load)}">
        <span class="load-bar"><i style="width:${Math.round(c.load * 100)}%"></i></span>
        <span class="wt">${waitText(c.wait ?? c.waitMinutes)}</span>
      </div>
    </button>`;
}

/* ---------- persona switching ---------- */
$$(".persona-btn").forEach(btn => {
  btn.addEventListener("click", () => {
    $$(".persona-btn").forEach(b => b.classList.remove("active"));
    btn.classList.add("active");
    $$(".view").forEach(v => v.classList.remove("active"));
    $("#view-" + btn.dataset.view).classList.add("active");
    window.scrollTo({ top: 0, behavior: "smooth" });
    if (btn.dataset.view === "staff") loadStaff();
    if (btn.dataset.view === "admin") loadAdmin();
  });
});

/* ---------- phone screen navigation ---------- */
const screenTab = {
  "scr-home": "home", "scr-settings": "home", "scr-weather": "home", "scr-queue": "home",
  "scr-crop": "book", "scr-qty": "book",
  "scr-centres": "book", "scr-map": "book", "scr-slots": "book",
  "scr-token": "token", "scr-cancel": "token",
  "scr-track": "track", "scr-payment": "track",
  "scr-alerts": "alerts"
};

/* Depth is used only to decide which way a screen slides in. */
const screenDepth = {
  "scr-login": 0, "scr-otp": 1,
  "scr-home": 1, "scr-crop": 1, "scr-token": 1, "scr-track": 1, "scr-alerts": 1,
  "scr-qty": 2, "scr-map": 2, "scr-queue": 2, "scr-payment": 2,
  "scr-weather": 2, "scr-cancel": 2, "scr-settings": 2,
  "scr-centres": 3, "scr-slots": 4
};

let currentScreen = "scr-login";
let historyOk = location.protocol !== "file:";

function goto(screenId, tabName, opts = {}) {
  const target = $("#" + screenId);
  if (!target) return;

  const back = (screenDepth[screenId] ?? 1) < (screenDepth[currentScreen] ?? 1);
  $$(".screen").forEach(s => {
    if (s !== target) s.classList.remove("active", "back");
  });

  // Forcing a reflow between the two class writes restarts the entry
  // animation even when the same screen is opened twice in a row.
  target.classList.remove("active", "back");
  void target.offsetWidth;
  target.classList.add("active");
  target.classList.toggle("back", back);

  $(".phone-body").scrollTop = 0;
  currentScreen = screenId;

  const tab = tabName || screenTab[screenId];
  if (tab) $$(".tab").forEach(t => t.classList.toggle("on", t.dataset.tab === tab));

  // The tab bar is meaningless before login, so hide it there.
  const preLogin = screenId === "scr-login" || screenId === "scr-otp";
  $("#tabbar").style.display = preLogin ? "none" : "flex";

  // Keeping the URL in step means any screen can be shared or bookmarked,
  // and the browser's own back button walks the app properly. Browsers block
  // this when the file is opened straight from disk, so it stays optional.
  if (!opts.silent && historyOk) {
    try {
      const url = new URL(location.href);
      url.searchParams.set("screen", screenId.replace("scr-", ""));
      history.pushState({ screen: screenId, tab }, "", url);
    } catch (err) {
      historyOk = false;
    }
  }

  if (!opts.skipLoad) loadScreen(screenId);
}

window.addEventListener("popstate", e => {
  const id = (e.state && e.state.screen) || "scr-login";
  goto(id, e.state && e.state.tab, { silent: true });
});

document.addEventListener("click", e => {
  const el = e.target.closest("[data-goto]");
  if (!el) return;
  goto(el.dataset.goto, el.dataset.tab);
});

/* ---------- small feedback helpers ---------- */
let toastTimer = null;
function toast(message, good) {
  const el = $("#toast");
  el.className = "toast show" + (good ? " good" : "");
  el.querySelector("span").textContent = message;
  clearTimeout(toastTimer);
  toastTimer = setTimeout(() => el.classList.remove("show"), 2600);
}

function busy(btn, ms, done) {
  const label = btn.innerHTML;
  btn.classList.add("busy");
  btn.innerHTML = '<span class="spin"></span>';
  setTimeout(() => {
    btn.innerHTML = label;
    btn.classList.remove("busy");
    done();
  }, ms);
}

async function withBusy(btn, work) {
  const label = btn.innerHTML;
  btn.classList.add("busy");
  btn.innerHTML = '<span class="spin"></span>';
  try {
    await work();
  } finally {
    btn.innerHTML = label;
    btn.classList.remove("busy");
  }
}

function flash(el) {
  el.classList.remove("flash");
  void el.offsetWidth;
  el.classList.add("flash");
}

/* ---------- login and OTP (feature 01) ----------
   Digits only, 10-digit mobile, 12-digit Aadhaar, and all 4 OTP boxes
   must be filled before either button unlocks. */
const authMsg = {
  en: {
    errMobile: "Enter all 10 digits of your mobile number.",
    errMobileStart: "An Indian mobile number starts with 6, 7, 8 or 9.",
    errAadhaar: "Enter all 12 digits of your Aadhaar number.",
    errOtp: "Enter the 4-digit code we sent by SMS.",
    resendIn: "Did not get it? Resend in",
    resendNow: "Resend code",
    resent: "New code sent by SMS.",
    qtlShort: "qtl",
    quintalWord: "quintal",
    cropsWord: "crops",
    perQuintal: "per quintal",
    change: "Change",
    pickCrop: "Tap at least one crop",
    continueOne: "Continue with 1 crop",
    continueMany: "Continue with {n} crops",
    noCropYet: "No crop chosen yet. Tap here to pick one.",
    otpSent: "Code sent by SMS.",
    welcome: "Welcome back, Ramesh.",
    pickSlot: "Tap a time first, then confirm.",
    booked: "Slot booked. Token A-042 is ready.",
    cancelled: "Booking cancelled. Slot offered to the waitlist.",
    held: "Your place is held for 30 minutes.",
    noVoice: "This browser cannot read text aloud."
  },
  hi: {
    errMobile: "मोबाइल नंबर के पूरे 10 अंक भरें।",
    errMobileStart: "मोबाइल नंबर 6, 7, 8 या 9 से शुरू होता है।",
    errAadhaar: "आधार नंबर के पूरे 12 अंक भरें।",
    errOtp: "SMS में आया 4 अंकों का कोड भरें।",
    resendIn: "कोड नहीं मिला? दोबारा भेजें",
    resendNow: "कोड दोबारा भेजें",
    resent: "नया कोड SMS से भेज दिया गया।",
    qtlShort: "क्विंटल",
    quintalWord: "क्विंटल",
    cropsWord: "फसलें",
    perQuintal: "प्रति क्विंटल",
    change: "बदलें",
    pickCrop: "कम से कम एक फसल चुनें",
    continueOne: "1 फसल के साथ आगे बढ़ें",
    continueMany: "{n} फसलों के साथ आगे बढ़ें",
    noCropYet: "अभी कोई फसल नहीं चुनी। चुनने के लिए यहां दबाएं।",
    otpSent: "कोड SMS से भेज दिया गया।",
    welcome: "नमस्ते रमेश जी।",
    pickSlot: "पहले समय चुनें, फिर पक्का करें।",
    booked: "समय बुक हो गया। टोकन A-042 तैयार है।",
    cancelled: "बुकिंग रद्द हुई। समय अगले किसान को दे दिया गया।",
    held: "आपकी जगह 30 मिनट तक रोकी गई है।",
    noVoice: "यह ब्राउज़र आवाज़ में नहीं पढ़ सकता।"
  },
  pa: {
    errMobile: "ਮੋਬਾਈਲ ਨੰਬਰ ਦੇ ਪੂਰੇ 10 ਅੰਕ ਭਰੋ।",
    errMobileStart: "ਮੋਬਾਈਲ ਨੰਬਰ 6, 7, 8 ਜਾਂ 9 ਨਾਲ ਸ਼ੁਰੂ ਹੁੰਦਾ ਹੈ।",
    errAadhaar: "ਆਧਾਰ ਨੰਬਰ ਦੇ ਪੂਰੇ 12 ਅੰਕ ਭਰੋ।",
    errOtp: "SMS ਵਿੱਚ ਆਇਆ 4 ਅੰਕਾਂ ਦਾ ਕੋਡ ਭਰੋ।",
    resendIn: "ਕੋਡ ਨਹੀਂ ਮਿਲਿਆ? ਦੁਬਾਰਾ ਭੇਜੋ",
    resendNow: "ਕੋਡ ਦੁਬਾਰਾ ਭੇਜੋ",
    resent: "ਨਵਾਂ ਕੋਡ SMS ਰਾਹੀਂ ਭੇਜ ਦਿੱਤਾ ਗਿਆ।",
    qtlShort: "ਕੁਇੰਟਲ",
    quintalWord: "ਕੁਇੰਟਲ",
    cropsWord: "ਫ਼ਸਲਾਂ",
    perQuintal: "ਪ੍ਰਤੀ ਕੁਇੰਟਲ",
    change: "ਬਦਲੋ",
    pickCrop: "ਘੱਟੋ-ਘੱਟ ਇੱਕ ਫ਼ਸਲ ਚੁਣੋ",
    continueOne: "1 ਫ਼ਸਲ ਨਾਲ ਅੱਗੇ ਵਧੋ",
    continueMany: "{n} ਫ਼ਸਲਾਂ ਨਾਲ ਅੱਗੇ ਵਧੋ",
    noCropYet: "ਹਾਲੇ ਕੋਈ ਫ਼ਸਲ ਨਹੀਂ ਚੁਣੀ। ਚੁਣਨ ਲਈ ਇੱਥੇ ਦਬਾਓ।",
    otpSent: "ਕੋਡ SMS ਰਾਹੀਂ ਭੇਜ ਦਿੱਤਾ ਗਿਆ।",
    welcome: "ਜੀ ਆਇਆਂ ਨੂੰ, ਰਮੇਸ਼ ਜੀ।",
    pickSlot: "ਪਹਿਲਾਂ ਸਮਾਂ ਚੁਣੋ, ਫਿਰ ਪੱਕਾ ਕਰੋ।",
    booked: "ਸਮਾਂ ਬੁੱਕ ਹੋ ਗਿਆ। ਟੋਕਨ A-042 ਤਿਆਰ ਹੈ।",
    cancelled: "ਬੁਕਿੰਗ ਰੱਦ ਹੋਈ। ਸਮਾਂ ਅਗਲੇ ਕਿਸਾਨ ਨੂੰ ਦੇ ਦਿੱਤਾ ਗਿਆ।",
    held: "ਤੁਹਾਡੀ ਥਾਂ 30 ਮਿੰਟ ਲਈ ਰੋਕੀ ਗਈ ਹੈ।",
    noVoice: "ਇਹ ਬ੍ਰਾਊਜ਼ਰ ਆਵਾਜ਼ ਵਿੱਚ ਨਹੀਂ ਪੜ੍ਹ ਸਕਦਾ।"
  }
};
const am = k => (authMsg[lang] || authMsg.en)[k];

const mobileInput = $("#mobileInput");
const mobileWrap = $("#mobileWrap");
const aadhaarInput = $("#aadhaarInput");
const sendOtpBtn = $("#sendOtpBtn");
const otpBoxes = $$("#otpRow .otp-box");
const verifyBtn = $("#verifyBtn");

const digitsOf = v => v.replace(/\D/g, "");
const lock = (btn, off) => {
  btn.classList.toggle("off", off);
  btn.setAttribute("aria-disabled", String(off));
};
const shake = el => {
  el.classList.add("shake");
  setTimeout(() => el.classList.remove("shake"), 320);
};
const mobileDigits = () => digitsOf(mobileInput.value);
const aadhaarDigits = () => digitsOf(aadhaarInput.value);
const mobileOk = () => /^[6-9]\d{9}$/.test(mobileDigits());
const aadhaarOk = () => aadhaarDigits().length === 12;
const otpValue = () => otpBoxes.map(b => b.value).join("");

function setCount(el, n, max) {
  el.textContent = n + "/" + max;
  el.classList.toggle("done", n === max);
}

/* Blocks anything that is not a digit, even from a paste or a phone keypad. */
function digitField(input, max, format) {
  const clean = () => {
    const start = input.selectionStart === input.value.length;
    let d = digitsOf(input.value).slice(0, max);
    input.value = format ? format(d) : d;
    if (start) input.setSelectionRange(input.value.length, input.value.length);
  };
  input.addEventListener("input", clean);
  input.addEventListener("keypress", e => {
    if (e.key.length === 1 && !/\d/.test(e.key)) e.preventDefault();
  });
  input.addEventListener("paste", () => setTimeout(clean));
}

digitField(mobileInput, 10);
digitField(aadhaarInput, 12, d => d.replace(/(\d{4})(?=\d)/g, "$1 "));

function refreshLogin() {
  const m = mobileDigits(), a = aadhaarDigits();
  setCount($("#mobileCount"), m.length, 10);
  setCount($("#aadhaarCount"), a.length, 12);

  mobileWrap.classList.toggle("valid", mobileOk());
  aadhaarInput.classList.toggle("valid", aadhaarOk());
  if (mobileOk()) { mobileWrap.classList.remove("invalid"); $("#mobileErr").textContent = ""; }
  if (aadhaarOk()) { aadhaarInput.classList.remove("invalid"); $("#aadhaarErr").textContent = ""; }

  lock(sendOtpBtn, !(mobileOk() && aadhaarOk()));
}

function showLoginErrors() {
  const m = mobileDigits();
  if (!mobileOk()) {
    $("#mobileErr").textContent = m.length === 10 ? am("errMobileStart") : am("errMobile");
    mobileWrap.classList.add("invalid");
  }
  if (!aadhaarOk()) {
    $("#aadhaarErr").textContent = am("errAadhaar");
    aadhaarInput.classList.add("invalid");
  }
}

function focusFirstProblem() {
  const target = !mobileOk() ? mobileWrap : aadhaarInput;
  shake(target);
  (mobileOk() ? aadhaarInput : mobileInput).focus();
}

[mobileInput, aadhaarInput].forEach(i => {
  i.addEventListener("input", refreshLogin);
  i.addEventListener("blur", () => { if (digitsOf(i.value)) showLoginErrors(); });
});
mobileInput.addEventListener("keydown", e => { if (e.key === "Enter") aadhaarInput.focus(); });
aadhaarInput.addEventListener("keydown", e => { if (e.key === "Enter") sendOtpBtn.click(); });

let resendTimer = null;
function startResendCountdown(seconds) {
  clearInterval(resendTimer);
  let left = seconds;
  const hint = $("#resendHint"), out = $("#resendTimer");
  const paint = () => {
    const mm = String(Math.floor(left / 60)).padStart(2, "0");
    const ss = String(left % 60).padStart(2, "0");
    hint.firstChild.textContent = am("resendIn") + " ";
    out.textContent = mm + ":" + ss;
  };
  paint();
  resendTimer = setInterval(() => {
    left--;
    if (left <= 0) {
      clearInterval(resendTimer);
      hint.firstChild.textContent = "";
      out.innerHTML = `<a href="#" class="link-btn" id="resendLink">${am("resendNow")}</a>`;
      return;
    }
    paint();
  }, 1000);
}

function resetOtp() {
  otpBoxes.forEach(b => { b.value = ""; b.classList.remove("filled"); });
  $("#otpRow").classList.remove("invalid");
  $("#otpErr").textContent = "";
  lock(verifyBtn, true);
}

sendOtpBtn.addEventListener("click", async () => {
  if (!(mobileOk() && aadhaarOk())) { showLoginErrors(); focusFirstProblem(); return; }
  const m = mobileDigits();
  await withBusy(sendOtpBtn, async () => {
    try {
      const res = await KSApi.sendOtp(m, aadhaarDigits());
      $("#otpNumber").textContent = "+91 " + m.slice(0, 5) + " " + m.slice(5);
      resetOtp();
      goto("scr-otp");
      startResendCountdown(res.expiresInSec || 24);
      setTimeout(() => otpBoxes[0].focus(), 260);
      toast(am("otpSent"), true);
    } catch (err) {
      toast(err.message || "Could not send OTP.");
    }
  });
});

document.addEventListener("click", async e => {
  if (!e.target.closest("#resendLink")) return;
  e.preventDefault();
  try {
    const res = await KSApi.sendOtp(mobileDigits(), aadhaarDigits());
    resetOtp();
    startResendCountdown(res.expiresInSec || 24);
    otpBoxes[0].focus();
    toast(am("resent"), true);
  } catch (err) {
    toast(err.message || "Could not resend OTP.");
  }
});

otpBoxes.forEach((box, i) => {
  box.addEventListener("input", () => {
    box.value = digitsOf(box.value).slice(-1);
    box.classList.toggle("filled", !!box.value);
    if (box.value && i < otpBoxes.length - 1) otpBoxes[i + 1].focus();
    refreshOtp();
  });
  box.addEventListener("keydown", e => {
    if (e.key === "Backspace" && !box.value && i > 0) {
      otpBoxes[i - 1].focus();
      otpBoxes[i - 1].value = "";
      otpBoxes[i - 1].classList.remove("filled");
      refreshOtp();
    }
    if (e.key === "ArrowLeft" && i > 0) otpBoxes[i - 1].focus();
    if (e.key === "ArrowRight" && i < otpBoxes.length - 1) otpBoxes[i + 1].focus();
    if (e.key === "Enter") verifyBtn.click();
    if (e.key.length === 1 && !/\d/.test(e.key)) e.preventDefault();
  });
  box.addEventListener("paste", e => {
    e.preventDefault();
    const d = digitsOf(e.clipboardData.getData("text")).slice(0, otpBoxes.length - i);
    d.split("").forEach((ch, k) => {
      otpBoxes[i + k].value = ch;
      otpBoxes[i + k].classList.add("filled");
    });
    otpBoxes[Math.min(i + d.length, otpBoxes.length - 1)].focus();
    refreshOtp();
  });
});

function refreshOtp() {
  const full = otpValue().length === otpBoxes.length;
  lock(verifyBtn, !full);
  if (full) { $("#otpRow").classList.remove("invalid"); $("#otpErr").textContent = ""; }
}

verifyBtn.addEventListener("click", async () => {
  if (otpValue().length !== otpBoxes.length) {
    $("#otpErr").textContent = am("errOtp");
    $("#otpRow").classList.add("invalid");
    shake($("#otpRow"));
    (otpBoxes.find(b => !b.value) || otpBoxes[0]).focus();
    return;
  }
  await withBusy(verifyBtn, async () => {
    try {
      const res = await KSApi.verifyOtp(mobileDigits(), otpValue());
      KSApi.setToken(res.token);
      farmer = res.farmer;
      const cur = await KSApi.getCurrentBooking();
      booking = cur.booking;
      applyFarmer();
      applyBooking();
      clearInterval(resendTimer);
      goto("scr-home", "home");
      toast(am("welcome"), true);
    } catch (err) {
      $("#otpErr").textContent = err.message || am("errOtp");
      $("#otpRow").classList.add("invalid");
      shake($("#otpRow"));
    }
  });
});

/* Error text and the resend line are rebuilt whenever the language changes. */
function refreshAuthText() {
  if ($("#mobileErr").textContent) { $("#mobileErr").textContent = ""; showLoginErrors(); }
  if ($("#aadhaarErr").textContent) { $("#aadhaarErr").textContent = ""; showLoginErrors(); }
  if ($("#otpErr").textContent) $("#otpErr").textContent = am("errOtp");
  if ($("#resendLink")) $("#resendLink").textContent = am("resendNow");
  else if (resendTimer) $("#resendHint").firstChild.textContent = am("resendIn") + " ";
}

refreshLogin();

/* Links in the feature-coverage panel jump into the right screen or persona. */
document.addEventListener("click", e => {
  const jump = e.target.closest("[data-jump]");
  if (jump) {
    $('.persona-btn[data-view="farmer"]').click();
    goto(jump.dataset.jump);
    return;
  }
  const persona = e.target.closest("[data-persona]");
  if (persona) $(`.persona-btn[data-view="${persona.dataset.persona}"]`).click();
});

/* ---------- voice readout ----------
   Uses the browser's built-in speech engine, so it needs no API key. */
const voiceLang = { en: "en-IN", hi: "hi-IN", pa: "pa-IN" };

document.addEventListener("click", e => {
  const btn = e.target.closest("[data-speak]");
  if (!btn) return;

  if (!("speechSynthesis" in window)) {
    toast(am("noVoice"));
    return;
  }

  // A second tap stops playback instead of restarting it.
  if (btn.classList.contains("playing")) {
    speechSynthesis.cancel();
    btn.classList.remove("playing");
    return;
  }

  speechSynthesis.cancel();
  $$(".voice-btn").forEach(b => b.classList.remove("playing"));

  const line = (speech[lang] || speech.en)[btn.dataset.speak];
  if (!line) return;

  const utter = new SpeechSynthesisUtterance(line);
  utter.lang = voiceLang[lang];
  utter.rate = 0.92;
  btn.classList.add("playing");
  utter.onend = () => btn.classList.remove("playing");
  speechSynthesis.speak(utter);
});

/* ---------- farmer: booking flow, step 1 crop and step 2 quantity ----------
   Crop and quantity are picked before a centre, then carried all the way
   through to the gate pass and the payment estimate. */
/* A farmer often brings more than one crop in the same trip, so the picker
   holds several crops, each with its own quantity in quintal. */
const picked = new Map([["wheat", 20]]);
const DEFAULT_QTY = 20;

const rupees = n => "\u20B9 " + Number(n).toLocaleString("en-IN");
const cropName = c => (lang === "hi" ? (c.hi || c.nameHi) : lang === "pa" ? (c.pa || c.namePa) : c.name);
const cropSvg = c => '<svg viewBox="0 0 24 24">' + (c.icon || cropIcons[c.id] || cropIcons.wheat) + "</svg>";

/* Always in the order the crops are listed, so the summary never jumps around. */
const pickedCrops = () => crops.filter(c => picked.has(c.id));
const totalQty = () => pickedCrops().reduce((s, c) => s + picked.get(c.id), 0);
const totalAmount = () => pickedCrops().reduce((s, c) => s + picked.get(c.id) * c.msp, 0);

/* "Wheat 20 + Paddy 15 quintal", or just "Wheat, 20 quintal" for one crop. */
function cropSummary() {
  const list = pickedCrops();
  if (!list.length) return "";
  if (list.length === 1) {
    return cropName(list[0]) + ", " + picked.get(list[0].id) + " " + am("quintalWord");
  }
  return list.map(c => cropName(c) + " " + picked.get(c.id)).join(" + ") + " " + am("quintalWord");
}

function renderCrops() {
  if (!$("#cropGrid")) return;
  $("#cropGrid").innerHTML = crops.map(c => `
    <button class="crop ${picked.has(c.id) ? "on" : ""}" data-crop="${c.id}"
      aria-pressed="${picked.has(c.id)}">
      <span class="tick"><svg viewBox="0 0 24 24"><path d="M20 6 9 17l-5-5" /></svg></span>
      <div class="ic">${cropSvg(c)}</div>
      <div class="t">${cropName(c)}</div>
      <div class="hi">${lang === "en" ? c.hi : c.name}</div>
      <div class="msp">${rupees(c.msp)} / ${am("qtlShort")}</div>
    </button>`).join("");

  const n = picked.size;
  $("#cropCount").textContent = n === 0 ? am("pickCrop")
    : n === 1 ? am("continueOne")
      : am("continueMany").replace("{n}", n);
  lock($("#cropNextBtn"), n === 0);
}

$("#cropGrid").addEventListener("click", e => {
  const el = e.target.closest("[data-crop]");
  if (!el) return;
  const id = el.dataset.crop;
  if (picked.has(id)) picked.delete(id);
  else picked.set(id, DEFAULT_QTY);
  renderCrops();
  renderQty();
});

$("#cropNextBtn").addEventListener("click", () => {
  if (!picked.size) {
    toast(am("pickCrop"));
    shake($("#cropGrid"));
    return;
  }
  goto("scr-qty", "book");
});

function renderQty() {
  const list = pickedCrops();

  if (!list.length) {
    $("#qtyList").innerHTML =
      `<div class="empty-note" data-goto="scr-crop" data-tab="book">${am("noCropYet")}</div>`;
  } else {
    $("#qtyList").innerHTML = list.map(c => {
      const q = picked.get(c.id);
      return `<div class="qcrop">
        <div class="head">
          <span class="ic">${cropSvg(c)}</span>
          <span class="nm">
            <b>${cropName(c)}</b>
            <span>${rupees(c.msp)} ${am("perQuintal")}</span>
          </span>
          <button class="rm" data-remove="${c.id}" aria-label="Remove">&times;</button>
        </div>
        <div class="foot">
          <button class="qty-btn sm ${q <= 1 ? "off" : ""}" data-step="-5" data-id="${c.id}">&#8722;</button>
          <span class="qv"><b>${q}</b> ${am("quintalWord")}</span>
          <button class="qty-btn sm ${q >= 200 ? "off" : ""}" data-step="5" data-id="${c.id}">+</button>
          <span class="ln">${rupees(q * c.msp)}</span>
        </div>
      </div>`;
    }).join("");
  }

  $("#qtyAmount").textContent = rupees(totalAmount());
  $("#qtyCalc").textContent = list.length > 1
    ? list.length + " " + am("cropsWord") + " \u00B7 " + totalQty() + " " + am("quintalWord")
    : totalQty() + " " + am("quintalWord");

  lock($("#qtyNextBtn"), !list.length);
  $("#slotCropNote").textContent = cropSummary();
}

$("#qtyList").addEventListener("click", e => {
  const step = e.target.closest("[data-step]");
  if (step) {
    const id = step.dataset.id;
    picked.set(id, Math.min(200, Math.max(1, picked.get(id) + +step.dataset.step)));
    renderQty();
    flash($(`[data-step][data-id="${id}"]`).closest(".foot").querySelector(".qv"));
    return;
  }
  const rm = e.target.closest("[data-remove]");
  if (rm) {
    picked.delete(rm.dataset.remove);
    renderCrops();
    renderQty();
  }
});

$("#qtyNextBtn").addEventListener("click", () => {
  if (!picked.size) { toast(am("pickCrop")); return; }
  goto("scr-centres", "book");
});

/* Keeps the MSP tracker consistent with what was actually booked. */
function updatePaymentFigures() {
  const list = pickedCrops();
  const gross = totalAmount();

  $("#payBreakdown").innerHTML = list.map(c => {
    const q = picked.get(c.id);
    return `<div class="calc-row">
      <span class="k">${cropName(c)} \u00B7 ${q.toFixed(2)} ${am("qtlShort")} \u00D7 ${rupees(c.msp)}</span>
      <span class="v">${rupees(q * c.msp)}</span>
    </div>`;
  }).join("");

  $("#payHero").textContent = rupees(gross);
  $("#payGross").textContent = rupees(gross);
  $("#payNet").textContent = rupees(gross);
}

function renderCentreLists() {
  $("#homeCentres").innerHTML = centres.slice(0, 2).map(c => centreCard(c, true)).join("");
  $("#centreList").innerHTML = centres.map(c => centreCard(c, false)).join("");
}

function renderMap() {
  const box = $("#mapPins");
  if (!box) return;
  box.innerHTML = centres.map(c => {
    const wait = waitText(c.wait ?? c.waitMinutes).replace(" wait", "");
    const lvl = (c.load >= 0.85) ? "pin-high" : (c.load >= 0.55) ? "pin-med" : "pin-low";
    return `<div class="map-pin ${lvl}" data-centre="${c.id}"
      style="left:${c.mapLeft || "50%"};top:${c.mapTop || "50%"}">
      <span class="head"><b>${c.id}</b></span>
      <span class="tag">${c.name.split(" ")[0]} &middot; ${wait}</span>
    </div>`;
  }).join("");
}

document.addEventListener("click", e => {
  const el = e.target.closest("button.centre[data-centre], .map-pin[data-centre]");
  if (!el) return;
  const c = centres.find(x => x.id === +el.dataset.centre);
  if (!c) return;
  $("#slotCentreName").textContent = c.name;
  selectedCentre = c;
  $$(".slot").forEach(s => s.classList.remove("on"));
  goto("scr-slots", "book");
});

$$("[data-i18n='openGmaps']").forEach(btn => {
  btn.addEventListener("click", () => {
    const c = selectedCentre || centres[0];
    if (!c) return;
    const dest = (c.lat && c.lng) ? (c.lat + "," + c.lng) : (c.name + ", Haryana, India");
    window.open("https://www.google.com/maps/dir/?api=1&destination=" + encodeURIComponent(dest), "_blank", "noopener");
  });
});

function renderFarmerQueue(data) {
  if (!data || !$("#queuePreview")) return;
  aheadList = data.ahead || [];
  if ($("#queuePos")) $("#queuePos").textContent = data.position;
  if ($("#nowServingTok")) $("#nowServingTok").textContent = data.nowServing;
  if ($("#queueEta")) $("#queueEta").textContent = t("reachCounter").includes("11:38")
    ? t("reachCounter").replace("11:38 AM", data.eta)
    : t("reachCounter");
  if ($("#queueAvg")) $("#queueAvg").textContent = data.avgMinutes + " min";
  const you = farmer ? farmer.name : "Ramesh Singh";
  const tok = booking && booking.token ? booking.token : "A-042";
  $("#queuePreview").innerHTML =
    aheadList.map(r => `<div class="qrow">
        <span class="tk">${r.token || r.tok}</span>
        <span class="who">${r.name ? (r.name + " · " + (r.village || "")) : r.who}</span>
        <span class="tag" style="color:var(--muted)">${r.tag}</span>
      </div>`).join("") +
    `<div class="qrow me">
        <span class="tk">${tok}</span>
        <span class="who"><b>You</b> · ${you}</span>
        <span class="tag" style="color:var(--saffron-700)">~${(booking && booking.waitMinutes) || 35} min</span>
      </div>`;
}

/* ---------- farmer: cancellation (feature 12) ----------
   Cancelling has to change the gate pass too, otherwise the app would still
   show a live token for a booking that no longer exists. */
function setTokenCancelled(cancelled) {
  const pill = $("#tokenStatusPill");
  pill.className = "pill " + (cancelled ? "grey" : "green");
  pill.textContent = cancelled ? "Cancelled" : "Confirmed";
  pill.removeAttribute("data-i18n");
  $(".qr-wrap").style.opacity = cancelled ? ".4" : "1";
  $("#seeQueueBtn").style.display = cancelled ? "none" : "flex";
  $("#cancelEntryBtn").style.display = cancelled ? "none" : "flex";
  $("#rebookBtn").style.display = cancelled ? "flex" : "none";
  $("#homeToken").style.display = cancelled ? "none" : "block";
  $("#homeNoToken").style.display = cancelled ? "block" : "none";
}

$("#doCancelBtn").addEventListener("click", async e => {
  const btn = e.currentTarget;
  if (!booking) { toast(am("cancelled")); return; }
  await withBusy(btn, async () => {
    try {
      const res = await KSApi.cancelBooking(booking.id);
      booking.status = "cancelled";
      applyBooking();
      const who = res.offeredTo && res.offeredTo.name ? res.offeredTo.name : "the waitlist";
      const box = $("#cancelResult");
      box.className = "scan-result ok";
      box.innerHTML = "Booking " + booking.token + " cancelled. Your slot has been offered to " +
        "<b>" + who + "</b> on WhatsApp." + (res.penalty ? "" : " No penalty was applied.");
      toast(am("cancelled"), true);
    } catch (err) {
      toast(err.message || "Could not cancel booking.");
    }
  });
});

$("#lateBtn").addEventListener("click", async () => {
  if (!booking) { toast(am("held"), true); return; }
  try {
    await KSApi.holdBooking(booking.id);
    booking.status = "held";
    toast(am("held"), true);
  } catch (err) {
    toast(err.message || am("held"));
  }
});

/* ---------- farmer: date strip ---------- */
const days = ["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"];
const dateHtml = [];
for (let i = 0; i < 7; i++) {
  const d = new Date(2026, 7, 25 + i);
  dateHtml.push(
    `<button class="date-chip ${i === 0 ? "on" : ""}" data-day="${i}" data-date="${isoDate(d)}">
       <div class="dw">${days[d.getDay()]}</div>
       <div class="dd">${d.getDate()}</div>
     </button>`
  );
}
$("#dateStrip").innerHTML = dateHtml.join("");

$$(".date-chip").forEach(chip => {
  chip.addEventListener("click", () => {
    $$(".date-chip").forEach(c => c.classList.remove("on"));
    chip.classList.add("on");
    loadSlots();
  });
});

function renderSlots() {
  $("#slotList").innerHTML = currentSlots.map(s => {
    const label = (s.start && s.end) ? (s.start + " – " + s.end) : (s.t || "");
    const left = s.left;
    const full = left === 0;
    return `<button class="slot ${full ? "full" : ""}" data-slot-id="${s.id}" ${full ? "disabled" : ""}>
        <span class="tm">${label}</span>
        <span class="seats">${full ? "Full" : `<b>${left}</b> of ${s.total || 12} free`}</span>
      </button>`;
  }).join("");

  $$(".slot:not(.full)").forEach(el => {
    el.addEventListener("click", () => {
      $$(".slot").forEach(s => s.classList.remove("on"));
      el.classList.add("on");
    });
  });
}

$("#confirmSlotBtn").addEventListener("click", async () => {
  const chosen = $(".slot.on");
  if (!chosen) {
    toast(am("pickSlot"));
    shake($("#slotList"));
    $(".phone-body").scrollTo({ top: 0, behavior: "smooth" });
    return;
  }
  const centre = selectedCentre || centres[0];
  const date = $(".date-chip.on").dataset.date;
  await withBusy($("#confirmSlotBtn"), async () => {
    try {
      booking = await KSApi.createBooking({
        centreId: centre.id,
        date,
        slotId: chosen.dataset.slotId,
        crops: pickedCrops().map(c => ({ cropId: c.id, quintal: picked.get(c.id) }))
      });
      applyBooking();
      updatePaymentFigures();
      goto("scr-token", "token");
      toast(am("booked"), true);
    } catch (err) {
      toast(err.message || "Could not book this slot.");
    }
  });
});

/* ---------- farmer: QR code ----------
   Not a real QR encoder — a deterministic pattern that reads as a QR
   in the mockup. Swap for a qrcode library when wiring the real booking id. */
(function drawQr() {
  const size = 37;
  const ctx = $("#qrCanvas").getContext("2d");
  ctx.fillStyle = "#fff";
  ctx.fillRect(0, 0, size, size);
  ctx.fillStyle = "#3a2413";

  let seed = 20260825;
  const rnd = () => (seed = (seed * 1103515245 + 12345) & 0x7fffffff) / 0x7fffffff;
  const inFinder = (x, y) =>
    (x < 8 && y < 8) || (x > size - 9 && y < 8) || (x < 8 && y > size - 9);

  for (let y = 0; y < size; y++) {
    for (let x = 0; x < size; x++) {
      if (inFinder(x, y)) continue;
      if (rnd() > 0.52) ctx.fillRect(x, y, 1, 1);
    }
  }

  function finder(ox, oy) {
    ctx.fillStyle = "#3a2413";
    ctx.fillRect(ox, oy, 7, 7);
    ctx.fillStyle = "#fff";
    ctx.fillRect(ox + 1, oy + 1, 5, 5);
    ctx.fillStyle = "#3a2413";
    ctx.fillRect(ox + 2, oy + 2, 3, 3);
  }
  finder(0, 0);
  finder(size - 7, 0);
  finder(0, size - 7);
})();

/* ---------- staff: queue table ---------- */
function renderQueue() {
  $("#queueBody").innerHTML = queue.map((r, i) => {
    const m = stageMeta[r.stage];
    const opts = Object.keys(stageMeta)
      .map(k => `<option value="${k}" ${k === r.stage ? "selected" : ""}>${stageMeta[k].label}</option>`)
      .join("");
    return `<tr>
        <td class="tok-cell">${r.token}</td>
        <td class="name-cell"><b>${r.name}</b><span>${r.village}</span></td>
        <td>${r.crop}</td>
        <td>${r.slot}</td>
        <td><span class="pill ${m.pill}">${m.label}</span></td>
        <td><select class="stage-sel" data-row="${i}">${opts}</select></td>
      </tr>`;
  }).join("");

  $$(".stage-sel").forEach(sel => {
    sel.addEventListener("change", () => changeQueueStage(+sel.dataset.row, sel.value));
  });
}

function refreshStats() {
  const active = queue.filter(r => ["arrived", "graded", "weighed"].includes(r.stage)).length;
  const done = queue.filter(r => r.stage === "accepted").length;
  const missed = queue.filter(r => r.stage === "no_show").length;
  $("#statQueue").textContent = staffStats.inQueue != null ? staffStats.inQueue : active;
  $("#statDone").textContent = staffStats.completed != null ? staffStats.completed : done;
  $("#statNoShow").textContent = staffStats.noShows != null ? staffStats.noShows : missed;
  if ($("#statBooked") && staffStats.booked != null) $("#statBooked").textContent = staffStats.booked;
}

function renderWaitlist() {
  $("#waitlistBox").innerHTML = waitlist.map((w, i) => `
    <div style="display:flex;align-items:center;gap:11px;padding:10px 0;
      border-bottom:${i === waitlist.length - 1 ? "none" : "1.5px solid #f7efe6"}">
      <span style="width:24px;height:24px;border-radius:50%;background:var(--saffron-100);
        color:var(--saffron-700);font-size:12px;font-weight:800;display:grid;place-items:center">${i + 1}</span>
      <span>
        <b style="display:block;font-size:14px;color:var(--earth-900)">${w.name}</b>
        <span style="font-size:12.5px;color:var(--muted)">${w.village} · wants ${w.want} · ${w.since}</span>
      </span>
    </div>`).join("");
}

async function changeQueueStage(index, stage) {
  const row = queue[index];
  if (!row) return;
  if (!online) {
    row.stage = stage;
    pendingMutations.push({ type: "stage", token: row.token, stage });
    if (KSConfig.useMock) KSMock.queueOfflineMutation({ type: "stage", token: row.token, stage });
    renderQueue();
    refreshStats();
    renderOfflineBar();
    return;
  }
  try {
    await KSApi.updateQueueStage(row.token, stage);
    await loadStaff();
  } catch (err) {
    toast(err.message || "Could not update stage.");
  }
}

/* ---------- staff: token scan ---------- */
$("#scanBtn").addEventListener("click", async () => {
  const val = $("#scanInput").value.trim().toUpperCase();
  const box = $("#scanResult");

  if (!val) {
    box.className = "scan-result err";
    box.textContent = "Enter or scan a token number.";
    return;
  }

  if (!online) {
    pendingMutations.push({ type: "check-in", token: val });
    if (KSConfig.useMock) KSMock.queueOfflineMutation({ type: "check-in", token: val });
    const found = queue.find(r => r.token === val);
    if (found) found.stage = "arrived";
    renderQueue();
    refreshStats();
    renderOfflineBar();
    box.className = "scan-result ok";
    box.innerHTML = "Saved on this device. Will upload when the network returns.";
    $("#scanInput").value = "";
    return;
  }

  try {
    const res = await KSApi.checkIn(val);
    await loadStaff();
    flash($("#statQueue").closest(".stat") || $("#statQueue"));
    box.className = "scan-result ok";
    box.innerHTML = `<b>${res.farmer.name}</b> (${res.farmer.village}) checked in for the ${res.slot} slot. ${res.crop}.`;
    $("#scanInput").value = "";
  } catch (err) {
    box.className = "scan-result err";
    box.innerHTML = `<b>${val}</b> ${err.message || "is not booked for today."}`;
  }
});

$("#scanInput").addEventListener("keydown", e => {
  if (e.key === "Enter") $("#scanBtn").click();
});

/* ---------- staff: offline simulation ---------- */
let online = true;

function renderOfflineBar() {
  const bar = $("#offlineBar");
  if (online) {
    bar.style.background = "var(--leaf-100)";
    bar.style.borderColor = "#cfe7c0";
    bar.innerHTML = `<span class="dot-live"></span>
      <span><b>Online.</b> All entries synced. If the internet drops, entries are saved on this device and uploaded
      automatically.</span>
      <button class="btn" id="offlineToggle">Simulate offline</button>`;
  } else {
    bar.style.background = "var(--clay-100)";
    bar.style.borderColor = "#f5cdc0";
    bar.innerHTML = `<span class="dot-live" style="background:var(--clay-600);box-shadow:0 0 0 4px rgba(193,68,14,.18)"></span>
      <span><b style="color:var(--clay-600)">Offline.</b> ${pendingMutations.length} entries saved on this device. They will upload
      automatically when the network returns — keep working.</span>
      <button class="btn" id="offlineToggle">Go back online</button>`;
  }
}

$("#offlineBar").addEventListener("click", async e => {
  if (!e.target.closest("#offlineToggle")) return;
  if (online) {
    online = false;
    if (KSConfig.useMock) KSMock.setStaffOnline(false);
    renderOfflineBar();
    return;
  }
  try {
    if (pendingMutations.length) await KSApi.syncStaff(pendingMutations);
    pendingMutations = [];
    online = true;
    if (KSConfig.useMock) KSMock.setStaffOnline(true);
    renderOfflineBar();
    await loadStaff();
  } catch (err) {
    toast(err.message || "Could not sync offline entries.");
  }
});

function renderSlotCapacity() {
  $("#slotCapacity").innerHTML = slotCapacityData.map(s => {
    const used = s.total - s.left;
    const pct = Math.round((used / s.total) * 100);
    const lvl = pct >= 85 ? "lvl-high" : pct >= 55 ? "lvl-med" : "lvl-low";
    return `<div style="margin-bottom:14px">
        <div style="display:flex;font-size:13.5px;margin-bottom:6px">
          <span style="font-weight:700;color:var(--earth-900)">${s.time}</span>
          <span style="margin-left:auto;color:var(--muted);font-weight:600">${used}/${s.total}</span>
        </div>
        <div class="load-row ${lvl}">
          <span class="load-bar"><i style="width:${pct}%"></i></span>
        </div>
      </div>`;
  }).join("");
}

function renderAdminCentres(list) {
  $("#adminCentres").innerHTML = list.map(c => {
    const wait = c.wait ?? c.waitMinutes;
    const lvl = loadLevel(c.load);
    const status = c.load >= 0.85
      ? '<span class="pill red">Over capacity</span>'
      : c.load >= 0.55
        ? '<span class="pill amber">Busy</span>'
        : '<span class="pill green">Comfortable</span>';
    return `<div class="centre-row">
        <div>
          <div class="nm">${c.name}</div>
          <div class="dist">${c.crops}</div>
        </div>
        <div>
          <div class="num">${waitText(wait).replace("~", "").replace(" wait", "")}</div>
          <div class="cap">current wait</div>
        </div>
        <div>${status}</div>
        <div class="load-row ${lvl}">
          <span class="load-bar"><i style="width:${Math.round(c.load * 100)}%"></i></span>
          <span class="wt">${Math.round(c.load * 100)}%</span>
        </div>
      </div>`;
  }).join("");
}

function renderHourChart(rows) {
  if (!rows.length) { $("#hourChart").innerHTML = ""; return; }
  const maxN = Math.max(...rows.map(h => h.count ?? h.n));
  $("#hourChart").innerHTML = rows.map(h => {
    const n = h.count ?? h.n;
    const pct = (n / maxN) * 100;
    return `<div class="bar-col">
        <span class="qty">${n}</span>
        <div class="bar ${n === maxN ? "peak" : ""}" style="height:${pct}%"></div>
        <span class="hr">${h.hour || h.hr}</span>
      </div>`;
  }).join("");
}

function renderAdminAlerts(items) {
  const box = $("#adminAlerts");
  if (!box) return;
  box.innerHTML = items.map(a => `
    <div class="alert-item ${a.level}">
      <div class="bar-i"></div>
      <div>
        <div class="t">${a.title}</div>
        <div class="d">${a.body}</div>
        <div class="tm">${a.time}</div>
      </div>
    </div>`).join("");
}

/* ---------- language toggle (feature 11) ----------
   The top-bar picker and the in-app Language screen stay in sync. */
const originals = new Map();
$$("[data-i18n]").forEach(el => originals.set(el, el.textContent));

function setLang(code) {
  lang = code;
  KSConfig.lang = code;
  const dict = i18n[code] || {};
  $$("[data-i18n]").forEach(el => {
    el.textContent = dict[el.dataset.i18n] || originals.get(el);
  });
  $("#langSelect").value = code;
  $$(".opt-row[data-lang]").forEach(r => r.classList.toggle("on", r.dataset.lang === code));
  refreshAuthText();
  renderCrops();
  renderQty();
  if (window.speechSynthesis) speechSynthesis.cancel();
  if (KSApi.isLoggedIn()) KSApi.updateMe({ language: code }).catch(() => {});
  if (currentScreen === "scr-alerts") loadScreen("scr-alerts");
}

$("#langSelect").addEventListener("change", e => setLang(e.target.value));
$$(".opt-row[data-lang]").forEach(r => r.addEventListener("click", () => setLang(r.dataset.lang)));

/* ---------- apply API payloads to the UI ---------- */
function applyFarmer() {
  if (!farmer) return;
  if ($("#farmerName")) $("#farmerName").textContent = farmer.name;
  if ($("#farmerPlace")) $("#farmerPlace").textContent = farmer.village + ", " + farmer.district;
  if ($("#farmerAvatar")) $("#farmerAvatar").textContent = farmer.initials || farmer.name.slice(0, 2).toUpperCase();
}

function applyBooking() {
  const active = booking && booking.status !== "cancelled";
  setTokenCancelled(!active);
  if (!booking) return;
  $$(".tno").forEach(el => { el.textContent = booking.token; });
  if ($("#homeTok")) $("#homeTok").textContent = booking.token;
  $$("[data-token-centre]").forEach(el => { el.textContent = booking.centreName; });
  $$("[data-token-day]").forEach(el => { el.textContent = booking.dateLabel; });
  $$("[data-token-slot]").forEach(el => { el.textContent = booking.slotLabel; });
  $$("[data-token-crop]").forEach(el => { el.textContent = booking.cropsLabel; });
  if ($("#homeWaitMin")) $("#homeWaitMin").textContent = "~" + (booking.waitMinutes || 35) + " min";
}

async function loadSlots() {
  const centre = selectedCentre || centres[0];
  const chip = $(".date-chip.on");
  if (!centre || !chip) return;
  try {
    veil(true);
    const res = await KSApi.getSlots(centre.id, chip.dataset.date);
    currentSlots = res.slots || [];
    renderSlots();
  } catch (err) {
    toast(err.message || "Could not load slots.");
  } finally {
    veil(false);
  }
}

async function loadScreen(id) {
  try {
    if (id === "scr-queue") {
      const q = await KSApi.getQueue(booking && booking.centreId);
      renderFarmerQueue(q);
    }
    if (id === "scr-payment") {
      const pay = await KSApi.getCurrentPayment();
      $("#payHero").textContent = rupees(pay.net);
      $("#payGross").textContent = rupees(pay.gross);
      $("#payNet").textContent = rupees(pay.net);
      $("#payBreakdown").innerHTML = (pay.lines || []).map(l => `
        <div class="calc-row">
          <span class="k">${l.label} \u00B7 ${Number(l.quintal).toFixed(2)} ${am("qtlShort")} \u00D7 ${rupees(l.msp)}</span>
          <span class="v">${rupees(l.amount)}</span>
        </div>`).join("");
      if ($("#paySubLive")) $("#paySubLive").textContent = "Lot #" + pay.lotNo + " · " + pay.cropLabel + " · " + pay.centreName;
    }
    if (id === "scr-track") {
      const lot = await KSApi.getCurrentLot();
      if ($("#trackLotNo")) $("#trackLotNo").textContent = "Lot #" + lot.lotNo;
      if ($("#trackLotSub")) $("#trackLotSub").textContent = lot.cropLabel + " · " + lot.centreName;
    }
    if (id === "scr-alerts") {
      const notes = await KSApi.getNotifications();
      const chat = $("#alertsChat");
      if (chat) {
        chat.innerHTML = `<div class="chat-day">${t("today", "Today")}</div>` + notes.map(n => `
          <div class="bubble">
            <div class="hd">Kissan Setu</div>
            <p>${n.body || t(n.key, "")}</p>
            <div class="tm">${n.time}</div>
          </div>`).join("");
      }
    }
    if (id === "scr-slots") await loadSlots();
    if (id === "scr-home" || id === "scr-centres" || id === "scr-map") {
      centres = (await KSApi.listCentres()).map(normalizeCentre);
      renderCentreLists();
      renderMap();
    }
  } catch (err) {
    toast(err.message || "Could not load this screen.");
  }
}

async function loadStaff() {
  try {
    const data = await KSApi.getStaffDashboard();
    queue = data.queue || [];
    waitlist = data.waitlist || [];
    slotCapacityData = data.slots || [];
    staffStats = data.stats || staffStats;
    if (data.sync) {
      online = data.sync.online;
      if (typeof data.sync.pendingCount === "number" && !pendingMutations.length) {
        /* keep local pending list as source of truth while offline */
      }
    }
    if ($("#staffSub")) {
      $("#staffSub").textContent = [data.centreName, data.gate, data.operator && ("operator " + data.operator), data.date]
        .filter(Boolean).join(" · ");
    }
    renderQueue();
    refreshStats();
    renderWaitlist();
    renderSlotCapacity();
    renderOfflineBar();
  } catch (err) {
    toast(err.message || "Could not load the staff dashboard.");
  }
}

async function loadAdmin() {
  try {
    const data = await KSApi.getAdminDashboard();
    if ($("#adminSub")) {
      $("#adminSub").textContent = data.district + " district · " + data.centreCount + " procurement centres · live";
    }
    if (data.stats) {
      if ($("#adminServed")) $("#adminServed").textContent = Number(data.stats.served).toLocaleString("en-IN");
      if ($("#adminServedSub")) $("#adminServedSub").textContent = data.stats.servedDelta;
      if ($("#adminWait")) $("#adminWait").textContent = data.stats.avgWait + " min";
      if ($("#adminUtil")) $("#adminUtil").textContent = data.stats.utilisation + "%";
      if ($("#adminPay")) $("#adminPay").textContent = data.stats.paymentsPending;
    }
    renderAdminCentres((data.centres || []).map(normalizeCentre));
    renderAdminAlerts(data.alerts || []);
    renderHourChart(data.hourly || []);
  } catch (err) {
    toast(err.message || "Could not load the admin dashboard.");
  }
}

function paintApiTag() {
  const tag = $("#apiTag");
  if (!tag) return;
  tag.textContent = KSConfig.useMock ? "Mock data" : "Live API";
  tag.classList.toggle("live", !KSConfig.useMock);
}

const logoutBtn = $("#logoutBtn");
if (logoutBtn) {
  logoutBtn.addEventListener("click", () => {
    KSApi.clearToken();
    farmer = null;
    booking = null;
    goto("scr-login");
    toast(t("logout", "You have been logged out."));
  });
}

/* ---------- start ---------- */
const params = new URLSearchParams(location.search);

async function boot() {
  paintApiTag();
  setLang(params.get("lang") || "en");
  veil(true);
  try {
    crops = (await KSApi.listCrops()).map(normalizeCrop);
    centres = (await KSApi.listCentres()).map(normalizeCentre);
    if (!picked.size && crops.some(c => c.id === "wheat")) picked.set("wheat", 20);
    selectedCentre = centres[0] || null;
    renderCrops();
    renderQty();
    renderCentreLists();
    renderMap();

    if (KSApi.isLoggedIn()) {
      try {
        farmer = await KSApi.getMe();
        const cur = await KSApi.getCurrentBooking();
        booking = cur.booking;
        applyFarmer();
        applyBooking();
      } catch (err) {
        KSApi.clearToken();
      }
    }

    let startScreen = "scr-" + (params.get("screen") || "login");
    if (KSApi.isLoggedIn() && (startScreen === "scr-login" || startScreen === "scr-otp")) {
      startScreen = "scr-home";
    }
    goto(startScreen, null, { silent: true });
    if (historyOk) {
      try {
        history.replaceState({ screen: startScreen, tab: screenTab[startScreen] }, "", location.href);
      } catch (err) {
        historyOk = false;
      }
    }

    const startView = params.get("view");
    if (startView) {
      const btn = $(`.persona-btn[data-view="${startView}"]`);
      if (btn) btn.click();
    }
  } catch (err) {
    toast(err.message || "Could not start the app.");
  } finally {
    veil(false);
  }
}

boot();

/* A tap anywhere on a persona tab or screen should never leave a stale
   spoken line running in the background. */
document.addEventListener("click", e => {
  if (e.target.closest("[data-speak]")) return;
  if (window.speechSynthesis && speechSynthesis.speaking) {
    speechSynthesis.cancel();
    $$(".voice-btn").forEach(b => b.classList.remove("playing"));
  }
});

/**
 * Oázis Őszi Kupa 2026 — nevezések szinkronizálása Google Sheetsbe.
 *
 * Két munkalapot tart karban:
 *
 *   1. "Nevezések (élő)"  — az adatbázis pontos tükre. Minden futásnál teljesen
 *      felülíródik, és le van védve, úgyhogy csak a táblázat tulajdonosa tud
 *      beleírni. Ez a hiteles változat.
 *
 *   2. "Csapat munkalap"  — ugyanazok a sorok, de a csapat szabadon szerkeszti.
 *      A szinkron ide CSAK új sorokat fűz hozzá, a meglévőkhöz soha nem nyúl.
 *      Amit a csapat átír, az megmarad.
 *
 * Telepítés:
 *   1. Táblázat → Bővítmények → Apps Script, és ide bemásolni ezt a fájlt.
 *   2. Projekt beállításai → Szkript tulajdonságai, két sor:
 *        EXPORT_URL    = https://<oldal>/api/export
 *        EXPORT_TOKEN  = ugyanaz, mint a Vercelen az EXPORT_TOKEN
 *   3. Futtatás: setUpSync  (engedélyt kér, majd 2 óránkénti időzítőt állít be)
 *
 * Kézzel bármikor frissíthető a táblázat "Oázis" menüjéből, akkor is, ha az
 * automatikus szinkron ki van kapcsolva.
 *
 * A tokent a szkript tulajdonságai tárolják, nem a táblázat, így a csapat tagjai
 * nem látják akkor sem, ha szerkesztői joguk van.
 */

var CONFIG = {
  liveSheet: 'Nevezések (élő)',
  workSheet: 'Csapat munkalap',
  // Milyen sűrűn fusson az automatikus szinkron. A Google csak ezeket az
  // értékeket engedi: 1, 2, 4, 6, 8, 12 óra.
  syncHours: 2,

  // A csapat munkalapjának saját oszlopai. A szinkron ezeket soha nem írja,
  // csak létrehozza őket a tükrözött oszlopok után. Bővíthető.
  teamColumns: ['Csapat / pár', 'Megjelent?', 'Befizetve?', 'Csapat megjegyzése'],
};

/** Menü a táblázatban, hogy kézzel is indítható legyen. */
function onOpen() {
  SpreadsheetApp.getUi()
    .createMenu('Oázis')
    .addItem('Szinkronizálás most', 'syncRegistrations')
    .addSeparator()
    .addItem('Automatikus szinkron bekapcsolása', 'setUpSync')
    .addItem('Automatikus szinkron kikapcsolása', 'stopAutoSync')
    .addToUi();
}

/** Egyszer kell lefuttatni: időzítőt állít be, és rögtön szinkronizál is. */
function setUpSync() {
  removeSyncTriggers_();

  ScriptApp.newTrigger('syncRegistrations')
    .timeBased()
    .everyHours(CONFIG.syncHours)
    .create();

  syncRegistrations();
  toast_('Automatikus szinkron bekapcsolva, ' + CONFIG.syncHours + ' óránként.');
}

/**
 * Kikapcsolja az automatikus szinkront. A táblázat ettől nem sérül, csak
 * magától nem frissül többé — a menüből kézzel bármikor lehet.
 */
function stopAutoSync() {
  var removed = removeSyncTriggers_();
  toast_(
    removed
      ? 'Automatikus szinkron kikapcsolva. A menüből kézzel továbbra is frissíthető.'
      : 'Nem volt bekapcsolva automatikus szinkron.'
  );
}

function removeSyncTriggers_() {
  var removed = 0;
  ScriptApp.getProjectTriggers().forEach(function (trigger) {
    if (trigger.getHandlerFunction() === 'syncRegistrations') {
      ScriptApp.deleteTrigger(trigger);
      removed += 1;
    }
  });
  return removed;
}

/** A tényleges munka. Erre van kötve az időzítő. */
function syncRegistrations() {
  var payload = fetchRegistrations_();
  var book = SpreadsheetApp.getActiveSpreadsheet();

  writeLiveSheet_(sheetNamed_(book, CONFIG.liveSheet), payload);
  var added = appendToWorkSheet_(sheetNamed_(book, CONFIG.workSheet), payload);

  toast_(added ? added + ' új nevezés érkezett.' : 'Kész, új nevezés nincs.');
}

/**
 * Visszajelzés a menüből indított futásnál. Időzítőből futva nincs megnyitott
 * táblázat, amin megjelenhetne, ezért a hiba itt nem érdekes.
 */
function toast_(message) {
  try {
    SpreadsheetApp.getActiveSpreadsheet().toast(message, 'Oázis szinkron', 5);
  } catch (err) {
    // Időzítőből futott, nincs kinek szólni.
  }
}

/** ------------------------------------------------------------------ */

function fetchRegistrations_() {
  var props = PropertiesService.getScriptProperties();
  var url = (props.getProperty('EXPORT_URL') || '').trim();
  var token = (props.getProperty('EXPORT_TOKEN') || '').trim();

  if (!url || !token) {
    throw new Error(
      'Hiányzik az EXPORT_URL vagy az EXPORT_TOKEN. Projekt beállításai → Szkript tulajdonságai.'
    );
  }

  // Fejlécben megy a token, nem a címben: a query stringbe tett titkok
  // beleragadnak a szerver naplóiba.
  var response = UrlFetchApp.fetch(url, {
    method: 'get',
    headers: { 'x-export-token': token },
    muteHttpExceptions: true,
    followRedirects: false,
  });

  var code = response.getResponseCode();
  if (code === 401) throw new Error('A token nem egyezik a szerveren beállítottal.');
  if (code !== 200) throw new Error('Az export nem elérhető (HTTP ' + code + ').');

  var payload = JSON.parse(response.getContentText());
  if (!payload.columns || !payload.rows) throw new Error('Váratlan válasz az exporttól.');
  return payload;
}

function sheetNamed_(book, name) {
  return book.getSheetByName(name) || book.insertSheet(name);
}

/**
 * Teljes felülírás. Az 1. sorban a frissítés ideje áll, a 2. sorban a fejléc,
 * a 3. sortól jönnek az adatok.
 */
function writeLiveSheet_(sheet, payload) {
  var columnCount = payload.columns.length;

  sheet.clearContents();
  sheet.clearNotes();

  sheet
    .getRange(1, 1)
    .setValue('Frissítve: ' + payload.generatedAt + ' — ' + payload.count + ' nevezés')
    .setFontColor('#666666');

  sheet.getRange(2, 1, 1, columnCount).setValues([payload.columns]).setFontWeight('bold');

  if (payload.rows.length) {
    sheet.getRange(3, 1, payload.rows.length, columnCount).setValues(payload.rows);
  }

  sheet.setFrozenRows(2);
  // Az azonosító oszlop csak a párosításhoz kell, embernek nem mond semmit.
  sheet.hideColumns(1);
  sheet.autoResizeColumns(2, columnCount - 1);

  protectLiveSheet_(sheet);
}

/**
 * A csapat munkalapja. Csak hozzáfűz: minden olyan sort, aminek az azonosítója
 * még nincs a lapon. A meglévő sorokat érintetlenül hagyja, így a csapat
 * átírhatja őket anélkül, hogy a következő szinkron visszaállítaná.
 */
function appendToWorkSheet_(sheet, payload) {
  var headers = payload.columns.concat(CONFIG.teamColumns);
  var columnCount = headers.length;

  var firstCell = sheet.getRange(1, 1).getValue();
  if (!firstCell) {
    sheet.getRange(1, 1, 1, columnCount).setValues([headers]).setFontWeight('bold');
    sheet.setFrozenRows(1);
    sheet.hideColumns(1);
  }

  var lastRow = sheet.getLastRow();
  var known = {};
  if (lastRow > 1) {
    sheet
      .getRange(2, 1, lastRow - 1, 1)
      .getValues()
      .forEach(function (row) {
        if (row[0]) known[String(row[0])] = true;
      });
  }

  var fresh = payload.rows.filter(function (row) {
    return !known[String(row[0])];
  });
  if (!fresh.length) return 0;

  // A csapat oszlopait üresen hagyjuk, hogy legyen mit kitölteni.
  var padded = fresh.map(function (row) {
    return row.concat(CONFIG.teamColumns.map(function () { return ''; }));
  });

  sheet.getRange(lastRow + 1, 1, padded.length, columnCount).setValues(padded);
  return padded.length;
}

/**
 * A tükör-munkalapot csak a tulajdonos szerkesztheti. A csapat tagjai a
 * táblázatra kapnak szerkesztői jogot (kell nekik a 2. munkalap miatt), ez a
 * védés tartja őket távol az elsőtől.
 */
function protectLiveSheet_(sheet) {
  var existing = sheet.getProtections(SpreadsheetApp.ProtectionType.SHEET);
  var protection = existing.length ? existing[0] : sheet.protect();

  protection.setDescription('Élő export — a szinkron írja felül, kézzel ne szerkeszd.');

  // A tulajdonost a Google nem engedi eltávolítani, és nem is kell: a szkript
  // az ő nevében fut, tehát írni tud a lapra.
  try {
    protection.removeEditors(protection.getEditors());
  } catch (err) {
    // Egyedül a tulajdonos maradt, ez a várt állapot.
  }

  if (protection.canDomainEdit()) protection.setDomainEdit(false);
}

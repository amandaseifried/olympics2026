// ===== SETUP INSTRUCTIONS =====
// 1. Go to Google Sheets and create a new spreadsheet
// 2. Name it "Olympics 2026 Pool"
// 3. Click Extensions > Apps Script
// 4. Delete any code in the editor and paste THIS ENTIRE FILE
// 5. Click Deploy > New deployment
// 6. Select type: "Web app"
// 7. Set "Execute as": Me
// 8. Set "Who has access": Anyone
// 9. Click Deploy and authorize when prompted
// 10. Copy the Web App URL and paste it into index.html and results.html
//     (replace the YOUR_GOOGLE_SCRIPT_URL_HERE placeholder)
//
// IMPORTANT: After updating this code, you must create a NEW deployment
// (Deploy > New deployment), not just save. Then update the URL in the HTML files.
// ================================

function getOrCreateSheet(name, headers) {
  var ss = SpreadsheetApp.getActiveSpreadsheet();
  var sheet = ss.getSheetByName(name);
  if (!sheet) {
    sheet = ss.insertSheet(name);
    sheet.appendRow(headers);
  }
  return sheet;
}

function doGet(e) {
  try {
    var action = e.parameter.action || 'getAll';

    if (action === 'submit') {
      var submitData = JSON.parse(e.parameter.data);
      return submitPicks(submitData);
    } else if (action === 'setWinners') {
      var winnersInput = JSON.parse(e.parameter.data);
      return setWinners(winnersInput);
    } else if (action === 'deleteParticipant') {
      var deleteData = JSON.parse(e.parameter.data);
      return deleteParticipant(deleteData);
    }

    // Default: return all participants and winners
    var sheet = getOrCreateSheet('Responses', ['Name', 'Email', 'Picks', 'OpenEnded', 'Timestamp']);
    var data = sheet.getDataRange().getValues();

    var participants = [];
    for (var i = 1; i < data.length; i++) {
      if (data[i][0]) {
        participants.push({
          name: data[i][0],
          email: data[i][1] || '',
          picks: JSON.parse(data[i][2] || '{}'),
          openEnded: JSON.parse(data[i][3] || '{}'),
          timestamp: data[i][4]
        });
      }
    }

    var winnersSheet = getOrCreateSheet('Winners', ['QuestionId', 'Winner']);
    var winnersData = winnersSheet.getDataRange().getValues();
    var winners = {};
    for (var j = 1; j < winnersData.length; j++) {
      if (winnersData[j][0] !== '' && winnersData[j][1] !== '') {
        winners[winnersData[j][0]] = winnersData[j][1];
      }
    }

    return ContentService.createTextOutput(JSON.stringify({ participants: participants, winners: winners }))
      .setMimeType(ContentService.MimeType.JSON);

  } catch (err) {
    return ContentService.createTextOutput(JSON.stringify({ error: err.message }))
      .setMimeType(ContentService.MimeType.JSON);
  }
}

function submitPicks(data) {
  var sheet = getOrCreateSheet('Responses', ['Name', 'Email', 'Picks', 'OpenEnded', 'Timestamp']);
  var name = data.name;
  var email = data.email || '';
  var picks = data.picks || {};
  var openEnded = data.openEnded || {};

  var allData = sheet.getDataRange().getValues();
  var found = false;

  for (var i = 1; i < allData.length; i++) {
    if (allData[i][0] === name) {
      sheet.getRange(i + 1, 1, 1, 5).setValues([[
        name,
        email,
        JSON.stringify(picks),
        JSON.stringify(openEnded),
        new Date().toISOString()
      ]]);
      found = true;
      break;
    }
  }

  if (!found) {
    sheet.appendRow([
      name,
      email,
      JSON.stringify(picks),
      JSON.stringify(openEnded),
      new Date().toISOString()
    ]);
  }

  return ContentService.createTextOutput(JSON.stringify({ success: true }))
    .setMimeType(ContentService.MimeType.JSON);
}

function setWinners(data) {
  var sheet = getOrCreateSheet('Winners', ['QuestionId', 'Winner']);
  sheet.clear();
  sheet.appendRow(['QuestionId', 'Winner']);

  var entries = Object.entries(data.winners);
  for (var i = 0; i < entries.length; i++) {
    sheet.appendRow([entries[i][0], entries[i][1]]);
  }

  return ContentService.createTextOutput(JSON.stringify({ success: true }))
    .setMimeType(ContentService.MimeType.JSON);
}

function deleteParticipant(data) {
  var sheet = getOrCreateSheet('Responses', ['Name', 'Email', 'Picks', 'OpenEnded', 'Timestamp']);
  var allData = sheet.getDataRange().getValues();

  for (var i = 1; i < allData.length; i++) {
    if (allData[i][0] === data.name) {
      sheet.deleteRow(i + 1);
      break;
    }
  }

  return ContentService.createTextOutput(JSON.stringify({ success: true }))
    .setMimeType(ContentService.MimeType.JSON);
}

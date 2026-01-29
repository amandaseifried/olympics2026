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
// ================================

function getOrCreateSheet(name, headers) {
  const ss = SpreadsheetApp.getActiveSpreadsheet();
  let sheet = ss.getSheetByName(name);
  if (!sheet) {
    sheet = ss.insertSheet(name);
    sheet.appendRow(headers);
  }
  return sheet;
}

function doGet(e) {
  try {
    const sheet = getOrCreateSheet('Responses', ['Name', 'Email', 'Picks', 'OpenEnded', 'Timestamp']);
    const data = sheet.getDataRange().getValues();

    const participants = data.slice(1)
      .filter(row => row[0])
      .map(row => ({
        name: row[0],
        email: row[1] || '',
        picks: JSON.parse(row[2] || '{}'),
        openEnded: JSON.parse(row[3] || '{}'),
        timestamp: row[4]
      }));

    const winnersSheet = getOrCreateSheet('Winners', ['QuestionId', 'Winner']);
    const winnersData = winnersSheet.getDataRange().getValues();
    const winners = {};
    winnersData.slice(1).forEach(row => {
      if (row[0] !== '' && row[1] !== '') {
        winners[row[0]] = row[1];
      }
    });

    return ContentService.createTextOutput(JSON.stringify({ participants, winners }))
      .setMimeType(ContentService.MimeType.JSON);
  } catch (err) {
    return ContentService.createTextOutput(JSON.stringify({ error: err.message }))
      .setMimeType(ContentService.MimeType.JSON);
  }
}

function doPost(e) {
  try {
    const data = JSON.parse(e.postData.contents);
    const action = data.action;

    if (action === 'submit') {
      return submitPicks(data);
    } else if (action === 'setWinners') {
      return setWinners(data);
    } else if (action === 'deleteParticipant') {
      return deleteParticipant(data);
    }

    return ContentService.createTextOutput(JSON.stringify({ error: 'Unknown action' }))
      .setMimeType(ContentService.MimeType.JSON);
  } catch (err) {
    return ContentService.createTextOutput(JSON.stringify({ error: err.message }))
      .setMimeType(ContentService.MimeType.JSON);
  }
}

function submitPicks(data) {
  const sheet = getOrCreateSheet('Responses', ['Name', 'Email', 'Picks', 'OpenEnded', 'Timestamp']);
  const { name, email, picks, openEnded } = data;

  const allData = sheet.getDataRange().getValues();
  let found = false;

  for (let i = 1; i < allData.length; i++) {
    if (allData[i][0] === name) {
      sheet.getRange(i + 1, 1, 1, 5).setValues([[
        name,
        email || '',
        JSON.stringify(picks || {}),
        JSON.stringify(openEnded || {}),
        new Date().toISOString()
      ]]);
      found = true;
      break;
    }
  }

  if (!found) {
    sheet.appendRow([
      name,
      email || '',
      JSON.stringify(picks || {}),
      JSON.stringify(openEnded || {}),
      new Date().toISOString()
    ]);
  }

  return ContentService.createTextOutput(JSON.stringify({ success: true }))
    .setMimeType(ContentService.MimeType.JSON);
}

function setWinners(data) {
  const sheet = getOrCreateSheet('Winners', ['QuestionId', 'Winner']);
  sheet.clear();
  sheet.appendRow(['QuestionId', 'Winner']);

  Object.entries(data.winners).forEach(([qId, winner]) => {
    sheet.appendRow([qId, winner]);
  });

  return ContentService.createTextOutput(JSON.stringify({ success: true }))
    .setMimeType(ContentService.MimeType.JSON);
}

function deleteParticipant(data) {
  const sheet = getOrCreateSheet('Responses', ['Name', 'Email', 'Picks', 'OpenEnded', 'Timestamp']);
  const allData = sheet.getDataRange().getValues();

  for (let i = 1; i < allData.length; i++) {
    if (allData[i][0] === data.name) {
      sheet.deleteRow(i + 1);
      break;
    }
  }

  return ContentService.createTextOutput(JSON.stringify({ success: true }))
    .setMimeType(ContentService.MimeType.JSON);
}

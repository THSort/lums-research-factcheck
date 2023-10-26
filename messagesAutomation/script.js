const { google } = require('googleapis');

const { exec } = require('child_process');


async function _getGoogleSheetClient() {
    const auth = new google.auth.GoogleAuth({
        keyFile: './credentials.json',
        scopes: ['https://www.googleapis.com/auth/spreadsheets'],
    });
    const authClient = await auth.getClient();
    return google.sheets({
        version: 'v4',
        auth: authClient,
    });
}

async function _readGoogleSheet(googleSheetClient, sheetId, tabName, range) {
    try {
        const response = await googleSheetClient.spreadsheets.values.get({
            spreadsheetId: sheetId,
            range: `${tabName}!${range}`,
        });

        const rows = response.data.values;
        if (rows.length) {
            rows.forEach(row => {
                if (row.length > 0) {
                    console.log('Sending message to:', row[1]);
                    const command = `sudo npx mudslide send ${row[1]} 'Here are this week\'s fact checked articles: http://50.19.182.29/home/${row[1]}'`;
                    exec(command, (error, stdout, stderr) => {
                        if (error) {
                            console.error(`Error executing command: ${error}`);
                            return;
                        }
                        if (stderr) {
                            console.error(`stderr: ${stderr}`);
                            return;
                        }
                        console.log(`stdout: ${stdout}`);
                    });
                }
            });
        } else {
            console.log('No data found.');
        }
    } catch (e) {
        console.error('Error reading Google Sheet:', e);
    }
}

async function sendMessages(){
    const googleSheetClient = await _getGoogleSheetClient();
    _readGoogleSheet(googleSheetClient, '1gOfRk5BTon1VIxf1GaJc9G7ZZ6D0BpqCROxnQtVbS_I', 'Sheet1', 'A:B');
}

sendMessages();
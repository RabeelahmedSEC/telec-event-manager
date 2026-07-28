TELEC SMART EVENT MANAGER 2.0 - READY TO RUN

FIRST LOGIN
Username: admin
Password: Telec@2026

HOW TO RUN
1. Extract the ZIP file.
2. Double-click START_SERVER.bat.
3. The application opens at http://localhost:4310
4. Keep the black server window open while using the application.

MULTI-USER ACCESS
The Dashboard shows the network address. Other office users can open that address in Chrome/Edge while the main computer and server are running.
Admin can create Editor and Viewer accounts.

POSTER READER
The application can read JPG/PNG event posters and fill:
Event Date, Event Time, Family / Person Name, Event Type, Day, Venue / Location, City, Google Maps Link and Additional Details.
For AI poster reading, Admin must enter a Gemini API key once under Users & Settings. Normal manual event entry works without an API key.

GOOGLE SHEETS
Use "Export for Google Sheets" to download TELEC_Event_Data.csv, then import/upload it into Google Sheets.
A prepared Excel/Google Sheet template is included separately in the ZIP.

DATA SAFETY
Data is stored in the data folder. Backups are created before edits/deletes and can also be created manually.
Do not delete the data or backups folders.

GOOGLE SHEET CONNECTION (Updated Version)
-----------------------------------------
The Users & Settings page now includes:
- Gemini API Key
- Google Apps Script Web App URL
- Test Gemini button
- Test Google Sheet button
- Automatic Google Sheet sync option

The supplied Google Apps Script URL is already filled in. Paste the new Gemini API key, click Test Gemini, click Test Google Sheet, then Save Settings.
Every newly created event will be saved locally and also sent to the connected Google Sheet when automatic sync is enabled.


Version 2.5 update:
- Gemini model updated to Gemini 3.6 Flash.
- Automatic fallback to Gemini 3.5 Flash and 3.5 Flash-Lite.
- Existing Google Sheet connection and saved data preserved.

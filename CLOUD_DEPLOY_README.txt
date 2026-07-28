TELEC SMART EVENT MANAGER 2.6 - CLOUD READY

IMPORTANT
A ZIP file cannot stay online by itself. It must be uploaded to a 24/7 cloud host.
After deployment, the laptop may be switched off and users can open the public HTTPS URL.

RECOMMENDED: RAILWAY WITH A PERSISTENT VOLUME
1. Create a Railway account and a new empty project.
2. Upload this project through GitHub or Railway CLI.
3. Railway detects the Dockerfile automatically.
4. Add a persistent Volume and mount it at /app/data.
5. Add another Volume mount at /app/backups, or use one parent volume and update both variables.
6. Set environment variables:
   TELEC_DATA_DIR=/app/data
   TELEC_BACKUP_DIR=/app/backups
   NODE_ENV=production
7. Generate a public domain in Railway Settings > Networking.
8. Open the HTTPS URL and login.

RENDER
The included render.yaml requests a paid Starter web service and a 1 GB persistent disk.
Create a Blueprint from the repository containing these files.

FIRST LOGIN
Username: admin
Password: Telec@2026
Change/create user accounts immediately after deployment.

DATA SAFETY
Do not deploy without persistent storage. A host with an ephemeral filesystem can erase users,
events, API settings and backups when the service restarts or redeploys.

SECURITY
Gemini API Key is entered from Users & Settings after deployment.
Google Apps Script URL is already configured in the current database, but can be changed in Settings.
Use the HTTPS cloud URL, not a local 192.168.x.x address.

LOCAL TEST
Double-click START_CLOUD_LOCAL.bat, or run:
  npm install
  npm run cloud
Then open http://localhost:4310

HEALTH CHECK
Open /health after your cloud URL, for example:
  https://your-domain.example/health

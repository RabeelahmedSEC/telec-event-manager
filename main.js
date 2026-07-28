const {app,BrowserWindow,dialog}=require('electron');
const path=require('path');
let server;
async function create(){
  try{
    const base=app.isPackaged?process.resourcesPath:__dirname;
    process.env.TELEC_DATA_DIR=path.join(base,'data');
    process.env.TELEC_BACKUP_DIR=path.join(base,'backups');
    server=require('./server').start(4310);
    const w=new BrowserWindow({width:1450,height:900,minWidth:1100,minHeight:700,show:false,webPreferences:{contextIsolation:true,sandbox:true}});
    w.setMenuBarVisibility(false);
    await w.loadURL('http://127.0.0.1:4310');
    w.once('ready-to-show',()=>w.show());
  }catch(e){dialog.showErrorBox('TELEC Event Manager',e.message);app.quit();}
}
app.whenReady().then(create);
app.on('window-all-closed',()=>{if(server)server.close();if(process.platform!=='darwin')app.quit();});

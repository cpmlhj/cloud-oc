const {app, ipcMain, Menu, dialog} = require('electron');
const menuTemplate = require('./src/utils/menuTemplate');
const isDev = require('electron-is-dev');
const path = require('path');
const AppWindow = require('./AppWindow');
const Store = require('electron-store');
const settingStore = new Store({name: 'Settings'});
const fileStore = new Store({name: 'files Data'});
const qiniuConfig = ['accessKey', 'secretKey', 'bucketName'].every(k => !!settingStore.get(k));
const QiuniuManager = require('./src/utils/QiniuManager');
let mainWindow, settingsWindow;
const createManager = () => {
    const {accessKey, secretKey, bucketName} = settingStore.get()
    return new QiuniuManager(accessKey, secretKey, bucketName)
}
app.on('ready', () => {
    const mainWindowConfig = {
        width: 1024,
        height: 680,
        webPreferences: {
            nodeIntegration: true
        }
    };
    const urlLocation = isDev ? 'http://localhost:3000' : `file://${path.join(__dirname, './index.html')}`;
    mainWindow = new AppWindow(mainWindowConfig, urlLocation);
    mainWindow.on('settings.htmlclosed', () => {
        mainWindow = null;
    });
    const menu = Menu.buildFromTemplate(menuTemplate);
    Menu.setApplicationMenu(menu);
    //hook up main events
    ipcMain.on('open-settings-window', () => {
        const settingsWindowConfig = {
            width: 500,
            height: 400,
            parent: mainWindow
        };
        const settingsFileLocation = `file://${path.join(__dirname, './settings/settings.html')}`
        settingsWindow = new AppWindow(settingsWindowConfig, settingsFileLocation)
        settingsWindow.removeMenu();
        settingsWindow.on('closed', () => {
            settingsWindow = null;
        })
    });
    ipcMain.on('config-is-saved', () => {
        // watch out menu items index for mac and window
        let q = process.platform === 'darwin' ? menu.items[3] : menu.items[2]
        const switchItem = toggle => {
            [1, 2, 3].forEach(i => q.submenu.items[i].enabled = toggle)
        }
        if (qiniuConfig) {
            switchItem(true)
        } else {
            switchItem(false)
        }
    })
    ipcMain.on('upload-file', (event, data) => {
        const manager = createManager();
        manager.uploadFile(data.key, data.path)
            .then(data => mainWindow.webContents.send('success_upload'))
            .catch(err => dialog.showErrorBox('同步失败'))
    })
    ipcMain.on('download-file', (event, data) => {
        const manager = createManager();
        const filesObj = fileStore.get('files');
        const {key, path, id} = data
        manager.getStat(data.key).then(res => {
            const serverUpdatedTime = Math.round(res.putTime / 10000)
            const localTime = new Date(filesObj[id].updatedAt).getTime()
            if (serverUpdatedTime > localTime || !localTime) {
                manager.downLoadFile(key, path).then(() => {
                    mainWindow.webContents.send('file-down-load', {status: 'download-success', id})
                })
            } else {
                mainWindow.webContents.send('file-down-load', {status: 'no-new-file', id})
            }
        }).catch(err => {
            console.log(err)
            if (err.statusCode === 612) {
                mainWindow.webContents.send('file-down-load', {status: 'no-file', id})
            }
        })
    })
    ipcMain.on('upload-all-to-qi', () => {
        mainWindow.webContents.send('loading-status', true)
        const manager = createManager();
        const filesObj = fileStore.get('files') || {}
        const uploadPromiseArr = Object.keys(filesObj).forEach(k => {
            const file = filesObj[k];
            return manager.uploadFile(`${file.title}.md`, file.path)
        })
        Promise.all(uploadPromiseArr).then(s => {
            dialog.showMessageBox({
                type: 'info',
                title: `成功上传了${s.length}`,
                message: `成功上传了${s.length}`
            });
            mainWindow.webContents.send('file-uploaded')
        }).catch(err => dialog.showErrorBox('同步失败'))
            .finally(() => mainWindow.webContents.send('loading-status', false))
    })
    ipcMain.on('rename-file', (event, data) => {
        const manager = createManager();
        const {oldKey, key} = data;
        manager.renameFile(oldKey, key)
            .then(res => {
                mainWindow.webContents.send('rename_file_callback')
            })
            .catch(err => mainWindow.webContents.send('rename_file_callback', err))
    })
    ipcMain.on('deleteFile', (event, data) => {
        const manager = createManager();
        manager.getStat(data.key).then(res => {
            if (res) {
                manager.deleteFile(data.key)
            }
            mainWindow.webContents.send('delete_file')
        }).catch(err => console.log(err))
    })
});


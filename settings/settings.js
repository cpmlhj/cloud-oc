const {remote, ipcRenderer} = require('electron');
const Store = require('electron-store');
const settingsStore = new Store({name: 'Settings'});
const qiniuConfig = ['#savedFileLocation', '#accessKey', '#secretKey', '#bucketName']
const $ = (selector) => {
    const result = document.querySelectorAll(selector);
    return result.length > 1 ? result : result[0]
};

(function () {
    document.addEventListener('DOMContentLoaded', () => {
        let savedLocation = settingsStore.get('saveFileLocation');
        if (savedLocation) {
            $('#savedFileLocation').value = savedLocation
        }
        qiniuConfig.forEach(s => {
            console.log(settingsStore.get(s.substr(1)));
            const saveValue = settingsStore.get(s.substr(1));
            if(saveValue) {
                $(s).value = saveValue
            }
        })
        $('#select-new-location').addEventListener('click', () => {
            remote.dialog.showOpenDialog({
                properties: ['openDirectory'],
                message: '选择文件的存储路径'
            }, (path) => {
                if (Array.isArray(path)) {
                    $('savedFileLocation').value = path[0]
                }
            })
        });
        $('#settings-form').addEventListener('submit', (e) => {
            e.preventDefault();
            qiniuConfig.forEach(i => {
                if ($(i)) {
                    let {id, value} = $(i);
                    console.log(id + '+' + value)
                    settingsStore.set(id, value ? value : '')
                }
            });
            ipcRenderer.send('config-is-saved')
            // remote.getCurrentWindow().close()
        })
        $('.nav-tabs').addEventListener('click', (e) => {
            e.preventDefault();
            $('.nav-link').forEach(element => {
                element.classList.remove('active')
            });
            e.target.classList.add('active')
            $('.config-area').forEach(element => {
                element.style.display = 'none'
            });
            $(e.target.dataset.tab).style.display = 'block'
        })
    });
})();


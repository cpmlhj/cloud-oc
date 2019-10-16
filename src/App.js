import React, {useEffect, useState} from 'react';
import FileSearch from './component/FileSearch'
import FileList from './component/FileList'
import BottomBtn from './component/ButtonBtn'
import TabList from './component/TabList'
import loader from './component/loader'
import uuidV4 from 'uuid/v4'
import fileHelper from './utils/fileHelper'
import {flattenArr, objToArr, timeStampToString} from './utils/helper'
import {faPlus, faFileImport, faSave} from '@fortawesome/free-solid-svg-icons'
import {join, basename, extname, dirname} from 'path'
import useIpcRenderer from './hooks/useIpcRenderer'
import SimpleMde from 'react-simplemde-editor'
import 'bootstrap/dist/css/bootstrap.min.css'
import './App.css'
import 'easymde/dist/easymde.min.css'

const {remote, ipcRenderer} = window.require('electron');
const Store = window.require('electron-store');
const fileStore = new Store({'name': 'Files Data'});
const settingsStore = new Store({name: 'Settings'});
const getAutoSync = ['accessKey', 'secretKey', 'bucketName', 'enableAutoSync'].every(k => !!settingsStore.get(k));
const saveFilesToStore = files => {
    // wo dont have to store any info in file system
    const fileStoreObj = objToArr(files).reduce((result, file) => {
        const {id, path, title, createdAt, isSynced, updatedAt} = file;
        result[id] = {
            id, path, title, createdAt, isSynced, updatedAt
        };
        return result;
    }, {});
    fileStore.set('files', fileStoreObj)
};

function App() {
    const [files, setFiles] = useState(fileStore.get('files') || {});
    const [activeFileID, setActiveID] = useState('');
    const [openedFileIDs, setOpenedFilesIDs] = useState([]);
    const [unsavedFileIDs, setunsavedFileIDs] = useState([]);
    const [searchFiles, setSearchFile] = useState([]);
    const [isLoading, setLoading] = useState(false)
    const openFiles = openedFileIDs.map(openId => files[openId]);
    const activeFile = files[activeFileID];
    const fileArr = objToArr(files);
    const savedLocation = settingsStore.get('savedFileLocation') || remote.app.getPath('documents');
    const fileClick = (fileId) => {
        // set Current a  ctive file
        setActiveID(fileId);
        const currentFile = files[fileId];
        const {id, title, path, isLoaded} = currentFile
        if (getAutoSync) {
            ipcRenderer.send('download-file', {key: `${title}.md`, path, id})
        } else {
            if (!isLoaded) {
                fileHelper.readFile(path).then(value => {
                    const newFile = {... files[fileId], body: value, isLoaded: true};
                    setFiles({...files, [fileId]: newFile})
                })
            }
            // add new fileId to openedFiles
        }
        if (!openedFileIDs.includes(fileId)) {
            setOpenedFilesIDs([...openedFileIDs, fileId])
        }
    };
    const TabClick = (id) => {
        // set current active file
        setActiveID(id);
    };
    const CloseTab = (id) => {
        const tabsWithout = openedFileIDs.filter(fileId => fileId !== id);
        setOpenedFilesIDs(tabsWithout);
        // set the active to the first opened tab if still tabs left
        if (tabsWithout.length > 0) {
            setActiveID(tabsWithout[0])
        } else {
            setActiveID('')
        }
    };
    const fileChange = (id, value) => {
        if (value === files[id].body) return;
        const newFile = {...files[id], body: value};
        setFiles({...files, [id]: newFile});
        // update unsavedIDs
        if (!unsavedFileIDs.includes(id)) {
            setunsavedFileIDs([...unsavedFileIDs, id])
        }
    };
    const deleteFile = (id) => {
        if (files[id].isNew) {
            const {[id]: value, ...afterDelete} = files;
            setFiles(afterDelete);
        } else {
            fileHelper.deleteFile(files[id].path).then(() => {
                const {[id]: value, ...afterDelete} = files;
                ipcRenderer.send('deleteFile', {key: `${files[id].title}.md`});
                setFiles(afterDelete);
                CloseTab(id);
                saveFilesToStore(afterDelete)
            })
        }
    };
    const updateFileName = (id, title, isNew) => {
        // loop through files and update tht title
        const newPath = isNew ? join(savedLocation, `${title}.md`) : join(dirname(files[id].path), `${title}.md`)
        const modifFile = {...files[id], title, isNew: false, path: newPath};
        const newFiles = {...files, [id]: modifFile};
        const json_file = fileStore.get('files')
        const res = Object.keys(fileStore.get('files')).some((item) => {
            return json_file[item].title === title
        });
        if (isNew) {
            fileHelper.writeFile(newPath, files[id].body).then(() => {
                setFiles(newFiles);
                saveFilesToStore(newFiles)
            })
        } else {
            const oldPath = files[id].path
            fileHelper.renameFile(oldPath, newPath).then(() => {
                ipcRenderer.send('rename-file', {oldKey: `${files[id].title}.md`, key: `${title}.md`, path: newPath});
                console.log(newFiles);
                setFiles(newFiles);
                saveFilesToStore(newFiles)
            })
        }
    };
    const fileSearch = (keyword) => {
        // filter out the new files based on the key world
        const newFiles = fileArr.filter(file => file.title.includes(keyword))
        setSearchFile(newFiles)
    }
    const createNewFile = () => {
        const newID = uuidV4();
        const newFile = {
            id: newID,
            title: '',
            body: '##请输入Markwodn',
            createdAt: new Date().getTime(),
            isNew: true
        }
        setFiles({...files, [newID]: newFile})
    };
    const saveCurrentFile = () => {
        const {path, body, title} = activeFile;
        console.log(activeFile);
        fileHelper.writeFile(path, body).then(() => {
            setunsavedFileIDs(unsavedFileIDs.filter(id => id !== activeFile.id))

            if (getAutoSync) {
                ipcRenderer.send('upload-file', {key: `${title}.md`, path},)
            }
        })
    };
    const fileListArr = (searchFiles.length > 0) ? searchFiles : fileArr
    const importFiles = () => {
        remote.dialog.showOpenDialog({
            title: '选择导入的MarkDown文件',
            properties: ['openFile', 'multiSelections'],
            filters: [
                {name: 'MarkDown files', extensions: ['md']}
            ]
        }, (path) => {
            if (Array.isArray(path)) {
                const filteredPaths = path.filter(i => {
                    const alreadyFile = Object.values(files).find(f => {
                        return f.path === i
                    });
                    return !alreadyFile
                });
                const importArray = filteredPaths.map(p => {
                    return {
                        id: uuidV4(),
                        title: basename(p, extname(p)),
                        path: p
                    }
                });
                const newFiles = {...files, ...flattenArr(importArray)};
                setFiles(newFiles);
                saveFilesToStore(newFiles)
                if (importArray.length > 0) {
                    remote.dialog.showMessageBox({
                        type: 'info',
                        title: '成功导入'
                    })
                }
            }
        })
    };
    const UploadSuccess = () => {
        const {id} = activeFile;
        const modifiedFile = {...files[id], isSynced: true, updatedAt: new Date()}
        const newFiles = {...files, [id]: modifiedFile}
        setFiles(newFiles);
        saveFilesToStore(newFiles)
    };
    const fileDownLoad = (event, message) => {
        const currentFile = files[message.id];
        const {id, path} = currentFile;
        fileHelper.readFile(path).then(val => {
            let newFile;
            if (message.status === 'download-success') {
                newFile = {...files[id], body: val, isLoaded: true, isSynced: true, updatedAt: new Date().getTime()}
            } else {
                newFile = {...files[id], body: val, isLoaded: true}
            }
            const newFiles = {...files, [id]: newFile}
            setFiles(newFiles);
            saveFilesToStore(newFiles)
        })
    };
    const loadingStatus = (message, staus) => setLoading(staus);
    const fileUploaded = () => {
        const newFiles = objToArr(files).reduce((result, file) => {
            const currentTime = new Date().getTime()
            result[file.id] = {
                ...file,
                isSynced: true,
                updatedAt: currentTime
            };
            return result
        }, {});
        setFiles(newFiles);
        saveFilesToStore(newFiles)
    };
    const RenameFileCallback = (err) => {
        if(err.statusCode === 612)  {
            remote.dialog.showErrorBox({
                title: '云更新失败',
                content: '不存在该文件'
            })
        } else {
            remote.dialog.showMessageBox({
                type: 'info',
                title: '云同步成功',
                message: '云同步成功'
            })
        }
    };
    const deleteFileCallBack = () => {
        remote.dialog.showMessageBox({
            type: 'info',
            title: '删除成功',
            message: '删除成功'
        })
    }
    useIpcRenderer({
        'create-new-file': createNewFile,
        'import-file': importFiles,
        'save-edit-file': saveCurrentFile,
        'success_upload': UploadSuccess,
        'file-down-load': fileDownLoad,
        'loading-status': loadingStatus,
        'file-uploaded': fileUploaded,
        'rename_file_callback': RenameFileCallback,
        'delete_file': deleteFileCallBack
    });
    console.log(activeFile);
    return (
        <div className="App">
            <header className="App-header container-fluid px-0">
                {
                    isLoading && <loader/>
                }
                <div className="row">
                    <div className="col-3 left-panel pr-0">
                        <FileSearch
                            title={'我的云文档'}
                            onFileSearch={(value) => {
                                fileSearch(value)
                            }}
                        />
                        <FileList
                            files={fileListArr}
                            onFileClick={(id) => fileClick(id)}
                            onFileDelete={(id) => deleteFile(id)}
                            onSaveEdit={(id, value, isNew) => updateFileName(id, value, isNew)}
                        />
                        <div className="row no-gutters button-group">
                            <div className="col ">
                                <BottomBtn
                                    text={'新建'}
                                    colorClass={'btn-primary'}
                                    icon={faPlus}
                                    onBtnClick={() => createNewFile()}
                                />
                            </div>
                            <div className="col no-gutters">
                                <BottomBtn
                                    text={'导入'}
                                    onBtnClick={importFiles}
                                    colorClass={'btn-success'}
                                    icon={faFileImport}
                                />
                            </div>
                        </div>
                    </div>
                    <div className="col-9 right-panel">
                        {
                            !activeFile &&
                            <div className='start-page'>
                                选择或者创建新的Markdown文档
                            </div>
                        }
                        {
                            activeFile &&
                            <>
                                <TabList
                                    files={openFiles}
                                    onTabClick={(id) => TabClick(id)}
                                    activeId={activeFileID}
                                    unSaveIds={unsavedFileIDs}
                                    onCloseTab={(id) => CloseTab(id)}
                                />
                                <SimpleMde
                                    key={activeFile && activeFile.id}
                                    value={activeFile && activeFile.body}
                                    onChange={(value) => {
                                        fileChange(activeFile.id, value)
                                    }}
                                    options={{
                                        minHeight: '515px'
                                    }}
                                />
                                {
                                    activeFile.isSynced && <span
                                        className={'sync-status'}>已同步，上次同步{timeStampToString(activeFile.updatedAt)}</span>
                                }
                                <BottomBtn
                                    text={'导入'}
                                    colorClass={'btn-success'}
                                    icon={faSave}
                                    onBtnClick={saveCurrentFile}
                                />
                            </>
                        }
                    </div>
                </div>
            </header>
        </div>
    );
}

export default App;

const {promises} = window.require('fs');
// const path = window.require('path');
const fileHelper = {
    readFile: (path) => {
        return promises.readFile(path, {encoding: 'utf8'})
    },
    writeFile: (path, content) => {
        return promises.writeFile(path, content, {encoding: 'utf8'})
    },
    renameFile: (path, newPath) => {
        return promises.rename(path, newPath)
    },
    deleteFile: (path) => {
        return promises.unlink(path)
    }
};

export default fileHelper

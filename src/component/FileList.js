import React, {useState, useEffect, useRef} from 'react'
import {FontAwesomeIcon} from '@fortawesome/react-fontawesome'
import {faEdit, faTimes, faTrash} from '@fortawesome/free-solid-svg-icons'
import PropTypes from 'prop-types'
import {faMarkdown} from '@fortawesome/free-brands-svg-icons'
import useKeyPress from '../hooks/useKeyPress'
import useContextMenu from '../hooks/useContextMenu'
import {getParentNode} from '../utils/helper'

const FileList = ({files, onFileClick, onSaveEdit, onFileDelete}) => {
    const [editStatus, setEditStatus] = useState(false);
    const [value, setValue] = useState('');
    const editKeyPress = useKeyPress(13);
    const escKeyPress = useKeyPress(27);
    const closeSearch = (fileItem) => {
        setEditStatus(false);
        setValue('');
        if (fileItem.isNew) {
            onFileDelete(fileItem.id)
        }
    };
    const cElement = useContextMenu([
        {
            label: '打开',
            click: () => {
                const parentElement = getParentNode(cElement.current, 'file-item')
                if (parentElement) {
                    onFileClick(parentElement.dataset.id)
                }
            }
        },
        {
            label: '重命名',
            click: () => {
                const parentElement = getParentNode(cElement.current, 'file-item')
                if (parentElement) {
                    setEditStatus(parentElement.dataset.id);
                    setValue(parentElement.dataset.title)
                }
            }
        },
        {
            label: '删除',
            click: () => {
                const parentElement = getParentNode(cElement.current, 'file-item')
                if (parentElement) {
                    onFileDelete(parentElement.dataset.id)
                }
            }
        }
    ], '.file-list', [files]);
    useEffect(() => {
        const fileItem = files.find(file => file.id === editStatus);
        if (editKeyPress && editStatus && value.trim() !== '') {
            onSaveEdit(fileItem.id, value, fileItem.isNew);
            setEditStatus(false);
            setValue('')
        }
        if (escKeyPress && editStatus) {
            closeSearch(fileItem)
        }
    });
    useEffect(() => {
        const newFile = files.find(file => file.isNew);
        if (newFile) {
            setEditStatus(newFile.id);
            setValue(newFile.title)
        }
    }, [files]);
    return (
        <ul className='list-group list-group-flush file-list'>
            {
                files.map(file => (
                    <li key={file.id}
                        data-id={file.id}
                        data-title={file.title}
                        className=' file-item row mx-0 list-group-item bg-light d-flex align-content-center'
                        style={{padding: '20px 10px'}}
                    >
                        {
                            (file.id !== editStatus && !file.isNew) &&
                            <>
                                <span className='col-2'>
                             <FontAwesomeIcon
                                 icon={faMarkdown}
                                 size='lg'
                             />
                        </span>
                                <span className='col-6 c-link'
                                      onClick={() => onFileClick(file.id)}
                                >
                            {file.title}
                            </span>
                            </>
                        }
                        {
                            ((file.id === editStatus) || file.isNew) &&
                            <>
                                <input
                                    className='form-control col-10'
                                    style={{height: '30px'}}
                                    value={value}
                                    placeholder={'请输入文件名称'}
                                    onChange={(e) => setValue(e.target.value)}
                                />
                                <button type={'button'} className='icon-button col-2' onClick={() => closeSearch(file)}>
                                    <FontAwesomeIcon
                                        icon={faTimes}
                                        size='lg'
                                        title='关闭'
                                    />
                                </button>
                            </>
                        }
                    </li>
                ))
            }
        </ul>
    )
};

FileList.propTypes = {
    files: PropTypes.array,
    onFileClick: PropTypes.func,
    onFileDelete: PropTypes.func,
    onSaveEdit: PropTypes.func
};

export default FileList

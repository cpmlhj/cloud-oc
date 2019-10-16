import React from 'react'
import PropTypes from 'prop-types'
import classNames  from 'classnames'
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome'
import { faTimes } from '@fortawesome/free-solid-svg-icons'
import './TabList.scss'
const TabList = ({files, activeId, unSaveIds, onTabClick, onCloseTab}) => {
    return (
        <ul className='nav nav-pills'>
            {
                files.map(file => {
                    console.log(activeId, files);
                    const withUnSavedMark = unSaveIds.includes(file.id);
                    const fClassName = classNames({
                        'nav-link': true,
                        'active': file.id === activeId,
                        'withUnSaved': withUnSavedMark
                    });
                    return (
                        <li className='nav-item tablist-component' key={file.id}>
                            <a href="#"
                               className={fClassName}
                               onClick={(e) => {
                                   e.preventDefault();
                                   onTabClick(file.id)
                               }}
                            >
                                {file.title}
                                <span
                                    className='ml-2 close-icon'
                                    onClick={(e) => {
                                        e.stopPropagation();
                                        onCloseTab(file.id)
                                    }}
                                >
                                      <FontAwesomeIcon
                                          icon={faTimes}
                                      />
                                </span>
                                {
                                    withUnSavedMark && <span className='ml-2 rounded-circle unsave-icon'></span>
                                }
                            </a>
                        </li>
                    )
                })
            }
        </ul>
    )
};
TabList.propTypes = {
    files: PropTypes.array,
    activeId: PropTypes.string,
    unSaveIds: PropTypes.array,
    onTabClick: PropTypes.func,
    onCloseTab: PropTypes.func
};
TabList.defaultsProps = {
    unSaveIds: []
};


export default TabList

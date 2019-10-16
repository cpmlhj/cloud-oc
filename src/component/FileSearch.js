import React, {useState, useEffect, useRef} from 'react'
import {FontAwesomeIcon} from '@fortawesome/react-fontawesome'
import {faSearch, faTimes} from '@fortawesome/free-solid-svg-icons'
import PropTypes from 'prop-types'
import useKeyPress from '../hooks/useKeyPress'

const FileSearch = ({title, onFileSearch}) => {
    const [inputActive, setInputActive] = useState(false);
    const [value, setValue] = useState('');
    const enterpressed = useKeyPress(13);
    const escPressed = useKeyPress(27);
    let node = useRef(null);
    const closeSearch = (e) => {
        e.preventDefault();
        setInputActive(false);
        setValue('')
        onFileSearch('')
    };
    useEffect(() => {
        if(enterpressed && inputActive) {
            onFileSearch(value)
        }
        if(escPressed && inputActive) {
            closeSearch()
        }
    });
    useEffect(() => {
        if (inputActive) {
            node.current.focus()
        }
    }, [inputActive]);
    return (
        <div style={{
            height: '53px'
        }} className='alert alert-primary d-flex justify-content-between align-content-center mb-0'>
            {
                !inputActive && <>
                    <span>{title}</span>
                    <button type={'button'} className='icon-button' onClick={() => setInputActive(true)}>
                        <FontAwesomeIcon
                            icon={faSearch}
                            size='lg'
                            title='搜索'
                        />
                    </button>
                </>
            }
            {
                inputActive && <>
                    <input
                        className='form-control'
                        style={{height: '30px'}}
                        value={value}
                        ref={node}
                        onChange={(e) => setValue(e.target.value)}
                    />
                    <button type={'button'} className='icon-button' onClick={closeSearch}>
                        <FontAwesomeIcon
                            icon={faTimes}
                            size='lg'
                            title='关闭'
                        />
                    </button>
                </>
            }
        </div>
    )
};
FileSearch.propTypes = {
    title: PropTypes.string,
    onFileSearch: PropTypes.func.isRequired
};
FileSearch.defaultProps = {
    title: '我的云文档'
};

export default FileSearch

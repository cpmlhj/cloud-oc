import React, {useState, useEffect, useRef} from 'react'

const useKeyPress = (Code) => {
    const [keyPressed, setKeyPress] = useState(false);
    const keyDownHandler = ({keyCode}) => {
        if(keyCode === Code) {
            setKeyPress(true)
        }
    };
    const keyUpHandler = ({keyCode}) => {
        if (keyCode === Code) {
            setKeyPress(false)
        }
    }
    useEffect(() => {
        document.addEventListener('keydown', keyDownHandler);
        document.addEventListener('keyup', keyUpHandler);
        return () => {
            document.removeEventListener('keydown', keyDownHandler);
            document.removeEventListener('keyup', keyUpHandler)
        }
    }, []) ;
    return keyPressed
};

export default useKeyPress

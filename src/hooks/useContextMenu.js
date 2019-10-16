import {useEffect, useRef} from 'react'

const {remote} = window.require('electron');
const {Menu, MenuItem} = remote;

const useContextMenu = (itemArr, targetSelect, deps) => {
    let clickElement = useRef(null);
    useEffect(() => {
        const menu = new Menu();
        itemArr.forEach(i => {
            menu.append(new MenuItem(i))
        });
        const handleContextMenu = (e) => {
            //only the context menu on current dom element or targetSelector containers
            if (document.querySelector(targetSelect).contains(e.target)) {
                clickElement.current = e.target;
                menu.popup({
                    window: remote.getCurrentWindow()
                })
            }
        };
        window.addEventListener('contextmenu', handleContextMenu)
        return () => {
            window.removeEventListener('contextmenu', handleContextMenu)
        }
    }, deps);
    return clickElement
};

export default useContextMenu

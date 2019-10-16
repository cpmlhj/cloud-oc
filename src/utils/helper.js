export const flattenArr = (arr) => {
    return arr.reduce((map, item) => {
        map[item.id] = item;
        return map
    }, {})
};

export const objToArr = (obj) => {
    return Object.keys(obj).map(key => {
        return obj[key]
    })
};

export const getParentNode = (node, parentClassName) => {
    let current = node;
    while (current !== null) {
        if (current.classList.contains(parentClassName)) {
            return current
        }
        current = current.parentNode
    }
    return false
};
export const timeStampToString = (timeStamp) => {
    const data = new Date(timeStamp)
    return data.toLocaleDateString() + '' + data.toLocaleTimeString()
};

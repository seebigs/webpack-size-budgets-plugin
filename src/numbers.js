const bytes = require('bytes');

function parseBytes(str) {
    return bytes.parse(str);
}

function readableBytes(num) {
    return bytes(num, {
        decimalPlaces: 2,
        unitSeparator: ' ',
    });
}

function tableBytes(num, decimals) {
    if (num) {
        return bytes(num, {
            decimalPlaces: decimals || 0,
            unitSeparator: ' ',
        });
    }
    return '-';
}

function tablePercent(value) {
    if (value > 0) {
        return `+${value.toFixed(2)} %`;
    }
    if (value < 0) {
        return `${value.toFixed(2)} %`;
    }
    return '-';
}

function toFixed(num, decimals) {
    return typeof num === 'number' ? num.toFixed(decimals) : '';
}

module.exports = {
    parseBytes,
    readableBytes,
    tableBytes,
    tablePercent,
    toFixed,
};

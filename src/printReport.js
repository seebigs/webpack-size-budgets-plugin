const each = require('seebigs-each');
const getProperty = require('get-prop-safe');
const { Table } = require('console-table-printer');
const { tableBytes, tablePercent } = require('./numbers.js');

function rowColor(changePercent) {
    const minPercent = 0.5;
    if (changePercent > minPercent) {
        return 'red';
    }
    if (changePercent < -minPercent) {
        return 'cyan';
    }
    return 'white';
}

function printReport(report) {
    const printTable = new Table({
        title: 'Asset Sizes (vs last build)',
        columns: [
            { name: 'Asset', alignment: 'left', color: 'white' },
        ],
    });

    each(report.assets, (stats, assetName) => {
        const bundleSize = getProperty(stats, 'bundle.size');
        const bundleChange = getProperty(stats, 'bundle.changePercent');
        const sourceSize = getProperty(stats, 'source.size');
        const sourceChange = getProperty(stats, 'source.changePercent');
        const nodeModulesSize = getProperty(stats, 'nodeModules.size');
        const nodeModulesChange = getProperty(stats, 'nodeModules.changePercent');
        printTable.addRow({
            'Asset': assetName,
            'Bundle Size': tableBytes(bundleSize),
            'Bundle ↑↓': tablePercent(bundleChange),
            'Source Size': tableBytes(sourceSize),
            'Source ↑↓': tablePercent(sourceChange),
            'Node Modules Size': tableBytes(nodeModulesSize),
            'Node Modules ↑↓': tablePercent(nodeModulesChange),
        }, {
            color: rowColor(bundleChange),
        });
    });

    console.log('');
    printTable.printTable();
    console.log('');
}

module.exports = printReport;

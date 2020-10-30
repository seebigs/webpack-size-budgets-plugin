const fs = require('fs');
const path = require('path');
const getProperty = require('get-prop-safe');
const each = require('seebigs-each');
const checkBudgets = require('./checkBudgets.js');
const printReport = require('./printReport.js');

const historyFilePath = path.resolve(__dirname, '../.history');

function getHistory() {
    try {
        const historyFile = fs.readFileSync(historyFilePath, 'utf8');
        return JSON.parse(historyFile);
    } catch (err) {
        // missing or malformed history file
    }
    return {};
}

function saveHistory(report) {
    fs.writeFile(historyFilePath, JSON.stringify(report, null, 4), () => {});
}

function calculateSizeChange(currentSize, previousSize) {
    previousSize = previousSize || 0;
    const sizeDiff = currentSize - previousSize;
    return {
        size: currentSize,
        changeAmount: previousSize ? sizeDiff : undefined,
        changePercent: previousSize ? ((sizeDiff) / (previousSize || 1)) * 100 : undefined,
    };
}

function pluginHandler(pluginName, config) {
    return (compilation) => {
        const assets = {};
        const currentAssets = compilation.getStats().toJson().assets || [];
        const currentChunks = compilation.getStats().toJson().chunks || [];
        const history = getHistory();

        currentAssets.forEach((currentAsset) => {
            const previousAsset = (history.assets || {})[currentAsset.name] || {};
            let sourceSize = 0;
            let nodeModulesSize = 0;
            const nodeModulesList = {};

            each(currentAsset.chunks, (chunkId) => {

                function walkModules(modules) {
                    each(modules, (mod) => {
                        if (mod.modules && mod.modules.length) {
                            walkModules(mod.modules);
                        } else {
                            const modName = mod.name || '';
                            if (modName.indexOf('(webpack)') === 0) {
                                // what to do with these modules?
                            } else if (modName.indexOf('./node_modules/') === 0) {
                                nodeModulesSize += mod.size;
                                nodeModulesList[modName] = mod.size;
                            } else {
                                sourceSize += mod.size;
                            }
                        }
                    });
                }

                const matchingChunk = currentChunks.find((c) => c.id === chunkId);
                walkModules([matchingChunk]);
            });

            const nodeModules = calculateSizeChange(nodeModulesSize, getProperty(previousAsset, 'nodeModules.size'));
            nodeModules.modules = nodeModulesList;
            const currentStats = {
                name: currentAsset.name,
                bundle: calculateSizeChange(currentAsset.size, getProperty(previousAsset, 'bundle.size')),
                source: calculateSizeChange(sourceSize, getProperty(previousAsset, 'source.size')),
                nodeModules,
            };
            assets[currentAsset.name] = currentStats;
            checkBudgets(pluginName, config, compilation, currentStats);
        });

        const report = {
            timestamp: Date.now(),
            assets,
        };

        if (config.saveHistory) {
            saveHistory(report);
        }

        if (config.printReport) {
            printReport(report);
        }
    };
}

module.exports = pluginHandler;

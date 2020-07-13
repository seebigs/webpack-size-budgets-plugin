const pluginHandler = require('./src/pluginHandler.js');

const pluginName = 'WebpackSizeBudgetsPlugin';

const defaultConfig = {
    budgets: {},
    printReport: true,
    saveHistory: true,
    severity: 'ERROR',
};

function WebpackSizeBudgetsPlugin(userConfig) {
    const config = {
        ...defaultConfig,
        ...userConfig,
    };

    return {
        apply: (compiler) => {
            compiler.hooks.afterEmit.tap(pluginName, pluginHandler(pluginName, config));
        },
    };
}

module.exports = WebpackSizeBudgetsPlugin;

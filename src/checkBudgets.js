const each = require('seebigs-each');
const getProperty = require('get-prop-safe');
const minimatch = require('minimatch');
const { parseBytes, readableBytes, toFixed } = require('./numbers.js');

function indent(x) {
    let spaces = '';
    for (let i = 0; i < x; i += 1) {
        spaces += '   ';
    }
    return spaces;
}

function printModules(modules) {
    let modStr = '';
    each(modules, (modSize, modName) => {
        modStr += `\n${indent(3)}${modName}: ${readableBytes(modSize)}`;
    });
    return modStr;
}

function checkBudgets(pluginName, config, compilation, currentStats) {

    function handleViolation(violation) {
        const severity = violation.severity || config.severity;
        const msg = `${pluginName}\n${indent(1)}${violation.message}${printModules(violation.modules)}`;
        if (severity === 'ERROR') {
            compilation.errors.push(msg);
        } else if (severity === 'WARN') {
            compilation.warnings.push(msg);
        } else if (severity === 'INFO') {
            console.log(`\n${msg}`);
        }
    }

    function checkBudget(allowed, current) {
        if (current.value > allowed.value) {
            handleViolation({
                severity: allowed.severity,
                message: `${currentStats.name}\n${indent(2)}${allowed.type} ${allowed.name} [${current.readable}] exceeded ${allowed.name} budget [${allowed.readable}]`,
                modules: current.modules,
            });
        }
    }

    let matchingBudgets;
    each(config.budgets, (budgetConfig, budgetMatcher) => {
        if (minimatch(currentStats.name, budgetMatcher)) {
            matchingBudgets = budgetConfig;
            return false; // break out of loop
        }
    });

    if (typeof matchingBudgets === 'string') {
        matchingBudgets = [{ threshold: matchingBudgets }];
    }

    each(matchingBudgets, (budget) => {
        const budgetType = budget.type || 'bundle';
        const budgetAttribute = budget.attribute || 'size';
        const optimized = budgetType === 'bundle' ? '' : ' (unoptimized)';
        const modules = getProperty(currentStats, `${budgetType}.modules`);

        const checks = {
            size: () => {
                const sizeBudget = parseBytes(budget.threshold);
                const currentSize = getProperty(currentStats, `${budgetType}.size`);
                checkBudget(
                    {
                        name: budgetAttribute,
                        type: budgetType,
                        value: sizeBudget,
                        readable: readableBytes(sizeBudget),
                        severity: budget.severity,
                    },
                    {
                        value: currentSize,
                        readable: `${readableBytes(currentSize)}${optimized}`,
                        modules,
                    },
                );
            },
            changeAmount: () => {
                const changeAmountBudget = parseBytes(budget.threshold);
                const currentChangeAmount = getProperty(currentStats, `${budgetType}.changeAmount`);
                checkBudget(
                    {
                        name: budgetAttribute,
                        type: budgetType,
                        value: changeAmountBudget,
                        readable: readableBytes(changeAmountBudget),
                        severity: budget.severity,
                    },
                    {
                        value: currentChangeAmount,
                        readable: `${readableBytes(currentChangeAmount)}${optimized}`,
                    },
                );
            },
            changePercent: () => {
                const changePercentBudget = budget.threshold;
                const currentChangePercent = getProperty(currentStats, `${budgetType}.changePercent`);
                checkBudget(
                    {
                        name: budgetAttribute,
                        type: budgetType,
                        value: changePercentBudget,
                        readable: `${changePercentBudget} %`,
                        severity: budget.severity,
                    },
                    {
                        value: currentChangePercent,
                        readable: `${toFixed(currentChangePercent, 2)} %`,
                    },
                );
            },
        };

        const check = checks[budgetAttribute];
        if (typeof check === 'function') {
            check();
        }
    });
}

module.exports = checkBudgets;

/*! @license rule-process
 * Copyright (c) 2025 geoffwo
 * This source code is licensed under the ISC license
 */

// 新增模块级变量控制日志
let enableLog = true

function setEnableLog(enable = true){
    enableLog = enable
}

function logStep(...args){
    if (!enableLog) return // 根据标志决定是否输出
    logStepInfo(...args)
}

function logStepInfo(...args){
    const prefix  = `${'='.repeat(40)}> `;
    console.log(prefix,...args);
}

module.exports = {
    logStep,
    logStepInfo,
    setEnableLog
};
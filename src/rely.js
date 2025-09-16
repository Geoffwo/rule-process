require('ffi-napi');//vosk依赖：node-gyp-build
require('ref-napi');//vosk依赖：ref-napi
require('node-gyp-build');//vosk依赖：node-gyp-build
require('vosk');//因为vosk，使用node高版本下载异常但是运行没有异常，所以需要直接添加模块，不进行下载；使用时，直接运行
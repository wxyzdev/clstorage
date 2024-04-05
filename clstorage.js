/*
 * How to load this module in content_script.js
 *
 * 1. Add the storage permission and "web_accessible_resources" key to manifest.json like:
 * ---
 * "permissions": ["storage"],
 * "web_accessible_resources": [{
 *     "matches": ["https://this-module-enabled-site/*"],
 *     "resources": ["this-module-filename.js"]
 * }],
 * ---
 * or add with other modules like:
 * ---
 * "permissions": ["storage"],
 * "web_accessible_resources": [{
 *     "matches": ["<all_urls>"],
 *     "resources": ["/your-module-located-dir/*.js"]
 * }],
 * ---
 * 
 * 2. Import this module at the head section of content_script.js like:
 * ---
 * var clstorage;
 * (async () => {
 *     clstorage = (await import(chrome.runtime.getURL("clstorage.js")));
 *     await clstorage.setLogging(true);
 *     await clstorage.setLevel('DEBUG');
 * })();
 * ---
 * or in the async function like:
 * ---
 * // Load this module by 'await loadModules();' in async function main().
 * var clstorage;
 * async function loadModules () {
 *     if(typeof clstorage === 'undefined'){
 *         clstorage = (await import(chrome.runtime.getURL("clstorage.js")));
 *         await clstorage.setLogging(true);
 *         await clstorage.setLevel('DEBUG');
 *     };
 *     return true;
 * }
 * ---
 * 
 * 3. Use this module in async functions like:
 * ---
 * await loadModules();  // Ensure the completion of the loading module.
 * ...
 * await clstorage.storeConfig('key1', value1);
 * var config1 = await clstorage.readConfig('key1');
 * console.log(config1);                                                 // value1
 * await clstorage.storeConfig('key2', value2);
 * await clstorage.storeConfig('key3', value3);
 * await clstorage.storeConfig('key4', value4);
 * await clstorage.removeConfig('key1');
 * var config2 = await clstorage.readConfig('key1');
 * console.log(config2);                                                 // undefined
 * var config3 = await clstorage.readConfigs(['key1', 'key2', 'key3']);
 * console.log(config3);                                                 // {'key2': value2, 'key3': value3}
 * var config4 = await clstorage.readConfigs(null);
 * console.log(config4);                                                 // {'key2': value2, 'key3': value3, 'key4': value4}
 * await clstorage.removeConfigs(['key2', 'key3']);
 * var config5 = await clstorage.readConfigs(null);
 * console.log(config5);                                                 // {'key4': value4}
 * var result = await clstorage.clearConfigs();
 * var config6 = await clstorage.readConfigs(null);
 * console.log(config6);                                                 // {}
 * ---
 * 
 */

'use strict';

/* ======================================== Global variable and functions to implement Logging ======================================== */
const LogLevel = {
    TRACE: 0,
    DEBUG: 1,
    INFO: 2,
    WARN: 3,
    ERROR: 4,
    FATAL: 5,
    OFF: 6,
    UNKNOWN: 9
}
let _loggingLevel = LogLevel.OFF;
let _isLogging = false;

/** 
 * @return {object} An associative array of functions that are based on console.log.
 * @note _logger().info('This is a test.');           //   [2023-04-05T06:07:08.090Z] [INFO] (clstorage)  This is a test.
 *       _logger().object({'a':1, 'b':2});            //   [2023-04-05T06:07:08.091Z] [INFO] (clstorage)  >{'a':1, 'b':2}
 *       _logger().debug('object: ', {'a':1, 'b':2}); //   [2023-04-05T06:07:08.092Z] [DEBUG] (clstorage)  object: >{'a':1, 'b':2}
 *       _logger().errobj(err);                       // x > [2023-04-05T06:07:08.093Z] [ERROR] (clstorage)  TypeError: Cannot read properties of ...
 *       _logger().fatal('', err);                    // x > [2023-04-05T06:07:08.094Z] [FATAL] (clstorage)  TypeError: Cannot read properties of ...
 */
var _logger = () => {
    return {
        trace: (() => {
            if(_loggingLevel <= LogLevel.TRACE && _isLogging){
                return console.debug.bind(console, '%s%s', '[' + (new Date).toJSON() + '] [TRACE] (clstorage)  ');
            }else{
                return () => {};
            };
        })(),
        debug: (() => {
            if(_loggingLevel <= LogLevel.DEBUG && _isLogging){
                return console.debug.bind(console, '%s%s', '[' + (new Date).toJSON() + '] [DEBUG] (clstorage)  ');
            }else{
                return () => {};
            };
        })(),
        log: (() => {
            if(_loggingLevel <= LogLevel.INFO && _isLogging){
                return console.info.bind (console, '%s%s', '[' + (new Date).toJSON() + '] [INFO] (clstorage)  ');
            }else{
                return () => {};
            };
        })(),
        object: (() => {
            if(_loggingLevel <= LogLevel.INFO && _isLogging){
                return console.info.bind (console, '%s%o', '[' + (new Date).toJSON() + '] [INFO] (clstorage)  ');
            }else{
                return () => {};
            };
        })(),
        info: (() => {
            if(_loggingLevel <= LogLevel.INFO && _isLogging){
                return console.info.bind (console, '%s%s', '[' + (new Date).toJSON() + '] [INFO] (clstorage)  ');
            }else{
                return () => {};
            };
        })(),
        warn: (() => {
            if(_loggingLevel <= LogLevel.WARN && _isLogging){
                return console.warn.bind (console, '%s%s', '[' + (new Date).toJSON() + '] [WARN] (clstorage)  ');
            }else{
                return () => {};
            };
        })(),
        error: (() => {
            if(_loggingLevel <= LogLevel.ERROR && _isLogging){
                return console.error.bind(console, '%s%s', '[' + (new Date).toJSON() + '] [ERROR] (clstorage)  ');
            }else{
                return () => {};
            };
        })(),
        errobj: (() => {
            if(_loggingLevel <= LogLevel.ERROR && _isLogging){
                return console.error.bind(console, '%s%o', '[' + (new Date).toJSON() + '] [ERROR] (clstorage)  ');
            }else{
                return () => {};
            };
        })(),
        fatal: (() => {
            if(_loggingLevel <= LogLevel.FATAL && _isLogging){
                return console.error.bind(console, '%s%s', '[' + (new Date).toJSON() + '] [FATAL] (clstorage)  ');
            }else{
                return () => {};
            };
        })()
    }
}

/** 
 * @param {string} string A string describing the log level of this module.
 * @return {number} A number of corresponding to the given LogLevel. 9 (LogLevel.UNKNOWN) if the given string is not able to be interpreted.
 */
function _convertStringIntoLevel(string) {
    let level = LogLevel.UNKNOWN;
    if(string == 'TRACE'){
        level = LogLevel.TRACE;
    }else if(string == 'DEBUG'){
        level = LogLevel.DEBUG;
    }else if(string == 'INFO'){
        level = LogLevel.INFO;
    }else if(string == 'WARN'){
        level = LogLevel.WARN;
    }else if(string == 'ERROR'){
        level = LogLevel.ERROR;
    }else if(string == 'FATAL'){
        level = LogLevel.FATAL;
    }else if(string == 'OFF'){
        level = LogLevel.OFF;
    };

    return level;
}

/** 
 * @param {string} level A string describing the log level of this module.
 * @return {Promise<boolean>}
 * @note await clstorage.setLevel('DEBUG');
 */
export async function setLevel(level) {
    if(_convertStringIntoLevel(level) <= LogLevel.OFF && _isLogging){
        _logger().info('Log level was set to ' + level + ' (' + _convertStringIntoLevel(level) + ').');
    }else if(_convertStringIntoLevel(level) > LogLevel.OFF && _isLogging){
        _logger().info('Log level was set to UNKNOWN (' + _convertStringIntoLevel(level) + ').');
    };
    _loggingLevel = _convertStringIntoLevel(level);

    return true;
}

/** 
 * @param {boolean} isLogging Set {@code true} to make this module output console log messages.
 * @return {Promise<boolean>}
 * @note await clstorage.setLogging(true);
 */
export async function setLogging(isLogging) {
    if(isLogging == true && !_isLogging){
        _logger().info('Enabled clstorage logging.');
    }else if(isLogging != true && _isLogging){
        _logger().info('Disabled clstorage logging.');
    };
    _isLogging = isLogging;

    return true;
}


/* ============================================= Functions to access Chrome Local Storage ============================================= */
/** 
 * @param {string} key A string of the key.
 * @return {Promise<object>} An object of the value corresponding to the given key. 'undefined' if there is no value.
 * @note var config = await clstorage.readConfig('key1');
 *       console.log(config); // value1
 */
export async function readConfig(key){
    _logger().trace('readConfig() was called.');

    let result = 'undefined';
    if(key !== null && typeof key === 'string'){
        await chrome.storage.local.get([key]).then((value) => {
            _logger().debug('current config.' + key + ' was', value[key], '.');
    
            result = value[key];
        }).catch((error) => {
            _logger().error('Failed to get config.' + key + '. Reason:', error);
        });
    };

    return result;
}

/** 
 * @param {string | array | object} key A string of the key or an array of string of keys. Pass {@code null} to retrieve the entire contents.
 * @return {Promise<object>} An object of the value corresponding to the given key or an associative array of contents corresponding to given keys. 
 *         'undefined' or {} if there is no value.
 * @note var configs = await clstorage.readConfigs(['key1', 'key2']);
 *       console.log(configs); // {'key1': value1, 'key2': value2, ...}
 */
export async function readConfigs(key){
    _logger().trace('readConfigs() was called.');

    let result = 'undefined';
    if(key !== null && typeof key === 'object' && Object.getPrototypeOf(key) === Array.prototype){
        await chrome.storage.local.get([...key]).then((value) => {
            _logger().debug('current config[' + [...key] + '] were', value, '.');

            result = value;
        }).catch((error) => {
            _logger().error('Failed to get config[' + [...key] + ']. Reason:', error);
        });
    }else if(key !== null && typeof key === 'string'){
        await chrome.storage.local.get([key]).then((value) => {
            _logger().debug('current config.' + key + ' was', value[key], '.');
    
            result = value;
        }).catch((error) => {
            _logger().error('Failed to get config.' + key + '. Reason:', error);
        });
    }else if(key === null){
        await chrome.storage.local.get(null).then((value) => {
            _logger().debug('current configs were', value, '.');
    
            result = value;
        }).catch((error) => {
            _logger().error('Failed to get all of configs. Reason:', error);
        });
    };

    return result;
}

/** 
 * @param {string} key A string of the key.
 * @param {object} value An object of the data corresponding to the given key.
 * @return {Promise<boolean>} {@code true} if the set of the key and value are stored Chrome Local Storage without any problems. 
 * @note var result = await clstorage.storeConfig('key', value);
 *       console.log(result); // true
 */
export async function storeConfig(key, value){
    _logger().trace('storeConfig() was called.');

    if(value === '' || value === null){
        value = '\'\''
    };

    let result = false;
    if(key !== null && typeof key === 'string'){
        await chrome.storage.local.set({[key]: value}).then(() => {
            _logger().info('config.' + key + ' was newly set to', value, '.');
    
            result = true;
        }).catch((error) => {
            _logger().error('Failed to set config.' + key + '. Reason:', error);
        });    
    };

    return result;
}

/** 
 * @param {string} key A string of the key.
 * @return {Promise<boolean>} {@code true} if the set of the given key and its corresponding value are removed from Chrome Local Storage without any problems. 
 * @note var result = await clstorage.removeConfig('key');
 *       console.log(result); // true
 */
export async function removeConfig(key){
    _logger().trace('removeConfig() was called.');

    let result = false;
    if(key !== null && typeof key === 'string'){
        await chrome.storage.local.remove([key]).then(() => {
            _logger().info('config.' + key + ' was removed.');

            result = true;
        }).catch((error) => {    
            _logger().error('Failed to remove config.' + key + '. Reason:', error);
        });
    };

    return result;
}

/** 
 * @param {string | array} key A string of the key or an array of string of keys.
 * @return {Promise<boolean>} {@code true} if all of the sets of the given keys and their corresponding values are removed from Chrome Local Storage without any problems. 
 * @note var result = await clstorage.removeConfigs(['key1', 'key2', ...]);
 *       console.log(result); // true
 */
export async function removeConfigs(key){
    _logger().trace('removeConfigs() was called.');

    let result = false;
    if(key !== null && typeof key === 'object' && Object.getPrototypeOf(key) === Array.prototype){
        await chrome.storage.local.remove([...key]).then(() => {
            _logger().info('config[' + [...key] + '] were removed.');

            result = true;
        }).catch((error) => {
            _logger().error('Failed to remove config[' + [...key] + ']. Reason:', error);
        });
    }else if(key !== null && typeof key === 'string'){
        await chrome.storage.local.remove([key]).then(() => {
            _logger().info('config.' + key + ' was removed.');

            result = true;
        }).catch((error) => {
            _logger().error('Failed to remove config.' + key + '. Reason:', error);
        });
    };

    return result;
}

/** 
 * @return {Promise<boolean>} {@code true} if the entire contents are removed from Chrome Local Storage without any problems. 
 * @note var result = await clstorage.clearConfigs();
 *       console.log(result); // true
 */
export async function clearConfigs(){
    _logger().trace('clearConfigs() was called.');

    let result = false;
    await chrome.storage.local.clear().then(() => {
        _logger().info('All configs and caches were cleared.');

        result = true;
    }).catch((error) => {
        _logger().error('Failed to clear all of data. Reason:', error);
    });

    return result;
}

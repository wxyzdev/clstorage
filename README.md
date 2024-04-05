# clstorage
A simple storage module for Chromium based browser extensions that helps store and retrieve user data locally and output log messages of storage operations.


## How to use
### 1. Add the storage permission and "web_accessible_resources" key to manifest.json like:
```json
"permissions": ["storage"],
"web_accessible_resources": [{
    "matches": ["https://this-module-enabled-site/*"],
    "resources": ["this-module-filename.js"]
}],
```

or add with other modules like:

```json
"permissions": ["storage"],
"web_accessible_resources": [{
    "matches": ["<all_urls>"],
    "resources": ["/your-module-located-dir/*.js"]
}],
```

### 2. Import this module at the head section of content_script.js like:

```javascript
var clstorage;
(async () => {
    clstorage = (await import(chrome.runtime.getURL("clstorage.js")));
    await clstorage.setLogging(true);
    await clstorage.setLevel('DEBUG');
})();
```

or in the async function like:

```javascript
// Load this module by 'await loadModules();' in async function main().
var clstorage;
async function loadModules () {
    if(typeof clstorage === 'undefined'){
        clstorage = (await import(chrome.runtime.getURL("clstorage.js")));
        await clstorage.setLogging(true);
        await clstorage.setLevel('DEBUG');
    };
    return true;
}
```

### 3. Use this module like:
```javascript
await loadModules();  // Ensure the completion of the loading module.
...
await clstorage.storeConfig('key1', value1);
var config1 = await clstorage.readConfig('key1');
console.log(config1);                                                 // value1
await clstorage.storeConfig('key2', value2);
await clstorage.storeConfig('key3', value3);
await clstorage.storeConfig('key4', value4);
await clstorage.removeConfig('key1');
var config2 = await clstorage.readConfig('key1');
console.log(config2);                                                 // undefined
var config3 = await clstorage.readConfigs(['key1', 'key2', 'key3']);
console.log(config3);                                                 // {'key2': value2, 'key3': value3}
var config4 = await clstorage.readConfigs(null);
console.log(config4);                                                 // {'key2': value2, 'key3': value3, 'key4': value4}
await clstorage.removeConfigs(['key2', 'key3']);
var config5 = await clstorage.readConfigs(null);
console.log(config5);                                                 // {'key4': value4}
var result = await clstorage.clearConfigs();
var config6 = await clstorage.readConfigs(null);
console.log(config6);                                                 // {}
```

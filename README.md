# WebdriverIO HTML Reporter

## Installation

```
npm install --save wdio-html-reporter
```

## Usage


In your `wdio.conf.js`:


```js
{
        reporters: ['html'],
        reporterOptions: {
                html: {
                        outFile: '/path/to/file.html'
                }
        }
}
```



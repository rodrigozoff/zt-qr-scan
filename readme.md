# zt-qr-scan

QR SCAN WebComponent / StencilJS 



# Installation

```
$ npm i @zoff-tech/zt-qr-scan
```


## Properties

| Property         | Attribute           | Description | Type                | Default     |
| ---------------- | ------------------- | ----------- | ------------------- | ----------- |
| `$canvas`        | --                  |             | `HTMLCanvasElement` | `undefined` |
| `$video`         | --                  |             | `HTMLVideoElement`  | `undefined` |
| `height`         | `height`            |             | `number`            | `undefined` |
| `showCanvas`     | `show-canvas`       |             | `boolean`           | `false`     |
| `showDetectedQR` | `show-detected-q-r` |             | `boolean`           | `true`      |
| `width`          | `width`             |             | `number`            | `undefined` |


## Events

| Event          | Description | Type                  |
| -------------- | ----------- | --------------------- |
| `codeDetected` |             | `CustomEvent<QRCode>` |


## Methods

### `hasCamera() => Promise<boolean>`



#### Returns

Type: `Promise<boolean>`



### `hasFlash() => Promise<any>`



#### Returns

Type: `Promise<any>`



### `isFlashOn() => Promise<boolean>`



#### Returns

Type: `Promise<boolean>`



### `pause() => Promise<void>`



#### Returns

Type: `Promise<void>`



### `scanImage(imageOrFileOrUrl: any, scanRegion?: any, canvas?: any) => Promise<void>`



#### Returns

Type: `Promise<void>`



### `setGrayscaleWeights(red: number, green: number, blue: number, useIntegerApproximation?: boolean) => Promise<void>`



#### Returns

Type: `Promise<void>`



### `setInversionMode(inversionMode: 'original' | 'invert' | 'both') => Promise<void>`



#### Returns

Type: `Promise<void>`



### `start() => Promise<void>`



#### Returns

Type: `Promise<void>`



### `stop() => Promise<void>`



#### Returns

Type: `Promise<void>`



### `toggleFlash() => Promise<any>`



#### Returns

Type: `Promise<any>`



### `turnFlashOff() => Promise<any>`



#### Returns

Type: `Promise<any>`



### `turnFlashOn() => Promise<any>`



#### Returns

Type: `Promise<any>`




----------------------------------------------

*Built with [StencilJS](https://stenciljs.com/)*

# License

The MIT License (MIT)

Copyright (c) 2021 Rodrigo Zoff

Permission is hereby granted, free of charge, to any person obtaining a copy of this software and associated documentation files (the "Software"), to deal in the Software without restriction, including without limitation the rights to use, copy, modify, merge, publish, distribute, sublicense, and/or sell copies of the Software, and to permit persons to whom the Software is furnished to do so, subject to the following conditions:

The above copyright notice and this permission notice shall be included in all copies or substantial portions of the Software.

THE SOFTWARE IS PROVIDED "AS IS", WITHOUT WARRANTY OF ANY KIND, EXPRESS OR IMPLIED, INCLUDING BUT NOT LIMITED TO THE WARRANTIES OF MERCHANTABILITY, FITNESS FOR A PARTICULAR PURPOSE AND NONINFRINGEMENT. IN NO EVENT SHALL THE AUTHORS OR COPYRIGHT HOLDERS BE LIABLE FOR ANY CLAIM, DAMAGES OR OTHER LIABILITY, WHETHER IN AN ACTION OF CONTRACT, TORT OR OTHERWISE, ARISING FROM, OUT OF OR IN CONNECTION WITH THE SOFTWARE OR THE USE OR OTHER DEALINGS IN THE SOFTWARE.

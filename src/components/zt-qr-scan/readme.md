# zt-qr-scan



<!-- Auto Generated Below -->


## Properties

| Property         | Attribute           | Description | Type                | Default     |
| ---------------- | ------------------- | ----------- | ------------------- | ----------- |
| `$canvas`        | --                  |             | `HTMLCanvasElement` | `undefined` |
| `$video`         | --                  |             | `HTMLVideoElement`  | `undefined` |
| `height`         | `height`            |             | `any`               | `undefined` |
| `showCanvas`     | `show-canvas`       |             | `boolean`           | `false`     |
| `showDetectedQR` | `show-detected-q-r` |             | `boolean`           | `true`      |
| `width`          | `width`             |             | `any`               | `undefined` |


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

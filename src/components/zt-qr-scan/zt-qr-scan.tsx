
import { Component, Host,  h, Method, Prop, Event, EventEmitter } from '@stencil/core';
import { QRCode } from "./zt-qr-scan-types"
import * as ztScanWorker from './zt-qr-scan.worker'

@Component({
  tag: 'zt-qr-scan',
  styleUrl: 'zt-qr-scan.css',
  shadow: true,
})
export class ZtQrScan {

  @Prop({ mutable: true, reflect: true }) width: number;
  @Prop({ mutable: true, reflect: true }) height: number;

  @Event() codeDetected: EventEmitter<QRCode>;

  @Prop()
  $video: HTMLVideoElement;

  @Prop({ mutable: true, reflect: true })
  showCanvas: boolean = false;

  @Prop({ mutable: true, reflect: true })
  showDetectedQR: boolean = true;

  @Prop()
  $canvas: HTMLCanvasElement;
  preferredFacingMode = 'environment'

  private _scanRegion: {
    x: number;
    y: number;
    width: number;
    height: number;
    downScaledWidth: any;
    downScaledHeight: any;
  };


  _legacyCanvasSize: any;
  _preferredFacingMode: string;
  _active: boolean;
  _paused: boolean;
  _flashOn: boolean;
  _qrEnginePromise: any;

  static defaultOptions = {
    DEFAULT_CANVAS_SIZE: 400,
  }

  canvas2dContext: CanvasRenderingContext2D;
  drawLine(begin, end, color) {

    if (!this.canvas2dContext)
      this.canvas2dContext = this.$canvas.getContext("2d");

    this.canvas2dContext.beginPath();
    this.canvas2dContext.moveTo(begin.x, begin.y);
    this.canvas2dContext.lineTo(end.x, end.y);
    this.canvas2dContext.lineWidth = 4;
    this.canvas2dContext.strokeStyle = color;
    this.canvas2dContext.stroke();
  }

  @Method()
  async hasCamera() {
    if (!navigator.mediaDevices) return Promise.resolve(false);
    // note that enumerateDevices can always be called and does not prompt the user for permission. However, device
    // labels are only readable if served via https and an active media stream exists or permanent permission is
    // given. That doesn't matter for us though as we don't require labels.
    return navigator.mediaDevices.enumerateDevices()
      .then(devices => devices.some(device => device.kind === 'videoinput'))
      .catch(() => false);
  }

  componentDidLoad() {
    (window as any).scanner = this;
    this._legacyCanvasSize = ZtQrScan.defaultOptions.DEFAULT_CANVAS_SIZE;
    this._preferredFacingMode = 'environment';
    this._active = false;
    this._paused = false;
    this._flashOn = false;

    this._scanRegion = this._calculateScanRegion();

    this._onPlay = this._onPlay.bind(this);
    this._onLoadedMetaData = this._onLoadedMetaData.bind(this);
    this._onVisibilityChange = this._onVisibilityChange.bind(this);

    // Allow inline playback on iPhone instead of requiring full screen playback,
    // see https://webkit.org/blog/6784/new-video-policies-for-ios/
    this.$video.playsInline = true;
    // Allow play() on iPhone without requiring a user gesture. Should not really be needed as camera stream
    // includes no audio, but just to be safe.
    this.$video.muted = true;
    (this.$video as any).disablePictureInPicture = true;
    this.$video.addEventListener('play', this._onPlay);
    this.$video.addEventListener('loadedmetadata', this._onLoadedMetaData);
    document.addEventListener('visibilitychange', this._onVisibilityChange);

  }

  /* async */
  @Method()
  async hasFlash() {
    if (!('ImageCapture' in window)) {
      return Promise.resolve(false);
    }

    const track = this.$video.srcObject ? (this.$video.srcObject as any).getVideoTracks()[0] : null;
    if (!track) {
      return Promise.reject('Camera not started or not available');
    }

    const imageCapture = new window['ImageCapture'](track);
    return imageCapture.getPhotoCapabilities()
      .then((result) => {
        return result.fillLightMode.includes('flash');
      })
      .catch((error) => {
        console.warn(error);
        return false;
      });
  }
  @Method()
  async isFlashOn() {
    return this._flashOn;
  }

  /* async */
  @Method()
  async toggleFlash() {
    return this._setFlash(!this._flashOn);
  }

  /* async */
  @Method()
  async turnFlashOff() {
    return this._setFlash(false);
  }

  /* async */
  @Method()
  async turnFlashOn() {
    return this._setFlash(true);
  }

  disconnectedCallback() {
    this.$video.removeEventListener('loadedmetadata', this._onLoadedMetaData);
    this.$video.removeEventListener('play', this._onPlay);
    document.removeEventListener('visibilitychange', this._onVisibilityChange);
    this.stop();
  }

  /* async */
  @Method()
  async start() {
    if (this._active && !this._paused) {
      return Promise.resolve();
    }
    if (window.location.protocol !== 'https:') {
      // warn but try starting the camera anyways
      console.warn('The camera stream is only accessible if the page is transferred via https.');
    }
    this._active = true;
    this._paused = false;
    if (document.hidden) {
      // camera will be started as soon as tab is in foreground
      return Promise.resolve();
    }
    clearTimeout(this._offTimeout);
    this._offTimeout = null;
    if (this.$video.srcObject) {
      // camera stream already/still set
      this.$video.play();
      return Promise.resolve();
    }

    let facingMode = this._preferredFacingMode;
    return this._getCameraStream(facingMode, true)
      .catch(() => {
        // We (probably) don't have a camera of the requested facing mode
        facingMode = facingMode === 'environment' ? 'user' : 'environment';
        return this._getCameraStream(); // throws if camera is not accessible (e.g. due to not https)
      })
      .then(stream => {
        // Try to determine the facing mode from the stream, otherwise use our guess. Note that the guess is not
        // always accurate as Safari returns cameras of different facing mode, even for exact constraints.
        facingMode = this._getFacingMode(stream) || facingMode;
        this.$video.srcObject = stream;
        this.$video.play();
        this._setVideoMirror(facingMode);
      })
      .catch(e => {
        this._active = false;
        throw e;
      });
  }

  _offTimeout: number;

  @Method()
  async stop() {
    this.pause();
    this._active = false;
  }

  @Method()
  async pause() {
    this._paused = true;
    if (!this._active) {
      return;
    }
    this.$video.pause();

    if (this._offTimeout) {
      return;
    }

    this._offTimeout = setTimeout(() => {
      const tracks = this.$video.srcObject ? (this.$video.srcObject as any).getTracks() : [];
      for (const track of tracks) {
        track.stop(); //  note that this will also automatically turn the flashlight off
      }
      this.$video.srcObject = null;
      this._offTimeout = null;
    }, 300);
  }

  /* async */
  @Method()
  async scanImage(imageOrFileOrUrl, scanRegion = null, canvas = null) {
    return this._loadImage(imageOrFileOrUrl).then(async (image) => {
      let canvasContext;
      [canvas, canvasContext] = this._drawToCanvas(image, scanRegion, canvas);

      // Enable scanning of inverted color qr codes. Not using _postWorkerMessage as it's async
      ztScanWorker.setInversionMode('both');
      const imageData = canvasContext.getImageData(0, 0, canvas.width, canvas.height);
      const result = await ztScanWorker.decode(imageData)
      if (result) {
        if (this.showDetectedQR) {
          this.drawLine(result.location.topLeftCorner, result.location.topRightCorner, "#FF3B58");
          this.drawLine(result.location.topRightCorner, result.location.bottomRightCorner, "#FF3B58");
          this.drawLine(result.location.bottomRightCorner, result.location.bottomLeftCorner, "#FF3B58");
          this.drawLine(result.location.bottomLeftCorner, result.location.topLeftCorner, "#FF3B58");
          await new Promise((resolve: (value: void) => void) => { setTimeout(() => { resolve() }, 2000) })
        }
        this.codeDetected.emit(result);
      }
    });
  }

  @Method()
  async setGrayscaleWeights(red: number, green: number, blue: number, useIntegerApproximation: boolean = true) {
    ztScanWorker.setGrayscaleWeights({ red, green, blue, useIntegerApproximation });
  }

  @Method()
  async setInversionMode(inversionMode: 'original' | 'invert' | 'both') {
    ztScanWorker.setInversionMode(inversionMode);
  }

  _onPlay() {
    this._scanRegion = this._calculateScanRegion();
    this._scanFrame();
  }

  _onLoadedMetaData() {
    this._scanRegion = this._calculateScanRegion();
  }

  _onVisibilityChange() {
    if (document.hidden) {
      this.pause();
    } else if (this._active) {
      this.start();
    }
  }

  _calculateScanRegion() {
    // Default scan region calculation. Note that this can be overwritten in the constructor.
    const smallestDimension = Math.min(this.$video.videoWidth, this.$video.videoHeight);
    const scanRegionSize = Math.round(2 / 3 * smallestDimension);
    return {
      x: (this.$video.videoWidth - scanRegionSize) / 2,
      y: (this.$video.videoHeight - scanRegionSize) / 2,
      width: scanRegionSize,
      height: scanRegionSize,
      downScaledWidth: this.width,
      downScaledHeight: this.height,
    };
  }

  async _scanFrame() {
    if (!this._active || this.$video.paused || this.$video.ended) return false;
    // using requestAnimationFrame to avoid scanning if tab is in background
    requestAnimationFrame(async () => {
      if (this.$video.readyState <= 1) {
        // Skip scans until the video is ready as drawImage() only works correctly on a video with readyState
        // > 1, see https://developer.mozilla.org/en-US/docs/Web/API/CanvasRenderingContext2D/drawImage#Notes.
        // This also avoids false positives for videos paused after a successful scan which remains visible on
        // the canvas until the video is started again and ready.
        this._scanFrame();
        return;
      }
      await this.scanImage(this.$video, this._scanRegion, this.$canvas)
      this._scanFrame()
    });
  }


  async _getCameraStream(facingMode?, exact = false) {
    const constraintsToTry = [{
      width: { min: 1024 }
    }, {
      width: { min: 768 }
    }, {}];

    if (facingMode) {
      if (exact) {
        facingMode = { exact: facingMode };
      }
      constraintsToTry.forEach((constraint: any) => constraint.facingMode = facingMode);
    }
    return this._getMatchingCameraStream(constraintsToTry);
  }

  async _getMatchingCameraStream(constraintsToTry) {
    if (!navigator.mediaDevices || constraintsToTry.length === 0) {
      return Promise.reject('Camera not found.');
    }
    return navigator.mediaDevices.getUserMedia({
      video: constraintsToTry.shift()
    }).catch(() => this._getMatchingCameraStream(constraintsToTry));
  }

  /* async */
  async _setFlash(on) {
    return this.hasFlash().then((hasFlash) => {
      if (!hasFlash) return Promise.reject('No flash available');
      // Note that the video track is guaranteed to exist at this point
      return (this.$video.srcObject as any).getVideoTracks()[0].applyConstraints({
        advanced: [{ torch: on }],
      });
    }).then(() => this._flashOn = on);
  }

  _setVideoMirror(facingMode) {
    // in user facing mode mirror the video to make it easier for the user to position the QR code
    const scaleFactor = facingMode === 'user' ? -1 : 1;
    this.$video.style.transform = 'scaleX(' + scaleFactor + ')';
  }

  _getFacingMode(videoStream) {
    const videoTrack = videoStream.getVideoTracks()[0];
    if (!videoTrack) return null; // unknown
    // inspired by https://github.com/JodusNodus/react-qr-reader/blob/master/src/getDeviceId.js#L13
    return /rear|back|environment/i.test(videoTrack.label)
      ? 'environment'
      : /front|user|face/i.test(videoTrack.label)
        ? 'user'
        : null; // unknown
  }

  _drawToCanvas(image, scanRegion = null, canvas = null) {
    canvas = canvas || document.createElement('canvas');
    const scanRegionX = scanRegion && scanRegion.x ? scanRegion.x : 0;
    const scanRegionY = scanRegion && scanRegion.y ? scanRegion.y : 0;
    const scanRegionWidth = scanRegion && scanRegion.width ? scanRegion.width : image.width || image.videoWidth;
    const scanRegionHeight = scanRegion && scanRegion.height ? scanRegion.height : image.height || image.videoHeight;
    /* if (!fixedCanvasSize) {
       canvas.width = scanRegion && scanRegion.downScaledWidth ? scanRegion.downScaledWidth : scanRegionWidth;
       canvas.height = scanRegion && scanRegion.downScaledHeight ? scanRegion.downScaledHeight : scanRegionHeight;
     }*/
    const context = canvas.getContext('2d', { alpha: false });
    context.imageSmoothingEnabled = false; // gives less blurry images
    context.drawImage(
      image,
      scanRegionX, scanRegionY, scanRegionWidth, scanRegionHeight,
      0, 0, canvas.width, canvas.height
    );
    return [canvas, context];
  }

  /* async */
  async _loadImage(imageOrFileOrBlobOrUrl) {
    if (imageOrFileOrBlobOrUrl instanceof HTMLCanvasElement || imageOrFileOrBlobOrUrl instanceof HTMLVideoElement
      || window.ImageBitmap && imageOrFileOrBlobOrUrl instanceof window.ImageBitmap
      || window.OffscreenCanvas && imageOrFileOrBlobOrUrl instanceof window.OffscreenCanvas) {
      return Promise.resolve(imageOrFileOrBlobOrUrl);
    } else if (imageOrFileOrBlobOrUrl instanceof Image) {
      return this._awaitImageLoad(imageOrFileOrBlobOrUrl).then(() => imageOrFileOrBlobOrUrl);
    } else if (imageOrFileOrBlobOrUrl instanceof File || imageOrFileOrBlobOrUrl instanceof Blob
      || imageOrFileOrBlobOrUrl instanceof URL || typeof (imageOrFileOrBlobOrUrl) === 'string') {
      const image = new Image();
      if (imageOrFileOrBlobOrUrl instanceof File || imageOrFileOrBlobOrUrl instanceof Blob) {
        image.src = URL.createObjectURL(imageOrFileOrBlobOrUrl);
      } else {
        image.src = imageOrFileOrBlobOrUrl as string;
      }
      return this._awaitImageLoad(image).then(() => {
        if (imageOrFileOrBlobOrUrl instanceof File || imageOrFileOrBlobOrUrl instanceof Blob) {
          URL.revokeObjectURL(image.src);
        }
        return image;
      });
    } else {
      return Promise.reject('Unsupported image type.');
    }
  }

  /* async */
  async _awaitImageLoad(image): Promise<void> {
    return new Promise((resolve, reject) => {
      if (image.complete && image.naturalWidth !== 0) {
        // already loaded
        resolve();
      } else {
        let onLoad, onError;
        onLoad = () => {
          image.removeEventListener('load', onLoad);
          image.removeEventListener('error', onError);
          resolve();
        };
        onError = () => {
          image.removeEventListener('load', onLoad);
          image.removeEventListener('error', onError);
          reject('Image load error');
        };
        image.addEventListener('load', onLoad);
        image.addEventListener('error', onError);
      }
    });
  }


  render() {
    return (
      <Host>
        <video ref={(el) => { this.$video = el; }} style={{ "display": "none" }} height={200} width={200}></video>
        <canvas ref={(el) => { this.$canvas = el; }} style={{ "display": (this.showCanvas ? "inline" : "none") }} height={this.height} width={this.width} ></canvas>
      </Host>
    );
  }

}

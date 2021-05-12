import jsQR, { GreyscaleWeights, QRCode } from 'jsqr-es6';

let inversionAttempts: "dontInvert" | "onlyInvert" | "attemptBoth" | "invertFirst" = 'dontInvert';

const grayscaleWeights = {
    // weights for quick luma integer approximation (https://en.wikipedia.org/wiki/YUV#Full_swing_for_BT.601)
    red: 77,
    green: 150,
    blue: 29,
    useIntegerApproximation: true,
};

export const close = async () => {

}

export const decode = async (params:{data:Uint8ClampedArray,width:number,height:number}): Promise<QRCode|undefined> => {
    const rgbaData = params.data;
    const width = params.width;
    const height = params.height;
    const result = jsQR(rgbaData, width, height, {
        inversionAttempts: inversionAttempts,
        greyScaleWeights: grayscaleWeights,
    });
    return result ? result : undefined;
}

export const setGrayscaleWeights = async (params:GreyscaleWeights) => {
    // update grayscaleWeights in a closure compiler compatible fashion
    grayscaleWeights.red = params.red;
    grayscaleWeights.green = params.green;
    grayscaleWeights.blue = params.blue;
    grayscaleWeights.useIntegerApproximation = params.useIntegerApproximation;
}

export const setInversionMode = async (inversionMode:'original' | 'invert' | 'both' ) => {
    switch (inversionMode) {
        case 'original':
            inversionAttempts = 'dontInvert';
            break;
        case 'invert':
            inversionAttempts = 'onlyInvert';
            break;
        case 'both':
            inversionAttempts = 'attemptBoth';
            break;
        default:
            throw new Error('Invalid inversion mode');
    }
}

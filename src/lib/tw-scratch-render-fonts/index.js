/* eslint-disable import/no-commonjs */

const SansSerif = require('./NotoSans-Medium.woff2');
const Serif = require('./SourceSerifPro-Regular.woff2');
const Handwriting = require('./handlee-regular.woff2');
const Marker = require('./Knewave.woff2');
const Curly = require('./Griffy-Regular.woff2');
const Pixel = require('./Grand9K-Pixel.woff2');
const Scratch = require('./ScratchSavers_b2.woff2');
const log = require('../log').default;

const fontSource = {
    'Sans Serif': SansSerif,
    'Serif': Serif,
    'Handwriting': Handwriting,
    'Marker': Marker,
    'Curly': Curly,
    'Pixel': Pixel,
    'Scratch': Scratch
};

const fontData = {};

const fetchWithTimeout = (url, ms) => {
    const controller = new AbortController();
    const timer = setTimeout(() => controller.abort(), ms);
    return fetch(url, {signal: controller.signal})
        .finally(() => clearTimeout(timer));
};

const fetchFonts = () => {
    const promises = [];
    for (const fontName of Object.keys(fontSource)) {
        const src = fontSource[fontName];
        // If the font source is already a data URI (inlined by url-loader),
        // use it directly — no network request needed. This avoids
        // TypeError: Failed to fetch when opening via file:// protocol.
        if (typeof src === 'string' && src.startsWith('data:')) {
            fontData[fontName] = `@font-face{font-family:"${fontName}";src:url("${src}");}`;
            promises.push(Promise.resolve());
            continue;
        }
        promises.push(fetchWithTimeout(src, 10000)
            .then(res => {
                if (!res.ok) {
                    throw new Error(`Cannot load font: ${fontName} (invalid HTTP response)`);
                }
                return res.blob();
            })
            .then(blob => new Promise((resolve, reject) => {
                const fr = new FileReader();
                fr.onload = () => resolve(fr.result);
                fr.onerror = () => reject(new Error(`Cannot load font: ${fontName} (could not read)`));
                fr.readAsDataURL(blob);
            }))
            .then(url => {
                fontData[fontName] = `@font-face{font-family:"${fontName}";src:url("${url}");}`;
            })
            .catch(err => {
                log.error(err);
            })
        );
    }
    return Promise.all(promises);
};

const addFontsToDocument = () => {
    if (document.getElementById('scratch-font-styles')) {
        return;
    }
    let css = '';
    for (const fontName of Object.keys(fontSource)) {
        const fontCSS = fontData[fontName];
        if (fontCSS) {
            css += fontCSS;
        }
    }
    const documentStyleTag = document.createElement('style');
    documentStyleTag.id = 'scratch-font-styles';
    documentStyleTag.textContent = css;
    document.body.insertBefore(documentStyleTag, document.body.firstChild);
};

const waitForFontsToLoad = () => {
    const promises = [];
    if (document.fonts && document.fonts.load) {
        for (const fontName in fontData) {
            promises.push(document.fonts.load(`12px ${fontName}`));
        }
    }
    return Promise.all(promises);
};

const loadFonts = () => fetchFonts()
    .then(() => {
        addFontsToDocument();
        return waitForFontsToLoad();
    })
    .catch(err => {
        log.error(err);
    });

const getFonts = () => fontData;

// We have to use legacy module.exports as some parts of Scratch expect require('scratch-render-font') to be a function
module.exports = getFonts;
module.exports.loadFonts = loadFonts;
module.exports.FONTS = fontData;

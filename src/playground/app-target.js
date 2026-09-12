import ReactDOM from 'react-dom';
import {setAppElement} from 'react-modal';

const appTarget = document.getElementById('app');

// Remove everything from the target to fix macOS Safari "Save Page As",
while (appTarget.firstChild) {
    appTarget.removeChild(appTarget.firstChild);
}

setAppElement(appTarget);

const render = children => {
    try {
        ReactDOM.render(children, appTarget);
    } finally {
        // Always hide the splash screen, even if ReactDOM.render throws.
        // Otherwise the user is stuck staring at a red spinner forever.
        if (window.SplashEnd) {
            window.SplashEnd();
        }
    }
};

export default render;

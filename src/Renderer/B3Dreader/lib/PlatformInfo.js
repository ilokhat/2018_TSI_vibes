/**
 * Edit On: april 2018
 * Class: PlatformInfo
 * Description:  Part extracted from 'itowns-legacy' {@link https://github.com/iTowns/itowns-legacy}
 * project VIBES
 * author: Adouni, Bouchaour, Grégoire, Mathelier, Nino, Ouhabi, Schlegel
 */

function PlatformInfo() {
    var info = {
        browser: 'other',
        version: '0.0.0',
        isTouchDevice: (document.createTouch !== undefined), // detect if it is running on a touch device
    };
    var agents = [
        ['firefox', /Firefox[/\s](\d+(?:.\d+)*)/],
        ['chrome', /Chrome[/\s](\d+(?:.\d+)*)/],
        ['opera', /Opera[/\s](\d+(?:.\d+)*)/],
        ['safari', /Safari[/\s](\d+(?:.\d+)*)/],
        ['webkit', /AppleWebKit[/\s](\d+(?:.\d+)*)/],
        ['ie', /MSIE[/\s](\d+(?:.\d+)*)/],
    ];
    var matches;
    for (var i = 0; i < agents.length; i++) {
        matches = agents[i][1].exec(window.navigator.userAgent);
        if (matches) {
            info.browser = agents[i][0];
            info.version = matches[1];
            break;
        }
    }
    return info;
}

export default PlatformInfo;

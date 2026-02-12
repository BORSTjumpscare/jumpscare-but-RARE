console.log("FNAF jumpscare content script loaded!");

// --- Flags ---
let jumpscare = false;
let jumpscareQueued = false;

// --- Preload assets ---
const assets = {
    foxy: new Image(),
    static: new Image(),
    audio: new Audio()
};

assets.foxy.src = chrome.runtime.getURL("assets/fnaf-foxy.gif");
assets.static.src = chrome.runtime.getURL("assets/static.gif");
assets.audio.src = chrome.runtime.getURL("assets/audio.mp3");
assets.audio.volume = 1.0;

// --- Secret combo ---
const secretCombo = ["1", "9", "8", "3"];
let comboIndex = 0;
let comboTimer = null;
const comboTime = 3000;

// Map numpad keys to number row
const keyMap = {
    Numpad1: "1", Numpad2: "2", Numpad3: "3", Numpad4: "4",
    Numpad5: "5", Numpad6: "6", Numpad7: "7", Numpad8: "8",
    Numpad9: "9", Digit1: "1", Digit2: "2", Digit3: "3",
    Digit4: "4", Digit5: "5", Digit6: "6", Digit7: "7",
    Digit8: "8", Digit9: "9"
};

// --- Check if tab is focused ---
function isTabFocused() {
    return new Promise(function(resolve) {
        chrome.runtime.sendMessage({ action: "checkFocus" }, function(response) {
            if (response && response.isFocused === true) {
                resolve(true);
            } else {
                resolve(false);
            }
        });
    });
}

// --- Execute jumpscare ---
function executeJumpscare() {
    if (jumpscare) return;
    jumpscare = true;

    const overlay = document.createElement("div");
    overlay.id = "fnaf-jumpscare-overlay";
    Object.assign(overlay.style, {
        position: "fixed",
        top: "0",
        left: "0",
        width: "100vw",
        height: "100vh",
        zIndex: "9999",
        backgroundColor: "rgba(0,0,0,0)",
        overflow: "hidden"
    });
    document.body.appendChild(overlay);

    // Fade in background
    setTimeout(function() {
        overlay.style.backgroundColor = "rgba(0,0,0,0.9)";
    }, 50);

    setTimeout(function() {
        // Foxy GIF fills entire screen
        Object.assign(assets.foxy.style, {
            position: "absolute",
            top: "0",
            left: "0",
            width: "100%",
            height: "100%",
            objectFit: "cover",
            zIndex: "10000"
        });
        overlay.appendChild(assets.foxy);

        // Play audio
        assets.audio.currentTime = 0;
        assets.audio.play().catch(function() {
            console.log("[FNAF] Audio blocked");
        });

        // After Foxy shows
        setTimeout(function() {
            overlay.removeChild(assets.foxy);

            Object.assign(assets.static.style, {
                position: "absolute",
                top: "0",
                left: "0",
                width: "100%",
                height: "100%",
                objectFit: "cover",
                zIndex: "10000"
            });

            overlay.appendChild(assets.static);

            setTimeout(function() {
                overlay.remove();
                jumpscare = false;
                jumpscareQueued = false;
                console.log("[FNAF] Freddy can strike again.");
            }, 3000);
        }, 1500);

        // Failsafe
        setTimeout(function() {
            if (document.getElementById("fnaf-jumpscare-overlay")) {
                overlay.remove();
                jumpscare = false;
                jumpscareQueued = false;
                console.log("[FNAF] Failsafe triggered, overlay removed.");
            }
        }, 10000);

    }, 2000);
}

// --- Secret combo detection ---
document.addEventListener("keydown", function(e) {
    var key = keyMap[e.code] || e.key;

    if (key === secretCombo[comboIndex]) {
        if (comboIndex === 0) {
            comboTimer = setTimeout(function() {
                comboIndex = 0;
            }, comboTime);
        }
        comboIndex++;

        if (comboIndex === secretCombo.length) {
            console.log("[FNAF] Secret combo triggered!");
            if (!jumpscare) {
                jumpscareQueued = true;
                executeJumpscare();
            }
            comboIndex = 0;
            if (comboTimer) clearTimeout(comboTimer);
        }
    } else {
        comboIndex = 0;
        if (comboTimer) clearTimeout(comboTimer);
    }
});

// --- Main jumpscare loop ---
async function jumpscareLoop() {
    var interacted = false;
    var markInteracted = function() { interacted = true; };
    document.addEventListener("click", markInteracted);
    document.addEventListener("keydown", markInteracted);

    while (true) {
        // Randomly queue jumpscare
        while (!jumpscareQueued) {
            await new Promise(function(r) {
                setTimeout(r, Math.floor(Math.random() * 10000));
            });
            if (Math.random() < 0.001) jumpscareQueued = true;
        }

        // Wait for tab focus & interaction
        while (!jumpscare) {
            await new Promise(function(r) {
                setTimeout(r, Math.floor(Math.random() * 5000));
            });
            var focused = await isTabFocused();
            if (focused && interacted && !jumpscare) {
                if (Math.random() < 0.5) {
                    console.log("[FNAF] Freddy backed out!");
                    jumpscareQueued = false;
                } else {
                    executeJumpscare();
                }
            }
        }
    }
}

// --- Start ---
jumpscareLoop();

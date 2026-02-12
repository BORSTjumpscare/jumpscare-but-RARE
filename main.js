console.log("FNAF jumpscare content script loaded!");

// ---------------- FLAGS ----------------
let jumpscare = false;
let jumpscareQueued = false;

// ---------------- AUDIO ----------------
const audio = new Audio(chrome.runtime.getURL("assets/audio.mp3"));
audio.volume = 1.0;

// ---------------- SECRET COMBO ----------------
const secretCombo = ["1", "9", "8", "3"];
let comboIndex = 0;
let comboTimer = null;
const comboTime = 3000;

const keyMap = {
    Numpad1: "1", Numpad2: "2", Numpad3: "3", Numpad4: "4",
    Numpad5: "5", Numpad6: "6", Numpad7: "7", Numpad8: "8",
    Numpad9: "9", Digit1: "1", Digit2: "2", Digit3: "3",
    Digit4: "4", Digit5: "5", Digit6: "6", Digit7: "7",
    Digit8: "8", Digit9: "9"
};

// ---------------- TAB FOCUS CHECK ----------------
function isTabFocused() {
    return new Promise(function(resolve) {
        try {
            chrome.runtime.sendMessage({ action: "checkFocus" }, function(response) {
                if (chrome.runtime.lastError) {
                    resolve(false);
                    return;
                }
                resolve(response && response.isFocused === true);
            });
        } catch (err) {
            resolve(false);
        }
    });
}

// ---------------- JUMPSCARE ----------------
function executeJumpscare() {
    if (jumpscare) return;
    jumpscare = true;

    // Create overlay
    const overlay = document.createElement("div");
    overlay.id = "fnaf-jumpscare-overlay";

    Object.assign(overlay.style, {
        position: "fixed",
        top: "0",
        left: "0",
        width: "100vw",
        height: "100vh",
        backgroundColor: "black",
        opacity: "0",
        transition: "opacity 0.3s ease",
        zIndex: "999999",
        overflow: "hidden"
    });

    document.body.appendChild(overlay);

    // Trigger fade-in
    setTimeout(function() {
        overlay.style.opacity = "1";
    }, 20);

    // Small delay before Foxy appears (so fade works)
    setTimeout(function() {

        // Create Foxy (fresh each time so it plays from start)
        const foxy = new Image();
        foxy.src = chrome.runtime.getURL("assets/foxy-jumpscare.gif");

        Object.assign(foxy.style, {
            position: "absolute",
            top: "0",
            left: "0",
            width: "100%",
            height: "100%",
            objectFit: "cover"
        });

        overlay.appendChild(foxy);

        // Play sound
        audio.currentTime = 0;
        audio.play().catch(function(){});

        // Remove Foxy after 0.75s
        setTimeout(function() {

            if (foxy.parentNode) {
                overlay.removeChild(foxy);
            }

            // Create static GIF (fresh each time)
            const staticImg = new Image();
            staticImg.src = chrome.runtime.getURL("assets/static.gif");

            Object.assign(staticImg.style, {
                position: "absolute",
                top: "0",
                left: "0",
                width: "100%",
                height: "100%",
                objectFit: "cover"
            });

            overlay.appendChild(staticImg);

            // Remove static after 2 seconds
            setTimeout(function() {

                // Fade out
                overlay.style.opacity = "0";

                setTimeout(function() {
                    if (overlay.parentNode) {
                        overlay.remove();
                    }
                    jumpscare = false;
                    jumpscareQueued = false;
                }, 300);

            }, 2000);

        }, 750);

    }, 200); // slight delay so fade works properly
}

// ---------------- SECRET COMBO DETECTION ----------------
document.addEventListener("keydown", function(e) {
    const key = keyMap[e.code] || e.key;

    if (key === secretCombo[comboIndex]) {

        if (comboIndex === 0) {
            comboTimer = setTimeout(function() {
                comboIndex = 0;
            }, comboTime);
        }

        comboIndex++;

        if (comboIndex === secretCombo.length) {
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

// ---------------- RANDOM LOOP ----------------
async function jumpscareLoop() {

    let interacted = false;

    document.addEventListener("click", function() { interacted = true; });
    document.addEventListener("keydown", function() { interacted = true; });

    while (true) {

        while (!jumpscareQueued) {
            await new Promise(r => setTimeout(r, Math.floor(Math.random() * 10000)));
            if (Math.random() < 0.001) jumpscareQueued = true;
        }

        while (!jumpscare) {
            await new Promise(r => setTimeout(r, Math.floor(Math.random() * 5000)));

            const focused = await isTabFocused();

            if (focused && interacted && !jumpscare) {
                executeJumpscare();
            }
        }
    }
}

// ---------------- START ----------------
jumpscareLoop();

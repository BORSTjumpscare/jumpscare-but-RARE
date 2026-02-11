console.log("FNAF jumpscare extension loaded");

// --- Flags for jumpscare state ---
let jumpscare = false;
let jumpscareQueued = false;

// --- Secret combo tracking ---
const secretCombo = ["1", "9", "8", "7"];
let comboProgress = 0;
let comboTimer = null;
const comboMaxTime = 3000; // 3 seconds to complete combo

// --- Random delay helpers ---
function randomDelay() {
    return Math.floor(Math.random() * 10000); // up to 10 seconds
}

function randomCheckDelay() {
    return Math.floor(Math.random() * 5000); // up to 5 seconds
}

// --- Check if current tab is focused ---
function isTabFocused() {
    return new Promise((resolve) => {
        chrome.runtime.sendMessage({ action: "checkFocus" }, (response) => {
            resolve(response?.isFocused ?? false);
        });
    });
}

// --- Execute the jumpscare with fade ---
function executeJumpscare() {
    const overlay = document.createElement("div");
    overlay.style.position = "fixed";
    overlay.style.top = "0";
    overlay.style.left = "0";
    overlay.style.width = "100vw";
    overlay.style.height = "100vh";
    overlay.style.zIndex = "9999";
    overlay.style.backgroundColor = "rgba(0,0,0,0)";
    overlay.style.transition = "background-color 2s";
    document.body.appendChild(overlay);

    setTimeout(() => {
        overlay.style.backgroundColor = "rgba(0,0,0,0.6)";
    }, 50);

    setTimeout(() => {
        const jumpscareGif = document.createElement("img");
        jumpscareGif.src = chrome.runtime.getURL("assets/fredbear.gif");
        jumpscareGif.style.width = "100%";
        jumpscareGif.style.height = "100%";
        jumpscareGif.style.objectFit = "cover";

        const jumpscareAudio = document.createElement("audio");
        jumpscareAudio.src = chrome.runtime.getURL("assets/audio.mp3");
        jumpscareAudio.volume = 1.0;
        jumpscareAudio.autoplay = true;
        jumpscareAudio.play().catch(() => {
            console.log("[FNAF] Audio autoplay blocked, waiting for user interaction.");
        });

        const staticOverlay = document.createElement("img");
        staticOverlay.src = chrome.runtime.getURL("assets/static.gif");
        staticOverlay.style.width = "100%";
        staticOverlay.style.height = "100%";
        staticOverlay.style.objectFit = "cover";

        overlay.appendChild(jumpscareGif);
        overlay.appendChild(jumpscareAudio);

        jumpscareGif.addEventListener("load", () => {
            jumpscareAudio.play();

            setTimeout(() => {
                overlay.removeChild(jumpscareGif);
                overlay.appendChild(staticOverlay);

                setTimeout(() => {
                    overlay.remove();
                    jumpscare = false;
                    jumpscareQueued = false;
                    console.log("[FNAF] Freddy can strike again.");
                }, 3000);
            }, 1500);
        });
    }, 2000);
}

// --- Secret combo: type 1 → 9 → 8 → 7 within 3 seconds ---
document.addEventListener("keydown", (event) => {
    if (event.key === secretCombo[comboProgress]) {
        if (comboProgress === 0) {
            // Start 3-second timer from first key
            comboTimer = setTimeout(() => {
                comboProgress = 0;
                comboTimer = null;
            }, comboMaxTime);
        }

        comboProgress++;

        if (comboProgress === secretCombo.length) {
            console.log("[FNAF] Secret combo activated!");
            if (!jumpscare) {
                jumpscare = true;
                jumpscareQueued = true;
                executeJumpscare();
            }
            comboProgress = 0;
            clearTimeout(comboTimer);
            comboTimer = null;
        }
    } else {
        // Wrong key resets everything
        comboProgress = 0;
        if (comboTimer) clearTimeout(comboTimer);
        comboTimer = null;
    }
});

// --- Main jumpscare loop ---
async function overlayJumpscare() {
    let hasInteracted = false;

    function markInteracted() {
        hasInteracted = true;
        document.removeEventListener("click", markInteracted);
        document.removeEventListener("keydown", markInteracted);
    }

    document.addEventListener("click", markInteracted);
    document.addEventListener("keydown", markInteracted);

    while (!jumpscareQueued) {
        const delay = randomDelay();
        console.log(`[FNAF] Jumpscare opportunity after ${delay / 1000}s`);
        await new Promise((r) => setTimeout(r, delay));

        if (Math.random() < 0.03) {
            console.log("[FNAF] Freddy wants to jumpscare!");
            jumpscareQueued = true;
        } else {
            console.log("[FNAF] Freddy does not want to jumpscare right now.");
        }
    }

    while (!jumpscare) {
        const delay = randomCheckDelay();
        console.log("[FNAF] Jumpscare queued. Waiting for next opportunity!");
        await new Promise((r) => setTimeout(r, delay));

        const tabFocused = await isTabFocused();

        if (!tabFocused) {
            console.log("[FNAF] Freddy is waiting for the user to focus this tab.");
        } else if (!hasInteracted) {
            console.log("[FNAF] Freddy is waiting for the next user interaction.");
        } else if (!jumpscare) {
            console.log("[FNAF] Opportunity found.");
            jumpscare = true;
            if (Math.random() < 0.5) {
                console.log("[FNAF] Freddy backed out and left this tab alone!");
            } else {
                console.log("[FNAF] Freddy is preparing to jumpscare!");
                executeJumpscare();
            }
        }
    }
}

// --- Start jumpscare loop ---
overlayJumpscare();

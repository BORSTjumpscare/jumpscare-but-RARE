console.log("FNAF jumpscare loaded!");

// ----------------------------
// STATE
// ----------------------------
let jumpscareActive = false;
let jumpscareQueued = false;
let userInteracted = false;

// Secret combo: 1 → 9 → 8 → 7
const secretCombo = ["1", "9", "8", "7"];
let comboIndex = 0;
let comboTimer = null;
const comboTimeLimit = 3000;

// ----------------------------
// USER INTERACTION UNLOCK
// ----------------------------
document.addEventListener("click", () => userInteracted = true);
document.addEventListener("keydown", () => userInteracted = true);

// ----------------------------
// SECRET CODE (CAPTURE PHASE)
// ----------------------------
document.addEventListener("keydown", (e) => {
    if (e.ctrlKey || e.altKey || e.metaKey) return;

    if (e.key === secretCombo[comboIndex]) {

        if (comboIndex === 0) {
            comboTimer = setTimeout(() => {
                comboIndex = 0;
            }, comboTimeLimit);
        }

        comboIndex++;

        if (comboIndex === secretCombo.length) {
            console.log("[FNAF] Secret combo activated!");
            comboIndex = 0;
            clearTimeout(comboTimer);
            triggerJumpscare();
        }

    } else {
        comboIndex = 0;
        if (comboTimer) clearTimeout(comboTimer);
    }

}, true); // capture phase = works in inputs too

// ----------------------------
// RANDOM QUEUE SYSTEM
// ----------------------------
function scheduleRandomCheck() {
    if (jumpscareActive) return;

    setTimeout(() => {
        if (Math.random() < 0.03) {
            jumpscareQueued = true;
        }
        scheduleRandomCheck();
    }, Math.floor(Math.random() * 10000));
}

scheduleRandomCheck();

// ----------------------------
// RANDOM EXECUTION CHECK
// ----------------------------
function scheduleExecutionCheck() {
    setTimeout(() => {

        if (
            jumpscareQueued &&
            !jumpscareActive &&
            userInteracted &&
            document.hasFocus()
        ) {
            if (Math.random() >= 0.5) {
                triggerJumpscare();
            } else {
                console.log("[FNAF] Freddy backed out...");
                jumpscareQueued = false;
            }
        }

        scheduleExecutionCheck();

    }, Math.floor(Math.random() * 5000));
}

scheduleExecutionCheck();

// ----------------------------
// TRIGGER JUMPSCARE
// ----------------------------
function triggerJumpscare() {
    if (jumpscareActive) return;
    if (document.getElementById("fnaf-overlay")) return;

    jumpscareActive = true;
    jumpscareQueued = false;

    const overlay = document.createElement("div");
    overlay.id = "fnaf-overlay";

    Object.assign(overlay.style, {
        position: "fixed",
        top: "0",
        left: "0",
        width: "100vw",
        height: "100vh",
        zIndex: "999999",
        backgroundColor: "rgba(0,0,0,0)",
        transition: "background-color 2s"
    });

    document.body.appendChild(overlay);

    // Fade in darker
    setTimeout(() => {
        overlay.style.backgroundColor = "rgba(0,0,0,0.6)";
    }, 50);

    // After fade → show jumpscare
    setTimeout(() => {

        const img = document.createElement("img");
        img.src = chrome.runtime.getURL("assets/fredbear.gif");
        Object.assign(img.style, {
            width: "100%",
            height: "100%",
            objectFit: "cover"
        });

        const audio = document.createElement("audio");
        audio.src = chrome.runtime.getURL("assets/audio.mp3");
        audio.volume = 1.0;

        overlay.appendChild(img);
        overlay.appendChild(audio);

        audio.play().catch(() => {
            console.log("[FNAF] Audio blocked until interaction.");
        });

        setTimeout(() => {
            img.src = chrome.runtime.getURL("assets/static.gif");
        }, 1500);

        setTimeout(() => {
            removeOverlay();
        }, 4500);

        // Failsafe: hard remove after 10s
        setTimeout(() => {
            removeOverlay();
        }, 10000);

    }, 2000);
}

// ----------------------------
// CLEANUP
// ----------------------------
function removeOverlay() {
    const overlay = document.getElementById("fnaf-overlay");
    if (overlay) overlay.remove();
    jumpscareActive = false;
}

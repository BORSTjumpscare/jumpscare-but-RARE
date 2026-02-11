console.log("FNAF jumpscare extension loaded!");

// --- Flags ---
let jumpscare = false;
let jumpscareQueued = false;

// --- Secret combo ---
const secretCombo = ["1", "9", "8", "7"];
let comboIndex = 0;
let comboTimer = null;
const comboTime = 3000; // 3 seconds to complete combo

// --- Random delay helpers ---
function randomDelay(max = 10000) { return Math.floor(Math.random() * max); }
function randomCheckDelay(max = 5000) { return Math.floor(Math.random() * max); }

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
        transition: "background-color 1.5s"
    });
    document.body.appendChild(overlay);

    setTimeout(() => overlay.style.backgroundColor = "rgba(0,0,0,0.6)", 50);

    const img = document.createElement("img");
    img.src = chrome.runtime.getURL("assets/fredbear.gif");
    Object.assign(img.style, { width: "100%", height: "100%", objectFit: "cover" });

    const staticImg = document.createElement("img");
    staticImg.src = chrome.runtime.getURL("assets/static.gif");
    Object.assign(staticImg.style, { width: "100%", height: "100%", objectFit: "cover", opacity: 0, position: "absolute", top:0, left:0 });

    overlay.appendChild(img);
    overlay.appendChild(staticImg);

    const audio = document.createElement("audio");
    audio.src = chrome.runtime.getURL("assets/audio.mp3");
    audio.volume = 1.0;
    audio.autoplay = true;
    audio.play().catch(() => console.log("[FNAF] Audio blocked"));
    overlay.appendChild(audio);

    img.addEventListener("load", () => {
        audio.play();

        setTimeout(() => {
            img.remove();
            staticImg.style.transition = "opacity 0.3s";
            staticImg.style.opacity = 1; // fade in static

            setTimeout(() => {
                overlay.remove();
                jumpscare = false;
                jumpscareQueued = false;
                console.log("[FNAF] Freddy can strike again.");
            }, 3000);
        }, 1500);
    });

    // Failsafe
    setTimeout(() => {
        if (document.getElementById("fnaf-jumpscare-overlay")) {
            overlay.remove();
            jumpscare = false;
            jumpscareQueued = false;
            console.log("[FNAF] Failsafe triggered, overlay removed.");
        }
    }, 10000);
}

// --- Secret combo detection ---
document.addEventListener("keydown", e => {
    if (e.ctrlKey || e.altKey || e.metaKey) return; // ignore modifiers

    if (e.key === secretCombo[comboIndex]) {
        if (comboIndex === 0) {
            comboTimer = setTimeout(() => comboIndex = 0, comboTime);
        }

        comboIndex++;

        if (comboIndex === secretCombo.length) {
            console.log("[FNAF] Secret combo triggered!");
            jumpscareQueued = true;
            executeJumpscare();
            comboIndex = 0;
            if (comboTimer) clearTimeout(comboTimer);
        }
    } else {
        comboIndex = 0;
        if (comboTimer) clearTimeout(comboTimer);
    }
}, true); // capture phase ensures detection even in inputs

// --- Infinite jumpscare loop ---
async function jumpscareLoop() {
    let interacted = false;
    const markInteracted = () => { interacted = true; };
    document.addEventListener("click", markInteracted);
    document.addEventListener("keydown", markInteracted);

    while (true) { // infinite loop
        // Step 1: Randomly queue jumpscare
        while (!jumpscareQueued) {
            await new Promise(r => setTimeout(r, randomDelay()));
            if (Math.random() < 0.03) jumpscareQueued = true;
        }

        // Step 2: Wait for interaction & tab focus
        while (!jumpscare) {
            await new Promise(r => setTimeout(r, randomCheckDelay()));
            if (interacted && !jumpscare) {
                if (Math.random() < 0.5) {
                    console.log("[FNAF] Freddy backed out!");
                    jumpscareQueued = false; // allow next loop
                } else {
                    executeJumpscare();
                }
            }
        }
    }
}

// --- Start infinite loop ---
jumpscareLoop();

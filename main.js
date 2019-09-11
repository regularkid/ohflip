// System
let canvas = document.getElementById("canvas");
let ctx = canvas.getContext("2d", { alpha: false });
let lastFrameTime;

// Player
let playerZ = 0;
let playerVel = 0;
let playerAngle = 0;
let gravity = -1400;
let bounceVelMin = 1000;
let bounceVel = bounceVelMin;
let bounceVelHitIncrease = 120;
let bounceVelMissDecrease = 120;
let curBounceVelIdx = 0;
let bounceHigher = false;
let blink = false;
let jumpHigher = false;
let perfectJump = false;
let zMax = 0;
let zMaxDecayDelay = 0;
let flipAngleVel = 0;
let uprightFix = false;
let totalAngleDelta = 0;
let blinkDelay = 3.0;
let blinkTime = 0.5;

// Trampoline
let trampShakeAmount = 0;
let trampShakeDecayPct = 0.9;
let trampShakeAngle = 0;
let trampShakeAngleSpeed = 4000.0;

// Camera
let camScale = 0.7;
let camDecayDelay = 0;

// Input
let touch = { x: 0, y: 0, active: false, up: false}
let lastTouch = 0;

canvas.addEventListener("mousedown", e => { touch.active = true; touch.down = true; }, false);
canvas.addEventListener("mouseup", e => { touch.active = false; touch.up = true; }, false);
canvas.addEventListener("mousemove", e => { SetTouchPos(e); e.preventDefault(); }, false );
canvas.addEventListener("touchstart", e => { SetTouchPos(e.touches[0]); touch.active = true; e.preventDefault(); }, false );
canvas.addEventListener("touchend", e => { touch.active = false; e.preventDefault(); }, false );
canvas.addEventListener("touchcancel", e => { touch.active = false; e.preventDefault(); }, false );
canvas.addEventListener("touchmove", e => { SetTouchPos(e.touches[0]); e.preventDefault(); }, false );

function Init()
{
    playerZ = 0;
    playerVel = bounceVel;
    playerAngle = 0;
}

function GameLoop(curTime)
{
    let dt = Math.min((curTime - (lastFrameTime || curTime)) / 1000.0, 0.2);  // Cap to 200ms (5fps)
    lastFrameTime = curTime;

    UpdatePlayer(dt);
    UpdateTrampoline(dt);
    touch.down = false;
    touch.up = false;

    // Clear background
    ctx.save();
    ctx.setTransform(1, 0, 0, 1, 0, 0);
    ctx.fillStyle = "#AADDFF";
    ctx.fillRect(0, 0, canvas.width, canvas.height);
    ctx.restore();

    ctx.save();
    ctx.scale(camScale, camScale);
    let canvasWidthScaled = canvas.width/camScale;
    let canvasHeightScaled = canvas.height/camScale;
    ctx.translate((canvasWidthScaled - canvas.width)*0.5, (canvasHeightScaled - canvas.height));
    DrawTrampoline();
    DrawPlayer();
    ctx.restore();

    window.requestAnimationFrame(GameLoop);
}

function SetTouchPos(event)
{
    touch.x = (event.pageX - canvas.offsetLeft) / 4.0; // Screen scale factor = 4 (see index.html)
    touch.y = (event.pageY - canvas.offsetTop) / 4.0;
}

function UpdatePlayer(dt)
{
    if (touch.down && playerZ <= 100)
    {
        if (playerZ <= 25)
        {
            perfectJump = true;
        }

        if (playerVel < 0)
        {
            jumpHigher = true;
        }
        else
        {
            bounceVel += perfectJump ? (bounceVelHitIncrease * 1.5) : bounceVelHitIncrease;
            playerVel = bounceVel;
        }
    }

    if (touch.active && playerZ > 100)
    {
        uprightFix = false;
        flipAngleVel += (720.0 - flipAngleVel)*0.1;
    }
    else
    {
        if (uprightFix)
        {
            playerAngle *= 0.8;
            if (Math.abs(playerAngle) < 0.01)
            {
                uprightFix = false;
            }
        }
        
        flipAngleVel *= 0.8;
    }

    let prevPlayerAngle = playerAngle;
    playerAngle += flipAngleVel * dt;
    totalAngleDelta += playerAngle - prevPlayerAngle;
    //if (totalAngleDelta >= 270) { console.log("FLIP!"); }
    if (playerAngle >= 180.0)
    {
        playerAngle -= 360.0;
    }
    else if (playerAngle < -180.0)
    {
        playerAngle += 360;
    }

    // if (playerZ <= 0.0)
    // {
    //     playerVel += Math.abs(playerVel)*100.0 * dt;
    // }
    // else
    {
        playerVel += gravity * dt;
    }

    let prevPlayerZ = playerZ;
    playerZ += playerVel * dt;

    //if (prevPlayerZ <= 0.0 && playerZ > 0.0)
    if (playerZ <= 0.0)
    {
        // Start trampoline shake
        trampShakeAmount = 16.0;
        trampShakeAngle = 0;

        jumpHigher = totalAngleDelta >= 270 && Math.abs(playerAngle) < 20.0;
        perfectJump = totalAngleDelta >= 270 && Math.abs(playerAngle) < 8.0;

        if (jumpHigher)
        {
            jumpHigher = false;
            bounceVel += perfectJump ? (bounceVelHitIncrease * 1.5) : bounceVelHitIncrease;
        }
        else
        {
            bounceVel = Math.max(bounceVel - bounceVelMissDecrease, bounceVelMin);
        }

        //bounceVel = 1000;
        playerZ = 0.0;
        playerVel = bounceVel;
        uprightFix = true;
        totalAngleDelta = 0;
    }

    let desiredCamScale = (300.0 / Math.max(playerZ, 300.0)) * 1.5;
    if (desiredCamScale < camScale)
    {
        camDecayDelay = 3.0;
    }
    else
    {
        camDecayDelay -= dt;
    }

    desiredCamScale = Math.min(camScale, desiredCamScale);
    camScale += (desiredCamScale - camScale) * 0.2;
    if (camDecayDelay <= 0.0)
    {
        camScale += (0.7 - camScale) * 0.001;
    }

    blinkDelay -= dt;
    blinkTime -= dt;
    if (blinkDelay <= 0.0)
    {
        blinkDelay = 1.0 + (Math.random()*3.0);
        blinkTime = 0.1 + (Math.random()*0.1);
    }
}

function UpdateTrampoline(dt)
{
    trampShakeAmount *= trampShakeDecayPct;
    trampShakeAngle += trampShakeAngleSpeed * dt;
}

function DrawLine(x1, y1, x2, y2, color, width)
{
    ctx.strokeStyle = color;
    ctx.lineWidth = width;
    ctx.beginPath();
    ctx.moveTo(x1, y1);
    ctx.lineTo(x2, y2);
    ctx.stroke();
}

function DrawRectangle(width, height, color)
{
    let halfWidth = width * 0.5;
    let halfHeight = height * 0.5;

    ctx.fillStyle = color;
    ctx.beginPath();
    ctx.moveTo(-halfWidth, -halfHeight);
    ctx.lineTo(halfWidth, -halfHeight);
    ctx.lineTo(halfWidth, halfHeight);
    ctx.lineTo(-halfWidth, halfHeight);
    ctx.lineTo(-halfWidth, -halfHeight);
    ctx.fill();
}

function DrawTrampoline()
{
    ctx.save();
    ctx.translate(canvas.width * 0.5, canvas.height - 120);

    DrawRectangle(canvas.width/camScale, 240, "#00D846");     // Grass
    DrawLine(-196, -20, -196, 80, "#000", 12);      // Left pole
    DrawLine(196, -20, 196, 80, "#000", 12);        // Right pole
    ctx.translate(0, Math.sin(trampShakeAngle * Math.PI/180.0) * trampShakeAmount);
    DrawLine(-200, 0, 200, 0, "#000", 12);         // Mesh

    ctx.restore();
}

function DrawPlayer()
{
    ctx.save();
    ctx.translate(canvas.width * 0.5, (canvas.height - 188) - playerZ);
    ctx.rotate(playerAngle * Math.PI/180.0);

    ctx.translate(0, -40);
    DrawRectangle(80, 96, "#FF9600");       // Head
    if (blinkTime > 0.0)
    {
        ctx.translate(-4, 4);
        DrawRectangle(40, 40, "#000");          // Eye
        ctx.translate(4, 4);
        DrawRectangle(34, 34, "#FF9600");          // Eye
        ctx.translate(-12, 0);
    }
    else
    {
        ctx.translate(-4, 4);
        DrawRectangle(40, 40, "#FFF");          // Eye
        ctx.translate(-8, 4);
        DrawRectangle(16, 24, "#000");            // Pupil
    }

    if (!touch.active)
    {
        ctx.translate(8, 40);
        DrawLine(0, 0, 0, 60, "#000", 8);       // Leg
    }
    else
    {
        ctx.translate(8, 40);
        DrawLine(0, 0, -30, 20, "#000", 8);       // Leg (upper)
        DrawLine(-30, 20, 0, 40, "#000", 8);       // Leg (lower)
    }

    ctx.restore();
}

Init();
window.requestAnimationFrame(GameLoop);
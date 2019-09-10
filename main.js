// System
let canvas = document.getElementById("canvas");
let ctx = canvas.getContext("2d", { alpha: false });
let lastFrameTime;

// Player
let playerZ = 0;
let playerVel = 0;
let playerAngle = 0;
let gravity = -350;
let bounceVel = [100, 130, 160, 190, 210, 240];
let curBounceVelIdx = 0;
let bounceHigher = false;
let blink = false;

// Trampoline
let trampShakeAmount = 0;
let trampShakeDecayPct = 0.9;
let trampShakeAngle = 0;
let trampShakeAngleSpeed = 4000.0;

// Input
let touch = { x: 0, y: 0, active: false, up: false}
let lastTouch = 0;

canvas.addEventListener("mousedown", e => { touch.active = true }, false);
canvas.addEventListener("mouseup", e => { touch.active = false, touch.up = true }, false);
canvas.addEventListener("mousemove", e => { SetTouchPos(e); e.preventDefault(); }, false );
canvas.addEventListener("touchstart", e => { SetTouchPos(e.touches[0]); touch.active = true; e.preventDefault(); }, false );
canvas.addEventListener("touchend", e => { touch.active = false; e.preventDefault(); }, false );
canvas.addEventListener("touchcancel", e => { touch.active = false; e.preventDefault(); }, false );
canvas.addEventListener("touchmove", e => { SetTouchPos(e.touches[0]); e.preventDefault(); }, false );

function Init()
{
    playerZ = 0;
    playerVel = bounceVel[0];
    playerAngle = 0;
}

function GameLoop(curTime)
{
    let dt = Math.min((curTime - (lastFrameTime || curTime)) / 1000.0, 0.2);  // Cap to 200ms (5fps)
    lastFrameTime = curTime;

    UpdatePlayer(dt);
    UpdateTrampoline(dt);
    touch.up = false;

    ctx.fillStyle = "#AADDFF";
    ctx.fillRect(0, 0, canvas.width, canvas.height*0.7);
    DrawTrampoline();
    DrawPlayer();

    window.requestAnimationFrame(GameLoop);
}

function SetTouchPos(event)
{
    touch.x = (event.pageX - canvas.offsetLeft) / 4.0; // Screen scale factor = 4 (see index.html)
    touch.y = (event.pageY - canvas.offsetTop) / 4.0;
}

function UpdatePlayer(dt)
{
    playerVel += gravity * dt;
    playerZ += playerVel * dt;
    if (playerZ <= 0.0)
    {
        // Start trampoline shake
        trampShakeAmount = 4.0;
        trampShakeAngle = 0;

        //curBounceVelIdx = Math.max(curBounceVelIdx - 1, 0);

        playerZ = 0.0;
        playerVel = bounceVel[curBounceVelIdx];
    }

    if (touch.up)
    {
        //console.log(playerZ);
        if (playerZ < 10)
        {
            curBounceVelIdx = Math.min(curBounceVelIdx + 1, bounceVel.length - 1);
            playerVel = bounceVel[curBounceVelIdx];
        }
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
    ctx.translate(canvas.width * 0.5, canvas.height - 30);

    DrawRectangle(canvas.width, 60, "#00D846"); // Grass
    DrawLine(-49, -5, -49, 20, "#000", 3);      // Left pole
    DrawLine(49, -5, 49, 20, "#000", 3);        // Right pole
    ctx.translate(0, Math.sin(trampShakeAngle * Math.PI/180.0) * trampShakeAmount);
    DrawLine(-50, 0, 50, 0, "#000", 3);         // Mesh

    ctx.restore();
}

function DrawPlayer()
{
    ctx.save();
    ctx.translate(canvas.width * 0.5, (canvas.height - 47) - playerZ);
    ctx.rotate(playerAngle * Math.PI/180.0);
    //playerAngle -= 1.0;

    ctx.translate(0, -10);
    DrawRectangle(20, 24, "#FF9600");       // Head
    ctx.translate(-1, 1);
    DrawRectangle(10, 10, "#FFF");          // Eye
    ctx.translate(-2, 1);
    DrawRectangle(4, 6, "#000");            // Pupil
    ctx.translate(2, 10);
    DrawLine(0, 0, 0, 15, "#000", 2);       // Leg

    ctx.restore();
}

Init();
window.requestAnimationFrame(GameLoop);
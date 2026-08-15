const bg = document.querySelector('.bg-breathing');
const glow = document.querySelector('.red-glow');
const flash = document.querySelector('.lightning-flash');

// Vị trí chuột hiện tại (0 = giữa màn hình)
let mouseX = 0, mouseY = 0;
// Vị trí đang dùng để vẽ (mượt dần đuổi theo mouseX/mouseY)
let curX = 0, curY = 0;

// Toạ độ chuột thực tế trên màn hình (px), dùng cho cursor trail lửa
let cursorPx = { x: window.innerWidth / 2, y: window.innerHeight / 2 };

window.addEventListener('mousemove', (e) => {
  mouseX = (e.clientX / window.innerWidth - 0.5) * 2;
  mouseY = (e.clientY / window.innerHeight - 0.5) * 2;
  cursorPx.x = e.clientX;
  cursorPx.y = e.clientY;
});

const start = performance.now();

// ================== HẠT LỬA BAY LÊN (Canvas) ==================
const canvas = document.getElementById('embers');
const ctx = canvas.getContext('2d');

function resizeCanvas() {
  canvas.width = window.innerWidth;
  canvas.height = window.innerHeight;
}
resizeCanvas();
window.addEventListener('resize', resizeCanvas);

const EMBER_COUNT = 60;
const embers = [];

function makeEmber() {
  return {
    x: Math.random() * canvas.width,
    y: canvas.height + Math.random() * 100,       // bắt đầu từ dưới đáy
    r: 1 + Math.random() * 2.2,                     // bán kính hạt
    speedY: 0.4 + Math.random() * 1.1,               // tốc độ bay lên
    drift: (Math.random() - 0.5) * 0.6,              // trôi ngang nhẹ
    alpha: 0.3 + Math.random() * 0.6,
    flicker: Math.random() * Math.PI * 2,            // pha nhấp nháy riêng từng hạt
  };
}

for (let i = 0; i < EMBER_COUNT; i++) {
  const e = makeEmber();
  e.y = Math.random() * canvas.height; // rải sẵn trên toàn màn hình lúc bắt đầu
  embers.push(e);
}

function drawEmbers(t) {
  ctx.clearRect(0, 0, canvas.width, canvas.height);

  for (const e of embers) {
    e.y -= e.speedY;
    e.x += e.drift;

    const flick = 0.5 + 0.5 * Math.sin(t * 3 + e.flicker); // nhấp nháy độ sáng
    const a = e.alpha * flick;

    const grad = ctx.createRadialGradient(e.x, e.y, 0, e.x, e.y, e.r * 3);
    grad.addColorStop(0, `rgba(255,140,60,${a})`);
    grad.addColorStop(1, `rgba(255,60,20,0)`);

    ctx.beginPath();
    ctx.fillStyle = grad;
    ctx.arc(e.x, e.y, e.r * 3, 0, Math.PI * 2);
    ctx.fill();

    // Hạt bay hết màn hình / mờ dần thì tái sinh ở dưới đáy
    if (e.y < -20) {
      Object.assign(e, makeEmber());
    }
  }
}

// ================== 1. CURSOR TRAIL LỬA (hạt lửa bám theo chuột) ==================
const trailEmbers = [];

function makeTrailEmber(x, y) {
  return {
    x: x + (Math.random() - 0.5) * 6,
    y: y + (Math.random() - 0.5) * 6,
    r: 1 + Math.random() * 2,
    vy: -(0.3 + Math.random() * 0.8),           // bay lên nhẹ
    vx: (Math.random() - 0.5) * 0.8,
    life: 1,                                     // 1 = mới sinh, giảm dần về 0 rồi bị xoá
    decay: 0.02 + Math.random() * 0.02,
  };
}

let lastTrailSpawn = 0;

function spawnTrail(t) {
  // Giới hạn tốc độ sinh hạt để không quá dày, ~mỗi 30ms 1 hạt
  if (t - lastTrailSpawn > 0.03) {
    trailEmbers.push(makeTrailEmber(cursorPx.x, cursorPx.y));
    lastTrailSpawn = t;
    if (trailEmbers.length > 120) trailEmbers.shift(); // giới hạn số lượng, tránh tràn bộ nhớ
  }
}

function drawTrail() {
  for (let i = trailEmbers.length - 1; i >= 0; i--) {
    const e = trailEmbers[i];
    e.x += e.vx;
    e.y += e.vy;
    e.life -= e.decay;

    if (e.life <= 0) {
      trailEmbers.splice(i, 1);
      continue;
    }

    const grad = ctx.createRadialGradient(e.x, e.y, 0, e.x, e.y, e.r * 3);
    grad.addColorStop(0, `rgba(255,180,80,${e.life})`);
    grad.addColorStop(1, `rgba(255,60,20,0)`);

    ctx.beginPath();
    ctx.fillStyle = grad;
    ctx.arc(e.x, e.y, e.r * 3, 0, Math.PI * 2);
    ctx.fill();
  }
}

// ================== 2. SẤM CHỚP NGẪU NHIÊN ==================
function scheduleLightning() {
  // Chớp cách nhau ngẫu nhiên 8 - 20 giây
  const delay = 8000 + Math.random() * 12000;
  setTimeout(() => {
    flashOnce();
    scheduleLightning(); // hẹn lần chớp tiếp theo
  }, delay);
}

function flashOnce() {
  // Chớp 2 nhịp nhanh giống sét thật (sáng - tắt - sáng nhẹ - tắt)
  flash.style.transition = 'opacity 60ms ease';
  flash.style.opacity = 0.85;

  setTimeout(() => { flash.style.opacity = 0; }, 80);
  setTimeout(() => { flash.style.opacity = 0.5; }, 160);
  setTimeout(() => { flash.style.opacity = 0; }, 240);
}

scheduleLightning();

// ================== 3. RUNG NHẸ KHI HOVER MENU ==================
document.querySelectorAll('.menu-item').forEach((item) => {
  item.addEventListener('mouseenter', () => {
    bg.classList.remove('shake');
    void bg.offsetWidth;        // ép trình duyệt reset animation để có thể chạy lại liên tiếp
    bg.classList.add('shake');
  });
});

// ================== VÒNG LẶP CHÍNH ==================
function animate(now) {
  const t = (now - start) / 1000;

  // --- Hiệu ứng thở cho nền ---
  const breathe = Math.sin(t * (Math.PI * 2) / 6);
  const scale = 1 + breathe * 0.04;
  const brightness = 1 + breathe * 0.06;

  // --- Parallax theo chuột ---
  curX += (mouseX - curX) * 0.04;
  curY += (mouseY - curY) * 0.04;
  const moveX = curX * 15;
  const moveY = curY * 15;

  bg.style.transform = `translate(${moveX}px, ${moveY}px) scale(${scale})`;
  bg.style.filter = `brightness(${brightness})`;

  // --- Glow đỏ nhấp nháy như tim đập (2 lớp sóng sin chồng nhau cho tự nhiên hơn) ---
  const pulse = 0.6 + 0.25 * Math.sin(t * 1.4) + 0.15 * Math.sin(t * 3.7);
  glow.style.opacity = pulse;
  glow.style.transform =
    `translate(-50%, -50%) scale(${1 + pulse * 0.12})`;

  // --- Hạt lửa bay (nền) + cursor trail lửa (theo chuột) ---
  drawEmbers(t);
  spawnTrail(t);
  drawTrail();

  requestAnimationFrame(animate);
}

requestAnimationFrame(animate);
const canvas = document.getElementById("gameCanvas");
const ctx = canvas.getContext("2d");

canvas.width = 800;
canvas.height = 600;

// Load images
const backgroundImage = new Image();
backgroundImage.src = "images/battlefield_landscape.png";
const guardianImage = new Image();
guardianImage.src = "images/guardian.png";

const background = {
  x: 0,
  y: 0,
  width: canvas.width,
  height: canvas.height,
  draw() {
    ctx.drawImage(backgroundImage, this.x, this.y, this.width, this.height);
  }
};

const guardian = {
  x: canvas.width / 2,
  y: canvas.height - 100,
  width: 100,
  height: 100,
  draw() {
    ctx.drawImage(guardianImage, this.x, this.y, this.width, this.height);
  }
};

const fortress = {
  health: 100,
  maxHealth: 100
};

class Enemy {
  constructor(imageSrc, x, y, width, height, speed, health) {
    this.x = x;
    this.y = y;
    this.width = width;
    this.height = height;
    this.speed = speed;
    this.health = health;
    this.maxHealth = health;

    this.image = new Image();
    this.image.src = imageSrc;
  }

  draw() {
    ctx.drawImage(this.image, this.x, this.y, this.width, this.height);
  }

  update() {
    this.y += this.speed;
    this.draw();
  }
}

const enemies = [];
const enemyImageSrc = "images/enemy1.png";

function spawnEnemy() {
  const x = Math.random() * (canvas.width - 50);
  const y = -50;
  const width = 50;
  const height = 50;
  const speed = 1; // Maintain reduced speed
  const health = 100; // Health that requires two shots to deplete (2 * 50)
  enemies.push(new Enemy(enemyImageSrc, x, y, width, height, speed, health));
}

let waveNumber = 0;
let lastWaveTime = Date.now();
let waveInterval = 5000;

function startNewWave() {
  waveNumber++;
  let enemiesToSpawn = waveNumber * 5;
  const enemySpawnInterval = setInterval(() => {
    spawnEnemy();
    enemiesToSpawn--;
    if (enemiesToSpawn <= 0) {
      clearInterval(enemySpawnInterval);
    }
  }, 500);
}

const keys = {
  right: false,
  left: false,
  space: false
};

window.addEventListener("keydown", function (e) {
  if (e.keyCode === 39) keys.right = true; // Right arrow
  if (e.keyCode === 37) keys.left = true; // Left arrow
  if (e.keyCode === 32 && !keys.space) {
    // Space key
    keys.space = true;
    shoot();
  }
});

window.addEventListener("keyup", function (e) {
  if (e.keyCode === 39) keys.right = false; // Right arrow
  if (e.keyCode === 37) keys.left = false; // Left arrow
  if (e.keyCode === 32) keys.space = false; // Space key
});

function updateGuardian() {
  if (keys.right && guardian.x < canvas.width - guardian.width) guardian.x += 5;
  if (keys.left && guardian.x > 0) guardian.x -= 5;
  guardian.draw();
}

class Projectile {
  constructor(x, y, width, height, color, velocity) {
    this.x = x;
    this.y = y;
    this.width = width;
    this.height = height;
    this.color = color;
    this.velocity = velocity;
  }

  draw() {
    ctx.fillStyle = this.color;
    ctx.fillRect(this.x, this.y, this.width, this.height);
  }

  update() {
    this.draw();
    this.y += this.velocity;
  }
}

const projectiles = [];

function shoot() {
  const x = guardian.x + guardian.width / 2 - 2.5;
  const y = guardian.y;
  const projectileWidth = 5;
  const projectileHeight = 10;
  const color = "red";
  const velocity = -5;
  projectiles.push(new Projectile(x, y, projectileWidth, projectileHeight, color, velocity));
}

function handleCollisions() {
  projectiles.forEach((projectile, pIndex) => {
    enemies.forEach((enemy, eIndex) => {
      if (projectile.x < enemy.x + enemy.width && projectile.x + projectile.width > enemy.x && projectile.y < enemy.y + enemy.height && projectile.y + projectile.height > enemy.y) {
        enemy.health -= 50; // Damage adjusted to 50
        projectiles.splice(pIndex, 1);

        if (enemy.health <= 0) {
          enemies.splice(eIndex, 1);
          addScore(10); // Increase score for defeating an enemy
        }
      }
    });
  });
}

let gold = 0;
let mana = 100;
let score = 0;

function addGold(amount) {
  gold += amount;
}

function useMana(amount) {
  if (mana >= amount) {
    mana -= amount;
    return true;
  }
  return false;
}

function addScore(points) {
  score += points;
}

function drawResources() {
  ctx.fillStyle = "gold";
  ctx.font = "20px Arial";
  ctx.fillText(`Gold: ${gold}`, 20, 30);
  ctx.fillStyle = "blue";
  ctx.fillText(`Mana: ${mana}`, 20, 60);
  ctx.fillStyle = "black";
  ctx.fillText(`Score: ${score}`, 20, 90);
  ctx.fillText(`Wave: ${waveNumber}`, 20, 120);
}

function drawHealthBar(entity) {
  ctx.fillStyle = "red";
  ctx.fillRect(entity.x, entity.y - 10, entity.width, 10);

  ctx.fillStyle = "green";
  const healthWidth = (entity.health / entity.maxHealth) * entity.width;
  ctx.fillRect(entity.x, entity.y - 10, healthWidth, 10);
}

function checkGameOver() {
  if (fortress.health <= 0) {
    cancelAnimationFrame(animationId);
    ctx.fillStyle = "black";
    ctx.font = "40px Arial";
    ctx.fillText("Game Over", canvas.width / 2 - 100, canvas.height / 2);
    return true;
  }
  return false;
}

let animationId;

function gameLoop() {
  const currentTime = Date.now();
  ctx.clearRect(0, 0, canvas.width, canvas.height);
  background.draw();
  updateGuardian();

  projectiles.forEach((projectile, index) => {
    projectile.update();
    if (projectile.y + projectile.height < 0) {
      projectiles.splice(index, 1);
    }
  });

  handleCollisions();

  enemies.forEach((enemy, index) => {
    enemy.update();
    drawHealthBar(enemy);
    if (enemy.y > canvas.height) {
      enemies.splice(index, 1);
      fortress.health -= 10;
    }
  });

  drawResources();

  if (enemies.length === 0 && currentTime - lastWaveTime > waveInterval) {
    startNewWave();
    lastWaveTime = currentTime;
  }

  if (!checkGameOver()) {
    animationId = requestAnimationFrame(gameLoop);
  }
}

Promise.all([
  new Promise(resolve => {
    backgroundImage.onload = resolve;
    backgroundImage.src = "images/battlefield_landscape.png";
  }),
  new Promise(resolve => {
    guardianImage.onload = resolve;
    guardianImage.src = "images/guardian.png";
  })
]).then(() => {
  startNewWave(); // Start the first wave
  gameLoop();
});

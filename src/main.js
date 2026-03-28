import './style.css'

const app = document.querySelector('#app')

app.innerHTML = `
  <main class="game-shell">
    <section class="hud">
      <div>
        <p class="eyebrow">Claw Pong</p>
        <h1>Modern arcade brick breaker</h1>
        <p class="subtitle">Bounce the energy orb, clear every space block, and don't let it fall into the void.</p>
      </div>
      <div class="stats">
        <div class="stat-card">
          <span class="label">Score</span>
          <strong id="score">0</strong>
        </div>
        <div class="stat-card">
          <span class="label">Lives</span>
          <strong id="lives">3</strong>
        </div>
        <div class="stat-card">
          <span class="label">Blocks Left</span>
          <strong id="blocks-left">0</strong>
        </div>
      </div>
    </section>

    <section class="canvas-wrap">
      <canvas id="game" width="960" height="600" aria-label="Claw Pong game board"></canvas>
      <div class="controls">
        <span>Move: <kbd>←</kbd> <kbd>→</kbd> or <kbd>A</kbd> <kbd>D</kbd></span>
        <span>Launch / Restart: <kbd>Space</kbd></span>
      </div>
    </section>
  </main>
`

const canvas = document.querySelector('#game')
const ctx = canvas.getContext('2d')

const scoreEl = document.querySelector('#score')
const livesEl = document.querySelector('#lives')
const blocksLeftEl = document.querySelector('#blocks-left')

const state = {
  score: 0,
  lives: 3,
  running: false,
  gameOver: false,
  win: false,
  keys: { left: false, right: false },
}

const paddle = {
  width: 160,
  height: 18,
  x: canvas.width / 2 - 80,
  y: canvas.height - 42,
  speed: 8,
}

const ball = {
  radius: 11,
  x: canvas.width / 2,
  y: paddle.y - 11,
  vx: 0,
  vy: 0,
  speed: 5.5,
  trail: [],
}

const blockConfig = {
  rows: 6,
  cols: 10,
  width: 78,
  height: 24,
  gap: 12,
  top: 92,
}

const palette = ['#7dd3fc', '#818cf8', '#c084fc', '#f472b6', '#fb7185', '#f59e0b']
let blocks = []

function buildBlocks() {
  const totalWidth = blockConfig.cols * blockConfig.width + (blockConfig.cols - 1) * blockConfig.gap
  const startX = (canvas.width - totalWidth) / 2
  blocks = []

  for (let row = 0; row < blockConfig.rows; row += 1) {
    for (let col = 0; col < blockConfig.cols; col += 1) {
      blocks.push({
        x: startX + col * (blockConfig.width + blockConfig.gap),
        y: blockConfig.top + row * (blockConfig.height + blockConfig.gap),
        width: blockConfig.width,
        height: blockConfig.height,
        color: palette[row % palette.length],
        alive: true,
      })
    }
  }
}

function resetBall(stickToPaddle = true) {
  ball.x = paddle.x + paddle.width / 2
  ball.y = paddle.y - ball.radius - 2
  ball.vx = stickToPaddle ? 0 : ball.speed * (Math.random() > 0.5 ? 1 : -1)
  ball.vy = stickToPaddle ? 0 : -ball.speed
  ball.trail = []
}

function resetGame() {
  state.score = 0
  state.lives = 3
  state.running = false
  state.gameOver = false
  state.win = false
  paddle.x = canvas.width / 2 - paddle.width / 2
  buildBlocks()
  resetBall(true)
  syncHud()
}

function syncHud() {
  scoreEl.textContent = state.score
  livesEl.textContent = state.lives
  blocksLeftEl.textContent = blocks.filter((block) => block.alive).length
}

function launchBall() {
  if (state.running || state.gameOver || state.win) return
  state.running = true
  resetBall(false)
}

function handleKeyChange(event, isDown) {
  const key = event.key.toLowerCase()
  if (key === 'arrowleft' || key === 'a') state.keys.left = isDown
  if (key === 'arrowright' || key === 'd') state.keys.right = isDown

  if (key === ' ' || event.code === 'Space') {
    event.preventDefault()
    if (state.gameOver || state.win) {
      resetGame()
    } else if (!isDown) {
      launchBall()
    }
  }
}

window.addEventListener('keydown', (event) => handleKeyChange(event, true))
window.addEventListener('keyup', (event) => handleKeyChange(event, false))

canvas.addEventListener('mousemove', (event) => {
  const rect = canvas.getBoundingClientRect()
  const scaleX = canvas.width / rect.width
  const nextX = (event.clientX - rect.left) * scaleX - paddle.width / 2
  paddle.x = Math.max(16, Math.min(canvas.width - paddle.width - 16, nextX))
  if (!state.running) resetBall(true)
})

function update() {
  if (state.keys.left) paddle.x -= paddle.speed
  if (state.keys.right) paddle.x += paddle.speed
  paddle.x = Math.max(16, Math.min(canvas.width - paddle.width - 16, paddle.x))

  if (!state.running) {
    resetBall(true)
    return
  }

  ball.x += ball.vx
  ball.y += ball.vy
  ball.trail.push({ x: ball.x, y: ball.y })
  if (ball.trail.length > 10) ball.trail.shift()

  if (ball.x - ball.radius <= 0 || ball.x + ball.radius >= canvas.width) {
    ball.vx *= -1
  }

  if (ball.y - ball.radius <= 0) {
    ball.vy *= -1
  }

  const paddleTop = paddle.y
  const paddleBottom = paddle.y + paddle.height
  const paddleLeft = paddle.x
  const paddleRight = paddle.x + paddle.width

  if (
    ball.y + ball.radius >= paddleTop &&
    ball.y - ball.radius <= paddleBottom &&
    ball.x >= paddleLeft &&
    ball.x <= paddleRight &&
    ball.vy > 0
  ) {
    const hitPoint = (ball.x - (paddle.x + paddle.width / 2)) / (paddle.width / 2)
    ball.vx = hitPoint * 6.5
    ball.vy = -Math.max(4.5, ball.speed - Math.abs(hitPoint))
  }

  for (const block of blocks) {
    if (!block.alive) continue

    const closestX = Math.max(block.x, Math.min(ball.x, block.x + block.width))
    const closestY = Math.max(block.y, Math.min(ball.y, block.y + block.height))
    const dx = ball.x - closestX
    const dy = ball.y - closestY

    if (dx * dx + dy * dy <= ball.radius * ball.radius) {
      block.alive = false
      state.score += 100
      syncHud()

      if (Math.abs(dx) > Math.abs(dy)) {
        ball.vx *= -1
      } else {
        ball.vy *= -1
      }

      if (blocks.every((candidate) => !candidate.alive)) {
        state.running = false
        state.win = true
      }
      break
    }
  }

  if (ball.y - ball.radius > canvas.height) {
    state.lives -= 1
    state.running = false
    syncHud()

    if (state.lives <= 0) {
      state.gameOver = true
    }
  }
}

function drawBackground() {
  const gradient = ctx.createLinearGradient(0, 0, canvas.width, canvas.height)
  gradient.addColorStop(0, '#020617')
  gradient.addColorStop(1, '#111827')
  ctx.fillStyle = gradient
  ctx.fillRect(0, 0, canvas.width, canvas.height)

  for (let i = 0; i < 30; i += 1) {
    const x = (i * 73) % canvas.width
    const y = (i * 97) % canvas.height
    ctx.fillStyle = 'rgba(148, 163, 184, 0.08)'
    ctx.beginPath()
    ctx.arc(x, y, (i % 3) + 1.5, 0, Math.PI * 2)
    ctx.fill()
  }
}

function drawBlocks() {
  blocks.forEach((block) => {
    if (!block.alive) return
    ctx.fillStyle = block.color
    ctx.shadowColor = block.color
    ctx.shadowBlur = 18
    ctx.fillRect(block.x, block.y, block.width, block.height)
    ctx.shadowBlur = 0

    ctx.fillStyle = 'rgba(255,255,255,0.24)'
    ctx.fillRect(block.x, block.y, block.width, 6)
  })
}

function drawPaddle() {
  const gradient = ctx.createLinearGradient(paddle.x, paddle.y, paddle.x + paddle.width, paddle.y)
  gradient.addColorStop(0, '#38bdf8')
  gradient.addColorStop(1, '#8b5cf6')
  ctx.fillStyle = gradient
  ctx.shadowColor = 'rgba(56, 189, 248, 0.7)'
  ctx.shadowBlur = 24
  ctx.beginPath()
  ctx.roundRect(paddle.x, paddle.y, paddle.width, paddle.height, 999)
  ctx.fill()
  ctx.shadowBlur = 0
}

function drawBall() {
  ball.trail.forEach((point, index) => {
    const alpha = (index + 1) / ball.trail.length
    ctx.fillStyle = `rgba(251, 191, 36, ${alpha * 0.18})`
    ctx.beginPath()
    ctx.arc(point.x, point.y, ball.radius * alpha * 0.95, 0, Math.PI * 2)
    ctx.fill()
  })

  const gradient = ctx.createRadialGradient(ball.x - 4, ball.y - 4, 2, ball.x, ball.y, ball.radius)
  gradient.addColorStop(0, '#fef3c7')
  gradient.addColorStop(1, '#f59e0b')
  ctx.fillStyle = gradient
  ctx.shadowColor = 'rgba(245, 158, 11, 0.9)'
  ctx.shadowBlur = 22
  ctx.beginPath()
  ctx.arc(ball.x, ball.y, ball.radius, 0, Math.PI * 2)
  ctx.fill()
  ctx.shadowBlur = 0
}

function drawOverlay() {
  if (!state.gameOver && !state.win && state.running) return

  ctx.fillStyle = 'rgba(2, 6, 23, 0.58)'
  ctx.fillRect(0, 0, canvas.width, canvas.height)

  ctx.textAlign = 'center'
  ctx.fillStyle = '#f8fafc'
  ctx.font = '700 42px Inter, system-ui, sans-serif'

  if (state.win) {
    ctx.fillText('You won Claw Pong ✨', canvas.width / 2, canvas.height / 2 - 10)
    ctx.font = '500 20px Inter, system-ui, sans-serif'
    ctx.fillText('Press Space to play again', canvas.width / 2, canvas.height / 2 + 32)
  } else if (state.gameOver) {
    ctx.fillText('Game over', canvas.width / 2, canvas.height / 2 - 10)
    ctx.font = '500 20px Inter, system-ui, sans-serif'
    ctx.fillText('Press Space to restart', canvas.width / 2, canvas.height / 2 + 32)
  } else {
    ctx.fillText('Press Space to launch', canvas.width / 2, canvas.height / 2 - 10)
    ctx.font = '500 20px Inter, system-ui, sans-serif'
    ctx.fillText('Clear every block to win', canvas.width / 2, canvas.height / 2 + 32)
  }
}

function draw() {
  drawBackground()
  drawBlocks()
  drawPaddle()
  drawBall()
  drawOverlay()
}

function loop() {
  update()
  draw()
  requestAnimationFrame(loop)
}

resetGame()
loop()

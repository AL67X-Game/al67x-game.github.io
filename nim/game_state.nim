# nim/game_state.nim
# Helper functions that the JS side can call.
# Compile with:  nim c -d:release --js:game_state.js nim/game_state.nim

proc updateScore(score: int): string =
  result = "Score updated to: " & $score

proc checkCollision(cx, cy, cRadius: float,
                    xCoords, yCoords, radii: seq[float]): seq[int] =
  var collided: seq[int] = @[]
  for i in 0..<xCoords.len:
    let dx = xCoords[i] - cx
    let dy = yCoords[i] - cy
    if dx*dx + dy*dy < (cRadius + radii[i])*(cRadius + radii[i]):
      collided.add i
  result = collided

proc checkMagnetZone(px, py, pRadius, magnetRange: float,
                    xCoords, yCoords, radii: seq[float]): seq[int] =
  var pulled: seq[int] = @[]
  for i in 0..<xCoords.len:
    let dx = xCoords[i] - px
    let dy = yCoords[i] - py
    let d2 = dx*dx + dy*dy
    if d2 < magnetRange*magnetRange and d2 > (pRadius + radii[i])*(pRadius + radii[i]):
      pulled.add i
  result = pulled

# nim/swipe_detector.nim
# Wrapper around the Rust `calculate_swipe` function.
# Compile with:  nim c -d:release --js:swipe_detector.js nim/swipe_detector.nim

proc calculateSwipe(dragX, dragY, screenW: float, released: bool): tuple[
    offsetX, offsetY, rotation, action: float]. {.importc: "calculate_swipe",
    dynlib: "al67x_physics/pkg/al67x_physics.js".}

proc handleSwipe(dragX, dragY, screenW: float, released: bool) =
  let res = calculateSwipe(dragX, dragY, screenW, released)
  if res.action == 1.0:
    # Right swipe → revive
    revivePlayer()
  elif res.action == -1.0:
    # Left swipe → immediate game over
    endGame()

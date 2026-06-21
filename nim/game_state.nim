# Nim code for game state management
# This will replace some JS logic for better performance and maintainability

proc updateScore(score: int): string =
  result = "Score updated to: " & $score

proc checkCollision(cx: float, cy: float, c_radius: float,
                   x_coords: seq[float], y_coords: seq[float],
                   radii: seq[float]): seq[int] =
  var collided_indices = @[]
  let len = x_coords.len
  for i in 0..<len:
    let dx = x_coords[i] - cx
    let dy = y_coords[i] - cy
    let d = sqrt(dx*dx + dy*dy)
    if d < c_radius + radii[i]:
      collided_indices.add i
  result = collided_indices

proc calculateSwipe(drag_x: float, drag_y: float, screen_width: float, is_released: bool): tuple[
  offset_x: float, offset_y: float, rotation: float, action: int] =
  let offset_x = drag_x
  let offset_y = drag_y * 0.3
  let rotation = drag_x * 0.08
  let mut action = 0
  let threshold = screen_width * 0.25
  if is_released:
    if drag_x > threshold:
      action = 1
    else if drag_x < -threshold:
      action = -1
  result = (offset_x, offset_y, rotation, action)

# Nim code for swipe detection
# This will handle swipe gestures for the Instagram card

proc detectSwipe(x: float, y: float, screen_width: float, released: bool): tuple[
  offset_x: float, offset_y: float, rotation: float, action: int] =
  result = calculateSwipe(x, y, screen_width, released)

proc checkMagnetZone(px: float, py: float, p_radius: float,
                    magnet_range: float, x_coords: seq[float],
                    y_coords: seq[float], radii: seq[float]): seq[int] =
  var pulled_indices = @[]
  let len = x_coords.len
  for i in 0..<len:
    let dx = x_coords[i] - px
    let dy = y_coords[i] - py
    let d = sqrt(dx*dx + dy*dy)
    if d < magnet_range and d > p_radius + radii[i]:
      pulled_indices.add i
  result = pulled_indices

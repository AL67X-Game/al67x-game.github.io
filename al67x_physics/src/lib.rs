use js_sys::JsError;
use wasm_bindgen::prelude::*;

#[cfg(feature = "wee_alloc")]
#[global_allocator]
static ALLOC: wee_alloc::WeeAlloc = wee_alloc::WeeAlloc::INIT;

/// Calculates the Euclidean distance between two points.
#[wasm_bindgen]
pub fn dist(x1: f64, y1: f64, x2: f64, y2: f64) -> f64 {
    ((x2 - x1).powi(2) + (y2 - y1).powi(2)).sqrt()
}

/// Bulk check for enemies colliding with a circle (e.g. player or bomb).
/// Returns a Result containing a Uint32Array of indices that collided.
/// Returns an error if inputs are invalid.
#[wasm_bindgen]
pub fn check_circle_collisions(
    cx: f64,
    cy: f64,
    c_radius: f64,
    x_coords: &[f64],
    y_coords: &[f64],
    radii: &[f64],
) -> Result<js_sys::Uint32Array, JsError> {
    // Input validation
    if c_radius <= 0.0 {
        return Err(JsError::new("Collision radius must be positive"));
    }
    if x_coords.is_empty() || y_coords.is_empty() || radii.is_empty() {
        return Err(JsError::new("Coordinate arrays cannot be empty"));
    }
    if x_coords.len() != y_coords.len() || x_coords.len() != radii.len() {
        return Err(JsError::new(
            "Coordinate and radius arrays must have matching lengths",
        ));
    }

    let mut collided_indices = Vec::new();
    let len = x_coords.len();

    for i in 0..len {
        let dx = x_coords[i] - cx;
        let dy = y_coords[i] - cy;
        // Avoid sqrt by comparing squared distances
        let d_squared = dx * dx + dy * dy;
        let threshold = (c_radius + radii[i]).powi(2);

        if d_squared < threshold {
            collided_indices.push(i as u32);
        }
    }

    Ok(js_sys::Uint32Array::from(&collided_indices[..]))
}

/// Filter out items in the magnet zone
/// Returns a Result containing indices of items to pull.
#[wasm_bindgen]
pub fn check_magnet_zone(
    px: f64,
    py: f64,
    p_radius: f64,
    magnet_range: f64,
    x_coords: &[f64],
    y_coords: &[f64],
    radii: &[f64],
) -> Result<js_sys::Uint32Array, JsError> {
    // Input validation
    if magnet_range <= 0.0 || p_radius <= 0.0 {
        return Err(JsError::new("Radius values must be positive"));
    }
    if x_coords.is_empty() || y_coords.is_empty() || radii.is_empty() {
        return Err(JsError::new("Coordinate arrays cannot be empty"));
    }
    if x_coords.len() != y_coords.len() || x_coords.len() != radii.len() {
        return Err(JsError::new(
            "Coordinate and radius arrays must have matching lengths",
        ));
    }

    let mut pulled_indices = Vec::new();
    let len = x_coords.len();

    for i in 0..len {
        let dx = x_coords[i] - px;
        let dy = y_coords[i] - py;
        // Avoid sqrt by comparing squared distances
        let d_squared = dx * dx + dy * dy;
        let inner_threshold = (p_radius + radii[i]).powi(2);
        let outer_threshold = magnet_range.powi(2);

        if d_squared < outer_threshold && d_squared > inner_threshold {
            pulled_indices.push(i as u32);
        }
    }

    Ok(js_sys::Uint32Array::from(&pulled_indices[..]))
}

#[wasm_bindgen]
pub struct SwipeResult {
    pub offset_x: f64,
    pub offset_y: f64,
    pub rotation: f64,
    pub action: f64, // Changed to f64 for consistency
}

#[wasm_bindgen]
pub fn calculate_swipe(
    drag_x: f64,
    drag_y: f64,
    screen_width: f64,
    is_released: bool,
) -> SwipeResult {
    let offset_x = drag_x;
    let offset_y = drag_y * 0.3;
    let rotation = drag_x * 0.08;
    let mut action = 0.0;

    let threshold = screen_width * 0.25;

    if is_released {
        if drag_x > threshold {
            action = 1.0; // Swipe right (like/revive)
        } else if drag_x < -threshold {
            action = -1.0; // Swipe left (nope/game over)
        }
    }

    SwipeResult {
        offset_x,
        offset_y,
        rotation,
        action,
    }
}

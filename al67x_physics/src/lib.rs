use wasm_bindgen::prelude::*;

// When the `wee_alloc` feature is enabled, use `wee_alloc` as the global
// allocator.
#[cfg(feature = "wee_alloc")]
#[global_allocator]
static ALLOC: wee_alloc::WeeAlloc = wee_alloc::WeeAlloc::INIT;

#[wasm_bindgen]
pub fn dist(x1: f64, y1: f64, x2: f64, y2: f64) -> f64 {
    ((x2 - x1).powi(2) + (y2 - y1).powi(2)).sqrt()
}

// Bulk check for enemies colliding with a circle (e.g. player or bomb)
// Returns a Uint32Array of indices that collided.
#[wasm_bindgen]
pub fn check_circle_collisions(
    cx: f64,
    cy: f64,
    c_radius: f64,
    x_coords: &[f64],
    y_coords: &[f64],
    radii: &[f64],
) -> js_sys::Uint32Array {
    let mut collided_indices = Vec::new();
    let len = x_coords.len();
    
    for i in 0..len {
        let dx = x_coords[i] - cx;
        let dy = y_coords[i] - cy;
        let d = (dx * dx + dy * dy).sqrt();
        if d < c_radius + radii[i] {
            collided_indices.push(i as u32);
        }
    }
    
    js_sys::Uint32Array::from(&collided_indices[..])
}

// Filter out items in the magnet zone
#[wasm_bindgen]
pub fn check_magnet_zone(
    px: f64,
    py: f64,
    p_radius: f64,
    magnet_range: f64,
    x_coords: &[f64],
    y_coords: &[f64],
    radii: &[f64]
) -> js_sys::Uint32Array {
    let mut pulled_indices = Vec::new();
    let len = x_coords.len();
    
    for i in 0..len {
        let dx = x_coords[i] - px;
        let dy = y_coords[i] - py;
        let d = (dx * dx + dy * dy).sqrt();
        if d < magnet_range && d > p_radius + radii[i] {
            pulled_indices.push(i as u32);
        }
    }
    
    js_sys::Uint32Array::from(&pulled_indices[..])
}

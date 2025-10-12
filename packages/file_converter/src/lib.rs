use std::io::Cursor;

use image::{ImageFormat, load_from_memory};
use wasm_bindgen::prelude::*;

#[wasm_bindgen]
pub fn convert_image(input_image: &[u8], input_format: &str) -> Result<Vec<u8>, JsError> {
    let dynamic_image = match load_from_memory(input_image) {
        Ok(data) => data,
        Err(_) => return Err(JsError::new("Unable to load image from the bytes")),
    };
    let mut output_image = Cursor::new(Vec::new());
    let output_format = match input_format {
        "png" => ImageFormat::Png,
        "gif" => ImageFormat::Gif,
        "jpeg" | "jpg" => ImageFormat::Jpeg,
        "webp" => ImageFormat::WebP,
        "tiff" => ImageFormat::Tiff,
        _ => return Err(JsError::new("Unable to recognise format")),
    };

    if let Err(_) = dynamic_image.write_to(&mut output_image, output_format) {
        return Err(JsError::new("Unable to convert file to desired format"));
    }
    return Ok(output_image.into_inner());
}

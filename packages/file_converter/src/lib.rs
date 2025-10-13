use std::io::Cursor;

use image::{ImageFormat, load_from_memory};
use wasm_bindgen::prelude::*;
use wasm_bindgen_futures::{
    future_to_promise,
    js_sys::{Promise, Uint8Array},
};

#[wasm_bindgen]
pub fn convert_image(input_image: Vec<u8>, input_format: String) -> Promise {
    future_to_promise(async move {
        let dynamic_image = load_from_memory(&input_image).map_err(|err| {
            JsValue::from_str(&format!("Unable to load image from the bytes {}", err))
        })?;
        let mut output_image = Cursor::new(Vec::new());
        let output_format = match input_format.as_str() {
            "png" => ImageFormat::Png,
            "gif" => ImageFormat::Gif,
            "jpeg" | "jpg" => ImageFormat::Jpeg,
            "webp" => ImageFormat::WebP,
            "tiff" => ImageFormat::Tiff,
            _ => return Err(JsValue::from_str("Unable to recognise format")),
        };

        if let Err(_) = dynamic_image.write_to(&mut output_image, output_format) {
            return Err(JsValue::from_str(
                "Unable to convert file to desired format",
            ));
        }
        let js_array: JsValue = Uint8Array::from(&output_image.into_inner()[..]).into();
        return Ok(js_array.into());
    })
}

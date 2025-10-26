use console_error_panic_hook;
use flate2::read::ZlibDecoder;
use image::{ImageBuffer, ImageFormat, load_from_memory};
use lopdf::{Document, ObjectId, xobject::PdfImage};
use std::io::{Cursor, Read};
use std::panic;
use wasm_bindgen::prelude::*;
use wasm_bindgen_futures::{
    future_to_promise,
    js_sys::{Promise, Uint8Array},
};

#[wasm_bindgen]
extern "C" {
    #[wasm_bindgen(js_namespace = console)]
    fn log(s: &str);
}

#[wasm_bindgen(start)]
pub fn main_js() {
    panic::set_hook(Box::new(console_error_panic_hook::hook));
}

#[wasm_bindgen]
pub fn convert_image(input_file: Vec<u8>, output_format: String) -> Promise {
    future_to_promise(async move {
        let dynamic_image = load_from_memory(&input_file).map_err(|err| {
            JsValue::from_str(&format!("Unable to load image file from the bytes {}", err))
        })?;
        let mut output_image = Cursor::new(Vec::new());
        let output_format = get_format(&output_format)
            .ok_or_else(|| JsValue::from_str("Unable to recognise format"))?;

        dynamic_image
            .write_to(&mut output_image, output_format)
            .map_err(|_| JsValue::from_str("Unable to convert file to desired format"))?;
        let js_array: JsValue = Uint8Array::from(&output_image.into_inner()[..]).into();
        Ok(js_array)
    })
}

#[wasm_bindgen]
pub fn convert_pdf(input_file: Vec<u8>, output_format: String) -> Promise {
    future_to_promise(async move {
        let doc = Document::load_mem(&input_file)
            .map_err(|err| JsValue::from_str(&format!("Unable to load document: {err}")))?;
        let page_number: Vec<ObjectId> = doc.get_pages().values().cloned().collect();

        let pdf_images: Vec<PdfImage> = page_number
            .iter()
            .flat_map(|object_id| doc.get_page_images(*object_id).ok().into_iter().flatten())
            .collect();

        let first_image = pdf_images
            .iter()
            .next()
            .ok_or_else(|| JsValue::from_str("No images in this pdf document"))?;

        let output_format = get_format(&output_format)
            .ok_or_else(|| JsValue::from_str("Unable to recognise format"))?;

        let mut data = first_image.content.to_vec();

        let filters = first_image.filters.as_deref().unwrap_or(&[]);
        for filter in filters {
            match filter.as_str() {
                "FlateDecode" => {
                    let mut z = ZlibDecoder::new(&data[..]);
                    let mut decoded = Vec::new();
                    z.read_to_end(&mut decoded).map_err(|err| {
                        JsValue::from_str(&format!("Unable to decode filter: {err}"))
                    })?;
                    data = decoded;
                }
                "DCTDecode" => {}
                other => return Err(JsValue::from_str(&format!("Filter not supported: {other}"))),
            }
        }

        let last_filter = first_image.filters.as_deref().unwrap_or(&[]).iter().last();
        let dynamic_image = if let Some(filter) = last_filter
            && filter == "FlateDecode"
        {
            let img =
                ImageBuffer::from_raw(first_image.width as u32, first_image.height as u32, data)
                    .ok_or_else(|| JsValue::from_str("Unable to convert data to image"))?;
            image::DynamicImage::ImageRgb8(img)
        } else {
            load_from_memory(&data)
                .map_err(|err| JsValue::from_str(&format!("Loading from memory failed: {err}")))?
        };

        let mut output_image = Cursor::new(Vec::new());
        dynamic_image
            .write_to(&mut output_image, output_format)
            .map_err(|_| JsValue::from_str("Unable to convert file to desired format"))?;
        let js_array: JsValue = Uint8Array::from(&output_image.into_inner()[..]).into();
        Ok(js_array)
    })
}

pub fn get_format(input_format: &str) -> Option<ImageFormat> {
    match input_format {
        "png" => Some(ImageFormat::Png),
        "gif" => Some(ImageFormat::Gif),
        "jpeg" | "jpg" => Some(ImageFormat::Jpeg),
        "webp" => Some(ImageFormat::WebP),
        "tiff" => Some(ImageFormat::Tiff),
        "bmp" => Some(ImageFormat::Bmp),
        "avif" => Some(ImageFormat::Avif),

        _ => None,
    }
}

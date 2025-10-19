import init, { convert_image, convert_pdf } from "file_converter";
import { type UploadedFile } from "./store/useFileStore";

interface messageData {
	uploadedFiles: UploadedFile[],
	format: string,
	wasmPath: string,
}

let wasmInit = false;

const initWasm = async (wasmPath: string) => {
	if (!wasmInit) {
		await init(wasmPath);
		wasmInit = true;
	}
}

onmessage = async e => {
	const { uploadedFiles, format, wasmPath }: messageData = e.data;

	try {
		await initWasm(wasmPath);

		const convertedFiles: UploadedFile[] = await Promise.all(uploadedFiles.map(async (uploadedFile) => {
			try {
				const type = uploadedFile.file.type.split("/")[1];
				const arrayBuffer = await uploadedFile.file.arrayBuffer();
				const inputU8 = new Uint8Array(arrayBuffer);
				let outputU8;
				if (type == "pdf") {
					outputU8 = await convert_pdf(inputU8, format); if (!outputU8) {
						return uploadedFile;
					};
				} else {
					outputU8 = await convert_image(inputU8, format); if (!outputU8) {
						return uploadedFile;
					};
				}
				const convertedImage = new Blob([new Uint8Array(outputU8)], { type: `image/${format.toLowerCase()}` });
				return {
					...uploadedFile,
					blob: convertedImage,
					blob_name: uploadedFile.file.name.replace(/\.[^/.]+$/, '') + `.${format.toLowerCase()}`
				};

			} catch (err) {
				console.error(`Conversion failed for ${uploadedFile.file.name}:`, err);
				return uploadedFile;
			}
		}));

		postMessage({
			success: true,
			convertedFiles: convertedFiles,
		})

	} catch (err: any) {
		postMessage({
			success: false,
			error: err.toString(),
		});
	}
}

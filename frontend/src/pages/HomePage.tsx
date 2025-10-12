import "../index.css";
import React, { useState, useEffect } from "react";
import { ImageUp } from "lucide-react";
import init, { convert_image } from "file_converter";
import { type UploadedFile, useFiles } from "../store/useFileStore";

const allowedTypes = ["image/png", "image/jpeg", "image/gif", "image/tiff", "image/webp", "image/svg"];

const HomePage = () => {

	useEffect(() => {
		const loadWasm = async () => {
			await init();
			setWasmInit(true);
		};
		loadWasm();
	}, []);

	const [wasmInit, setWasmInit] = useState(false);
	const uploadedFiles = useFiles(state => state.uploadedFiles);
	const setUploadedFiles = useFiles(state => state.setUploadedFiles);
	const addUploadedFiles = useFiles(state => state.addUploadedFiles);

	const convert_to = async (uploadedFile: UploadedFile, format: string) => {
		if (!wasmInit) {
			return;
		}
		const arrayBuffer = await uploadedFile.file.arrayBuffer();
		const inputImage = new Uint8Array(arrayBuffer);
		try {
			const outputU8 = convert_image(inputImage, format);
			const outputImage = new Blob([new Uint8Array(outputU8)], { type: `image/${format.toLowerCase()}` });
			return outputImage;
		} catch (e) {
			console.log(e);
			return;
		}
	}

	const convert_all = async () => {
		const processedFiles: UploadedFile[] = await Promise.all(uploadedFiles.map(async (file) => {
			const convertedImage = await convert_to(file, "png");
			return { ...file, blob: convertedImage }
		}));

		setUploadedFiles(processedFiles);
	}

	let processedFiles = (files: File[]) => {
		if (!files.length) {
			return;
		}
		const processedFiles: UploadedFile[] = files.map(file => {
			const preview = URL.createObjectURL(file);
			return { file, preview };
		});
		addUploadedFiles(processedFiles);
	}

	const handleFiles = (e: React.ChangeEvent<HTMLInputElement>) => {
		e.preventDefault();
		const { files: selectedFiles } = e.target;
		if (selectedFiles?.length) {
			const files = Array.from(selectedFiles);
			const validFiles = files.filter(file => allowedTypes.includes(file.type));
			processedFiles(validFiles);
		}
		e.target.value = "";
	}

	const handleDrop = (e: React.DragEvent<HTMLDivElement>) => {
		e.preventDefault();

		const droppedFiles = Array.from(e.dataTransfer.files);
		const validFiles = droppedFiles.filter(file => allowedTypes.includes(file.type));
		processedFiles(validFiles)
	}

	const removeAll = () => {
		uploadedFiles.forEach(file => {
			if (file.preview) {
				URL.revokeObjectURL(file.preview)
			}
		})
		setUploadedFiles([]);
	}

	const removeFile = (file: File) => {
		const processedFiles: UploadedFile[] = uploadedFiles.filter((uploadedFile => {
			if (uploadedFile.file != file) {
				return uploadedFile;
			} else if (uploadedFile.preview) {
				URL.revokeObjectURL(uploadedFile.preview);
			}
		}))
		setUploadedFiles(processedFiles);
	}

	const formatFileSize = (bytes: number): string => {
		if (bytes === 0) return "0 Bytes"
		const k = 1024
		const sizes = ["Bytes", "KB", "MB", "GB"]
		const i = Math.floor(Math.log(bytes) / Math.log(k))
		return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + " " + sizes[i]
	}

	return (
		<main className="bg-background-dark place-items-center w-full min-h-screen pt-20">
			<div className="p-5 flex flex-col gap-3 w-250">
				<div onDrop={handleDrop} className="relative h-70 bg-background size-full rounded-xl shadow-m hover:shadow-l transition-all duration-200">
					<input className="size-full cursor-pointer absolute inset-0 opacity-0" type="file" multiple accept="image/*" onChange={handleFiles} />
					<div className="size-full flex flex-col gap-4 justify-center items-center">
						<ImageUp className="stroke-[1.5px] stroke-primary size-16" />
						<div className="text-center">
							<p className="text-md text-text">Upload Images or PDF</p>
							<p className="text-xs text-text-muted">Drag the files or click here</p>
						</div>
					</div>
				</div>
				{uploadedFiles.length > 0 && (
					<div className="w-full flex gap- gap-3">
						<button onClick={convert_all} className="bg-primary py-1 px-6 text-md cursor-pointer shadow-m rounded-xl text-background-light hover:bg-secondary transition-all duration-200">Convert</button>
						<div>
							<button className="py-1 px-6 text-md cursor-pointer shadow-m rounded-xl bg-background hover:bg-primary hover:text-background-light transition-all duration-200">Format</button>
							<div></div>
						</div>
						<button onClick={removeAll} className="ml-auto py-1 px-6 rounded-xl shadow-m bg-background hover:bg-danger hover:text-background cursor-pointer transition-all duration-200">Remove All</button>
					</div>
				)}
				<div className="grid grid-cols-5 gap-4">
					{uploadedFiles.map((uploadedFile, index) => (
						<div key={index} className="bg-background rounded-xl p-4 shadow-m transition-all duration-200">
							<div className="space-y-2">
								<div className="shadow-s bg-background-light size-full flex aspect-square justify-center rounded-md items-center overflow-hidden">
									<img src={uploadedFile.preview} draggable={false} />
								</div>
								<div>
									<p className="truncate text-sm text-text">{uploadedFile.file.name}</p>
									<p className="text-xs text-text-muted">{formatFileSize(uploadedFile.file.size)}</p>
								</div>
								<button onClick={() => removeFile(uploadedFile.file)} className="py-0.5 shadow-s cursor-pointer w-full rounded-md bg-background-light hover:bg-danger hover:text-background-light transition-all duration-200">Remove</button>
							</div>
						</div>
					))}
				</div>
			</div>
		</main>
	);
}

export default HomePage;

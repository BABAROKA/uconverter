import "../index.css";
import React, { useEffect, useState } from "react";
import { ImageUp, ChevronDown, ChevronUp, LoaderPinwheel, File } from "lucide-react";
import { type UploadedFile, useFiles } from "../store/useFileStore";
import { useConverted } from "../store/useConvertedStore";
import { useNavigate } from 'react-router-dom';

interface messageData {
	success: boolean,
	convertedFiles: UploadedFile[],
	error: any;
}

const allowedTypes = ["image/png", "image/jpeg", "image/gif", "image/tiff", "image/webp", "image/bmp", "image/avif", "application/pdf"];

const HomePage = () => {
	const [format, setFormat] = useState("");
	const [formatOpen, setFormatsOpen] = useState(false);
	const [converting, setConverting] = useState(false);

	const uploadedFiles = useFiles(state => state.uploadedFiles);
	const setUploadedFiles = useFiles(state => state.setUploadedFiles);
	const addUploadedFiles = useFiles(state => state.addUploadedFiles);
	const setConverted = useConverted(state => state.setConverted);

	const navigate = useNavigate();

	useEffect(() => {
		removeAll();
		setConverted(false);
		setConverting(false);
		setFormat("");
		return () => {
			uploadedFiles.forEach(f => f.preview && URL.revokeObjectURL(f.preview));
		};
	}, []);

	const convert_all = async () => {
		setConverting(true);
		const filePromise = new Promise<UploadedFile[]>((resolve, reject) => {
			const convertWorker = new Worker(new URL("../converterWorker.ts", import.meta.url), { type: "module" });

			convertWorker.postMessage({ uploadedFiles, format, wasmPath: "/file_converter_bg.wasm" });

			convertWorker.onmessage = (e) => {
				const { success, convertedFiles, error }: messageData = e.data;
				convertWorker.terminate();
				if (!success) {
					reject(error || new Error("Worker conversion failed with unknown error."))
				}
				resolve(convertedFiles);
			}

			convertWorker.onerror = (e) => {
				convertWorker.terminate();
				reject(new Error(`Worker error: ${e.message}`))
			}
		});
		try {
			const processedFiles = await filePromise;
			if (!processedFiles) {
				setConverting(false);
				return;
			}
			setUploadedFiles(processedFiles);
		} catch (e) {
			console.log(e);
			setConverting(false);
		}
		setConverted(true);
		try {
			navigate("/download", { viewTransition: true });
		} catch {
			navigate("/download");
		}
		setConverting(false);
	}

	let processFiles = (files: File[]) => {
		if (!files.length) {
			return;
		}
		const processedFiles: UploadedFile[] = files.map(file => {
			let preview = undefined;
			if (file.type.startsWith("image") && !file.type.endsWith("tiff")) {
				preview = URL.createObjectURL(file);
			}
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
			processFiles(validFiles);
		}
		e.target.value = "";
	}

	const handleDrop = (e: React.DragEvent<HTMLDivElement>) => {
		e.preventDefault();

		const droppedFiles = Array.from(e.dataTransfer.files);
		const validFiles = droppedFiles.filter(file => allowedTypes.includes(file.type));
		processFiles(validFiles)
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
				return false;
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
		<main className="bg-background-dark w-full min-h-screen px-3">
			<div className="absolute size-30 -mt-5 rotate-y-180" style={{ viewTransitionName: "pizza-image" }}>
				<img src="/pizza.svg" alt="pizza" draggable={false} />
			</div>
			<div className="w-full flex justify-center pt-20">
				<div className="p-5 flex flex-col gap-3 w-250">
					<div onDrop={handleDrop} className={`relative h-40 md:h-70 bg-background size-full rounded-xl transition-all duration-200 ${converting ? "" : "shadow-m hover:shadow-l"}`}>
						<input disabled={converting} className={`size-full absolute inset-0 opacity-0 ${converting ? "cursor-default" : "cursor-pointer"}`} type="file" multiple accept="image/*, application/pdf" onChange={handleFiles} />

						<div className="size-full flex flex-col gap-4 justify-center items-center">
							{
								converting ?
									<LoaderPinwheel className="stroke-[1.5px] stroke-primary size-16 animate-spin" /> :
									<ImageUp className="stroke-[1.5px] stroke-primary size-16" />
							}
							<div className="text-center">
								<p className="text-md text-text">Upload Images or PDF</p>
								<p className="text-xs text-text-muted">Drag the files or click here</p>
							</div>
						</div>
					</div>
					{(uploadedFiles.length > 0) && (
						<div className="w-full flex gap-3">
							<button disabled={!format || converting} onClick={convert_all} className="text-sm sm:text-base bg-primary disabled:cursor-default disabled:bg-primary-muted px-2 md:px-6 text-md cursor-pointer shadow-m rounded-xl text-background-light hover:bg-secondary transition-all duration-200">Convert</button>
							<div className="relative space-y-1">
								<button disabled={converting} onClick={() => setFormatsOpen(!formatOpen)} className='text-sm sm:text-base bg-background hover:bg-primary hover:text-background-light shadow-m flex h-full justify-between items-center gap-2 px-2 md:px-6 rounded-xl cursor-pointer text-center disabled:bg-primary-muted disabled:cursor-default disabled:text-background-light transition-all duration-200'>
									{format == "" ? "Format" : format.toUpperCase()} {formatOpen ? <ChevronUp className='stroke-1 size-4' /> : <ChevronDown className='stroke-1 size-4' />}
								</button>
								{formatOpen && (
									<div className='absolute rounded-xl p-2 overflow-hidden mt-0.5 bg-background shadow-l w-max'>
										<ul className='grid grid-cols-2 gap-2 p-1'>
											{allowedTypes.filter(excludeType => excludeType.split("/")[1] != format && excludeType.split("/")[0] == "image").map((type, index) => {
												const formatType = type.split("/")[1];
												return (
													<li key={index} onClick={() => { setFormat(formatType); setFormatsOpen(!formatOpen) }} className='bg-background-light shadow-s hover:shadow-m rounded-lg cursor-pointer py-1 px-5 transition-all duration-200 text-center' value={formatType}>{formatType.toUpperCase()}</li>
												)
											})}
										</ul>
									</div>
								)}

							</div>
							<button onClick={removeAll} className="text-sm sm:text-base text-nowrap ml-auto py-1 px-2 md:px-6 rounded-xl shadow-m bg-background hover:bg-danger hover:text-background cursor-pointer transition-all duration-200">Remove All</button>
						</div>
					)}
					<div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-5 gap-4">
						{uploadedFiles.map((uploadedFile, index) => (
							<div key={index} className="bg-background rounded-xl p-4 shadow-m transition-all duration-200">
								<div className="space-y-2">
									<div className="shadow-s bg-background-light size-full flex aspect-square justify-center rounded-md items-center overflow-hidden">
										{uploadedFile.preview ? (
											<img src={uploadedFile.preview} draggable={false} />
										) : (
											<div className='text-center space-y-1'>
												<File className='size-10 stroke-primary-muted mx-auto' />
												<p className='text-xs text-text-muted'>{uploadedFile.file.type.split('/')[1] || 'FILE'}</p>
											</div>
										)}
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
			</div>
		</main>
	);
}

export default HomePage;

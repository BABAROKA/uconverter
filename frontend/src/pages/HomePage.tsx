import "../index.css";
import React, { useState, useEffect } from "react";
import { ImageUp, ChevronDown, ChevronUp, LoaderPinwheel } from "lucide-react";
import init, { convert_image } from "file_converter";
import { type UploadedFile, useFiles } from "../store/useFileStore";
import { useConverted } from "../store/useConvertedStore";
import { useNavigate } from 'react-router-dom';

const allowedTypes = ["image/png", "image/jpeg", "image/gif", "image/tiff", "image/webp",];

const HomePage = () => {
	const [wasmInit, setWasmInit] = useState(false);
	const [format, setFormat] = useState("");
	const [formatOpen, setFormatsOpen] = useState(false);
	const [converting, setConverting] = useState(false);

	useEffect(() => {
		const loadWasm = async () => {
			await init("/file_converter_bg.wasm");
			setWasmInit(true);
		};
		loadWasm();
	}, []);

	const uploadedFiles = useFiles(state => state.uploadedFiles);
	const setUploadedFiles = useFiles(state => state.setUploadedFiles);
	const addUploadedFiles = useFiles(state => state.addUploadedFiles);
	const setConverted = useConverted(state => state.setConverted);

	const navigate = useNavigate();

	const convert_to = async (uploadedFile: UploadedFile, outputFormat: string) => {
		if (!wasmInit) return;
		const arrayBuffer = await uploadedFile.file.arrayBuffer();
		const inputImage = new Uint8Array(arrayBuffer);
		const outputU8 = await convert_image(inputImage, outputFormat);
		const outputImage = new Blob([new Uint8Array(outputU8)], { type: `image/${outputFormat.toLowerCase()}` });
		return outputImage;
	}

	const convert_all = async () => {
		setConverting(true);
		const processedFiles: UploadedFile[] = await Promise.all(uploadedFiles.map(async (uploadedFile) => {
			try {
				const convertedImage = await convert_to(uploadedFile, format); if (!convertedImage) {
					return uploadedFile;
				}
				return {
					...uploadedFile,
					blob: convertedImage,
					blob_name: uploadedFile.file.name.replace(/\.[^/.]+$/, '') + `.${format.toLowerCase()}`
				};

			} catch {
				return uploadedFile;
			}
		}));

		setUploadedFiles(processedFiles);
		setConverted(true);
		navigate("/download", { viewTransition: true });
		setConverting(false);
	}

	let processFiles = (files: File[]) => {
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
		<main className="bg-background-dark w-full min-h-screen">
			<div className="absolute size-30 -mt-5" style={{ viewTransitionName: "pizza-image" }}>
				<svg xmlns="http://www.w3.org/2000/svg" className="w-full h-auto rotate-y-180" viewBox="0 0 800 800" version="1.1" preserveAspectRatio="xMidYMid meet">
					<path d="M 395.233 230.668 C 388.757 232.960, 380.576 241.024, 376.791 248.845 C 373.985 254.646, 373.572 256.527, 373.578 263.500 C 373.583 269.610, 374.108 272.656, 375.800 276.395 L 378.016 281.289 370.636 292.895 C 362.376 305.884, 350.263 324.760, 299.018 404.500 C 248.863 482.545, 239.065 497.952, 236.946 502.107 C 234.169 507.549, 232.804 517.695, 234 524.001 C 235.284 530.770, 238.227 535.460, 243.297 538.815 C 246.794 541.129, 248.382 541.496, 254.924 541.498 C 259.091 541.499, 264.075 541.163, 266 540.751 L 269.500 540.003 269.500 549.926 C 269.500 558.388, 269.804 560.256, 271.562 562.613 C 275.373 567.721, 278.715 569.500, 284.500 569.500 C 291.042 569.500, 294.548 567.245, 297.750 560.980 C 299.769 557.028, 300 555.128, 300 542.456 L 300 528.336 303.250 527.288 C 305.038 526.711, 311.311 524.200, 317.192 521.706 L 327.883 517.173 329.400 519.488 C 331.531 522.739, 338.984 525.413, 343.537 524.559 C 349.177 523.501, 353.958 518.459, 355.402 512.047 L 356.617 506.653 366.962 502.327 C 372.653 499.947, 377.464 498, 377.654 498 C 377.844 498, 378.010 500.137, 378.022 502.750 C 378.051 509.058, 381.066 515.460, 385.192 517.976 C 392.066 522.167, 401.749 519.740, 406.005 512.759 C 407.699 509.981, 407.993 507.710, 407.996 497.372 C 407.999 488.842, 408.371 484.966, 409.250 484.306 C 409.938 483.789, 415 481.425, 420.500 479.053 C 426 476.680, 447.825 467.103, 469 457.770 C 515.195 437.410, 558.210 418.531, 578 409.932 C 595.016 402.538, 598.433 400.549, 602.941 395.414 C 608.727 388.825, 611.420 381.672, 611.832 371.802 C 612.553 354.537, 606.643 345.099, 580.803 322.246 C 549.122 294.228, 516.734 272.936, 479.858 255.883 C 461.456 247.374, 451.363 243.421, 427.529 235.392 C 407.285 228.571, 402.949 227.937, 395.233 230.668 M 399.500 240.061 C 390.826 242.607, 384 253.133, 384 263.962 C 384 275.514, 384.810 276.282, 404.052 282.969 C 458.246 301.804, 498.719 325.288, 537.034 360.129 L 546.779 368.990 547.469 365.245 C 548.493 359.682, 551.596 353.199, 555.537 348.390 C 559.630 343.394, 571.474 337, 576.634 337 C 578.485 337, 580 336.576, 580 336.058 C 580 334.934, 558.809 316.868, 547.500 308.349 C 512.214 281.771, 474.479 262.363, 426.133 245.925 C 404.981 238.733, 404.434 238.613, 399.500 240.061 M 382.149 294.499 L 378.074 300.997 382.079 303.040 C 396.449 310.372, 402.471 327.341, 395.650 341.283 C 387.286 358.379, 365.297 363.707, 350.184 352.301 C 348.361 350.924, 346.731 349.956, 346.563 350.149 C 346.395 350.342, 339.619 360.850, 331.506 373.500 C 323.393 386.150, 314.335 400.208, 311.378 404.741 C 306.100 412.827, 305.144 415, 306.859 415 C 308.929 415, 317.329 423.702, 319.772 428.377 C 323.583 435.669, 323.601 446.316, 319.814 453.500 C 311.685 468.922, 293.694 474.655, 277.745 466.907 C 275.160 465.651, 272.881 464.820, 272.682 465.061 C 271.365 466.656, 247.913 504.144, 246.557 506.822 C 245.266 509.369, 245.143 510.468, 246.027 511.533 C 248.049 513.969, 250.500 514.077, 256.959 512.013 C 260.425 510.906, 264.371 510, 265.729 510 C 269.813 510, 274.830 512.990, 277.234 516.856 C 279.330 520.226, 279.525 521.853, 279.835 538.499 C 280.029 548.948, 280.605 557.024, 281.207 557.749 C 281.778 558.437, 283.260 559, 284.500 559 C 288.972 559, 289.466 556.953, 290.027 536.101 C 290.552 516.558, 290.563 516.481, 293.760 509.893 C 297.579 502.022, 303.874 495.864, 311.825 492.220 C 325.390 486.004, 336 491.321, 336 504.336 C 336 510.719, 337.438 514.003, 340.225 513.985 C 344.635 513.955, 345.267 512.667, 346.091 502.040 C 347.270 486.818, 352.834 477.330, 363.500 472.353 C 372.125 468.328, 379.446 469.788, 384.618 476.563 C 387.378 480.179, 387.521 480.896, 388 493.521 C 388.519 507.194, 389.379 510, 393.051 510 C 397.244 510, 398 507.560, 398 494.034 C 398 478.885, 399.780 471.744, 405.929 462.232 C 411.965 452.892, 416.880 448.803, 430.767 441.565 C 445.762 433.750, 452.388 431.690, 459.674 432.580 C 468.919 433.708, 473.988 431.205, 485.126 420.009 C 495.333 409.749, 496.804 408.901, 512.745 404.079 C 518.468 402.348, 547.140 389.139, 548.901 387.422 C 549.454 386.883, 541.457 378.436, 531.647 369.196 C 503.387 342.576, 465.028 318.293, 426 302.315 C 418.980 299.441, 387.404 288, 386.491 288 C 386.344 288, 384.390 290.924, 382.149 294.499 M 363.203 324.300 C 358.294 332.110, 353.951 339.082, 353.552 339.794 C 352.542 341.598, 354.789 343.994, 359.500 346.137 C 372.639 352.113, 388 342.977, 388 329.186 C 388 320.660, 383.380 314.325, 374.815 311.108 C 372.178 310.117, 371.974 310.348, 363.203 324.300 M 451.500 334.460 C 431.872 339.860, 415.920 351.267, 409.289 364.644 C 407.270 368.718, 408.208 372.585, 411.412 373.389 C 414.956 374.278, 416.851 373.208, 418.955 369.127 C 425.451 356.529, 438.714 348.219, 460.740 342.944 C 464.083 342.143, 465.119 341.374, 465.637 339.309 C 465.999 337.869, 465.845 335.973, 465.295 335.095 C 463.982 332.999, 457.842 332.716, 451.500 334.460 M 573 348.253 C 567.233 350.180, 560.391 357.847, 558.436 364.572 C 556.365 371.696, 556.933 379.988, 559.889 385.783 C 561.050 388.058, 562 390.611, 562 391.456 C 562 393.523, 527.715 410.109, 514.171 414.594 C 500.468 419.132, 500.700 418.990, 491.466 428.429 C 480.361 439.780, 475.340 442.147, 460.639 442.957 L 449.500 443.572 435.590 451.018 C 424.193 457.119, 420.986 459.342, 417.840 463.322 C 414.344 467.744, 413.208 470, 414.478 470 C 414.903 470, 448.040 455.518, 486 438.743 C 516.503 425.263, 534.804 417.254, 559 406.796 C 589.836 393.468, 590.688 393.038, 594.638 388.838 C 599.420 383.751, 601.276 379.214, 601.786 371.361 C 602.390 362.040, 599.279 354.537, 593.119 350.460 C 588.420 347.351, 578.845 346.300, 573 348.253 M 457.703 358.442 C 447.865 361.951, 441.105 369.857, 440.239 378.863 C 439.300 388.638, 444.007 396.864, 453.351 401.775 C 457.841 404.135, 459.652 404.482, 467.500 404.482 C 475.348 404.482, 477.159 404.135, 481.649 401.775 C 493.911 395.330, 498.235 382.746, 492.250 370.929 C 489.257 365.020, 482.863 359.889, 476.177 358.033 C 471.101 356.622, 462.254 356.819, 457.703 358.442 M 459.020 369.250 C 447.419 375.178, 447.413 386.827, 459.008 392.823 C 462.644 394.703, 464.581 395.055, 469.173 394.674 C 478.220 393.924, 483.767 389.447, 484.664 382.172 C 486.065 370.810, 470.911 363.174, 459.020 369.250 M 342.857 376.389 C 336.999 378.482, 332.928 381.233, 329.606 385.343 C 326.804 388.809, 326.500 389.860, 326.500 396.070 C 326.500 402.149, 326.804 403.258, 329.097 405.552 C 330.724 407.179, 333.247 408.358, 335.847 408.706 C 339.419 409.185, 340 409.602, 340 411.681 C 340 415.437, 342.776 419.906, 345.541 420.600 C 346.918 420.945, 351.073 420.905, 354.773 420.511 C 365.299 419.389, 367.915 417.306, 367.971 410 C 368.003 405.838, 368.287 405.350, 371.748 403.500 C 376.469 400.978, 378.436 395.895, 377.060 389.774 C 375.755 383.964, 373.208 380.914, 367.020 377.750 C 362.514 375.446, 360.412 375.007, 354.071 375.044 C 349.907 375.068, 344.861 375.673, 342.857 376.389 M 348.917 384.900 C 344.561 385.788, 338.334 389.507, 336.987 392.024 C 335.764 394.310, 335.690 399, 336.878 399 C 337.360 399, 338.315 398.325, 339 397.500 C 340.512 395.678, 345.361 395.525, 346.796 397.255 C 347.369 397.945, 348.226 401.207, 348.700 404.505 L 349.561 410.500 353.435 410.262 C 355.566 410.131, 357.480 409.853, 357.689 409.644 C 357.898 409.435, 357.672 406.732, 357.187 403.637 C 355.958 395.801, 357.539 393.528, 363.639 394.364 C 368.444 395.023, 368.815 394.477, 366.547 390.091 C 364.310 385.765, 356.277 383.400, 348.917 384.900 M 403.340 398.371 C 397.214 400.381, 393.006 403.775, 390.905 408.401 C 387.427 416.060, 389.158 423.580, 394.953 425.980 C 397.797 427.159, 398 427.589, 398 432.447 C 398 438.923, 400.237 441.308, 407.799 442.891 C 419.613 445.364, 424.408 443.423, 425.668 435.657 C 426.184 432.478, 426.542 432.098, 428.544 432.600 C 432.060 433.483, 437.434 430.410, 439.331 426.432 C 444.140 416.347, 438.054 404.732, 425.343 399.739 C 419.024 397.257, 408.691 396.615, 403.340 398.371 M 404.329 408.395 C 401.132 409.849, 399 412.627, 399 415.339 C 399 416.464, 399.891 416.690, 402.791 416.301 C 408.318 415.560, 409.427 417.361, 408.710 425.913 L 408.135 432.777 411.193 433.389 C 412.874 433.725, 414.621 434, 415.075 434 C 415.528 434, 416.437 431.267, 417.094 427.927 C 418.773 419.395, 421.891 416.938, 426.559 420.468 C 429.366 422.592, 431.001 422.327, 430.996 419.750 C 430.990 416.146, 427.543 411.486, 423.445 409.541 C 418.364 407.130, 408.421 406.534, 404.329 408.395 M 289.500 438.715 C 284 447.346, 279.348 454.770, 279.163 455.213 C 278.528 456.736, 287.495 459.956, 292.434 459.978 C 309.089 460.052, 318.717 441.324, 308.355 429.010 C 306.257 426.516, 301.179 422.957, 299.800 423.012 C 299.635 423.019, 295 430.085, 289.500 438.715 M 354.901 444.848 C 349.767 448.103, 340.598 457.064, 337.859 461.500 C 335.591 465.174, 335.489 468.346, 337.571 470.429 C 340.925 473.782, 343.524 472.385, 349.500 464.013 C 351.150 461.702, 355.313 457.742, 358.750 455.213 C 365.755 450.059, 366.984 446.503, 362.777 443.557 C 359.919 441.554, 360.155 441.516, 354.901 444.848 M 283.500 479.425 C 278.888 481.410, 270.815 488.202, 267.675 492.741 C 264.046 497.986, 264.292 502.041, 268.324 503.451 C 270.970 504.376, 271.506 504.050, 276.824 498.287 C 279.946 494.903, 284.435 490.905, 286.801 489.401 C 290.489 487.056, 291.059 486.244, 290.801 483.697 C 290.375 479.491, 287.396 477.748, 283.500 479.425 M 367.223 482.113 C 363.257 484.082, 358 490.721, 358 493.763 C 358 494.610, 373.543 488.637, 377.165 486.398 C 378.053 485.849, 376.038 481, 374.921 481 C 374.505 481, 373.564 480.773, 372.832 480.495 C 372.099 480.217, 369.575 480.945, 367.223 482.113 M 315.478 501.847 C 313.266 502.865, 310.116 505.041, 308.478 506.683 C 305.306 509.862, 302.360 514.693, 303.126 515.459 C 303.380 515.714, 308.654 513.841, 314.845 511.299 C 325.980 506.726, 326.099 506.643, 325.801 503.588 C 325.545 500.959, 325.054 500.463, 322.500 500.248 C 320.850 500.109, 317.690 500.829, 315.478 501.847 M 258.500 522.170 C 254.498 523.484, 251.085 523.956, 248.250 523.589 C 243.209 522.936, 242.960 523.806, 246.920 528.234 C 249.602 531.234, 250.316 531.495, 255.670 531.441 C 258.877 531.409, 263.188 530.811, 265.250 530.114 C 268.596 528.982, 269 528.480, 269 525.458 C 269 523.132, 268.394 521.746, 267.066 521.035 C 266.002 520.466, 264.989 520.045, 264.816 520.100 C 264.642 520.155, 261.800 521.086, 258.500 522.170" fill="#6a2f58" fillRule="evenodd" />
				</svg>
			</div>
			<div className="w-full place-items-center pt-20">
				<div className="p-5 flex flex-col gap-3 w-250">
					<div onDrop={handleDrop} className="relative h-70 bg-background size-full rounded-xl shadow-m hover:shadow-l transition-all duration-200">
						<input className="size-full cursor-pointer absolute inset-0 opacity-0" type="file" multiple accept="image/*" onChange={handleFiles} />
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
					{uploadedFiles.length > 0 && (
						<div className="w-full flex gap-3">
							<button disabled={!format || converting} onClick={convert_all} className="bg-primary disabled:cursor-default disabled:bg-primary-muted py-1 px-6 text-md cursor-pointer shadow-m rounded-xl text-background-light hover:bg-secondary transition-all duration-200">Convert</button>
							<div className="relative space-y-1">
								<button onClick={() => setFormatsOpen(!formatOpen)} className='bg-background hover:bg-primary hover:text-background-light shadow-m flex h-full justify-between items-center gap-2 px-6 rounded-xl cursor-pointer text-center transition-all duration-200'>
									{format == "" ? "Format" : format.toUpperCase()} {formatOpen ? <ChevronUp className='stroke-1 size-4' /> : <ChevronDown className='stroke-1 size-4' />}
								</button>
								{formatOpen && (
									<div className='absolute rounded-xl p-2 overflow-hidden mt-0.5 bg-background shadow-m w-max'>
										<ul className='grid grid-cols-2 gap-2 p-1'>
											{allowedTypes.filter(excludeType => excludeType.split("/")[1] != format).map((type, index) => {
												const formatType = type.split("/")[1];
												return (
													<li key={index} onClick={() => { setFormat(formatType); setFormatsOpen(!formatOpen) }} className='bg-background-light shadow-s hover:shadow-m rounded-lg cursor-pointer py-1 px-5 transition-all duration-200 text-center' value={formatType}>{formatType.toUpperCase()}</li>
												)
											})}
										</ul>
									</div>
								)}

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
			</div>
		</main>
	);
}

export default HomePage;

import "../index.css";
import { useFiles } from "../store/useFileStore";
import JSZip from "jszip";
import { useConverted } from "../store/useConvertedStore";
import { useState } from "react";

const Download = () => {

	const uploadedFiles = useFiles(state => state.uploadedFiles);
	const converted = useConverted(state => state.converted);
	const [downloading, setDownloading] = useState(false);

	const download = async () => {
		setDownloading(true);
		if (!converted) return;
		if (uploadedFiles.length === 0) return;

		if (uploadedFiles.length === 1) {
			const uploadedFile = uploadedFiles[0];
			if (!uploadedFile.blob) {
				return;
			}
			const url = URL.createObjectURL(uploadedFile.blob);
			const a = document.createElement("a");
			a.href = url;
			a.download = uploadedFile.blob_name ?? "";
			a.click();
			URL.revokeObjectURL(url);
			a.remove();
			setDownloading(false);
			return;
		}

		const zip = new JSZip();

		uploadedFiles.forEach((uploadedFile) => {
			if (uploadedFile.blob && uploadedFile.blob_name) {
				zip.file(uploadedFile.blob_name, uploadedFile.blob);
			}
		})

		const blob = await zip.generateAsync({ type: "blob" });

		const url = URL.createObjectURL(blob);
		const a = document.createElement("a");
		a.href = URL.createObjectURL(blob);
		a.download = "converted_files.zip";
		a.click();
		URL.revokeObjectURL(url);
		a.remove();
		setDownloading(false);
	}

	return (
		<main className="bg-background-dark place-items-center w-full min-h-screen pt-20">
			<div className="size-60 rotate-y-180" style={{ viewTransitionName: "pizza-image" }}>
				<img src="/pizza.svg" alt="pizza" className={downloading ? "animate-spin" : "animate-none"}  draggable={false}/>
			</div>
			<div className="w-full flex flex-col gap-10 items-center">
				<div className="p-3 shadow-l rounded-xl bg-background">
					<button onClick={download} disabled={!converted} className="bg-primary disabled:bg-primary-muted disabled:cursor-default shadow-m cursor-pointer rounded-xl text-3xl text-background-light py-4 px-10 hover:bg-secondary transition-all duration-200">
						Download
					</button>
				</div>
				<div className="text-center">
					<p className="text-text text-lg">Download the images that have been converted</p>
					<p className="text-text-muted">Images will be downloaded inside a zip</p>
				</div>
			</div>
		</main>
	);
}

export default Download;

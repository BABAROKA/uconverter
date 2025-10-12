import { create } from "zustand";

export interface UploadedFile {
	file: File,
	preview?: string,
	blob?: Blob,
	blob_name?: string,
}

type FilesStore = {
	uploadedFiles: UploadedFile[],
	setUploadedFiles: (newFiles: UploadedFile[]) => void,
	addUploadedFiles: (newFiles: UploadedFile[]) => void,
}

export const useFiles = create<FilesStore>((set) => ({
	uploadedFiles: [],
	setUploadedFiles: (newFiles) => set(() => ({uploadedFiles: newFiles})),
	addUploadedFiles: (newFiles) => set(state => ({uploadedFiles: [...state.uploadedFiles, ...newFiles]}))
}));

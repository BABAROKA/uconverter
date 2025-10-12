import { create } from "zustand";

type ConvertedStore = {
	converted: boolean,
	setConverted: (NewConverted: boolean) => void,
}

export const useConverted = create<ConvertedStore>((set) => ({
	converted: false,
	setConverted: (newConverted) => set(() => ({converted: newConverted})),
}));

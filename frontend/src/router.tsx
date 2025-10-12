import { createBrowserRouter } from "react-router-dom";
import HomePage from "./pages/HomePage";
import Download from "./pages/Download.tsx";

const router = createBrowserRouter([
	{
		path: "/",
		element: <HomePage />
	},
	{
		path: "download",
		element: <Download />
	},
]);

export default router;

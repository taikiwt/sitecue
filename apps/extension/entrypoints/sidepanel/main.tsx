import React from "react";
import ReactDOM from "react-dom/client";
import SidePanel from "../../src/SidePanel";
import "../../src/index.css";

// biome-ignore lint/style/noNonNullAssertion: root element exists in index.html
ReactDOM.createRoot(document.getElementById("root")!).render(
	<React.StrictMode>
		<SidePanel />
	</React.StrictMode>,
);

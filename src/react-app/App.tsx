// src/App.tsx

import { useState, useEffect } from "react";
import "./App.css";
import { api } from "./services/api";

function App() {
	const [count, setCount] = useState(0);
	const [main, setMain] = useState("");
	const [products, setProducts] = useState("");
	const [discovery, setDiscovery] = useState("");
	const [chat, setChat] = useState("");

	useEffect(() => {
		api.main().then((data) => setMain(JSON.stringify(data)));
		api.products().then((data) => setProducts(JSON.stringify(data)));
		api.discovery().then((data) => setDiscovery(JSON.stringify(data)));
		api.chat().then((data) => setChat(JSON.stringify(data)));
	}, []);

	return (
		<>
			<h1>Goto Demo Template</h1>
			<div className="card">
				<button
					onClick={() => setCount((count) => count + 1)}
					aria-label="increment"
				>
					count is {count}
				</button>
				<p>
					Edit <code>src/App.tsx</code> and save to test HMR
				</p>
			</div>
			<div className="card">
				<p>Main: {main}</p>
				<p>Products: {products}</p>
				<p>Discovery: {discovery}</p>
				<p>Chat: {chat}</p>
			</div>
		</>
	);
}

export default App;

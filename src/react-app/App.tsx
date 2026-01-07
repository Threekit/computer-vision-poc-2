import { useState } from "react";
import "./App.css";
import { api } from "./services/api";

function App() {
	const [selectedFile, setSelectedFile] = useState<File | null>(null);
	const [imageUrl, setImageUrl] = useState<string>("");
	const [generatedImageUrl, setGeneratedImageUrl] = useState<string>("");
	const [loading, setLoading] = useState(false);
	const [error, setError] = useState<string>("");
	const [showOriginal, setShowOriginal] = useState<boolean>(true);
	
	// Product configuration state (placeholder for now)
	const [productType, setProductType] = useState<string>("blinds");
	const [color, setColor] = useState<string>("white");

	const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
		const file = e.target.files?.[0];
		if (file) {
			setSelectedFile(file);
			setImageUrl(URL.createObjectURL(file));
			setGeneratedImageUrl("");
			setShowOriginal(true);
			setError("");
		}
	};

	const handleVisualize = async () => {
		if (!selectedFile) return;

		setLoading(true);
		setError("");

		try {
			// Build prompt based on selected product configuration
			const prompt = `Add ${color} ${productType} to the windows in this room, make it look realistic and natural with proper lighting and shadows`;
			
			// Call image generation API
			const result = await api.generateImage(
				selectedFile,
				[selectedFile], // Using the same image as reference
				prompt
			);
			
			// Convert base64 to data URL and display
			const dataUrl = `data:${result.mimeType};base64,${result.generatedImage}`;
			setGeneratedImageUrl(dataUrl);
			// Switch to showing generated image after creation
			setShowOriginal(false);
		} catch (err) {
			setError(err instanceof Error ? err.message : "Failed to generate visualization");
			console.error("Generation error:", err);
		} finally {
			setLoading(false);
		}
	};


	return (
		<div className="app-container">
			{loading && (
				<div className="loading-overlay">
					<div className="loading-spinner"></div>
					<div className="loading-text">Visualizing Your Space...</div>
					<div className="loading-subtext">Adding window treatments to your room</div>
				</div>
			)}

			<h1>Window Treatment Visualizer</h1>
			<p className="subtitle">See how blinds and drapes will look in your home</p>

			{error && (
				<div className="error-message">
					<i className="fas fa-exclamation-circle"></i> {error}
				</div>
			)}

			<div className="main-layout">
				{/* Left Side - Image Upload & Preview */}
				<div className="left-panel">
					<div className="upload-section">
						<h2>Upload Your Room Photo</h2>
						<input
							type="file"
							accept="image/*"
							onChange={handleFileSelect}
							id="file-input"
						/>
						<label htmlFor="file-input" className="file-label">
							<i className="fas fa-upload"></i> Choose Image
						</label>
					</div>

					{imageUrl && (
						<div className="image-preview">
							<div className="image-header">
								<h3>{showOriginal ? "Original Room" : "✨ With Window Treatments"}</h3>
								{generatedImageUrl && (
									<button 
										className="toggle-button"
										onClick={() => setShowOriginal(!showOriginal)}
									>
										<i className={`fas fa-${showOriginal ? 'wand-magic-sparkles' : 'image'}`}></i>
										{showOriginal ? "View Generated" : "View Original"}
									</button>
								)}
							</div>
							<img 
								src={showOriginal ? imageUrl : generatedImageUrl} 
								alt={showOriginal ? "Your room" : "Room with window treatments"} 
							/>
						</div>
					)}
				</div>

				{/* Right Side - Product Configuration */}
				<div className="right-panel">
					<div className="configurator-section">
						<h2>Configure Your Window Treatments</h2>
						
						<div className="config-group">
							<label htmlFor="product-type">Product Type</label>
							<select
								id="product-type"
								value={productType}
								onChange={(e) => setProductType(e.target.value)}
								className="config-select"
							>
								<option value="blinds">Blinds</option>
								<option value="drapes">Drapes</option>
								<option value="shades">Shades</option>
								<option value="shutters">Shutters</option>
							</select>
						</div>

						<div className="config-group">
							<label htmlFor="color">Color</label>
							<select
								id="color"
								value={color}
								onChange={(e) => setColor(e.target.value)}
								className="config-select"
							>
								<option value="white">White</option>
								<option value="beige">Beige</option>
								<option value="gray">Gray</option>
								<option value="navy">Navy</option>
								<option value="black">Black</option>
							</select>
						</div>

						{selectedFile && (
							<button
								onClick={handleVisualize}
								disabled={loading}
								className="visualize-button"
							>
								<i className="fas fa-wand-magic-sparkles"></i> Visualize in My Room
							</button>
						)}

						<div className="info-box">
							<i className="fas fa-info-circle"></i>
							<div>
								<strong>How it works:</strong>
								<p>Upload a photo of your room with windows, choose your preferred window treatment style and color, then click visualize to see how it looks!</p>
							</div>
						</div>
					</div>
				</div>
			</div>
		</div>
	);
}

export default App;

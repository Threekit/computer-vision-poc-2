import { Hono } from "hono";
import vision from "@google-cloud/vision";

const app = new Hono<{ Bindings: Env }>();

interface DetectedObject {
	name: string;
	confidence: number;
	boundingPoly: {
		normalizedVertices: Array<{ x: number; y: number }>;
	};
}

interface DetectedLabel {
	description: string;
	confidence: number;
}

interface VisionAnalysisResponse {
	objects: DetectedObject[];
	labels: DetectedLabel[];
}

app.post("/analyze", async (c) => {
	try {
		// Get the uploaded image from form data
		const formData = await c.req.formData();
		const imageFile = formData.get("image");

		if (!imageFile || !(imageFile instanceof File)) {
			return c.json({ error: "No image file provided" }, 400);
		}

		// Convert file to buffer
		const arrayBuffer = await imageFile.arrayBuffer();
		const buffer = Buffer.from(arrayBuffer);

		// Get credentials from environment
		const credentialsJson = c.env.GOOGLE_CREDENTIALS;
		if (!credentialsJson) {
			return c.json(
				{ error: "Google credentials not configured" },
				500,
			);
		}

		// Parse credentials
		const credentials = JSON.parse(credentialsJson);

		// Create Vision API client
		const client = new vision.ImageAnnotatorClient({
			credentials,
		});

		// Perform object localization and label detection
		const [result] = await client.annotateImage({
			image: { content: buffer.toString("base64") },
			features: [
				{ type: "OBJECT_LOCALIZATION" },
				{ type: "LABEL_DETECTION" },
			],
		});

		// Extract and format objects
		const objects: DetectedObject[] = (
			result.localizedObjectAnnotations || []
		).map((obj) => ({
			name: obj.name || "Unknown",
			confidence: obj.score || 0,
			boundingPoly: {
				normalizedVertices:
					obj.boundingPoly?.normalizedVertices?.map((v) => ({
						x: v.x || 0,
						y: v.y || 0,
					})) || [],
			},
		}));

		// Extract and format labels
		const labels: DetectedLabel[] = (result.labelAnnotations || []).map(
			(label) => ({
				description: label.description || "Unknown",
				confidence: label.score || 0,
			}),
		);

		const response: VisionAnalysisResponse = {
			objects,
			labels,
		};

		return c.json(response);
	} catch (error) {
		console.error("Vision API error:", error);
		return c.json(
			{
				error: "Failed to analyze image",
				details: error instanceof Error ? error.message : String(error),
			},
			500,
		);
	}
});

export default app;


import { Hono } from "hono";
import { GoogleGenAI } from "@google/genai";

const app = new Hono<{ Bindings: Env }>();

interface NanoBananaResponse {
	generatedImage: string;
	mimeType: string;
	width?: number;
	height?: number;
}

app.post("/generate", async (c) => {
	try {
		// Get the uploaded images and prompt from form data
		const formData = await c.req.formData();
		const userImage = formData.get("userImage");
		const productImage1 = formData.get("productImage1");
		const productImage2 = formData.get("productImage2");
		const prompt = formData.get("prompt");

		// Validate required fields
		if (!userImage || !(userImage instanceof File)) {
			return c.json({ error: "User image is required" }, 400);
		}

		if (!productImage1 || !(productImage1 instanceof File)) {
			return c.json({ error: "At least one product image is required" }, 400);
		}

		if (!prompt || typeof prompt !== "string") {
			return c.json({ error: "Prompt text is required" }, 400);
		}

		// Get API key from environment
		const apiKey = c.env.GEMINI_API_KEY;
		if (!apiKey) {
			return c.json({ error: "Gemini API key not configured" }, 500);
		}

		// Convert images to base64
		const userImageBuffer = Buffer.from(await userImage.arrayBuffer());
		const userImageBase64 = userImageBuffer.toString("base64");

		const product1Buffer = Buffer.from(await productImage1.arrayBuffer());
		const product1Base64 = product1Buffer.toString("base64");

		// Build the content parts array
		const contentParts: Array<{ text?: string; inlineData?: { mimeType: string; data: string } }> = [
			{
				inlineData: {
					mimeType: userImage.type || "image/jpeg",
					data: userImageBase64,
				},
			},
			{
				inlineData: {
					mimeType: productImage1.type || "image/jpeg",
					data: product1Base64,
				},
			},
		];

		// Add second product image if provided
		if (productImage2 && productImage2 instanceof File) {
			const product2Buffer = Buffer.from(await productImage2.arrayBuffer());
			const product2Base64 = product2Buffer.toString("base64");
			contentParts.push({
				inlineData: {
					mimeType: productImage2.type || "image/jpeg",
					data: product2Base64,
				},
			});
		}

		// Add the text prompt
		contentParts.push({
			text: prompt,
		});

		// Initialize Gemini client
		const ai = new GoogleGenAI({ apiKey });

		// Generate image using Nano Banana
		const response = await ai.models.generateContent({
			model: "gemini-2.5-flash-image",
			contents: contentParts,
		});

		// Extract the generated image from response
		if (
			!response.candidates ||
			response.candidates.length === 0 ||
			!response.candidates[0].content?.parts
		) {
			return c.json(
				{ error: "No image generated in response" },
				500,
			);
		}

		// Find the image part in the response
		let generatedImageData: string | null = null;
		let mimeType = "image/png";

		for (const part of response.candidates[0].content.parts) {
			if (part.inlineData?.data) {
				generatedImageData = part.inlineData.data;
				mimeType = part.inlineData.mimeType || "image/png";
				break;
			}
		}

		if (!generatedImageData) {
			return c.json(
				{ error: "No image data found in response" },
				500,
			);
		}

		const result: NanoBananaResponse = {
			generatedImage: generatedImageData,
			mimeType,
		};

		return c.json(result);
	} catch (error) {
		console.error("Nano Banana API error:", error);
		return c.json(
			{
				error: "Failed to generate image",
				details: error instanceof Error ? error.message : String(error),
			},
			500,
		);
	}
});

export default app;


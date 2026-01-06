import { Hono } from "hono";


const app = new Hono<{ Bindings: Env }>();

app.get("/", (c) => c.json({ message: "Lets chat!" }));

export default app;
import { Hono } from "hono";
import { logger } from 'hono/logger';

import products from './products';
import discovery from './discovery';
import chat from './chat';


const app = new Hono<{ Bindings: Env }>();
app.use('*', logger());

app.route('/api/products/', products);
app.route('/api/discovery/', discovery);
app.route('/api/chat/', chat);

app.get('/api/', (c) => c.json({ name: "Goto Demo API" }));

export default app;

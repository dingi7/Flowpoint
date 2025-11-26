import { Response } from "express";

/**
 * Set CORS headers on the response
 */
export function setCorsHeaders(res: Response): void {
  res.set("Access-Control-Allow-Origin", "*");
  res.set("Access-Control-Allow-Methods", "GET, POST, OPTIONS");
  res.set("Access-Control-Allow-Headers", "Content-Type, Authorization");
}

/**
 * Handle CORS preflight requests
 */
export function handleCorsPreflight(req: { method?: string }, res: Response): boolean {
  if (req.method === "OPTIONS") {
    setCorsHeaders(res);
    res.status(200).send("");
    return true;
  }
  return false;
}


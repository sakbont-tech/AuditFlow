import {type Request, type Response} from "express";

const notFoundHandler = (req: Request, res: Response) => {
  res.status(404).json({ err: "Route not found" });
};

export default notFoundHandler;

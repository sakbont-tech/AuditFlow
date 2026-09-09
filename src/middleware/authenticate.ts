import { type Request, type Response, type NextFunction } from "express";
import { jwtVerify } from "jose";
import { env } from "../config/env.js";

const encodedJwtSecret = new TextEncoder().encode(env.jwtSecret);

const authenticate = async (
  req: Request,
  res: Response,
  next: NextFunction,
) => {
  const authorizationHeader = req.get("authorization");
  const authorizationScheme = authorizationHeader?.slice(0, "Bearer ".length);

  if (
    !authorizationHeader ||
    authorizationScheme?.toLowerCase() !== "bearer "
  ) {
    return res.status(401).json({
      error: {
        code: "AUTHENTICATION_REQUIRED",
        message: "A valid access token is required",
      },
    });
  }

  const token = authorizationHeader
    .slice("Bearer ".length, authorizationHeader.length)
    .trim();

  if (token.length === 0) {
    return res.status(401).json({
      error: {
        code: "AUTHENTICATION_REQUIRED",
        message: "A valid access token is required",
      },
    });
  }

  try {
    const { payload } = await jwtVerify(token, encodedJwtSecret, {
      algorithms: ["HS256"],
    });

    if (!payload.sub || !(typeof payload.sub === "string")) {
      return res.status(401).json({
        error: {
          code: "AUTHENTICATION_REQUIRED",
          message: "A valid access token is required",
        },
      });
    }

    res.locals.userId = payload.sub;

  } catch {
    return res.status(401).json({
      error: {
        code: "AUTHENTICATION_REQUIRED",
        message: "A valid access token is required",
      },
    });
  }
  next();
};

export default authenticate;

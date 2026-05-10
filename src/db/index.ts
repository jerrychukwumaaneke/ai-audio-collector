import { drizzle } from "drizzle-orm/postgres-js";
import { queryClient } from "../config/db";
import * as schema from "./schema";

export const db = drizzle(queryClient, { schema });

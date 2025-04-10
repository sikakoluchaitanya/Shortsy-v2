import postgres from "postgres"
import { drizzle } from "drizzle-orm/postgres-js"
import * as schema from "./schema"

const connectionString = process.env.Database_URL || ""

const client = postgres(connectionString, {
    prepare: false,

})

export const db = drizzle(client, {schema})

export {eq, and , or, like, desc, asc} from "drizzle-orm"
import { relations } from "drizzle-orm";
import { integer, pgEnum, text, timestamp, primaryKey, boolean } from "drizzle-orm/pg-core";
import { pgTable, serial, varchar } from "drizzle-orm/pg-core";
import type { AdapterAccount } from "next-auth/adapters";

// user role enums
export const userRoleEnum = pgEnum("user_role", ["user", "admin"]); // this is code enforce type types in the database that a user can have two roles 


// user table
export const users = pgTable("users", {
    id: varchar("id", { length: 255 }).notNull().primaryKey(),
    name: varchar("name", { length: 255 }).notNull(),
    email: varchar("email", { length: 255 }).notNull().unique(),
    emailVerified: timestamp("email_verified", { mode: "date" }),
    image: text("image"),
    password: text("password"),
    role: userRoleEnum("role").default("user").notNull(), // default to user role
    createdAt: timestamp("created_at").notNull().defaultNow(),
    updatedAt: timestamp("updated_at").notNull().defaultNow(),
})

export const accounts = pgTable("accounts", {
    userId: varchar("userid", { length: 255 }).notNull().references(() => users.id, { onDelete: "cascade" }),
    type: varchar("type", { length: 255 }).$type<AdapterAccount["type"]>().notNull(),
    provider: varchar("provider", { length: 255 }).notNull(),
    providerAccountId: varchar("provider_account_id", { length: 255 }).notNull(),
    refresh_token: text("refresh_token"),
    access_token: text("access_token"),
    expires_at: integer("expires_at"),
    token_type: varchar("token_type", { length: 255 }),
    scope: varchar("scope", { length: 255 }),
    id_token: text("id_token"),
    session_state: varchar("session_state", { length: 255 }),

},  (account) => [
    {
        compoundKey: primaryKey({
            columns: [account.provider, account.providerAccountId],
        }),
    },]
)

export const sessions = pgTable("sessions", {
    sessionToken: varchar("session_token", { length: 255 }).notNull().primaryKey(),
    userId: varchar("user_id", { length: 255 }).notNull().references(() => users.id, { onDelete: "cascade" }),
    expires: timestamp("expires", { mode: "date" }).notNull(),
})

export const verificationTokens = pgTable("verification_tokens", {
    identifier: varchar("identifier", { length: 255 }).notNull(),
    token: varchar("token", { length: 255 }).notNull(),
    expires: timestamp("expires", { mode: "date" }).notNull(),
}, (verificationToken) => [
    {
        compositePk: primaryKey({
            columns: [verificationToken.identifier, verificationToken.token],
        }),
    },]
)

export const urls = pgTable("urls", {
    id: serial("id").primaryKey(),
    originalUrl: varchar("original_url", { length: 2000 }).notNull(),
    shortCode: varchar("short_Code", { length: 10 }).notNull().unique(),
    createdAt: timestamp("created_at").notNull().defaultNow(),
    updatedAt: timestamp("updated_at").notNull().defaultNow(),
    clicks: integer("clicks").notNull().default(0),
    userId: varchar("user_id", { length: 255 }).notNull().references(() => users.id, { onDelete: "set null" }),
    flagged: boolean("flagged").default(false).notNull(),
    flagReason: text("flag_reason"),
})

export const userRelations = relations(users, ({ many }) => ({
    urls: many(urls),
    accounts: many(accounts),
    sessions: many(sessions),
}));

export const urlRelations = relations(urls, ({ one }) => ({
    user: one(users, {
        fields: [urls.userId],
        references: [users.id],
    }),
}));
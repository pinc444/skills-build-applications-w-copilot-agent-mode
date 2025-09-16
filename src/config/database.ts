import "reflect-metadata";
import { DataSource } from "typeorm";
import { Account } from "../entities/Account";
import { Transaction } from "../entities/Transaction";
import { Category } from "../entities/Category";

export const AppDataSource = new DataSource({
    type: "postgres",
    host: process.env.DB_HOST || "localhost",
    port: parseInt(process.env.DB_PORT || "5432"),
    username: process.env.DB_USERNAME || "postgres",
    password: process.env.DB_PASSWORD || "password",
    database: process.env.DB_DATABASE || "personal_finance",
    synchronize: process.env.NODE_ENV === "development",
    logging: false,
    entities: [Account, Transaction, Category],
    migrations: [],
    subscribers: [],
});
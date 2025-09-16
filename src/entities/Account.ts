import { Entity, PrimaryGeneratedColumn, Column, CreateDateColumn, UpdateDateColumn, OneToMany } from "typeorm";
import { Transaction } from "./Transaction";

export enum AccountType {
    ASSET_BANK = "asset_bank",
    ASSET_INVESTMENT = "asset_investment",
    ASSET_CASH = "asset_cash",
    LIABILITY_CREDIT_CARD = "liability_credit_card",
    LIABILITY_LOAN = "liability_loan",
    INCOME = "income",
    EXPENSE = "expense"
}

@Entity()
export class Account {
    @PrimaryGeneratedColumn()
    id: number;

    @Column()
    name: string;

    @Column({
        type: "enum",
        enum: AccountType
    })
    type: AccountType;

    @Column({ nullable: true })
    description?: string;

    @Column({ type: "decimal", precision: 12, scale: 2, default: 0 })
    balance: number;

    @Column({ default: true })
    active: boolean;

    // Puppeteer automation config for banks/credit cards
    @Column({ nullable: true })
    loginUrl?: string;

    @Column({ nullable: true })
    encryptedUsername?: string; // Encrypted storage

    @Column({ nullable: true })
    encryptedPassword?: string; // Encrypted storage

    @Column({ nullable: true })
    loginSelector?: string;

    @Column({ nullable: true })
    passwordSelector?: string;

    @Column({ nullable: true })
    submitSelector?: string;

    @Column({ nullable: true })
    exportSelector?: string;

    @OneToMany(() => Transaction, transaction => transaction.debitAccount)
    debitTransactions: Transaction[];

    @OneToMany(() => Transaction, transaction => transaction.creditAccount)
    creditTransactions: Transaction[];

    @CreateDateColumn()
    createdAt: Date;

    @UpdateDateColumn()
    updatedAt: Date;
}
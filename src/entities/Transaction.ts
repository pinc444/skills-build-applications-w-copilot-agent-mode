import { Entity, PrimaryGeneratedColumn, Column, CreateDateColumn, UpdateDateColumn, ManyToOne, JoinColumn } from "typeorm";
import { Account } from "./Account";
import { Category } from "./Category";

export enum TransactionStatus {
    PENDING = "pending",
    CLEARED = "cleared",
    RECONCILED = "reconciled"
}

@Entity()
export class Transaction {
    @PrimaryGeneratedColumn()
    id: number;

    @Column({ type: "date" })
    date: Date;

    @Column({ type: "decimal", precision: 12, scale: 2 })
    amount: number;

    @Column()
    description: string;

    @Column({ nullable: true })
    reference?: string; // Check number, transaction ID, etc.

    @Column({
        type: "enum",
        enum: TransactionStatus,
        default: TransactionStatus.PENDING
    })
    status: TransactionStatus;

    @Column({ nullable: true })
    notes?: string;

    // Double-entry bookkeeping: every transaction has debit and credit accounts
    @ManyToOne(() => Account, account => account.debitTransactions)
    @JoinColumn({ name: "debitAccountId" })
    debitAccount: Account;

    @Column()
    debitAccountId: number;

    @ManyToOne(() => Account, account => account.creditTransactions)
    @JoinColumn({ name: "creditAccountId" })
    creditAccount: Account;

    @Column()
    creditAccountId: number;

    @ManyToOne(() => Category, category => category.transactions, { nullable: true })
    @JoinColumn({ name: "categoryId" })
    category?: Category;

    @Column({ nullable: true })
    categoryId?: number;

    // Import metadata
    @Column({ nullable: true })
    importBatch?: string; // For tracking imported batches

    @Column({ nullable: true })
    originalData?: string; // Store original QIF/CSV data as JSON

    @CreateDateColumn()
    createdAt: Date;

    @UpdateDateColumn()
    updatedAt: Date;
}
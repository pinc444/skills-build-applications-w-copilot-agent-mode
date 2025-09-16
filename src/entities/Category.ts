import { Entity, PrimaryGeneratedColumn, Column, CreateDateColumn, UpdateDateColumn, OneToMany } from "typeorm";
import { Transaction } from "./Transaction";

export enum CategoryType {
    INCOME = "income",
    EXPENSE = "expense",
    TRANSFER = "transfer"
}

@Entity()
export class Category {
    @PrimaryGeneratedColumn()
    id: number;

    @Column()
    name: string;

    @Column({
        type: "enum",
        enum: CategoryType
    })
    type: CategoryType;

    @Column({ nullable: true })
    description?: string;

    @Column({ nullable: true })
    color?: string; // For UI display

    @Column({ nullable: true })
    parentId?: number; // For subcategories

    @Column({ default: true })
    active: boolean;

    @OneToMany(() => Transaction, transaction => transaction.category)
    transactions: Transaction[];

    @CreateDateColumn()
    createdAt: Date;

    @UpdateDateColumn()
    updatedAt: Date;
}